# ADR 002 — Backend: Supabase (PostgreSQL + Auth + Edge Functions)

**Status**: Accepted  
**Date**: 2025-01-01  
**Deciders**: Core team

---

## Context

Cortex Second Brain needs:
- A relational database with strong consistency
- User authentication (email/password, MFA)
- Server-side compute for AI calls and privileged operations
- Row-level data isolation between users
- Minimal operational overhead (no self-managed servers)

## Decision

We use **Supabase** as the complete backend:
- **PostgreSQL** for data storage with Row Level Security
- **Supabase Auth** for authentication (email/password + TOTP)
- **Supabase Edge Functions** (Deno) for server-side compute
- **Supabase Realtime** for live updates
- **Supabase Storage** for file uploads

The Supabase JS client (`@supabase/supabase-js` 2.98.0) is the only backend SDK used.

## Rationale

| Option | Considered | Reason for/against |
|---|---|---|
| Supabase | ✅ **Selected** | Postgres + Auth + Edge Functions in one; RLS for multi-tenancy; generous free tier |
| Firebase | Considered | NoSQL model less suited to relational knowledge data; vendor lock-in concerns |
| PocketBase | Considered | Less mature Auth/RLS; smaller ecosystem |
| Custom Express API | Rejected | Operational overhead; auth from scratch |
| Prisma + Planetscale | Rejected | No built-in Auth; additional service to manage |

## Consequences

- RLS policies on every table provide automatic per-user data isolation
- `has_role()` RPC enables admin access without a custom auth layer
- Edge Functions use `SUPABASE_SERVICE_ROLE_KEY` only server-side — never exposed to the client
- The client uses `VITE_SUPABASE_PUBLISHABLE_KEY` (the anon/public key) — safe to expose
- All database types are auto-generated into `src/integrations/supabase/types.ts`
- Migrations managed via `supabase/migrations/` and deployed with `supabase db push`
