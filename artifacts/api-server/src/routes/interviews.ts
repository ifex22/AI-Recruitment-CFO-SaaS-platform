import { Router, type IRouter } from "express";
import { supabase } from "../lib/supabase";

const router: IRouter = Router();

function parseSubcat(s: unknown): Record<string, unknown> {
  if (!s) return {};
  if (typeof s === "object") return s as Record<string, unknown>;
  try { return JSON.parse(s as string); } catch { return {}; }
}

function mapInterview(row: Record<string, unknown>) {
  const d = parseSubcat(row.subcategories);
  return {
    id: row.id,
    type: d.type ?? "screening",
    status: d.status ?? "scheduled",
    candidate_name: d.candidate_name ?? "",
    candidate_id: d.candidate_id ?? null,
    job_title: d.job_title ?? "",
    job_id: d.job_id ?? null,
    scheduled_at: d.scheduled_at ?? null,
    duration_minutes: d.duration_minutes ?? 60,
    notes: d.notes ?? "",
    overall_rating: d.score ?? null,
    hire_recommendation: d.hire_recommendation ?? null,
    technical_score: d.technical_score ?? null,
    communication_score: d.communication_score ?? null,
    problem_solving_score: d.problem_solving_score ?? null,
    interviewer_name: d.interviewer ?? null,
    label: row.name,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function buildRow(body: Record<string, unknown>, existing?: Record<string, unknown>) {
  const prev = existing ? parseSubcat((existing as Record<string, unknown>).subcategories) : {};
  const subcat: Record<string, unknown> = {
    ...prev,
    type: body.type ?? prev.type ?? "screening",
    status: body.status ?? prev.status ?? "scheduled",
    candidate_name: body.candidate_name ?? prev.candidate_name ?? "",
    candidate_id: body.candidate_id ?? prev.candidate_id ?? null,
    job_title: body.job_title ?? prev.job_title ?? "",
    job_id: body.job_id ?? prev.job_id ?? null,
    scheduled_at: body.scheduled_at ?? prev.scheduled_at ?? null,
    duration_minutes: body.duration_minutes ?? prev.duration_minutes ?? 60,
    notes: body.notes ?? prev.notes ?? "",
    score: body.overall_rating ?? prev.score ?? null,
    hire_recommendation: body.hire_recommendation ?? prev.hire_recommendation ?? null,
    technical_score: body.technical_score ?? prev.technical_score ?? null,
    communication_score: body.communication_score ?? prev.communication_score ?? null,
    problem_solving_score: body.problem_solving_score ?? prev.problem_solving_score ?? null,
    interviewer: body.interviewer_name ?? prev.interviewer ?? null,
  };
  const label = `${String(subcat.type).charAt(0).toUpperCase() + String(subcat.type).slice(1)}: ${subcat.candidate_name} for ${subcat.job_title}`;
  return { name: label, subcategories: subcat };
}

router.get("/interviews", async (req, res) => {
  const { candidate_id, job_id, status } = req.query;

  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) { res.status(500).json({ error: error.message }); return; }

  let interviews = (data ?? []).map(mapInterview);

  if (candidate_id) interviews = interviews.filter(i => i.candidate_id === candidate_id);
  if (job_id) interviews = interviews.filter(i => i.job_id === job_id);
  if (status) interviews = interviews.filter(i => i.status === status);

  res.json(interviews);
});

router.post("/interviews", async (req, res) => {
  const row = buildRow(req.body);
  const { data, error } = await supabase.from("categories").insert(row).select().single();
  if (error) { res.status(500).json({ error: error.message }); return; }
  res.status(201).json(mapInterview(data));
});

router.get("/interviews/:id", async (req, res) => {
  const { data } = await supabase.from("categories").select("*").eq("id", req.params.id).maybeSingle();
  if (!data) { res.status(404).json({ error: "Not found" }); return; }
  res.json(mapInterview(data));
});

router.patch("/interviews/:id", async (req, res) => {
  const { data: existing } = await supabase.from("categories").select("*").eq("id", req.params.id).maybeSingle();
  if (!existing) { res.status(404).json({ error: "Not found" }); return; }

  const row = buildRow(req.body, existing);
  const { data, error } = await supabase
    .from("categories")
    .update({ ...row, updated_at: new Date().toISOString() })
    .eq("id", req.params.id)
    .select()
    .single();

  if (error) { res.status(500).json({ error: error.message }); return; }
  res.json(mapInterview(data));
});

router.delete("/interviews/:id", async (req, res) => {
  await supabase.from("categories").delete().eq("id", req.params.id);
  res.status(204).send();
});

router.post("/interviews/:id/evaluate", async (req, res) => {
  const { overall_rating, hire_recommendation, technical_score, communication_score, problem_solving_score, notes } = req.body;
  const { data: existing } = await supabase.from("categories").select("*").eq("id", req.params.id).maybeSingle();
  if (!existing) { res.status(404).json({ error: "Not found" }); return; }

  const prev = parseSubcat((existing as Record<string, unknown>).subcategories);
  const updated: Record<string, unknown> = {
    ...prev,
    status: "completed",
    score: overall_rating,
    hire_recommendation,
    technical_score,
    communication_score,
    problem_solving_score,
    notes: notes ?? prev.notes,
  };
  const updType = String(updated.type ?? "screening");
  const label = `${updType.charAt(0).toUpperCase() + updType.slice(1)}: ${String(updated.candidate_name ?? "")} for ${String(updated.job_title ?? "")}`;

  const { data, error } = await supabase
    .from("categories")
    .update({ name: label, subcategories: updated, updated_at: new Date().toISOString() })
    .eq("id", req.params.id)
    .select()
    .single();

  if (error) { res.status(500).json({ error: error.message }); return; }
  res.json(mapInterview(data));
});

export default router;
