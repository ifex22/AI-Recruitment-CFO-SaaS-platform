import type { Request, Response, NextFunction } from "express";

// ── Security Headers (helmet-equivalent) ─────────────────────────────────────
export function securityHeaders(_req: Request, res: Response, next: NextFunction): void {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "0");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("X-DNS-Prefetch-Control", "off");
  res.setHeader("X-Download-Options", "noopen");
  res.setHeader("X-Permitted-Cross-Domain-Policies", "none");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  res.setHeader(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "connect-src 'self' https://*.supabase.co",
      "font-src 'self'",
      "object-src 'none'",
      "frame-ancestors 'none'",
    ].join("; ")
  );
  if (process.env.NODE_ENV === "production") {
    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }
  // Remove fingerprinting headers
  res.removeHeader("X-Powered-By");
  next();
}

// ── Rate Limiter (express-rate-limit-equivalent) ──────────────────────────────
interface HitRecord {
  count: number;
  resetAt: number;
}

function createRateLimiter(options: {
  windowMs: number;
  max: number;
  message?: string;
  keyFn?: (req: Request) => string;
}) {
  const store = new Map<string, HitRecord>();
  const { windowMs, max, message = "Too many requests, please try again later.", keyFn } = options;

  // Sweep expired entries every window period
  setInterval(() => {
    const now = Date.now();
    store.forEach((val, key) => { if (val.resetAt <= now) store.delete(key); });
  }, windowMs).unref();

  return function rateLimiter(req: Request, res: Response, next: NextFunction): void {
    const key = keyFn ? keyFn(req) : (
      (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim()
      ?? req.socket.remoteAddress
      ?? "unknown"
    );

    const now = Date.now();
    const record = store.get(key);

    if (!record || record.resetAt <= now) {
      store.set(key, { count: 1, resetAt: now + windowMs });
      res.setHeader("RateLimit-Limit", max);
      res.setHeader("RateLimit-Remaining", max - 1);
      res.setHeader("RateLimit-Reset", Math.ceil((now + windowMs) / 1000));
      next();
      return;
    }

    record.count++;
    const remaining = Math.max(0, max - record.count);
    res.setHeader("RateLimit-Limit", max);
    res.setHeader("RateLimit-Remaining", remaining);
    res.setHeader("RateLimit-Reset", Math.ceil(record.resetAt / 1000));

    if (record.count > max) {
      res.setHeader("Retry-After", Math.ceil((record.resetAt - now) / 1000));
      res.status(429).json({ error: message });
      return;
    }

    next();
  };
}

const windowMs = Number(process.env.RATE_LIMIT_WINDOW_MS ?? 15 * 60 * 1000); // 15 min default
const globalMax = Number(process.env.RATE_LIMIT_MAX ?? 200);
const authMax = Number(process.env.AUTH_RATE_LIMIT_MAX ?? 10);

export const globalRateLimit = createRateLimiter({ windowMs, max: globalMax });

export const authRateLimit = createRateLimiter({
  windowMs,
  max: authMax,
  message: "Too many authentication attempts. Please try again in 15 minutes.",
});

// ── CORS (restricted) ─────────────────────────────────────────────────────────
export function corsMiddleware(req: Request, res: Response, next: NextFunction): void {
  const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(",").map(o => o.trim())
    : [];

  const origin = req.headers.origin;

  // Always allow in development or when no origins configured
  if (process.env.NODE_ENV !== "production" || allowedOrigins.length === 0) {
    if (origin) res.setHeader("Access-Control-Allow-Origin", origin);
    else res.setHeader("Access-Control-Allow-Origin", "*");
  } else if (origin && allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }

  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Vary", "Origin");

  if (req.method === "OPTIONS") {
    res.status(204).send();
    return;
  }
  next();
}
