import { Router, type IRouter } from "express";
import { supabase } from "../lib/supabase";
import { openai } from "@workspace/integrations-openai-ai-server";
import crypto from "crypto";

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
  return `Company: ${data.name}. Hiring policy: ${data.description || "Assess candidates fairly based on skills, experience, and cultural fit. Be professional and inclusive."}`;
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

  const completion = await openai.chat.completions.create({
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

  const scoreCompletion = await openai.chat.completions.create({
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
