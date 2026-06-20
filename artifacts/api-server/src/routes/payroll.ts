import { Router, type IRouter } from "express";
import { supabase } from "../lib/supabase";

const router: IRouter = Router();

function parseAddr(addr: string | null): Record<string, unknown> {
  try { return addr ? JSON.parse(addr) : {}; } catch { return {}; }
}

function mapPayrollRun(s: Record<string, unknown>) {
  const d = parseAddr(s.address as string | null);
  return {
    id: s.id,
    period_label: s.name,
    period_start: d.period_start ?? "",
    period_end: d.period_end ?? "",
    status: s.status,
    employee_count: s.total_orders ?? d.employee_count ?? 0,
    total_gross: s.total_amount ?? d.total_gross ?? 0,
    total_net: d.total_net ?? Math.round(Number(s.total_amount ?? 0) * 0.75),
    total_tax: d.total_tax ?? Math.round(Number(s.total_amount ?? 0) * 0.25),
    total_benefits: d.total_benefits ?? Math.round(Number(s.total_amount ?? 0) * 0.10),
    notes: d.notes ?? "",
    processed_at: d.processed_at ?? null,
    created_at: s.created_at,
    updated_at: s.updated_at,
  };
}

router.get("/payroll/runs", async (req, res) => {
  const { data, error } = await supabase.from("suppliers").select("*").order("created_at", { ascending: false });
  if (error) { res.status(500).json({ error: error.message }); return; }
  res.json((data ?? []).map(mapPayrollRun));
});

router.post("/payroll/runs", async (req, res) => {
  const { period_start, period_end, notes } = req.body;

  // Calculate from active employees
  const { data: employees } = await supabase.from("employees").select("salary").eq("status", "active");
  const annualSalary = (employees ?? []).reduce((sum, e) => sum + Number(e.salary), 0);
  const monthlyGross = Math.round(annualSalary / 12);
  const tax = Math.round(monthlyGross * 0.25);
  const benefits = Math.round(monthlyGross * 0.10);
  const net = monthlyGross - tax - benefits;

  const periodLabel = period_start ? `${new Date(period_start).toLocaleString("default", { month: "long", year: "numeric" })} Payroll` : `Payroll ${Date.now()}`;

  const addrData = { period_start, period_end, total_gross: monthlyGross, total_net: net, total_tax: tax, total_benefits: benefits, employee_count: employees?.length ?? 0, notes };

  const { data, error } = await supabase.from("suppliers").insert({
    name: periodLabel,
    email: "payroll@nexus.ai",
    phone: "",
    address: JSON.stringify(addrData),
    total_orders: employees?.length ?? 0,
    total_amount: monthlyGross,
    status: "draft",
  }).select().single();

  if (error) { res.status(500).json({ error: error.message }); return; }
  res.status(201).json(mapPayrollRun(data));
});

router.get("/payroll/summary", async (req, res) => {
  const { data: employees } = await supabase.from("employees").select("department, salary").eq("status", "active");

  const deptMap: Record<string, { count: number; total: number }> = {};
  (employees ?? []).forEach(e => {
    if (!deptMap[e.department]) deptMap[e.department] = { count: 0, total: 0 };
    deptMap[e.department].count++;
    deptMap[e.department].total += Number(e.salary);
  });

  const totalAnnual = (employees ?? []).reduce((s, e) => s + Number(e.salary), 0);
  const monthlyPayroll = Math.round(totalAnnual / 12);
  const currentMonth = new Date().getMonth();

  res.json({
    total_monthly_payroll: monthlyPayroll,
    ytd_payroll: monthlyPayroll * currentMonth,
    avg_salary: employees?.length ? Math.round(totalAnnual / employees.length) : 0,
    by_department: Object.entries(deptMap).map(([department, d]) => ({
      department,
      headcount: d.count,
      total_cost: Math.round(d.total / 12),
      avg_salary: Math.round(d.total / d.count),
    })),
  });
});

router.get("/payroll/runs/:id", async (req, res) => {
  const { data } = await supabase.from("suppliers").select("*").eq("id", req.params.id).maybeSingle();
  if (!data) { res.status(404).json({ error: "Not found" }); return; }
  res.json(mapPayrollRun(data));
});

router.patch("/payroll/runs/:id", async (req, res) => {
  const { data: existing } = await supabase.from("suppliers").select("*").eq("id", req.params.id).maybeSingle();
  if (!existing) { res.status(404).json({ error: "Not found" }); return; }

  const prev = parseAddr((existing as Record<string, unknown>).address as string | null);
  const newAddr = { ...prev };
  if (req.body.period_start !== undefined) newAddr.period_start = req.body.period_start;
  if (req.body.period_end !== undefined) newAddr.period_end = req.body.period_end;
  if (req.body.notes !== undefined) newAddr.notes = req.body.notes;

  const upd: Record<string, unknown> = { address: JSON.stringify(newAddr), updated_at: new Date().toISOString() };
  if (req.body.status !== undefined) upd.status = req.body.status;

  const { data, error } = await supabase.from("suppliers").update(upd).eq("id", req.params.id).select().single();
  if (error) { res.status(500).json({ error: error.message }); return; }
  res.json(mapPayrollRun(data));
});

router.post("/payroll/runs/:id/process", async (req, res) => {
  const { data: existing } = await supabase.from("suppliers").select("*").eq("id", req.params.id).maybeSingle();
  if (!existing) { res.status(404).json({ error: "Not found" }); return; }

  const prev = parseAddr((existing as Record<string, unknown>).address as string | null);
  const newAddr = { ...prev, processed_at: new Date().toISOString() };

  const { data, error } = await supabase
    .from("suppliers")
    .update({ status: "completed", address: JSON.stringify(newAddr), updated_at: new Date().toISOString() })
    .eq("id", req.params.id)
    .select()
    .single();

  if (error) { res.status(500).json({ error: error.message }); return; }
  res.json(mapPayrollRun(data));
});

export default router;
