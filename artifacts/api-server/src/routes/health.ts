import { Router, type IRouter } from "express";
import { supabase } from "../lib/supabase";

const router: IRouter = Router();

router.get("/healthz", async (_req, res) => {
  let dbStatus = "ok";
  let dbLatencyMs = 0;

  try {
    const t0 = Date.now();
    const { error } = await supabase.from("brands").select("id").limit(1);
    dbLatencyMs = Date.now() - t0;
    if (error) dbStatus = "degraded";
  } catch {
    dbStatus = "unreachable";
  }

  const status = dbStatus === "ok" ? "ok" : "degraded";
  const code = status === "ok" ? 200 : 503;

  res.status(code).json({
    status,
    version: process.env.npm_package_version ?? "1.0.0",
    environment: process.env.NODE_ENV ?? "production",
    uptime_seconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    checks: {
      database: { status: dbStatus, latency_ms: dbLatencyMs },
      memory: {
        status: "ok",
        heap_used_mb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        heap_total_mb: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
      },
    },
  });
});

router.get("/readyz", (_req, res) => {
  res.json({ ready: true, timestamp: new Date().toISOString() });
});

export default router;
