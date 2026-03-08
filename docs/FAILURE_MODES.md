# Failure Modes & Edge Cases

**Version**: 1.0.0 · **Last Updated**: 2026-03-08 · **Owner**: Engineering Lead / QA Lead

This document catalogues known and anticipated failure modes for each feature of the Tessa AI Platform, together with expected behaviours, user-facing messages, recovery procedures, and prevention strategies.

---

## Table of Contents

1. [How to Use This Document](#1-how-to-use-this-document)
2. [Authentication Failure Modes](#2-authentication-failure-modes)
3. [AI Chat Failure Modes](#3-ai-chat-failure-modes)
4. [Knowledge Base Failure Modes](#4-knowledge-base-failure-modes)
5. [Offline / Sync Failure Modes](#5-offline--sync-failure-modes)
6. [Database Failure Modes](#6-database-failure-modes)
7. [Edge Function Failure Modes](#7-edge-function-failure-modes)
8. [File / Storage Failure Modes](#8-file--storage-failure-modes)
9. [Performance Degradation Modes](#9-performance-degradation-modes)
10. [Cascading Failure Scenarios](#10-cascading-failure-scenarios)
11. [Circuit Breaker and Retry Policies](#11-circuit-breaker-and-retry-policies)

---

## 1. How to Use This Document

Each failure mode entry follows this schema:

| Field | Description |
|---|---|
| **ID** | Unique identifier (e.g. `AUTH-001`) |
| **Trigger** | Conditions that cause the failure |
| **Expected Behaviour** | What the system should do |
| **User Message** | Text shown to the user |
| **Recovery** | Steps the system / user should take |
| **Monitoring** | Alert or metric to detect this |
| **Prevention** | Engineering controls to avoid recurrence |

---

## 2. Authentication Failure Modes

### AUTH-001 — Supabase Auth service unavailable

| Field | Detail |
|---|---|
| **Trigger** | Supabase Auth endpoint returns 5xx or is unreachable |
| **Expected Behaviour** | Login form disabled; cached session allows read-only access if a valid JWT exists in storage |
| **User Message** | "Authentication service is temporarily unavailable. Existing sessions remain active." |
| **Recovery** | App polls `/health` every 30 s; re-enables login when service recovers |
| **Monitoring** | Alert when login failure rate > 20% over 5 min |
| **Prevention** | Cache last-known-good JWT; graceful degradation to read-only mode |

### AUTH-002 — JWT token expired during active session

| Field | Detail |
|---|---|
| **Trigger** | Access token reaches expiry (`exp` claim); user is still interacting |
| **Expected Behaviour** | Supabase JS client automatically refreshes using the refresh token |
| **User Message** | None (transparent refresh) |
| **Recovery** | If refresh fails, redirect to login with message: "Your session has expired. Please sign in again." |
| **Monitoring** | Log `token_refresh_error` events |
| **Prevention** | Keep Supabase JS client up to date; set session persistence to `'local'` |

### AUTH-003 — Account lockout after repeated failed logins

| Field | Detail |
|---|---|
| **Trigger** | ≥ 5 failed login attempts within 15 minutes from the same IP (configurable via `rate_limit_config`) |
| **Expected Behaviour** | Login blocked for 30 minutes; IP added to `failed_login_attempts`; security alert created |
| **User Message** | "Too many failed attempts. Please try again in 30 minutes or reset your password." |
| **Recovery** | Admin can unblock via `blocked_ips` table; user can reset password via email |
| **Monitoring** | Alert on `security_alerts` INSERT with `alert_type = 'brute_force'` |
| **Prevention** | `account-lockout` edge function enforced at API layer |

### AUTH-004 — OAuth provider unavailable (Google / GitHub)

| Field | Detail |
|---|---|
| **Trigger** | OAuth provider returns error or redirect fails |
| **Expected Behaviour** | Show error; fall back to email/password login option |
| **User Message** | "Sign in with [Provider] is temporarily unavailable. Please use email and password instead." |
| **Recovery** | Retry link displayed; email/password always available as fallback |
| **Monitoring** | Supabase Auth dashboard; alert if OAuth error rate > 5% |
| **Prevention** | Always keep email/password login enabled as fallback |

### AUTH-005 — Browser storage unavailable (private mode / quota exceeded)

| Field | Detail |
|---|---|
| **Trigger** | `localStorage` / `sessionStorage` inaccessible |
| **Expected Behaviour** | App functions in-memory only; session does not persist across refreshes |
| **User Message** | "You appear to be in private browsing mode. Your session will not be saved." |
| **Recovery** | User can still use app; data persists server-side |
| **Prevention** | Detect storage availability on load; degrade gracefully without throwing |

---

## 3. AI Chat Failure Modes

### CHAT-001 — OpenAI API unavailable

| Field | Detail |
|---|---|
| **Trigger** | OpenAI returns 5xx or connection timeout |
| **Expected Behaviour** | Return a structured error response; do not retry infinitely |
| **User Message** | "The AI assistant is temporarily unavailable. Please try again in a few minutes." |
| **Recovery** | Edge function returns 503; frontend shows retry button with 30 s back-off |
| **Monitoring** | Alert when AI error rate > 5% over 5 min |
| **Prevention** | OpenAI status check before first call; configurable fallback model |

### CHAT-002 — Application rate limit exceeded (20 messages/minute per user)

| Field | Detail |
|---|---|
| **Trigger** | User sends > 20 messages within 60 seconds |
| **Expected Behaviour** | Edge function returns 429; message not sent |
| **User Message** | "You've reached the message limit. Please wait a moment before sending more." |
| **Recovery** | Rate limit window resets after 60 s; UI shows countdown timer |
| **Monitoring** | Track 429 responses per user |
| **Prevention** | Rate limiting enforced in `chat-with-tessa-secure` edge function |

### CHAT-003 — AI response timeout (> 30 seconds)

| Field | Detail |
|---|---|
| **Trigger** | OpenAI response exceeds edge function timeout |
| **Expected Behaviour** | Edge function times out and returns 504; message stored as failed |
| **User Message** | "The response took too long. Please try a shorter message or try again." |
| **Recovery** | Retry button shown; user can reformulate the prompt |
| **Monitoring** | Alert on p95 chat latency > 15 s |
| **Prevention** | Set OpenAI `max_tokens` ceiling; implement streaming responses |

### CHAT-004 — Chat context exceeds token limit

| Field | Detail |
|---|---|
| **Trigger** | Accumulated chat history exceeds model context window |
| **Expected Behaviour** | Truncate oldest messages from context; send most recent N messages |
| **User Message** | "Earlier messages in this conversation are no longer included in context." |
| **Recovery** | Transparent; user can start a new chat for full context |
| **Prevention** | Token-counting middleware in edge function; sliding window truncation |

### CHAT-005 — AI returns content policy violation

| Field | Detail |
|---|---|
| **Trigger** | OpenAI refuses request due to content policy |
| **Expected Behaviour** | Return 400 with `content_policy` error code |
| **User Message** | "This message couldn't be processed. Please rephrase your request." |
| **Recovery** | User reformulates; no retry |
| **Prevention** | Pre-filter obvious violations client-side; log for review |

---

## 4. Knowledge Base Failure Modes

### KB-001 — Concurrent edit conflict

| Field | Detail |
|---|---|
| **Trigger** | Two sessions update the same item simultaneously (`version` mismatch) |
| **Expected Behaviour** | Second write rejected (409 Conflict); user prompted to resolve |
| **User Message** | "This item was modified in another tab or device. Reload to see the latest version." |
| **Recovery** | Show diff or "reload" option; user chooses which version to keep |
| **Monitoring** | Track `version_conflict` events |
| **Prevention** | `increment_version()` trigger + optimistic-lock check in service layer |

### KB-002 — Bulk import failure (partial)

| Field | Detail |
|---|---|
| **Trigger** | Import of multiple items fails mid-batch |
| **Expected Behaviour** | Successful items committed; failed items returned with error list |
| **User Message** | "Import partially completed: X items imported, Y items failed. See error list below." |
| **Recovery** | Error list shown with reasons; user can retry failed items |
| **Prevention** | Per-item try/catch in import loop; transaction per item, not per batch |

### KB-003 — Knowledge item content too large

| Field | Detail |
|---|---|
| **Trigger** | Item content exceeds 10 MB limit |
| **Expected Behaviour** | Reject with 413 and descriptive error |
| **User Message** | "This item is too large (max 10 MB). Try splitting it into smaller sections." |
| **Recovery** | User reduces size; no partial save |
| **Prevention** | Client-side size validation before submit |

### KB-004 — Search returns empty results (full-text index not ready)

| Field | Detail |
|---|---|
| **Trigger** | Full-text index not yet built after large import |
| **Expected Behaviour** | Return empty results with a note; fall back to `ILIKE` search if available |
| **User Message** | "Search index is building. Basic search is available; full search will be ready shortly." |
| **Recovery** | Graceful fallback to `ILIKE`; index builds in background |
| **Prevention** | Confirm index exists before query; add async index-build monitoring |

---

## 5. Offline / Sync Failure Modes

### SYNC-001 — Network unavailable (user goes offline)

| Field | Detail |
|---|---|
| **Trigger** | Browser reports `navigator.onLine = false` |
| **Expected Behaviour** | Service worker serves cached assets; reads from IndexedDB; writes queued |
| **User Message** | "You're offline. Changes will sync when you reconnect." (toast banner) |
| **Recovery** | Background sync on reconnect; conflict resolution if server diverged |
| **Monitoring** | Service worker sync events; sync queue length metric |
| **Prevention** | PWA service worker with cache-first strategy for static assets |

### SYNC-002 — Sync queue overflow (IndexedDB quota exceeded)

| Field | Detail |
|---|---|
| **Trigger** | Browser storage quota exceeded (typically 50–500 MB per origin) |
| **Expected Behaviour** | Warn user; pause offline writes; prioritise sync of existing queue |
| **User Message** | "Storage space is almost full. Some offline features may be unavailable." |
| **Recovery** | Trigger background sync; remove oldest soft-deleted items from local cache |
| **Prevention** | Monitor `navigator.storage.estimate()`; evict stale cache entries |

### SYNC-003 — Real-time subscription dropped

| Field | Detail |
|---|---|
| **Trigger** | Supabase Realtime WebSocket disconnects |
| **Expected Behaviour** | Reconnect with exponential back-off; refresh data on reconnect |
| **User Message** | "Live updates paused — reconnecting…" (inline indicator) |
| **Recovery** | Re-subscribe and fetch missed events on reconnect |
| **Prevention** | Supabase JS client has built-in reconnect; handle `CHANNEL_ERROR` events |

---

## 6. Database Failure Modes

### DB-001 — RLS policy blocks a legitimate operation

| Field | Detail |
|---|---|
| **Trigger** | Bug in RLS policy denies an authenticated user's own data |
| **Expected Behaviour** | Operation returns empty result or 403 |
| **User Message** | "Unable to load your data. Please refresh or contact support." |
| **Recovery** | Admin can temporarily disable RLS for diagnosis (NEVER in production without audit) |
| **Monitoring** | Alert on spike in empty result sets for data-owner queries |
| **Prevention** | Unit test RLS policies in CI using `supabase db test`; code review RLS on every migration |

### DB-002 — Migration failure mid-deploy

| Field | Detail |
|---|---|
| **Trigger** | SQL error during `supabase db push` |
| **Expected Behaviour** | Migration halts; previously applied steps committed (Postgres auto-commits each statement unless in explicit transaction) |
| **Recovery** | Write a new rollback migration; do NOT edit the failed file |
| **Prevention** | Test all migrations on local Supabase first; wrap destructive changes in explicit transactions |

### DB-003 — Connection pool exhaustion

| Field | Detail |
|---|---|
| **Trigger** | All available DB connections in use (typically 25–100 on Supabase free/pro) |
| **Expected Behaviour** | New queries queue; if queue full, return 503 |
| **User Message** | "The service is under heavy load. Please try again shortly." |
| **Recovery** | Reduce connection count; add PgBouncer if on self-hosted |
| **Monitoring** | Alert on connection count > 80% of pool max |
| **Prevention** | Use Supabase connection pooler (port 6543) in production |

---

## 7. Edge Function Failure Modes

### EDGE-001 — Edge function cold start timeout

| Field | Detail |
|---|---|
| **Trigger** | Function not invoked recently; Deno runtime not warm |
| **Expected Behaviour** | First invocation takes 500 ms–2 s longer than steady state |
| **User Message** | None (within acceptable latency) |
| **Recovery** | Retry automatically; use keep-alive pings for critical functions |
| **Monitoring** | P50/P95 latency dashboard; alert if P95 > 5 s |
| **Prevention** | Schedule a no-op keep-warm invocation every 5 min for critical functions |

### EDGE-002 — Missing or invalid API key secret

| Field | Detail |
|---|---|
| **Trigger** | `OPENAI_API_KEY` not set or expired |
| **Expected Behaviour** | Function returns 500 with `configuration_error` code (do not expose key details) |
| **User Message** | "The AI service is not configured correctly. Please contact support." |
| **Recovery** | Admin sets/rotates secret in Supabase dashboard and redeploys function |
| **Monitoring** | Alert on configuration errors immediately |
| **Prevention** | Validate secret presence on function startup; add to deployment checklist |

### EDGE-003 — Edge function memory limit exceeded

| Field | Detail |
|---|---|
| **Trigger** | Function processes very large payload or has a memory leak |
| **Expected Behaviour** | Deno runtime terminates function; 503 returned |
| **User Message** | "Request could not be processed. Please try a smaller request." |
| **Recovery** | Client retries with smaller payload |
| **Prevention** | Stream large responses; set `MAX_MESSAGE_LENGTH` limit |

---

## 8. File / Storage Failure Modes

### STORE-001 — File upload exceeds size limit (50 MB)

| Field | Detail |
|---|---|
| **Trigger** | User uploads file > 50 MB |
| **Expected Behaviour** | Reject at client-side validation before upload |
| **User Message** | "File is too large (max 50 MB). Please compress or split the file." |
| **Recovery** | User reduces file size |
| **Prevention** | `MAX_UPLOAD_SIZE` enforced client-side and server-side |

### STORE-002 — Supabase Storage unavailable

| Field | Detail |
|---|---|
| **Trigger** | Storage service returns 5xx |
| **Expected Behaviour** | Upload fails gracefully; no partial data stored |
| **User Message** | "File upload is temporarily unavailable. Please try again later." |
| **Recovery** | Retry with exponential back-off up to 3 times |
| **Prevention** | Wrap uploads in retry logic; check Supabase status page |

---

## 9. Performance Degradation Modes

### PERF-001 — Page load Lighthouse score < 70

| Field | Detail |
|---|---|
| **Trigger** | Bundle size increases; unoptimised images; no code splitting |
| **Expected Behaviour** | Target Lighthouse > 90; alert on regression |
| **Recovery** | Run `npm run build` and analyse bundle; add lazy imports |
| **Prevention** | `visual-regression.yml` CI workflow; `web-vitals` monitoring in production |

### PERF-002 — Virtual scroll lag with large lists (> 1 000 items)

| Field | Detail |
|---|---|
| **Trigger** | `@tanstack/react-virtual` not applied; all rows in DOM |
| **Expected Behaviour** | Virtual scroll renders only visible rows (< 30 at any time) |
| **Recovery** | Ensure `useVirtualizer` is applied to all long lists |
| **Prevention** | Performance test with 1 000+ item datasets in CI |

---

## 10. Cascading Failure Scenarios

### CASCADE-001 — Supabase full outage

**Impact**: Auth, Database, Real-time, Edge Functions, and Storage all unavailable.

**Response sequence**:
1. PWA serves cached app shell and static assets.
2. Offline reads from IndexedDB.
3. Write queue accumulates locally.
4. Status banner informs users.
5. On recovery: background sync flushes queue; conflict resolution runs.

**RTO target**: < 1 hour (Supabase-side outage).

---

### CASCADE-002 — AI provider outage + high user load

**Impact**: All chat requests fail; users retry aggressively, amplifying load on edge functions.

**Response sequence**:
1. Edge function detects provider error; returns 503 immediately (do not queue requests).
2. Frontend implements exponential back-off (1 s, 2 s, 4 s, max 30 s).
3. Status banner: "AI chat is temporarily unavailable."
4. Users directed to knowledge base (read-only) as fallback.

---

## 11. Circuit Breaker and Retry Policies

| Service | Max Retries | Back-off | Circuit Breaker Open After | Reset After |
|---|---|---|---|---|
| OpenAI API | 2 | Exponential (1 s base) | 5 consecutive failures | 60 s |
| Supabase DB | 1 | Linear (500 ms) | Connection pool exhaustion | Auto (Supabase managed) |
| Supabase Realtime | Unlimited | Exponential (1 s, max 30 s) | 10 consecutive failures | 120 s |
| Supabase Storage | 3 | Linear (1 s) | 5 consecutive 5xx | 60 s |
| Edge Functions | 1 | None (fail fast) | — | — |

**Rule**: Client-side retries must include `Retry-After` header awareness for 429 responses.

---

## Related Documentation

- [Operational Runbook](RUNBOOK.md)
- [Observability & Monitoring](OBSERVABILITY.md)
- [Incident Response](INCIDENT_RESPONSE.md)
- [Error Handling Guide](ERROR_HANDLING_GUIDE.md)
- [ ] Invalid or malicious input
- [ ] Chat session not found
- [ ] Concurrent messages to same chat
- [ ] Message save failure after AI response

### 3. Knowledge Base Failure Modes

**Scenarios to Document**:
- [ ] Knowledge item exceeds size limit
- [ ] Database write failure
- [ ] Search index out of sync
- [ ] Bulk operation partial failure
- [ ] Concurrent edit conflicts
- [ ] Soft delete vs hard delete edge cases
- [ ] Tag creation failures
- [ ] Invalid content (XSS, SQL injection attempts)

### 4. Search Failure Modes

**Scenarios to Document**:
- [ ] Search query timeout
- [ ] Malformed search syntax
- [ ] Search index unavailable
- [ ] Zero results with valid query
- [ ] Search result pagination failure
- [ ] Filter combination errors

### 5. Offline & Sync Failure Modes

**Scenarios to Document**:
- [ ] Device storage quota exceeded
- [ ] Sync queue corruption
- [ ] Three-way merge conflicts
- [ ] Network failure during sync
- [ ] Extremely long offline periods (weeks)
- [ ] IndexedDB unavailable
- [ ] Sync conflict resolution failures

### 6. Real-Time Collaboration Failure Modes

**Scenarios to Document**:
- [ ] Real-time subscription connection drop
- [ ] Subscription limit exceeded
- [ ] Three-way concurrent edit conflicts
- [ ] Real-time event processing failure
- [ ] Subscription authentication failure

### 7. Performance Degradation Modes

**Scenarios to Document**:
- [ ] Database connection pool exhaustion
- [ ] Memory leak in long-running session
- [ ] Virtual scroll with 100k+ items
- [ ] Large dataset export timeout
- [ ] Slow query cascade

### 8. Admin & Security Failure Modes

**Scenarios to Document**:
- [ ] Admin account lockout
- [ ] Rate limit changes not propagating
- [ ] False positive threat detection
- [ ] Audit log write failure

### 9. Backup & Data Management Failure Modes

**Scenarios to Document**:
- [ ] Backup storage unavailable
- [ ] Import file parsing error
- [ ] Export timeout for large dataset
- [ ] Email delivery failure
- [ ] Data validation failure during import

### 10. Notification Failure Modes

**Scenarios to Document**:
- [ ] Email notification delivery failure
- [ ] Notification flood (100+ notifications)
- [ ] Real-time notification connection drop

---

## Failure Mode Documentation Template

For each failure mode, document:

```markdown
### [Feature Name] - [Failure Scenario]

**Trigger Conditions**:
- What conditions cause this failure?

**Expected Behavior**:
- What should happen when this failure occurs?
- Degraded mode capabilities (if any)

**User-Facing Impact**:
- What does the user see/experience?
- Error message shown to user

**System Behavior**:
- How does the system respond internally?
- Logging/metrics generated
- Retry attempts (if applicable)

**Recovery Procedure**:
- Automatic recovery (if any)
- Manual recovery steps
- Time to recovery estimate

**Monitoring & Alerting**:
- Metrics to monitor
- Alert thresholds
- Alert severity level

**Prevention Strategy**:
- How to prevent this failure
- Pre-flight checks
- Circuit breakers

**Example Scenario**:
- Real-world example or test case
```

---

## Edge Case Catalog

### Critical Edge Cases to Document

1. **Data Constraints**
   - [ ] Maximum knowledge item size
   - [ ] Maximum message length
   - [ ] Maximum tag count per item
   - [ ] Maximum concurrent users
   - [ ] Storage quota limits

2. **Timing Edge Cases**
   - [ ] Race conditions in concurrent operations
   - [ ] Token refresh during long operation
   - [ ] Undo after page reload
   - [ ] Sync during offline-to-online transition

3. **Input Edge Cases**
   - [ ] Empty inputs
   - [ ] Extremely long inputs
   - [ ] Special characters (Unicode, emoji, SQL-like syntax)
   - [ ] Malformed data

4. **State Edge Cases**
   - [ ] New user with no data
   - [ ] User with maximum data (100k+ items)
   - [ ] Session state after browser crash
   - [ ] App state during upgrade

---

## Cascading Failure Prevention

Document cascading failure scenarios:

```
Example:
Database Slowdown
  → Connection Pool Exhaustion
    → Request Timeouts
      → User Retry Storm
        → Complete Service Outage

Prevention:
- Monitor database performance
- Connection pool limits
- Request timeout limits
- Rate limiting
- Circuit breakers
```

**Scenarios to Document**:
- [ ] Database → Application → User cascade
- [ ] AI Service → Chat → User cascade
- [ ] Search → Database → Performance cascade
- [ ] Auth → Session → User cascade

---

## Testing Strategy

For each failure mode:
- [ ] Unit test exists
- [ ] Integration test exists
- [ ] Manual test procedure documented
- [ ] Production monitoring configured

---

## Next Steps

1. **Prioritize**: Start with P0 failure modes (auth, data loss risks)
2. **Document**: Use template above for each failure mode
3. **Test**: Create test cases for each failure mode
4. **Monitor**: Implement monitoring for each failure mode
5. **Review**: Quarterly review and update

---

## Related Documentation

- [Error Handling Guide](ERROR_HANDLING_GUIDE.md) - Not Started
- [Runbook](RUNBOOK.md) - Not Started
- [Incident Response](INCIDENT_RESPONSE.md) - Incomplete
- [Observability](OBSERVABILITY.md) - Not Started

---

**⚠️ PRODUCTION BLOCKER**: This documentation must be completed before production deployment.
