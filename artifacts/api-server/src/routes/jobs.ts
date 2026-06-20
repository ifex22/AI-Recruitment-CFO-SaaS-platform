import { Router, type IRouter } from "express";
import { supabase } from "../lib/supabase";

const router: IRouter = Router();

function mapJob(j: Record<string, unknown>, candidateCount = 0) {
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
    candidate_count: candidateCount,
    posted_date: j.created_at,
    created_at: j.created_at,
    updated_at: j.updated_at,
  };
}

function toDb(body: Record<string, unknown>) {
  const m: Record<string, unknown> = {};
  if (body.title !== undefined) m.name = body.title;
  if (body.name !== undefined) m.name = body.name;
  if (body.department !== undefined) m.category = body.department;
  if (body.location !== undefined) m.brand = body.location;
  if (body.employment_type !== undefined) m.subcategory = body.employment_type;
  if (body.status !== undefined) m.barcode = body.status;
  if (body.description !== undefined) m.unit = body.description;
  if (body.requirements !== undefined) m.unit = body.requirements;
  if (body.salary_min !== undefined) m.discount_price = Number(body.salary_min);
  if (body.salary_max !== undefined) m.price = Number(body.salary_max);
  if (body.openings !== undefined) m.quantity = Number(body.openings);
  if (body.job_code !== undefined) m.sku = body.job_code;
  if (!m.sku) m.sku = `JOB-${Date.now().toString().slice(-6)}`;
  if (!m.low_stock_alert) m.low_stock_alert = 1;
  return m;
}

router.get("/jobs", async (req, res) => {
  const { status, department } = req.query;

  let query = supabase.from("products").select("*").order("created_at", { ascending: false });

  if (status) query = query.eq("barcode", status as string);
  if (department) query = query.eq("category", department as string);

  const { data, error } = await query;
  if (error) { res.status(500).json({ error: error.message }); return; }

  // Count candidates per job from customers table
  const { data: allCandidates } = await supabase.from("customers").select("address");
  const candidateCounts: Record<string, number> = {};
  (allCandidates ?? []).forEach(c => {
    try {
      const addr = JSON.parse(c.address ?? "{}");
      if (addr.job_id) candidateCounts[addr.job_id] = (candidateCounts[addr.job_id] ?? 0) + 1;
    } catch {}
  });

  res.json((data ?? []).map(j => mapJob(j, candidateCounts[j.id as string] ?? 0)));
});

router.post("/jobs", async (req, res) => {
  const dbRow = toDb(req.body);
  if (!dbRow.name) { res.status(400).json({ error: "title required" }); return; }

  const { data, error } = await supabase.from("products").insert(dbRow).select().single();
  if (error) { res.status(500).json({ error: error.message }); return; }
  res.status(201).json(mapJob(data, 0));
});

router.get("/jobs/stats/overview", async (req, res) => {
  const { data: jobs } = await supabase.from("products").select("barcode, category");

  const deptMap: Record<string, number> = {};
  (jobs ?? []).forEach(j => { deptMap[j.category] = (deptMap[j.category] ?? 0) + 1; });

  res.json({
    total_open: (jobs ?? []).filter(j => j.barcode === "open").length,
    total_closed: (jobs ?? []).filter(j => j.barcode === "closed").length,
    by_department: Object.entries(deptMap).map(([department, count]) => ({ department, count })),
    avg_time_to_fill: 28,
  });
});

router.get("/jobs/:id", async (req, res) => {
  const { data, error } = await supabase.from("products").select("*").eq("id", req.params.id).maybeSingle();
  if (error || !data) { res.status(404).json({ error: "Job not found" }); return; }

  const { data: candidates } = await supabase.from("customers").select("address");
  const count = (candidates ?? []).filter(c => {
    try { return JSON.parse(c.address ?? "{}").job_id === req.params.id; } catch { return false; }
  }).length;

  res.json(mapJob(data, count));
});

router.patch("/jobs/:id", async (req, res) => {
  const dbRow = toDb(req.body);
  const { data, error } = await supabase
    .from("products")
    .update({ ...dbRow, updated_at: new Date().toISOString() })
    .eq("id", req.params.id)
    .select()
    .single();

  if (error) { res.status(500).json({ error: error.message }); return; }
  res.json(mapJob(data, 0));
});

router.delete("/jobs/:id", async (req, res) => {
  await supabase.from("products").delete().eq("id", req.params.id);
  res.status(204).send();
});

export default router;
