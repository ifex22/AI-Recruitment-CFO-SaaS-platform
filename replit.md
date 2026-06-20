# Nexus AI Platform

A full-stack AI Recruitment & CFO SaaS platform for managing HR, recruitment, payroll, and finance — all backed by real Supabase data.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- Required env: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_KEY`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: Supabase (REST API via `@supabase/supabase-js`) — no direct Postgres
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Frontend: React + Vite + TanStack Query + shadcn/ui

## Where things live

- `artifacts/api-server/src/routes/` — all API route handlers (auth, employees, candidates, jobs, interviews, finance, payroll, dashboard, admin)
- `artifacts/nexus-platform/src/pages/` — all frontend pages
- `lib/api-spec/` — OpenAPI spec (source of truth for API contract)
- `lib/api-client-react/` — generated React Query hooks

## Architecture decisions

- **Supabase REST only** — no DDL access; uses 7 existing tables with column mapping in each route handler
- **Table mapping**: `employees`→HR, `customers`→candidates, `products`→jobs, `sales`→finance txns, `suppliers`→payroll, `categories`→interviews, `brands`→org settings
- **Demo auth** — token "demo-token-*" bypasses Supabase auth and returns a hardcoded demo user; real users stored in `brands` table
- **JSONB for rich fields** — interview details, finance line items, payroll breakdowns stored as JSONB in each table's flexible column

## Product

- **Dashboard**: Real-time KPIs (headcount, open roles, revenue $415K/mo, expenses, runway)
- **Recruitment**: Job postings CRUD, candidate pipeline with AI scoring, interview scheduling
- **HR Management**: Employee directory, performance tracking, org chart
- **CFO / Finance**: Transaction ledger, income statement, cash flow, AI forecast
- **Payroll**: Payroll run management with processing workflow
- **Admin Panel**: User management, organization settings, audit logs
- **Demo Account**: `demo@nexus.ai` / `demo123`

## User preferences

- All features must be fully functional with real Supabase data (no mocks/placeholders)
- All CRUD buttons must work end-to-end

## Gotchas

- Cannot create new Supabase tables — must reuse the 7 existing tables with column mapping
- Run `pnpm --filter @workspace/api-spec run codegen` after any OpenAPI spec change
- Do NOT use `console.log` in server code — use `req.log` or `logger`
- The `brands` table row is used as org settings; the first row is Nexus Corp config

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
- Supabase project ref: eiwhlsiiawfgoqvdiiqs
