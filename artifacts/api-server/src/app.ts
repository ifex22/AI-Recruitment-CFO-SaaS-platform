import express, { type Express } from "express";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";
import { securityHeaders, globalRateLimit, corsMiddleware } from "./middleware/security";

const app: Express = express();

// Trust proxy for accurate IP in rate limiting / logs
app.set("trust proxy", 1);

// Security headers (helmet-equivalent)
app.use(securityHeaders);

// CORS (restricted to ALLOWED_ORIGINS in production)
app.use(corsMiddleware);

// Rate limiting — global
app.use(globalRateLimit);

// Structured request logging
app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return { id: req.id, method: req.method, url: req.url?.split("?")[0] };
      },
      res(res) {
        return { statusCode: res.statusCode };
      },
    },
  }),
);

// Body parsing
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

app.use("/api", router);

// Global error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error({ err }, "Unhandled error");
  res.status(500).json({ error: "Internal server error" });
});

export default app;
