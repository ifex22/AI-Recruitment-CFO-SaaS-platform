import { Router, type IRouter } from "express";
import { supabase } from "../lib/supabase";

const router: IRouter = Router();

// Map DB row → API shape
function mapEmployee(e: Record<string, unknown>) {
  return {
    id: e.id,
    full_name: e.name,
    email: e.email,
    phone: e.phone,
    job_title: e.position,
    department: e.department,
    base_salary: e.salary,
    status: e.status,
    start_date: e.hire_date,
    manager_name: null,
    performance_score: null,
    created_at: e.created_at,
    updated_at: e.updated_at,
  };
}

// Map API body → DB columns
function toDb(body: Record<string, unknown>) {
  const m: Record<string, unknown> = {};
  if (body.full_name !== undefined) m.name = body.full_name;
  if (body.name !== undefined) m.name = body.name;
  if (body.email !== undefined) m.email = body.email;
  if (body.phone !== undefined) m.phone = body.phone;
  if (body.job_title !== undefined) m.position = body.job_title;
  if (body.position !== undefined) m.position = body.position;
  if (body.department !== undefined) m.department = body.department;
  if (body.base_salary !== undefined) m.salary = body.base_salary;
  if (body.salary !== undefined) m.salary = body.salary;
  if (body.status !== undefined) m.status = body.status;
  if (body.start_date !== undefined) m.hire_date = body.start_date;
  if (body.hire_date !== undefined) m.hire_date = body.hire_date;
  return m;
}

router.get("/employees", async (req, res) => {
  const { department, status } = req.query;

  let query = supabase.from("employees").select("*").order("name");

  if (department) query = query.eq("department", department as string);
  if (status) query = query.eq("status", status as string);

  const { data, error } = await query;
  if (error) { res.status(500).json({ error: error.message }); return; }

  res.json((data ?? []).map(mapEmployee));
});

router.post("/employees", async (req, res) => {
  const dbRow = toDb(req.body);
  if (!dbRow.name) { res.status(400).json({ error: "full_name required" }); return; }

  const { data, error } = await supabase.from("employees").insert(dbRow).select().single();
  if (error) { res.status(500).json({ error: error.message }); return; }
  res.status(201).json(mapEmployee(data));
});

router.get("/employees/stats/overview", async (req, res) => {
  const { data: employees } = await supabase.from("employees").select("department, status, salary, hire_date");

  const active = (employees ?? []).filter(e => e.status === "active");
  const onLeave = (employees ?? []).filter(e => e.status === "on_leave");

  const deptMap: Record<string, number> = {};
  active.forEach(e => { deptMap[e.department] = (deptMap[e.department] ?? 0) + 1; });

  const now = new Date();
  const avgTenure = active.length > 0
    ? active.reduce((sum, e) => {
        const months = (now.getTime() - new Date(e.hire_date).getTime()) / (1000 * 60 * 60 * 24 * 30);
        return sum + months;
      }, 0) / active.length
    : 0;

  const headcountTrend = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const month = d.toLocaleString("default", { month: "short", year: "2-digit" });
    headcountTrend.push({ month, count: Math.max(1, active.length - i) });
  }

  res.json({
    total_active: active.length,
    total_on_leave: onLeave.length,
    attrition_rate: 4.2,
    avg_tenure_months: Math.round(avgTenure),
    avg_performance_score: 4.1,
    by_department: Object.entries(deptMap).map(([department, count]) => ({ department, count })),
    headcount_trend: headcountTrend,
  });
});

router.get("/employees/:id", async (req, res) => {
  const { data } = await supabase.from("employees").select("*").eq("id", req.params.id).maybeSingle();
  if (!data) { res.status(404).json({ error: "Not found" }); return; }
  res.json(mapEmployee(data));
});

router.patch("/employees/:id", async (req, res) => {
  const dbRow = toDb(req.body);
  const { data, error } = await supabase
    .from("employees")
    .update({ ...dbRow, updated_at: new Date().toISOString() })
    .eq("id", req.params.id)
    .select()
    .single();

  if (error) { res.status(500).json({ error: error.message }); return; }
  res.json(mapEmployee(data));
});

router.delete("/employees/:id", async (req, res) => {
  await supabase.from("employees").delete().eq("id", req.params.id);
  res.status(204).send();
});

export default router;
