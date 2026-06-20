import { Request } from "express";
import { supabase } from "./supabase";

export const DEFAULT_ORG_ID = "a0000000-0000-0000-0000-000000000001";

export async function getOrgId(req: Request): Promise<string> {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token || token.startsWith("demo-token")) {
    return DEFAULT_ORG_ID;
  }
  const { data } = await supabase.auth.getUser(token);
  if (!data.user) return DEFAULT_ORG_ID;

  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", data.user.id)
    .maybeSingle();

  return profile?.organization_id ?? DEFAULT_ORG_ID;
}

export async function getUserId(req: Request): Promise<string> {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token || token.startsWith("demo-token")) {
    return "b0000000-0000-0000-0000-000000000001";
  }
  const { data } = await supabase.auth.getUser(token);
  return data.user?.id ?? "b0000000-0000-0000-0000-000000000001";
}
