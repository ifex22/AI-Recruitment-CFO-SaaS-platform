import { supabase } from "./supabase";

export interface CommConfig {
  resend_api_key?: string;
  from_email?: string;
  twilio_account_sid?: string;
  twilio_auth_token?: string;
  twilio_from?: string;
  openai_api_key?: string;
  admin_email?: string;
  admin_phone?: string;
}

let _cache: CommConfig | null = null;
let _cacheTime = 0;
const CACHE_TTL = 30_000;

export async function loadCommConfig(): Promise<CommConfig> {
  if (_cache && Date.now() - _cacheTime < CACHE_TTL) return _cache;

  const { data } = await supabase.from("brands").select("description").limit(1).maybeSingle();
  let cfg: CommConfig = {};
  try {
    const details = JSON.parse(data?.description ?? "{}") as Record<string, unknown>;
    cfg = (details.comm_config as CommConfig) ?? {};
  } catch { /* ignore */ }

  const merged: CommConfig = {
    resend_api_key: cfg.resend_api_key || process.env.RESEND_API_KEY,
    from_email: cfg.from_email || process.env.FROM_EMAIL || "noreply@nexusai.app",
    twilio_account_sid: cfg.twilio_account_sid || process.env.TWILIO_ACCOUNT_SID,
    twilio_auth_token: cfg.twilio_auth_token || process.env.TWILIO_AUTH_TOKEN,
    twilio_from: cfg.twilio_from || process.env.TWILIO_FROM,
    openai_api_key: cfg.openai_api_key || process.env.OPENAI_API_KEY,
    admin_email: cfg.admin_email || process.env.ADMIN_EMAIL,
    admin_phone: cfg.admin_phone || process.env.ADMIN_PHONE,
  };

  _cache = merged;
  _cacheTime = Date.now();
  return merged;
}

export function bustCache() {
  _cache = null;
}

export async function saveCommConfig(patch: Partial<CommConfig>) {
  const { data } = await supabase.from("brands").select("id, description").limit(1).maybeSingle();
  if (!data) return;

  let details: Record<string, unknown> = {};
  try { details = JSON.parse(data.description ?? "{}") as Record<string, unknown>; } catch { /* ignore */ }

  const existing = (details.comm_config as CommConfig) ?? {};
  const next: CommConfig = { ...existing };

  for (const [k, v] of Object.entries(patch)) {
    const key = k as keyof CommConfig;
    if (v && v !== "••••••••") next[key] = v as string;
    else if (!v) delete next[key];
  }

  details.comm_config = next;
  await supabase.from("brands").update({ description: JSON.stringify(details) }).eq("id", data.id);
  bustCache();
}

export function maskKey(val: string | undefined): string {
  if (!val) return "";
  if (val.length <= 8) return "••••••••";
  return "••••••••" + val.slice(-4);
}

export function statusOf(cfg: CommConfig) {
  return {
    email: {
      configured: !!(cfg.resend_api_key),
      from: cfg.from_email ?? "noreply@nexusai.app",
      provider: "Resend",
    },
    sms: {
      configured: !!(cfg.twilio_account_sid && cfg.twilio_auth_token && cfg.twilio_from),
      from: cfg.twilio_from ?? "",
      provider: "Twilio",
    },
    ai: {
      configured: !!(cfg.openai_api_key),
      provider: "OpenAI",
    },
    notifications: {
      admin_email_set: !!(cfg.admin_email),
      admin_phone_set: !!(cfg.admin_phone),
    },
  };
}
