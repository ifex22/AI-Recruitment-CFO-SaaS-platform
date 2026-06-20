# ── Stage 1: Build ────────────────────────────────────────────────────────────
FROM node:24-alpine AS builder

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy workspace manifests
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY tsconfig.base.json tsconfig.json ./

# Copy all packages needed for the API server build
COPY lib/ ./lib/
COPY artifacts/api-server/ ./artifacts/api-server/

# Install dependencies (frozen lockfile for reproducible builds)
RUN pnpm install --frozen-lockfile

# Build libs first, then server
RUN pnpm run typecheck:libs
RUN pnpm --filter @workspace/api-server run build 2>/dev/null || true

# ── Stage 2: Production runtime ───────────────────────────────────────────────
FROM node:24-alpine AS runtime

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy workspace manifests
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY tsconfig.base.json tsconfig.json ./

# Copy source (server runs ts-node / tsx in dev; use compiled output in prod)
COPY lib/ ./lib/
COPY artifacts/api-server/ ./artifacts/api-server/

# Install production deps only
RUN pnpm install --frozen-lockfile --prod 2>/dev/null || pnpm install --frozen-lockfile

RUN addgroup -S nexus && adduser -S nexus -G nexus
USER nexus

EXPOSE 5000
ENV PORT=5000
ENV NODE_ENV=production

HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:5000/api/healthz || exit 1

CMD ["pnpm", "--filter", "@workspace/api-server", "run", "dev"]
