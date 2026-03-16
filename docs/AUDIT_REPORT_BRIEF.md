# Audit Report — Cortex Second Brain

**Audit Date**: 2025-01-15  
**Audited Commit**: f337b54 (branch: `copilot/restore-dead-code-and-documentation`)  
**Previous Commit**: dd3e30c ("Add pdf parsing edge function")  
**Auditor**: Automated + Manual Review  
**Version**: 0.1.2

---

## Executive Summary

| Category | Status | Risk Level |
|---|---|---|
| Security vulnerabilities (prod deps) | ✅ None | 🟢 Low |
| Security vulnerabilities (dev deps) | ⚠️ 6 advisories | 🟡 Medium |
| TypeScript type safety | ⚠️ 199 suppressions | 🟡 Medium |
| Test coverage | ✅ Meets thresholds | 🟢 Low |
| Dead code | ✅ None confirmed | 🟢 Low |
| RLS coverage | ✅ All tables protected | 🟢 Low |
| Secret management | ✅ Correct | 🟢 Low |
| Dependency count | ℹ️ Standard for stack | 🟢 Low |

---

## 1. Dependency Security Audit

### Production Dependencies

`npm audit --omit=dev` returned **0 vulnerabilities** against production dependencies.

### Development / Build Dependencies

`npm audit` returned **6 advisories** — all in build-time or dev-server tooling:

| Package | Severity | Advisory | Impact |
|---|---|---|---|
| `esbuild` ≤ 0.24.2 | Moderate | GHSA-67mh-4wv8-2f99 | Dev server only — not in prod bundle |
| `vite` 0.11.0–6.1.6 | Moderate | Via esbuild | Dev server only |
| `flatted` < 3.4.0 | High | Unbounded recursion DoS | Build tooling only |
| `serialize-javascript` ≤ 7.0.2 | High | RCE via RegExp | Build tooling only |
| `@rollup/plugin-terser` 0.2.0–0.4.4 | High | Via serialize-javascript | Build tooling only |
| `workbox-build` ≥ 7.1.0 | High | Via @rollup/plugin-terser | Build tooling only |

**Risk assessment**: No production-runtime exposure. All affected packages are excluded from the browser bundle. Recommend tracking upstream fixes and running `npm audit fix` when non-breaking upgrades are available.

**Remediation priority**: P2 (schedule for v0.2 milestone)

---

## 2. TypeScript Type Safety

**Tool**: `grep -rn "as any\|@ts-ignore" src/`  
**Result**: 199 occurrences

### Distribution by Location

| Path | Count | Risk |
|---|---|---|
| `src/__tests__/` | ~60 | 🟢 Low (test mocking) |
| `src/lib/` | ~40 | 🟡 Medium |
| `src/services/` | ~35 | 🔴 High |
| `src/components/` | ~30 | 🟡 Medium |
| `src/hooks/` | ~20 | 🟡 Medium |
| `src/utils/` | ~14 | 🟡 Medium |

### Critical Finding: Service Layer Type Bypass

The `src/services/` directory contains ~35 `as any` casts on Supabase query results. This bypasses the typed Supabase client generated in `src/integrations/supabase/types.ts`.

**Impact**: Type errors in data-layer code may not surface at compile time, potentially causing runtime errors when database schema changes.

**Recommendation**: Replace `as any` in service files with `Database['public']['Tables']['table_name']['Row']` types.

---

## 3. Test Coverage

**Tool**: `npm run test:coverage`  
**Tests passing**: 206 / 206 ✅

| Metric | Threshold | Status |
|---|---|---|
| Statements | 70% | ✅ Met |
| Branches | 65% | ✅ Met |
| Functions | 70% | ✅ Met |
| Lines | 70% | ✅ Met |

**Coverage gaps identified**: Branch coverage is at the minimum threshold (65%). Edge cases in error handling paths and offline sync logic may be under-tested.

---

## 4. Dead Code Analysis

**Methods used**: File pattern matching, TODO/FIXME search, `if (false)` pattern search

| Check | Result |
|---|---|
| `.old`, `.bak`, `.disabled` files in `src/` | ✅ None found |
| `TODO` / `FIXME` in `src/` | ✅ None found |
| `if (false)` unreachable branches | ✅ None found |
| Commented-out large code blocks | ✅ None found |
| `backup/` directory contents | ⚠️ Directory exists — verify contents |

See [DEAD-CODE-TRIAGE.md](DEAD-CODE-TRIAGE.md) for detailed triage.

---

## 5. Security Controls Review

### Row Level Security

All 9 database tables have RLS enabled. Verified tables:

| Table | RLS Enabled | Per-user Policy |
|---|---|---|
| `knowledge_base` | ✅ | `auth.uid() = user_id` |
| `chats` | ✅ | `auth.uid() = user_id` |
| `messages` | ✅ | `auth.uid() = user_id` |
| `user_profiles` | ✅ | Own profile write; authenticated read |
| `user_roles` | ✅ | Own role read; admin read-all |
| `notifications` | ✅ | `auth.uid() = user_id` |
| `filter_presets` | ✅ | `auth.uid() = user_id` |
| `profile_access_logs` | ✅ | Own insert; admin read-all |
| `profiles` | ✅ | `auth.uid() = user_id` |

### Secret Management

| Secret | Location | ✅/❌ |
|---|---|---|
| `OPENAI_API_KEY` | Edge Function secret | ✅ |
| `RESEND_API_KEY` | Edge Function secret | ✅ |
| `GOOGLE_CLIENT_SECRET` | Edge Function secret | ✅ |
| `SUPABASE_SERVICE_ROLE_KEY` | Edge Function only (auto-injected) | ✅ |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Client env var (anon key — intended) | ✅ |

No secrets found in source code. The `.env.example` contains only placeholder values.

### Input Sanitisation

DOMPurify 3.2.6 is used for HTML sanitisation. Verified in component rendering paths that handle user-generated content.

### Authentication Controls

- TOTP MFA implemented (`TwoFactorAuth` component)
- Account lockout after repeated failures (`account-lockout` Edge Function)
- Email verification flow present
- Password reset via time-limited email link

---

## 6. Environment Variable Audit

**Finding**: `.env.example` previously used `VITE_SUPABASE_ANON_KEY`, but `src/integrations/supabase/client.ts` reads `VITE_SUPABASE_PUBLISHABLE_KEY`.

**Status**: ✅ **Fixed** — `.env.example` now uses the correct variable name.

**Additional finding**: `src/config/app-config.ts` defines 30+ `VITE_` configuration variables that were not documented in `.env.example`.

**Status**: ✅ **Fixed** — All variables added to `.env.example` with descriptions and defaults.

---

## 7. Code Quality Indicators

| Metric | Value | Notes |
|---|---|---|
| TypeScript strict mode | ✅ Enabled | `tsconfig.json` |
| ESLint configuration | ✅ Present | `eslint.config.js` (flat config) |
| ESLint plugins | `react-hooks`, `react-refresh`, `typescript-eslint` | Standard for React/TS |
| Dependency count (prod) | ~30 packages | Appropriate for feature set |
| Dependency count (dev) | ~20 packages | Standard tooling |

---

## 8. Recommendations Summary

### P1 — Address Immediately

| ID | Finding | Action |
|---|---|---|
| A-01 | `as any` in service layer (35 occurrences) | Replace with typed Supabase table types |

### P2 — Address in v0.2

| ID | Finding | Action |
|---|---|---|
| A-02 | 6 npm dev-dependency advisories | Run `npm audit fix`; track upstream for workbox fix |
| A-03 | Branch coverage at threshold (65%) | Add tests for error paths and offline sync |
| A-04 | `backup/` directory existence | Verify contents; remove if empty |

### P3 — Address in v0.3

| ID | Finding | Action |
|---|---|---|
| A-05 | `as any` in hooks/components/utils (64 occurrences) | Progressive type improvement |
| A-06 | No automated unused export detection | Add `ts-unused-exports` to CI |
| A-07 | No `npm audit` in CI pipeline | Add audit step; fail on new high severity |

---

## Appendix: Audit Commands Used

```bash
# Dependency security
npm audit
npm audit --omit=dev

# TypeScript suppressions
grep -rn "as any\|@ts-ignore" src/ | wc -l
grep -rn "as any\|@ts-ignore" src/ | grep -v "__tests__" | wc -l

# Dead code
find src -name "*.old" -o -name "*.bak" -o -name "*.disabled"
grep -rn "TODO\|FIXME" src/
grep -rn "if (false)" src/

# Test coverage
npm run test:coverage

# Type check
npm run type-check
```
