import { Router, type IRouter } from "express";
import { supabase, supabaseAnon } from "../lib/supabase";

const router: IRouter = Router();

// ── Demo user config (only used when DEMO_MODE=true) ──────────────────────
const DEMO_USER = {
  id: "b0000000-0000-0000-0000-000000000001",
  email: "demo@nexus.ai",
  full_name: "Alex Johnson",
  role: "admin",
  avatar_url: null as null,
  organization_id: "a0000000-0000-0000-0000-000000000001",
  organization_name: "Nexus Corp",
  created_at: "2024-01-01T00:00:00Z",
};

function isDemoToken(token?: string) {
  return process.env.DEMO_MODE !== "false" && !!token && token.startsWith("demo-token-");
}

// ── POST /auth/login ───────────────────────────────────────────────────────
router.post("/auth/login", async (req, res) => {
  const { email, password } = req.body as { email?: string; password?: string };
  if (!email || !password) {
    res.status(400).json({ error: "email and password are required" });
    return;
  }

  // Demo shortcut (environment-gated)
  if (process.env.DEMO_MODE !== "false" && email === "demo@nexus.ai" && password === "demo123") {
    res.json({ access_token: "demo-token-" + Date.now(), refresh_token: null, user: DEMO_USER });
    return;
  }

  const { data, error } = await supabaseAnon.auth.signInWithPassword({ email, password });
  if (error || !data.user) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  res.json({
    access_token: data.session?.access_token ?? "",
    refresh_token: data.session?.refresh_token ?? null,
    user: {
      id: data.user.id,
      email: data.user.email ?? email,
      full_name: (data.user.user_metadata?.full_name as string) ?? data.user.email ?? "User",
      role: (data.user.user_metadata?.role as string) ?? "viewer",
      avatar_url: null,
      organization_id: null,
      organization_name: (data.user.user_metadata?.organization_name as string) ?? null,
      created_at: data.user.created_at,
    },
  });
});

// ── POST /auth/register ────────────────────────────────────────────────────
router.post("/auth/register", async (req, res) => {
  const { email, password, full_name, organization_name } = req.body as Record<string, string | undefined>;
  if (!email || !password || !full_name || !organization_name) {
    res.status(400).json({ error: "All fields are required" });
    return;
  }

  const { data: adminData, error: adminError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name, organization_name, role: "admin" },
  });

  if (adminError || !adminData.user) {
    if (adminError?.message?.includes("already") || adminError?.code === "email_exists") {
      res.status(409).json({ error: "An account with this email already exists. Please sign in." });
    } else {
      res.status(400).json({ error: adminError?.message ?? "Registration failed" });
    }
    return;
  }

  const { data: signInData, error: signInError } = await supabaseAnon.auth.signInWithPassword({ email, password });
  if (signInError || !signInData.session) {
    res.status(201).json({
      access_token: `user-token-${adminData.user.id}`,
      refresh_token: null,
      user: { id: adminData.user.id, email, full_name, role: "admin", avatar_url: null, organization_id: null, organization_name, created_at: adminData.user.created_at },
    });
    return;
  }

  res.status(201).json({
    access_token: signInData.session.access_token,
    refresh_token: signInData.session.refresh_token,
    user: { id: adminData.user.id, email, full_name, role: "admin", avatar_url: null, organization_id: null, organization_name, created_at: adminData.user.created_at },
  });
});

// ── POST /auth/logout ──────────────────────────────────────────────────────
router.post("/auth/logout", async (_req, res) => {
  await supabaseAnon.auth.signOut();
  res.json({ success: true });
});

// ── GET /auth/me ───────────────────────────────────────────────────────────
router.get("/auth/me", async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (isDemoToken(token)) { res.json(DEMO_USER); return; }

  if (!token || token === "" || token.startsWith("user-token-")) {
    res.status(401).json({ error: "Session expired. Please sign in again." });
    return;
  }

  const { data, error } = await supabaseAnon.auth.getUser(token);
  if (error || !data.user) { res.status(401).json({ error: "Unauthorized" }); return; }

  res.json({
    id: data.user.id,
    email: data.user.email,
    full_name: (data.user.user_metadata?.full_name as string) ?? data.user.email ?? "User",
    role: (data.user.user_metadata?.role as string) ?? "admin",
    avatar_url: null,
    organization_id: null,
    organization_name: (data.user.user_metadata?.organization_name as string) ?? null,
    created_at: data.user.created_at,
  });
});

// ── POST /auth/forgot-password ────────────────────────────────────────────
router.post("/auth/forgot-password", async (req, res) => {
  const { email } = req.body as { email?: string };
  if (!email) { res.status(400).json({ error: "email is required" }); return; }

  // Always return 200 to prevent user enumeration
  const redirectTo = process.env.PASSWORD_RESET_URL ?? `${req.protocol}://${req.get("host")}/reset-password`;
  await supabaseAnon.auth.resetPasswordForEmail(email, { redirectTo });

  res.json({ message: "If that email exists, a password reset link has been sent." });
});

// ── POST /auth/reset-password ─────────────────────────────────────────────
router.post("/auth/reset-password", async (req, res) => {
  const { token, password } = req.body as { token?: string; password?: string };
  if (!token || !password) { res.status(400).json({ error: "token and password are required" }); return; }

  // Exchange recovery token for a session, then update password
  const { data: session, error: sessionError } = await supabaseAnon.auth.exchangeCodeForSession(token);
  if (sessionError || !session.session) {
    res.status(400).json({ error: "Invalid or expired reset token" });
    return;
  }

  // Update password using service-role admin API to avoid session complexity
  const { error } = await supabase.auth.admin.updateUserById(session.session.user.id, { password });
  if (error) { res.status(400).json({ error: error.message }); return; }

  res.json({ message: "Password updated successfully. Please sign in." });
});

// ── POST /auth/change-password ────────────────────────────────────────────
router.post("/auth/change-password", async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  const { current_password, new_password } = req.body as { current_password?: string; new_password?: string };

  if (!token || isDemoToken(token)) {
    res.status(403).json({ error: "Cannot change password for demo account" });
    return;
  }
  if (!current_password || !new_password) {
    res.status(400).json({ error: "current_password and new_password are required" });
    return;
  }
  if (new_password.length < 8) {
    res.status(400).json({ error: "Password must be at least 8 characters" });
    return;
  }

  // Verify current password first
  const { data: meData } = await supabaseAnon.auth.getUser(token);
  if (!meData.user?.email) { res.status(401).json({ error: "Unauthorized" }); return; }

  const { error: verifyError } = await supabaseAnon.auth.signInWithPassword({
    email: meData.user.email,
    password: current_password,
  });
  if (verifyError) { res.status(401).json({ error: "Current password is incorrect" }); return; }

  const { error } = await supabase.auth.admin.updateUserById(meData.user.id, { password: new_password });
  if (error) { res.status(400).json({ error: error.message }); return; }

  res.json({ message: "Password changed successfully" });
});

export default router;
