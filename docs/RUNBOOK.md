# Operations Runbook — Cortex Second Brain

This runbook covers deployment, monitoring, incident response, and common operational procedures.

---

## Table of Contents

1. [Deployment](#deployment)
2. [Environment Configuration](#environment-configuration)
3. [Database Operations](#database-operations)
4. [Edge Functions](#edge-functions)
5. [Monitoring & Alerts](#monitoring--alerts)
6. [Incident Response](#incident-response)
7. [Common Issues & Fixes](#common-issues--fixes)
8. [Backup & Recovery](#backup--recovery)
9. [Scaling Considerations](#scaling-considerations)

---

## Deployment

### Production Build

```bash
# Install dependencies
npm ci

# Type-check and lint
npm run type-check
npm run lint

# Run tests
npm run test

# Build for production
npm run build

# Preview build locally (optional)
npm run preview
```

The build outputs to `dist/`. Deploy the contents of `dist/` to your hosting provider (Vercel, Netlify, Cloudflare Pages, etc.).

### Vite Build Output

| File | Description |
|---|---|
| `dist/index.html` | App entry point |
| `dist/assets/react-vendor-*.js` | React + React Router |
| `dist/assets/ui-vendor-*.js` | Radix UI + Framer Motion |
| `dist/assets/supabase-*.js` | Supabase JS SDK |
| `dist/assets/query-*.js` | TanStack Query |
| `dist/assets/charts-*.js` | Recharts |
| `dist/sw.js` | Service worker |
| `dist/manifest.webmanifest` | PWA manifest |

### Deploying Edge Functions

```bash
# Deploy all functions
supabase functions deploy

# Deploy a single function
supabase functions deploy chat-with-tessa-secure

# Check deployed functions
supabase functions list
```

### Setting Secrets

```bash
supabase secrets set OPENAI_API_KEY=sk-...
supabase secrets set RESEND_API_KEY=re_...
supabase secrets set GOOGLE_CLIENT_ID=...apps.googleusercontent.com
supabase secrets set GOOGLE_CLIENT_SECRET=GOCSPX-...

# Verify (shows names only, not values)
supabase secrets list
```

---

## Environment Configuration

See [`.env.example`](../.env.example) for all variables. Required for production:

| Variable | Source |
|---|---|
| `VITE_SUPABASE_URL` | Supabase Dashboard → Settings → API |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase Dashboard → Settings → API (anon key) |
| `VITE_SUPABASE_PROJECT_ID` | Supabase project reference |

> ⚠️ The variable name is `VITE_SUPABASE_PUBLISHABLE_KEY`, **not** `VITE_SUPABASE_ANON_KEY`. Ensure hosting environment variables use the correct name.

---

## Database Operations

### Running Migrations

```bash
# Push all pending migrations to remote
supabase db push

# Check migration status
supabase migration list

# Generate a new migration from schema diff
supabase db diff --schema public -f my_migration_name
```

### Resetting Local Database

```bash
supabase db reset
```

### Connecting Directly (psql)

```bash
# Via Supabase CLI
supabase db connect

# Via psql directly
psql "postgresql://postgres:<password>@db.<project-ref>.supabase.co:5432/postgres"
```

### Checking RLS Policies

```sql
-- List all RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

### Manually Unlocking a Locked Account

```bash
# Via Edge Function (requires service role)
curl -X GET \
  "https://<ref>.supabase.co/functions/v1/account-lockout?action=unlock&userId=<uuid>" \
  -H "Authorization: Bearer <service-role-key>"
```

---

## Edge Functions

### Checking Function Logs

```bash
# View logs for a specific function
supabase functions logs chat-with-tessa-secure

# Follow logs (streaming)
supabase functions logs chat-with-tessa-secure --follow
```

### Testing Functions Locally

```bash
# Start Supabase locally
supabase start

# Serve functions locally
supabase functions serve

# Test with curl
curl -X POST http://localhost:54321/functions/v1/system-status \
  -H "Content-Type: application/json" \
  -d '{"ping": true}'
```

### Function Health Check

```bash
curl -X POST https://<ref>.supabase.co/functions/v1/system-status \
  -H "Content-Type: application/json" \
  -d '{"ping": true}'
# Expected: {"status": "operational", "timestamp": "..."}
```

---

## Monitoring & Alerts

### Key Metrics to Watch

| Metric | Warning Threshold | Critical Threshold |
|---|---|---|
| Edge function error rate | > 1% | > 5% |
| Database connection pool | > 70% utilised | > 90% utilised |
| AI chat rate limit hits | > 10/min | > 50/min |
| Failed login attempts | > 20/hr | > 100/hr |
| Service worker cache miss rate | > 20% | > 50% |

### Supabase Dashboard

- **Database**: [supabase.com/dashboard/project/{ref}/database](https://supabase.com/dashboard/project/{ref}/database)
- **Auth logs**: [supabase.com/dashboard/project/{ref}/auth/users](https://supabase.com/dashboard/project/{ref}/auth/users)
- **Edge Function logs**: [supabase.com/dashboard/project/{ref}/functions](https://supabase.com/dashboard/project/{ref}/functions)

### Application Status Page

`GET /status` route shows the system status page (backed by `system-status` edge function).

---

## Incident Response

### P0 — Application Down

1. Check Supabase status: [status.supabase.com](https://status.supabase.com)
2. Check hosting provider status page
3. Test health endpoint: `curl https://your-app.com/functions/v1/system-status -X POST -d '{"ping":true}'`
4. Check recent deployments — roll back if a deploy coincided with the incident
5. Check edge function logs for errors

### P1 — Authentication Failures Spike

1. Check `account-lockout` function for unusual lockout activity:
   ```bash
   supabase functions logs account-lockout
   ```
2. Check `auth.audit_log_entries` in Supabase for login patterns
3. If brute-force suspected, review IP addresses in `profile_access_logs`
4. Consider temporarily increasing lockout threshold

### P2 — AI Chat Not Responding

1. Check `chat-with-tessa-secure` function logs
2. Verify `OPENAI_API_KEY` secret is set: `supabase secrets list`
3. Check [status.openai.com](https://status.openai.com)
4. Check `usage_tracking` table for rate limit exhaustion
5. Users can still use the app; TESSA is non-critical path

### P3 — PDF Import Failing

1. Check `parse-pdf` function logs
2. Test with a simple PDF:
   ```bash
   curl -X POST https://<ref>.supabase.co/functions/v1/parse-pdf \
     -F "file=@test.pdf"
   ```
3. Check for file size issues (large PDFs may hit function memory limits)

---

## Common Issues & Fixes

### "VITE_SUPABASE_PUBLISHABLE_KEY is undefined"

**Cause**: Environment variable is set as `VITE_SUPABASE_ANON_KEY` (old name).

**Fix**: Rename the variable to `VITE_SUPABASE_PUBLISHABLE_KEY` in your hosting dashboard.

### Offline Sync Not Resolving

**Cause**: Service worker queue may be stuck.

**Fix**:
1. Open browser DevTools → Application → Service Workers
2. Click "Update" to force SW refresh
3. Check IndexedDB for pending sync items
4. Clear site data if issues persist (users will need to re-login)

### Knowledge Entries Not Appearing After Import

**Cause**: Optimistic update or background sync delay.

**Fix**:
1. Wait 30 seconds for background sync to complete
2. Force refresh the page
3. Check browser console for sync errors
4. If errors persist, check `knowledge_base` RLS policies

### Admin Dashboard Not Loading

**Cause**: User missing `admin` role.

**Fix** (via SQL):
```sql
INSERT INTO user_roles (user_id, role)
VALUES ('<user-uuid>', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;
```

---

## Backup & Recovery

### Automated Backups

Supabase Pro+ plans include automated daily database backups. Configure via Dashboard → Settings → Database → Backups.

### Manual Database Backup

```bash
# Dump via Supabase CLI
supabase db dump -f backup-$(date +%Y%m%d).sql

# Dump via pg_dump
pg_dump "postgresql://postgres:<pass>@db.<ref>.supabase.co:5432/postgres" \
  > backup-$(date +%Y%m%d).sql
```

### User Data Export (via App)

Users can export their own data via:
1. Settings → Export Data
2. Or POST to `send-backup-email` edge function

### Restoring from Backup

```bash
# Restore to local Supabase
supabase db reset
psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" < backup.sql
```

---

## Scaling Considerations

| Concern | Current | Recommendation |
|---|---|---|
| Supabase plan | Assess based on usage | Upgrade to Pro for > 50k MAU |
| Database connections | Pooler (default) | Enable PgBouncer for high concurrency |
| Edge Function timeouts | 2s default | Increase for PDF parsing if large files expected |
| Rate limiting | 60 req/min default | Adjust `VITE_RATE_LIMIT_MAX` per user tier |
| CDN/hosting | Single region | Enable edge caching for static assets |
