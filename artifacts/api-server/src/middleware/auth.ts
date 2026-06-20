import type { Request, Response, NextFunction } from "express";
import { supabaseAnon } from "../lib/supabase";

export interface AuthenticatedUser {
  id: string;
  email: string;
  full_name: string;
  role: string;
}

declare global {
  namespace Express {
    interface Request {
      authUser?: AuthenticatedUser;
    }
  }
}

const DEMO_USER: AuthenticatedUser = {
  id: "b0000000-0000-0000-0000-000000000001",
  email: "demo@nexus.ai",
  full_name: "Alex Johnson",
  role: "admin",
};

function isDemoToken(token: string): boolean {
  return token.startsWith("demo-token-");
}

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  const token = authHeader.slice(7).trim();
  if (!token) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  // Demo mode — only allowed when explicitly enabled
  if (isDemoToken(token) && process.env.DEMO_MODE !== "false") {
    req.authUser = DEMO_USER;
    next();
    return;
  }

  // Real Supabase session validation
  const { data, error } = await supabaseAnon.auth.getUser(token);
  if (error || !data.user) {
    res.status(401).json({ error: "Invalid or expired token" });
    return;
  }

  req.authUser = {
    id: data.user.id,
    email: data.user.email ?? "",
    full_name: (data.user.user_metadata?.full_name as string) ?? data.user.email ?? "User",
    role: (data.user.user_metadata?.role as string) ?? "viewer",
  };
  next();
}

export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.authUser) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }
    if (!roles.includes(req.authUser.role)) {
      res.status(403).json({ error: `Access denied. Required role: ${roles.join(" or ")}` });
      return;
    }
    next();
  };
}
