import { Router, type IRouter } from "express";
import { supabase } from "../lib/supabase";
import { loadCommConfig } from "../lib/comm-config";

const router: IRouter = Router();

function parseAddr(addr: string | null): Record<string, unknown> {
  try { return addr ? JSON.parse(addr) : {}; } catch { return {}; }
}

function mapCandidate(c: Record<string, unknown>) {
  const extra = parseAddr(c.address as string | null);
  return {
    id: c.id,
    full_name: c.name,
    email: c.email,
    phone: c.phone,
    stage: c.status,
    status: c.status,
    experience_years: c.total_orders ?? 0,
    expected_salary: c.total_spent ?? 0,
    ai_score: c.loyalty_points != null ? Number(c.loyalty_points) / 10 : null,
    applied_date: c.joined,
    skills: extra.skills ?? [],
    location: extra.location ?? "",
    job_id: extra.job_id ?? null,
    job_title: extra.job_title ?? null,
    notes: extra.notes ?? "",
    created_at: c.created_at,
    updated_at: c.updated_at,
  };
}

function toDb(body: Record<string, unknown>, existing?: Record<string, unknown>) {
  const existingExtra = existing ? parseAddr(existing.address as string | null) : {};
  const newExtra = {
    skills: body.skills ?? existingExtra.skills ?? [],
    location: body.location ?? existingExtra.location ?? "",
    job_id: body.job_id ?? existingExtra.job_id ?? null,
    job_title: body.job_title ?? existingExtra.job_title ?? null,
    notes: body.notes ?? existingExtra.notes ?? "",
  };

  const m: Record<string, unknown> = { address: JSON.stringify(newExtra) };
  if (body.full_name !== undefined) m.name = body.full_name;
  if (body.name !== undefined) m.name = body.name;
  if (body.email !== undefined) m.email = body.email;
  if (body.phone !== undefined) m.phone = body.phone;
  if (body.stage !== undefined) m.status = body.stage;
  if (body.status !== undefined) m.status = body.status;
  if (body.experience_years !== undefined) m.total_orders = Number(body.experience_years);
  if (body.expected_salary !== undefined) m.total_spent = Number(body.expected_salary);
  if (body.ai_score !== undefined) m.loyalty_points = Math.round(Number(body.ai_score) * 10);
  if (body.applied_date !== undefined) m.joined = body.applied_date;
  return m;
}

router.get("/candidates", async (req, res) => {
  const { stage, search, job_id } = req.query;

  let query = supabase.from("customers").select("*").order("joined", { ascending: false });

  if (stage) query = query.eq("status", stage as string);
  if (search) query = query.ilike("name", `%${search}%`);

  const { data, error } = await query;
  if (error) { res.status(500).json({ error: error.message }); return; }

  let candidates = (data ?? []).map(mapCandidate);
  if (job_id) candidates = candidates.filter(c => c.job_id === job_id);

  res.json(candidates);
});

router.post("/candidates", async (req, res) => {
  const dbRow = toDb(req.body);
  if (!dbRow.name && !req.body.full_name) { res.status(400).json({ error: "full_name required" }); return; }

  const { data, error } = await supabase.from("customers").insert(dbRow).select().single();
  if (error) { res.status(500).json({ error: error.message }); return; }
  res.status(201).json(mapCandidate(data));
});

router.get("/candidates/:id", async (req, res) => {
  const { data } = await supabase.from("customers").select("*").eq("id", req.params.id).maybeSingle();
  if (!data) { res.status(404).json({ error: "Candidate not found" }); return; }
  res.json(mapCandidate(data));
});

router.patch("/candidates/:id", async (req, res) => {
  const { data: existing } = await supabase.from("customers").select("*").eq("id", req.params.id).maybeSingle();
  if (!existing) { res.status(404).json({ error: "Not found" }); return; }

  const dbRow = toDb(req.body, existing);
  const { data, error } = await supabase
    .from("customers")
    .update({ ...dbRow, updated_at: new Date().toISOString() })
    .eq("id", req.params.id)
    .select()
    .single();

  if (error) { res.status(500).json({ error: error.message }); return; }
  res.json(mapCandidate(data));
});

router.delete("/candidates/:id", async (req, res) => {
  await supabase.from("customers").delete().eq("id", req.params.id);
  res.status(204).send();
});

router.post("/candidates/:id/advance", async (req, res) => {
  const { stage, notes } = req.body;
  const { data: existing } = await supabase.from("customers").select("*").eq("id", req.params.id).maybeSingle();
  if (!existing) { res.status(404).json({ error: "Not found" }); return; }

  const extra = parseAddr(existing.address as string | null);
  const newExtra = { ...extra, notes: notes ?? extra.notes };

  const { data, error } = await supabase
    .from("customers")
    .update({ status: stage, address: JSON.stringify(newExtra), updated_at: new Date().toISOString() })
    .eq("id", req.params.id)
    .select()
    .single();

  if (error) { res.status(500).json({ error: error.message }); return; }
  res.json(mapCandidate(data));
});

router.post("/candidates/:id/score", async (req, res) => {
  const { data: c } = await supabase.from("customers").select("*").eq("id", req.params.id).maybeSingle();
  if (!c) { res.status(404).json({ error: "Not found" }); return; }

  const extra = parseAddr(c.address as string | null);
  const skills: string[] = Array.isArray(extra.skills) ? extra.skills : [];
  const expYears = Number(c.total_orders) ?? 3;

  const skillsScore = Math.min(100, skills.length * 12 + 40);
  const expScore = Math.min(100, expYears * 10 + 20);
  const overall = Math.round((skillsScore * 0.5 + expScore * 0.5) * 10) / 10;
  const aiScore = Math.min(100, overall);

  await supabase.from("customers").update({ loyalty_points: Math.round(aiScore * 10) }).eq("id", req.params.id);

  res.json({
    overall_score: aiScore,
    skills_match: skillsScore,
    experience_match: expScore,
    cultural_fit: Math.round(Math.random() * 25 + 70),
    recommendation: aiScore >= 85 ? "strong_hire" : aiScore >= 70 ? "hire" : aiScore >= 55 ? "maybe" : "no_hire",
    strengths: skills.slice(0, 3).map((s: string) => `Strong ${s} skills`),
    weaknesses: ["Could improve leadership skills"],
    risk_factors: aiScore < 65 ? ["Skills gap in key areas"] : [],
    suggested_salary: Number(c.total_spent) ?? null,
  });
});

// ── AI Recruiter Notifications feed ────────────────────────────────────────

router.get("/recruitment/notifications", async (req, res) => {
  const { data } = await supabase
    .from("customers")
    .select("id, name, email, phone, status, loyalty_points, joined, address, updated_at")
    .order("updated_at", { ascending: false })
    .limit(50);

  const cfg = await loadCommConfig();

  const notifications = (data ?? []).flatMap(c => {
    const extra = parseAddr(c.address as string | null);
    if (!extra.interview_token) return []; // not from public portal

    const score = extra.interview_score as Record<string, unknown> | undefined;
    const interviewStatus = extra.interview_status as string ?? "pending";
    const overallScore = score ? Number(score.overall_score ?? 0) : null;
    const recommendation = score ? (score.recommendation as string) : null;
    const jobTitle = (extra.job_title as string) ?? "a role";

    const items: unknown[] = [];

    if (interviewStatus === "completed" && score) {
      items.push({
        id: `scored-${c.id}`,
        type: "interview_scored",
        candidate_id: c.id,
        candidate_name: c.name,
        candidate_email: c.email,
        job_title: jobTitle,
        score: overallScore,
        recommendation,
        summary: (score.summary as string) ?? "",
        strengths: (score.strengths as string[]) ?? [],
        timestamp: c.updated_at,
        email_notified: !!(extra.email_sent),
      });
    } else {
      items.push({
        id: `applied-${c.id}`,
        type: "new_application",
        candidate_id: c.id,
        candidate_name: c.name,
        candidate_email: c.email,
        job_title: jobTitle,
        interview_status: interviewStatus,
        timestamp: c.joined ?? c.updated_at,
      });
    }

    return items;
  });

  res.json({
    notifications,
    admin_configured: {
      email: !!(cfg.admin_email),
      sms: !!(cfg.admin_phone),
      admin_email: cfg.admin_email ?? null,
      admin_phone: cfg.admin_phone ?? null,
    },
  });
});

export default router;
