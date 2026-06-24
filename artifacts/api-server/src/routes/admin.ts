import { Router, type IRouter } from "express";
import { supabase } from "../lib/supabase";
import { requireRole } from "../middleware/auth";

const router: IRouter = Router();

// index.ts applies requireAuth before adminRouter — only add requireRole here

// ── Users (backed by Supabase Auth admin API) ──────────────────────────────

router.get("/admin/users", requireRole("admin"), async (req, res) => {
  const { data, error } = await supabase.auth.admin.listUsers({ perPage: 200 });
  if (error) { res.status(500).json({ error: error.message }); return; }

  const users = (data.users ?? []).map(u => ({
    id: u.id,
    email: u.email ?? "",
    full_name: (u.user_metadata?.full_name as string) ?? u.email ?? "Unknown",
    role: (u.user_metadata?.role as string) ?? "viewer",
    status: u.banned_until ? "suspended" : (u.email_confirmed_at ? "active" : "pending"),
    created_at: u.created_at,
  }));

  res.json(users);
});

router.post("/admin/users", requireRole("admin"), async (req, res) => {
  const { email, full_name, role } = req.body as { email?: string; full_name?: string; role?: string };
  if (!email || !full_name) {
    res.status(400).json({ error: "email and full_name required" });
    return;
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: { full_name, role: role ?? "viewer" },
  });
  if (error) { res.status(400).json({ error: error.message }); return; }

  const u = data.user;
  res.status(201).json({
    id: u.id,
    email: u.email,
    full_name,
    role: role ?? "viewer",
    status: "active",
    created_at: u.created_at,
  });
});

router.get("/admin/users/:id", requireRole("admin"), async (req, res) => {
  const { data, error } = await supabase.auth.admin.getUserById(req.params.id);
  if (error || !data.user) { res.status(404).json({ error: "Not found" }); return; }
  const u = data.user;
  res.json({
    id: u.id,
    email: u.email ?? "",
    full_name: (u.user_metadata?.full_name as string) ?? u.email ?? "Unknown",
    role: (u.user_metadata?.role as string) ?? "viewer",
    status: u.banned_until ? "suspended" : (u.email_confirmed_at ? "active" : "pending"),
    created_at: u.created_at,
  });
});

router.patch("/admin/users/:id", requireRole("admin"), async (req, res) => {
  const { full_name, role, status } = req.body as { full_name?: string; role?: string; status?: string };

  const updates: Parameters<typeof supabase.auth.admin.updateUserById>[1] = {};
  if (full_name || role) {
    updates.user_metadata = {};
    if (full_name) updates.user_metadata.full_name = full_name;
    if (role) updates.user_metadata.role = role;
  }
  if (status === "suspended") updates.ban_duration = "87600h";
  if (status === "active") updates.ban_duration = "none";

  const { data, error } = await supabase.auth.admin.updateUserById(req.params.id, updates);
  if (error) { res.status(400).json({ error: error.message }); return; }
  const u = data.user;
  res.json({
    id: u.id,
    email: u.email ?? "",
    full_name: (u.user_metadata?.full_name as string) ?? u.email ?? "Unknown",
    role: (u.user_metadata?.role as string) ?? "viewer",
    status: status ?? (u.email_confirmed_at ? "active" : "pending"),
    created_at: u.created_at,
  });
});

router.delete("/admin/users/:id", requireRole("admin"), async (req, res) => {
  const { error } = await supabase.auth.admin.deleteUser(req.params.id);
  if (error) { res.status(400).json({ error: error.message }); return; }
  res.status(204).send();
});

// ── Organization (backed by brands table) ─────────────────────────────────

router.get("/admin/organization", async (_req, res) => {
  const { data, error } = await supabase.from("brands").select("*").limit(1).maybeSingle();
  if (error) { res.status(500).json({ error: error.message }); return; }

  if (data) {
    let details: Record<string, unknown> = {};
    try { details = JSON.parse(data.description ?? "{}"); } catch {}
    res.json({ id: data.id, name: data.name, ...details, created_at: data.created_at });
    return;
  }

  res.json({ id: null, name: "My Organization", industry: "", size: "", currency: "USD", country: "" });
});

router.patch("/admin/organization", requireRole("admin"), async (req, res) => {
  const { data: existing } = await supabase.from("brands").select("*").limit(1).maybeSingle();
  const { name, ...details } = req.body as Record<string, unknown>;
  const description = JSON.stringify(details);

  if (existing) {
    const { data, error } = await supabase
      .from("brands")
      .update({ name: (name as string) ?? existing.name, description, updated_at: new Date().toISOString() })
      .eq("id", existing.id)
      .select()
      .single();
    if (error) { res.status(500).json({ error: error.message }); return; }
    res.json({ id: data.id, name: data.name, ...details });
  } else {
    const { data, error } = await supabase
      .from("brands")
      .insert({ name: (name as string) ?? "My Organization", description })
      .select()
      .single();
    if (error) { res.status(500).json({ error: error.message }); return; }
    res.json({ id: data.id, name: data.name, ...details });
  }
});

// ── Audit Logs ────────────────────────────────────────────────────────────

router.get("/admin/audit-logs", async (req, res) => {
  const { limit: lim } = req.query;
  const take = Math.min(Number(lim ?? 50), 200);

  const [empRes, candidatesRes, interviewsRes, payrollRes, salesRes] = await Promise.all([
    supabase.from("employees").select("id, name, department, updated_at").order("updated_at", { ascending: false }).limit(10),
    supabase.from("customers").select("id, name, status, updated_at").order("updated_at", { ascending: false }).limit(10),
    supabase.from("categories").select("id, name, updated_at").order("updated_at", { ascending: false }).limit(5),
    supabase.from("suppliers").select("id, name, status, updated_at").order("updated_at", { ascending: false }).limit(5),
    supabase.from("sales").select("id, order_id, total, updated_at").order("updated_at", { ascending: false }).limit(5),
  ]);

  const logs = [
    ...(empRes.data ?? []).map(e => ({ id: `emp-${e.id}`, action: "UPDATE_EMPLOYEE", entity_type: "employee", details: `Updated ${e.name} in ${e.department}`, created_at: e.updated_at })),
    ...(candidatesRes.data ?? []).map(c => ({ id: `cand-${c.id}`, action: "ADVANCE_STAGE", entity_type: "candidate", details: `Moved ${c.name} to ${c.status}`, created_at: c.updated_at })),
    ...(interviewsRes.data ?? []).map(i => ({ id: `int-${i.id}`, action: "SCHEDULE_INTERVIEW", entity_type: "interview", details: i.name, created_at: i.updated_at })),
    ...(payrollRes.data ?? []).map(p => ({ id: `pay-${p.id}`, action: "PROCESS_PAYROLL", entity_type: "payroll_run", details: `${p.name} — ${p.status}`, created_at: p.updated_at })),
    ...(salesRes.data ?? []).map(s => ({ id: `sale-${s.id}`, action: "ADD_TRANSACTION", entity_type: "transaction", details: `${s.order_id} — $${s.total}`, created_at: s.updated_at })),
  ]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, take);

  res.json(logs);
});

// ── Communications ─────────────────────────────────────────────────────────

import { loadCommConfig, saveCommConfig, maskKey, statusOf } from "../lib/comm-config";

function buildKeysResponse(cfg: Awaited<ReturnType<typeof loadCommConfig>>) {
  return {
    resend_api_key: maskKey(cfg.resend_api_key),
    from_email: cfg.from_email ?? "",
    twilio_account_sid: maskKey(cfg.twilio_account_sid),
    twilio_auth_token: maskKey(cfg.twilio_auth_token),
    twilio_from: cfg.twilio_from ?? "",
    openai_api_key: maskKey(cfg.openai_api_key),
    admin_email: cfg.admin_email ?? "",
    admin_phone: cfg.admin_phone ?? "",
  };
}

router.get("/admin/communications", requireRole("admin"), async (_req, res) => {
  const cfg = await loadCommConfig();
  res.json({ ...statusOf(cfg), keys: buildKeysResponse(cfg) });
});

router.post("/admin/communications/config", requireRole("admin"), async (req, res) => {
  const patch = req.body as Record<string, string>;
  await saveCommConfig(patch);
  const cfg = await loadCommConfig();
  res.json({ ok: true, ...statusOf(cfg), keys: buildKeysResponse(cfg) });
});

router.post("/admin/communications/test-email", requireRole("admin"), async (req, res) => {
  const cfg = await loadCommConfig();
  if (!cfg.resend_api_key) {
    res.status(400).json({ error: "Resend API key not configured. Enter it in the Communications tab and save." }); return;
  }
  const { to } = req.body as { to?: string };
  if (!to) { res.status(400).json({ error: "to email required" }); return; }
  const { Resend } = await import("resend");
  const resend = new Resend(cfg.resend_api_key);
  const { error } = await resend.emails.send({
    from: cfg.from_email ?? "noreply@nexusai.app",
    to,
    subject: "Nexus AI — Email Test",
    html: `<div style="font-family:sans-serif;padding:24px;max-width:480px"><h2 style="color:#2563eb">✅ Email is working!</h2><p>This is a test email from your <strong>Nexus AI Recruitment Platform</strong>.</p><p style="color:#64748b;font-size:13px">Sent via Resend · from ${cfg.from_email ?? "noreply@nexusai.app"}</p></div>`,
  });
  if (error) { res.status(500).json({ error: (error as { message?: string }).message ?? "Send failed" }); return; }
  res.json({ ok: true, message: `Test email sent to ${to}` });
});

router.post("/admin/communications/test-sms", requireRole("admin"), async (req, res) => {
  const cfg = await loadCommConfig();
  if (!(cfg.twilio_account_sid && cfg.twilio_auth_token && cfg.twilio_from)) {
    res.status(400).json({ error: "Twilio credentials not configured. Enter them in the Communications tab and save." }); return;
  }
  const { to } = req.body as { to?: string };
  if (!to) { res.status(400).json({ error: "to phone number required" }); return; }
  const twilio = (await import("twilio")).default;
  const client = twilio(cfg.twilio_account_sid, cfg.twilio_auth_token);
  try {
    await client.messages.create({ from: cfg.twilio_from, to, body: "✅ Nexus AI test SMS — your notifications are working!" });
    res.json({ ok: true, message: `Test SMS sent to ${to}` });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "SMS send failed";
    res.status(500).json({ error: msg });
  }
});

export default router;
