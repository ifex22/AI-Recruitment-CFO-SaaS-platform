import { Router, type IRouter } from "express";
import { supabase } from "../lib/supabase";
import { openai as replitOpenai } from "@workspace/integrations-openai-ai-server";
import OpenAI from "openai";
import { loadCommConfig } from "../lib/comm-config";
import crypto from "crypto";

async function sendEmail(to: string, subject: string, html: string) {
  try {
    const cfg = await loadCommConfig();
    if (!cfg.resend_api_key) return;
    const { Resend } = await import("resend");
    const resend = new Resend(cfg.resend_api_key);
    await resend.emails.send({ from: cfg.from_email ?? "noreply@nexusai.app", to, subject, html });
  } catch {
    // non-fatal
  }
}

async function sendSms(to: string, body: string) {
  try {
    const cfg = await loadCommConfig();
    if (!(cfg.twilio_account_sid && cfg.twilio_auth_token && cfg.twilio_from)) return;
    const twilio = (await import("twilio")).default;
    const client = twilio(cfg.twilio_account_sid, cfg.twilio_auth_token);
    await client.messages.create({ from: cfg.twilio_from, to, body });
  } catch {
    // non-fatal
  }
}

async function getOpenAI() {
  const cfg = await loadCommConfig();
  if (cfg.openai_api_key) {
    return new OpenAI({ apiKey: cfg.openai_api_key });
  }
  return replitOpenai;
}

const router: IRouter = Router();

function mapJob(j: Record<string, unknown>) {
  return {
    id: j.id,
    title: j.name,
    department: j.category,
    location: j.brand,
    employment_type: j.subcategory,
    status: j.barcode ?? "open",
    description: j.unit ?? "",
    requirements: j.unit ?? "",
    salary_min: j.discount_price,
    salary_max: j.price,
    openings: j.quantity ?? 1,
    job_code: j.sku,
    posted_date: j.created_at,
  };
}

function parseAddr(addr: string | null): Record<string, unknown> {
  try { return addr ? JSON.parse(addr) : {}; } catch { return {}; }
}

async function getHiringRules(): Promise<string> {
  const { data } = await supabase.from("brands").select("description, name").limit(1).maybeSingle();
  if (!data) return "Be fair, professional, and assess technical skills.";
  let policy = "Assess candidates fairly based on skills, experience, and cultural fit. Be professional and inclusive.";
  try {
    const details = JSON.parse(data.description ?? "{}");
    if (details.hiring_policy) policy = details.hiring_policy;
  } catch { /* use default */ }
  return `Company: ${data.name}. Hiring policy: ${policy}`;
}

router.get("/public/jobs", async (req, res) => {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("barcode", "open")
    .order("created_at", { ascending: false });

  if (error) { res.status(500).json({ error: error.message }); return; }
  res.json((data ?? []).map(mapJob));
});

router.get("/public/jobs/:id", async (req, res) => {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", req.params.id)
    .maybeSingle();

  if (error || !data) { res.status(404).json({ error: "Job not found" }); return; }
  res.json(mapJob(data));
});

router.post("/public/apply", async (req, res) => {
  const { full_name, email, phone, job_id, job_title, experience_years, expected_salary, skills, cover_letter } = req.body as Record<string, unknown>;

  if (!full_name || !email || !job_id) {
    res.status(400).json({ error: "full_name, email, and job_id are required" });
    return;
  }

  const token = crypto.randomBytes(32).toString("hex");

  const extra = {
    skills: Array.isArray(skills) ? skills : typeof skills === "string" ? skills.split(",").map((s: string) => s.trim()).filter(Boolean) : [],
    location: "",
    job_id,
    job_title: job_title ?? "",
    notes: cover_letter ?? "",
    interview_token: token,
    interview_status: "pending",
    interview_messages: [],
  };

  const { data, error } = await supabase.from("customers").insert({
    name: full_name,
    email,
    phone: phone ?? null,
    status: "applied",
    total_orders: Number(experience_years) || 0,
    total_spent: Number(expected_salary) || 0,
    loyalty_points: 0,
    joined: new Date().toISOString(),
    address: JSON.stringify(extra),
  }).select().single();

  if (error) { res.status(500).json({ error: error.message }); return; }

  if (phone) {
    await sendSms(
      phone as string,
      `Hi ${(full_name as string).split(" ")[0]}! Your application for ${job_title ?? "the role"} at Nexus AI was received. Complete your AI interview to get scored instantly: reply or visit the portal.`
    );
  }

  await sendEmail(
    email as string,
    `Application received — ${job_title ?? "your role"}`,
    `<div style="font-family:sans-serif;max-width:520px;margin:auto;color:#1e293b">
      <h2 style="color:#2563eb">Thanks for applying, ${(full_name as string).split(" ")[0]}!</h2>
      <p>We received your application for <strong>${job_title ?? "the position"}</strong> at Nexus AI.</p>
      <p>Next step: complete your <strong>AI interview</strong> — it only takes a few minutes and you'll get scored instantly. No scheduling needed.</p>
      <p style="margin-top:24px;font-size:12px;color:#94a3b8">This email was sent by Nexus AI Recruitment Platform. If you did not apply, please ignore this message.</p>
    </div>`
  );

  res.status(201).json({
    candidate_id: data.id,
    token,
    message: "Application submitted. Please complete your AI interview.",
  });
});

router.post("/public/interview/message", async (req, res) => {
  const { candidate_id, token, messages } = req.body as {
    candidate_id?: string;
    token?: string;
    messages?: Array<{ role: string; content: string }>;
  };

  if (!candidate_id || !token || !messages) {
    res.status(400).json({ error: "candidate_id, token, and messages are required" });
    return;
  }

  const { data: candidate } = await supabase
    .from("customers")
    .select("*")
    .eq("id", candidate_id)
    .maybeSingle();

  if (!candidate) { res.status(404).json({ error: "Candidate not found" }); return; }

  const extra = parseAddr(candidate.address as string | null);
  if (extra.interview_token !== token) { res.status(403).json({ error: "Invalid token" }); return; }
  if (extra.interview_status === "completed") { res.status(400).json({ error: "Interview already completed" }); return; }

  const jobId = extra.job_id as string;
  const { data: jobData } = await supabase.from("products").select("*").eq("id", jobId).maybeSingle();
  const jobTitle = (jobData?.name as string) ?? (extra.job_title as string) ?? "the position";
  const jobRequirements = (jobData?.unit as string) ?? "General professional skills";
  const hiringRules = await getHiringRules();

  const userMsgCount = messages.filter(m => m.role === "user").length;
  const isLastQuestion = userMsgCount >= 5;

  const systemPrompt = `You are a professional AI recruiter conducting a structured interview for the role of "${jobTitle}".

Job Requirements: ${jobRequirements}

${hiringRules}

Rules:
- Ask exactly 5 focused questions, one at a time
- Questions should assess: technical skills, experience, problem-solving, motivation, and cultural fit
- Be warm, professional, and encouraging
- Current user response count: ${userMsgCount}/5
${isLastQuestion ? "- This is the final response. Thank the candidate, tell them the interview is now complete and they will receive an email with results. Do NOT ask another question." : `- Ask question ${userMsgCount + 1} of 5`}`;

  const chatMessages = [
    { role: "system" as const, content: systemPrompt },
    ...messages.map(m => ({ role: m.role as "user" | "assistant", content: m.content })),
  ];

  const aiClient = await getOpenAI();
  const completion = await aiClient.chat.completions.create({
    model: "gpt-5-mini",
    max_completion_tokens: 512,
    messages: chatMessages,
  });

  const aiMessage = completion.choices[0]?.message?.content ?? "Thank you for your response.";

  const updatedExtra = {
    ...extra,
    interview_status: isLastQuestion ? "awaiting_score" : "in_progress",
    interview_messages: messages,
  };

  await supabase
    .from("customers")
    .update({ address: JSON.stringify(updatedExtra), updated_at: new Date().toISOString() })
    .eq("id", candidate_id);

  res.json({ message: aiMessage, done: isLastQuestion });
});

router.post("/public/interview/complete", async (req, res) => {
  const { candidate_id, token, messages } = req.body as {
    candidate_id?: string;
    token?: string;
    messages?: Array<{ role: string; content: string }>;
  };

  if (!candidate_id || !token || !messages) {
    res.status(400).json({ error: "candidate_id, token, and messages required" });
    return;
  }

  const { data: candidate } = await supabase
    .from("customers")
    .select("*")
    .eq("id", candidate_id)
    .maybeSingle();

  if (!candidate) { res.status(404).json({ error: "Candidate not found" }); return; }

  const extra = parseAddr(candidate.address as string | null);
  if (extra.interview_token !== token) { res.status(403).json({ error: "Invalid token" }); return; }

  const jobId = extra.job_id as string;
  const { data: jobData } = await supabase.from("products").select("*").eq("id", jobId).maybeSingle();
  const jobTitle = (jobData?.name as string) ?? (extra.job_title as string) ?? "the position";
  const jobRequirements = (jobData?.unit as string) ?? "General professional skills";
  const hiringRules = await getHiringRules();

  const transcript = messages.map(m => `${m.role === "user" ? "Candidate" : "Interviewer"}: ${m.content}`).join("\n\n");

  const scorePrompt = `You are evaluating a job interview for the role of "${jobTitle}".

Job Requirements: ${jobRequirements}
${hiringRules}

Interview Transcript:
${transcript}

Score the candidate from 0-100 based on:
- Technical skills match (30%)
- Experience relevance (30%)
- Communication quality (20%)
- Motivation and cultural fit (20%)

Respond ONLY with valid JSON:
{
  "overall_score": <number 0-100>,
  "skills_match": <number 0-100>,
  "experience_match": <number 0-100>,
  "communication": <number 0-100>,
  "cultural_fit": <number 0-100>,
  "recommendation": "<strong_hire|hire|maybe|no_hire>",
  "summary": "<2 sentence summary>",
  "strengths": ["<strength1>", "<strength2>"],
  "improvements": ["<area1>"]
}`;

  const aiClient2 = await getOpenAI();
  const scoreCompletion = await aiClient2.chat.completions.create({
    model: "gpt-5-mini",
    max_completion_tokens: 512,
    messages: [{ role: "user", content: scorePrompt }],
  });

  let scoreResult: Record<string, unknown> = {};
  try {
    const raw = scoreCompletion.choices[0]?.message?.content ?? "{}";
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    scoreResult = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
  } catch {
    scoreResult = { overall_score: 60, recommendation: "maybe" };
  }

  const overallScore = Number(scoreResult.overall_score ?? 60);

  const updatedExtra = {
    ...extra,
    interview_status: "completed",
    interview_messages: messages,
    interview_score: scoreResult,
    email_sent: true,
    email_sent_at: new Date().toISOString(),
  };

  await supabase.from("customers").update({
    status: "screening",
    loyalty_points: Math.round(overallScore * 10),
    address: JSON.stringify(updatedExtra),
    updated_at: new Date().toISOString(),
  }).eq("id", candidate_id);

  const recommendationLabel: Record<string, string> = {
    strong_hire: "Strong Hire ✅",
    hire: "Hire ✅",
    maybe: "Under Review 🔄",
    no_hire: "Not Selected ❌",
  };
  const recLabel = recommendationLabel[scoreResult.recommendation as string] ?? "Under Review 🔄";
  const strengths = (scoreResult.strengths as string[] ?? []).map(s => `<li>${s}</li>`).join("");

  if (candidate.phone) {
    const scoreEmoji = overallScore >= 75 ? "🟢" : overallScore >= 50 ? "🟡" : "🔴";
    await sendSms(
      candidate.phone as string,
      `${scoreEmoji} Hi ${(candidate.name as string ?? "").split(" ")[0]}! Your AI interview for ${jobTitle} is complete. Score: ${overallScore}/100. Our team will be in touch soon. – Nexus AI`
    );
  }

  await sendEmail(
    candidate.email as string,
    `Your AI interview results — ${jobTitle}`,
    `<div style="font-family:sans-serif;max-width:520px;margin:auto;color:#1e293b">
      <h2 style="color:#2563eb">Interview Complete!</h2>
      <p>Hi ${(candidate.name as string ?? "").split(" ")[0]}, here are your results for <strong>${jobTitle}</strong>:</p>
      <div style="background:#f1f5f9;border-radius:12px;padding:20px;margin:20px 0;text-align:center">
        <div style="font-size:48px;font-weight:900;color:#2563eb">${overallScore}</div>
        <div style="font-size:13px;color:#64748b;margin-top:4px">Overall Score / 100</div>
        <div style="margin-top:12px;font-size:16px;font-weight:600">${recLabel}</div>
      </div>
      <p><strong>Summary:</strong> ${scoreResult.summary ?? ""}</p>
      ${strengths ? `<p><strong>Strengths:</strong></p><ul>${strengths}</ul>` : ""}
      <p>Our recruitment team will be in touch shortly. Thank you for your time!</p>
      <p style="margin-top:24px;font-size:12px;color:#94a3b8">Nexus AI Recruitment Platform</p>
    </div>`
  );

  res.json({
    score: overallScore,
    recommendation: scoreResult.recommendation ?? "maybe",
    summary: scoreResult.summary ?? "Interview completed.",
    strengths: scoreResult.strengths ?? [],
    improvements: scoreResult.improvements ?? [],
    message: "Interview complete! Your results have been recorded. You will hear back via email.",
  });
});

export default router;
