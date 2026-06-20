---
name: Demo auth pattern
description: How authentication works for the demo account and real users
---

**Demo tokens:** Any token matching `demo-token-*` in `auth.ts` returns a hardcoded `DEMO_USER` object (demo@nexus.ai) without hitting Supabase. The `/api/auth/me` route also recognizes this pattern.

**Real login:** POST `/api/auth/login` with `email=demo@nexus.ai` + `password=demo123` returns a `demo-token-{timestamp}`. Other credentials would go to Supabase auth (not wired up yet).

**Frontend:** Token stored in `localStorage` as `nexus_token`; user object as `nexus_user`.

**Why:** Avoids Supabase Auth setup complexity while still demonstrating the full auth flow end-to-end.

**How to apply:** For any new protected route, the `requireAuth` middleware in `auth.ts` already handles demo token recognition. No changes needed for demo flows.
