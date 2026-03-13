# ADR 008 — Deployment: Static Hosting + Supabase Cloud

**Status**: Accepted  
**Date**: 2025-01-01  
**Deciders**: Core team

---

## Context

Cortex Second Brain is a client-heavy PWA with no custom server process. The deployment model needs to support:
- Static file hosting for the React/Vite build output
- Supabase Edge Functions deployment
- Database migrations
- Secrets management
- PWA caching headers

## Decision

**Frontend**: Deploy `dist/` to a static hosting provider (Vercel, Netlify, or Cloudflare Pages). All are compatible — the app is pure static output with no SSR.

**Backend**: All backend infrastructure runs on **Supabase Cloud**:
- PostgreSQL database (managed)
- Auth service (managed)
- Edge Functions (Deno, deployed via `supabase functions deploy`)
- Realtime (managed)

**Migrations**: Managed via `supabase/migrations/` and applied with `supabase db push` in CI/CD.

## Rationale

| Option | Considered | Reason for/against |
|---|---|---|
| Static hosting + Supabase | ✅ **Selected** | Zero server management; scales to zero; generous free tiers |
| Vercel + Supabase | Preferred hosting combo | Edge network, automatic previews, environment variable management |
| Netlify + Supabase | Valid alternative | Similar capabilities to Vercel |
| Cloudflare Pages + Supabase | Valid alternative | Best edge performance; slightly more complex setup |
| Self-hosted (Docker) | Rejected for v0 | Operational overhead not justified for initial release |
| AWS Amplify | Rejected | Tight AWS coupling; more complex than needed |

## Build & Deploy Checklist

```bash
# 1. Validate
npm run type-check && npm run lint && npm run test

# 2. Build
npm run build

# 3. Deploy frontend (example: Vercel CLI)
vercel deploy --prod

# 4. Deploy Edge Functions
supabase functions deploy

# 5. Apply migrations
supabase db push
```

## Environment Variables

The hosting provider must have these environment variables configured:

| Variable | Required |
|---|---|
| `VITE_SUPABASE_URL` | ✅ |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | ✅ |
| `VITE_SUPABASE_PROJECT_ID` | ✅ |

Supabase secrets (not `VITE_` variables):

| Secret | Set via |
|---|---|
| `OPENAI_API_KEY` | `supabase secrets set` |
| `RESEND_API_KEY` | `supabase secrets set` |
| `GOOGLE_CLIENT_ID` | `supabase secrets set` |
| `GOOGLE_CLIENT_SECRET` | `supabase secrets set` |

## Consequences

- No server to maintain — all infrastructure is managed
- Deployments are atomic — static file upload is all-or-nothing
- Service worker versioning is handled by Workbox — cache busting is automatic
- The `VITE_SUPABASE_PUBLISHABLE_KEY` (anon key) is intentionally public — it is safe to embed in the client bundle; RLS enforces data access control
- Rollback = re-deploy the previous `dist/` snapshot and re-run the previous migration state
