# Security Policy — Cortex Second Brain

## Reporting a Vulnerability

**Do not open a public GitHub issue for security vulnerabilities.**

Please email **security@your-org.example.com** with:
- A description of the vulnerability
- Steps to reproduce
- Potential impact assessment
- Any suggested mitigations

We aim to acknowledge reports within **48 hours** and provide a fix timeline within **7 days** for critical issues.

---

## Security Architecture

### Transport Security

- All communication over **HTTPS / TLS 1.3**
- `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload`
- HSTS preload eligibility maintained

### Authentication

| Mechanism | Implementation |
|---|---|
| Email/Password | Supabase Auth (bcrypt) |
| Session management | JWT (RS256), stored in `localStorage`, auto-refreshed |
| Multi-Factor Auth | TOTP (RFC 6238) via `TwoFactorAuth` component |
| Account lockout | `account-lockout` Edge Function; blocks after N failed attempts |
| Password reset | Time-limited email link via Supabase Auth |

### Authorisation

- **Row Level Security (RLS)** enforced on every PostgreSQL table
- Users may only read/write their own rows (`auth.uid() = user_id`)
- Admin access gated by `has_role('admin')` RPC — stored in `user_roles` table
- Edge Functions verify the Supabase JWT on every authenticated request

### Input Sanitisation

- **DOMPurify 3.2.6** sanitises all user-generated HTML before rendering
- TypeScript strict mode reduces type-confusion vulnerabilities
- All user input validated at both client (Zod schemas where present) and server (Edge Functions) layers

### HTTP Security Headers

Provided by the `security-headers` Edge Function and configured at the CDN/hosting layer:

```
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; connect-src 'self' https://*.supabase.co wss://*.supabase.co;
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
```

### Secrets Management

| Secret | Storage |
|---|---|
| `OPENAI_API_KEY` | Supabase Edge Function secrets (never in client bundle) |
| `RESEND_API_KEY` | Supabase Edge Function secrets |
| `GOOGLE_CLIENT_SECRET` | Supabase Edge Function secrets |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Edge Function secrets only |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Public (anon key — safe to expose) |

> The `SUPABASE_SERVICE_ROLE_KEY` is **only** used inside Edge Functions (specifically `account-lockout` and `system-status`). It is never sent to the browser.

### Rate Limiting

- AI chat (`chat-with-tessa-secure`) is rate-limited via `usage_tracking` table
- Account lockout enforced by `account-lockout` Edge Function
- Client-side rate limiting via `RateLimitConfig` (60 req/min default)

### Audit Logging

All sensitive actions (login, profile view, data export) are written to `profile_access_logs` with IP and user-agent metadata.

---

## Known Vulnerabilities (npm audit)

The following vulnerabilities were present at the time of the last audit. They are **development/build-time** dependencies and do not affect the production bundle delivered to users.

| Package | Severity | Advisory | Affects | Fix |
|---|---|---|---|---|
| `esbuild` ≤ 0.24.2 | **Moderate** | [GHSA-67mh-4wv8-2f99](https://github.com/advisories/GHSA-67mh-4wv8-2f99) | Dev server only | `npm audit fix` or upgrade Vite |
| `vite` 0.11.0–6.1.6 | **Moderate** | Transitively via esbuild | Dev server only | `npm audit fix` |
| `flatted` < 3.4.0 | **High** | Unbounded recursion DoS in `parse()` | Build tooling only | `npm audit fix --force` |
| `serialize-javascript` ≤ 7.0.2 | **High** | RCE via crafted RegExp | Build tooling only | `npm audit fix --force` |
| `@rollup/plugin-terser` 0.2.0–0.4.4 | **High** | Via serialize-javascript | Build tooling only | `npm audit fix --force` |
| `workbox-build` ≥ 7.1.0 | **High** | Via @rollup/plugin-terser | Build tooling only | Await Workbox upstream fix |

### Remediation Commands

```bash
# Safe auto-fix (non-breaking)
npm audit fix

# Force-fix (may include breaking changes — test after)
npm audit fix --force

# Check current status
npm audit
```

> **Risk assessment**: All high/moderate vulnerabilities are in **build-time** or **dev-server** tooling. None of these packages are included in the production browser bundle. Production users are not exposed to these vulnerabilities. They should still be patched when upstream fixes become available.

---

## Progressive Web App Security

- Service worker is scoped to `/` and only caches known URLs
- Cache-Control policies prevent sensitive API responses from being stored by the SW
- No credentials are cached by the service worker
- Offline fallback (`/offline`) does not expose any user data

---

## Data Privacy

- All user data is isolated via RLS — cross-user data access is impossible at the database level
- Soft-deleted records (`deleted_at IS NOT NULL`) are excluded from all queries
- The email backup feature sends data only to the authenticated user's own email address
- Geolocation data (IP lookup) is not persisted — used only for security logging

---

## Dependency Security

Dependencies are audited with `npm audit` on every CI run. The following practices are enforced:

1. Lock file (`package-lock.json`) committed and verified in CI
2. Dependabot / Renovate configured for automated dependency PRs
3. No `eval()` or dynamic code execution in application code
4. DOMPurify used for all HTML sanitisation — no `innerHTML` with raw user data
