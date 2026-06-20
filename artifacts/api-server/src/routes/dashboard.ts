import { Router, type IRouter } from "express";
import { supabase } from "../lib/supabase";

const router: IRouter = Router();

// Note: requireAuth is applied globally in routes/index.ts before this router

function parseItems(items: unknown): Record<string, unknown> {
  if (!items) return {};
  if (typeof items === "object") return items as Record<string, unknown>;
  try { return JSON.parse(items as string); } catch { return {}; }
}

function parseSubcat(s: unknown): Record<string, unknown> {
  if (!s) return {};
  if (typeof s === "object") return s as Record<string, unknown>;
  try { return JSON.parse(s as string); } catch { return {}; }
}

router.get("/dashboard/summary", async (req, res) => {
  const [empRes, jobsRes, candidatesRes, interviewsRes, salesRes] = await Promise.all([
    supabase.from("employees").select("status, salary"),
    supabase.from("products").select("barcode"),
    supabase.from("customers").select("status, loyalty_points"),
    supabase.from("categories").select("subcategories"),
    supabase.from("sales").select("total, payment_method, items, payment_status, created_at"),
  ]);

  const employees = empRes.data ?? [];
  const jobs = jobsRes.data ?? [];
  const candidates = candidatesRes.data ?? [];
  const interviews = interviewsRes.data ?? [];
  const sales = salesRes.data ?? [];

  const activeEmployees = employees.filter(e => e.status === "active").length;
  const openJobs = jobs.filter(j => j.barcode === "open").length;
  const activeCandidates = candidates.filter(c => !["hired", "rejected"].includes(c.status ?? "")).length;

  const scheduledInterviews = interviews.filter(i => {
    const d = parseSubcat(i.subcategories);
    return d.status === "scheduled";
  }).length;

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);

  const txns = sales.map(s => {
    const items = parseItems(s.items);
    return {
      type: items.type ?? "revenue",
      amount: Number(s.total),
      date: String(items.date ?? s.created_at ?? "").slice(0, 10),
    };
  });

  const monthTxns = txns.filter(t => t.date >= monthStart);
  const allRevenue = txns.filter(t => t.type === "revenue").reduce((s, t) => s + t.amount, 0);
  const allExpenses = txns.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const monthlyRevenue = monthTxns.filter(t => t.type === "revenue").reduce((s, t) => s + t.amount, 0) || (allRevenue > 0 ? Math.round(allRevenue / 6) : 0);
  const monthlyExpenses = monthTxns.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0) || (allExpenses > 0 ? Math.round(allExpenses / 6) : 0);

  const totalAnnualSalary = employees.filter(e => e.status === "active").reduce((s, e) => s + Number(e.salary ?? 0), 0);
  const monthlyPayroll = Math.round(totalAnnualSalary / 12);

  const totalRevenue = txns.filter(t => t.type === "revenue").reduce((s, t) => s + t.amount, 0);
  const totalExpenses = txns.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const cashBalance = totalRevenue - totalExpenses;
  const burnRate = monthlyExpenses || monthlyPayroll;
  const runwayMonths = burnRate > 0 ? Math.round((cashBalance / burnRate) * 10) / 10 : null;

  const hiredThisMonth = candidates.filter(c => c.status === "hired").length;
  const totalEmployees = employees.length;
  const inactiveEmployees = employees.filter(e => e.status !== "active").length;
  const attritionRate = totalEmployees > 0 ? Math.round((inactiveEmployees / totalEmployees) * 1000) / 10 : 0;

  res.json({
    total_employees: activeEmployees,
    open_jobs: openJobs,
    active_candidates: activeCandidates,
    interviews_scheduled: scheduledInterviews,
    monthly_revenue: monthlyRevenue,
    monthly_expenses: monthlyExpenses,
    net_profit: monthlyRevenue - monthlyExpenses,
    hiring_velocity: hiredThisMonth,
    attrition_rate: attritionRate,
    payroll_this_month: monthlyPayroll,
    burn_rate: burnRate,
    cash_runway_months: runwayMonths,
  });
});

router.get("/dashboard/activity", async (req, res) => {
  const [empRes, candidatesRes, payrollRes] = await Promise.all([
    supabase.from("employees").select("name, department, created_at").order("created_at", { ascending: false }).limit(3),
    supabase.from("customers").select("name, status, updated_at").order("updated_at", { ascending: false }).limit(5),
    supabase.from("suppliers").select("name, status, updated_at").order("updated_at", { ascending: false }).limit(3),
  ]);

  const items = [
    ...(empRes.data ?? []).map(e => ({ id: `emp-${e.name}`, type: "hire", title: "New employee onboarded", description: `${e.name} joined the ${e.department} team`, created_at: e.created_at })),
    ...(candidatesRes.data ?? []).map(c => ({ id: `cand-${c.name}`, type: "recruitment", title: `Candidate ${c.status}`, description: `${c.name} moved to ${c.status} stage`, created_at: c.updated_at })),
    ...(payrollRes.data ?? []).map(p => ({ id: `pay-${p.name}`, type: "payroll", title: `Payroll ${p.status}`, description: `${p.name} — status: ${p.status}`, created_at: p.updated_at })),
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 15);

  res.json(items);
});

router.get("/dashboard/recruitment-funnel", async (req, res) => {
  const { data: candidates } = await supabase.from("customers").select("status");

  const counts: Record<string, number> = { applied: 0, screening: 0, interview: 0, offer: 0, hired: 0, rejected: 0 };
  (candidates ?? []).forEach(c => {
    const stage = c.status ?? "applied";
    counts[stage] = (counts[stage] ?? 0) + 1;
  });
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  const stages = Object.entries(counts).map(([stage, count]) => ({
    stage, count,
    percentage: total > 0 ? Math.round((count / total) * 100) : 0,
  }));

  res.json({ stages });
});

router.get("/dashboard/financial-snapshot", async (req, res) => {
  const { data: rows } = await supabase.from("sales").select("total, items, created_at").order("created_at");

  const monthMap: Record<string, { revenue: number; expense: number }> = {};
  const months: string[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const key = d.toISOString().slice(0, 7);
    months.push(d.toLocaleString("default", { month: "short", year: "2-digit" }));
    monthMap[key] = { revenue: 0, expense: 0 };
  }

  (rows ?? []).forEach(s => {
    const items = parseItems(s.items);
    const date = String(items.date ?? s.created_at ?? "").slice(0, 7);
    if (monthMap[date]) {
      if (items.type === "revenue") monthMap[date].revenue += Number(s.total);
      else monthMap[date].expense += Number(s.total);
    }
  });

  const monthKeys = Object.keys(monthMap);
  const revenue_trend = monthKeys.map(k => monthMap[k].revenue);
  const expense_trend = monthKeys.map(k => monthMap[k].expense);
  const profit_trend = monthKeys.map((_, i) => revenue_trend[i] - expense_trend[i]);

  res.json({ months, revenue_trend, expense_trend, profit_trend });
});

export default router;
