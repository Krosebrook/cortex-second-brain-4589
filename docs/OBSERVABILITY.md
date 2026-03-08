# Observability & Monitoring

**Version**: 1.0.0 · **Last Updated**: 2026-03-08 · **Owner**: DevOps / Engineering Lead

This document defines the observability strategy for the Tessa AI Platform — covering structured logging, metrics, alerting thresholds, dashboards, and distributed tracing guidelines.

---

## Table of Contents

1. [Observability Principles](#1-observability-principles)
2. [Logging Strategy](#2-logging-strategy)
3. [Metrics Catalogue](#3-metrics-catalogue)
4. [Alerting Thresholds](#4-alerting-thresholds)
5. [Dashboard Specifications](#5-dashboard-specifications)
6. [Core Web Vitals Monitoring](#6-core-web-vitals-monitoring)
7. [Supabase Observability](#7-supabase-observability)
8. [Edge Function Monitoring](#8-edge-function-monitoring)
9. [Error Tracking](#9-error-tracking)
10. [Observability Checklist](#10-observability-checklist)

---

## 1. Observability Principles

| Principle | Application |
|---|---|
| **Structured logging** | All log entries are JSON; never plain-text lines in production |
| **Correlation IDs** | Each request carries a `request_id` (UUID) propagated through all layers |
| **Actionable alerts** | Every alert links to a runbook step; no alert without a remediation path |
| **Low cardinality labels** | Metric labels use enum values (e.g. `status=success|failure`), not user IDs |
| **Privacy first** | Logs never contain passwords, API keys, PII beyond hashed user ID |

---

## 2. Logging Strategy

### 2.1 Log Levels

| Level | When to Use | Example |
|---|---|---|
| `ERROR` | Unhandled exceptions; external service failures | `OpenAI API returned 500` |
| `WARN` | Recoverable issues; approaching limits | `Rate limit at 80%` |
| `INFO` | Significant business events; lifecycle events | `User authenticated`, `Chat created` |
| `DEBUG` | Detailed tracing for development; NEVER in production | `Query parameters: {…}` |

### 2.2 Structured Log Format

```json
{
  "timestamp": "2026-03-08T12:00:00.000Z",
  "level": "ERROR",
  "service": "chat-with-tessa-secure",
  "request_id": "550e8400-e29b-41d4-a716-446655440000",
  "user_id_hash": "sha256(user_id)",
  "message": "OpenAI API request failed",
  "error_code": "CHAT_003",
  "http_status": 500,
  "duration_ms": 30241,
  "metadata": {
    "model": "gpt-4o",
    "retry_attempt": 2
  }
}
```

**Rules**:
- `user_id_hash`: SHA-256 of `user_id` — never log raw UUID in external log stores.
- `duration_ms`: Always include for any external call.
- `error_code`: Always reference the error taxonomy (see Error Handling Guide).

### 2.3 What to Log

| Event Category | Log Level | Fields |
|---|---|---|
| User authentication | INFO | `request_id`, `event=login_success|login_failure`, `ip_hash`, `method` |
| AI chat request | INFO | `request_id`, `user_id_hash`, `model`, `duration_ms` |
| AI chat failure | ERROR | `request_id`, `error_code`, `http_status`, `duration_ms` |
| Knowledge item created | INFO | `request_id`, `user_id_hash`, `item_id` |
| Database slow query | WARN | `query_hash`, `duration_ms`, `table` |
| Rate limit triggered | WARN | `user_id_hash`, `ip_hash`, `limit_type` |
| Security alert | ERROR | `alert_type`, `severity`, `ip_hash` |
| Edge function cold start | INFO | `function_name`, `cold_start=true`, `duration_ms` |

### 2.4 Log Destinations

| Environment | Destination | Retention |
|---|---|---|
| Development | Browser console + Supabase local logs | N/A |
| Staging | Supabase Dashboard logs | 7 days |
| Production | Supabase Dashboard + external log aggregator (e.g. Datadog, Logtail) | 90 days |

---

## 3. Metrics Catalogue

### 3.1 Availability Metrics

| Metric | Unit | Description | Target |
|---|---|---|---|
| `service.uptime` | % | Percentage of time app is reachable | ≥ 99.5% |
| `auth.success_rate` | % | Successful logins / total login attempts | ≥ 95% |
| `chat.success_rate` | % | AI responses returned / chat requests | ≥ 98% |
| `sync.success_rate` | % | Successful syncs / sync attempts | ≥ 99% |

### 3.2 Latency Metrics

| Metric | Unit | P50 Target | P95 Target | P99 Target |
|---|---|---|---|---|
| `api.response_time` | ms | < 300 ms | < 2 000 ms | < 5 000 ms |
| `chat.response_time` | ms | < 2 000 ms | < 8 000 ms | < 15 000 ms |
| `db.query_time` | ms | < 50 ms | < 500 ms | < 2 000 ms |
| `page.load_time` | ms | < 1 500 ms | < 3 000 ms | < 5 000 ms |

### 3.3 Error Rate Metrics

| Metric | Unit | Alert Threshold |
|---|---|---|
| `api.error_rate` | % | > 1% over 5 min → WARN; > 5% → CRITICAL |
| `chat.error_rate` | % | > 2% over 5 min → WARN; > 10% → CRITICAL |
| `auth.error_rate` | % | > 5% over 5 min → WARN; > 20% → CRITICAL |
| `sync.error_rate` | % | > 2% over 5 min → WARN |

### 3.4 Business Metrics

| Metric | Unit | Description |
|---|---|---|
| `chat.messages_per_hour` | count | Chat message volume |
| `knowledge.items_created_per_day` | count | Knowledge creation rate |
| `active_users_daily` | count | DAU |
| `ai.tokens_used_per_hour` | count | Tracks OpenAI cost |
| `notifications.unread_avg` | count | Average unread notifications per user |

---

## 4. Alerting Thresholds

All alerts must link to a [Runbook](RUNBOOK.md) section.

| Alert | Condition | Severity | Runbook Section |
|---|---|---|---|
| Service down | HTTP 5xx rate > 50% for 2 min | CRITICAL (SEV1) | §5 Incident Response |
| High error rate | API error rate > 5% for 5 min | HIGH (SEV2) | §4 Common Issues |
| AI chat degraded | Chat error rate > 10% for 5 min | HIGH (SEV2) | §4 AI Chat Not Responding |
| Auth failures spike | Auth error rate > 20% for 5 min | HIGH (SEV2) | §4 Login Failures Spike |
| High latency | API P95 > 5 s for 5 min | MEDIUM (SEV3) | §8 Performance Troubleshooting |
| Slow queries | DB query P95 > 2 s | MEDIUM (SEV3) | §8 Database Slow Queries |
| Rate limit storm | > 100 rate-limit events / min | MEDIUM (SEV3) | §4 Rate Limit Issues |
| Sync backlog | Sync queue > 500 items | LOW (SEV4) | §4 Sync Failures |
| Security alert | `security_alerts` INSERT with `severity = critical` | CRITICAL (SEV1) | §9 Security Incidents |
| Coverage below threshold | Test coverage < 70% in CI | MEDIUM | Fix before merge |

### Alert Routing

```
SEV1 → PagerDuty (immediate) → Slack #incidents → Status Page
SEV2 → PagerDuty (15 min acknowledgement) → Slack #incidents
SEV3 → Slack #alerts → ticket created
SEV4 → Slack #alerts (no page)
```

---

## 5. Dashboard Specifications

### 5.1 Operational Overview Dashboard

**Panels** (recommended order):

1. Service health status (green/red per service)
2. Error rate (time series, last 24 h)
3. API P50/P95 latency (time series, last 24 h)
4. Active users (gauge)
5. AI chat success rate (time series, last 24 h)
6. Database query P95 (time series, last 24 h)
7. Recent incidents (table, last 7 days)

### 5.2 AI Performance Dashboard

**Panels**:

1. Chat requests per minute (time series)
2. AI response P50/P95 latency
3. Token usage per hour (cost tracking)
4. Error breakdown by error code (bar chart)
5. Rate limit events per hour
6. Top slow prompts (table)

### 5.3 Security Dashboard

**Panels**:

1. Failed login attempts per hour (time series + geo map)
2. Blocked IPs (count + table)
3. Security alerts by severity (pie chart)
4. Unusual access pattern events

---

## 6. Core Web Vitals Monitoring

The frontend uses the `web-vitals` library (already integrated) to report real-user metrics.

| Metric | Good | Needs Improvement | Poor |
|---|---|---|---|
| LCP (Largest Contentful Paint) | ≤ 2.5 s | 2.5–4.0 s | > 4.0 s |
| CLS (Cumulative Layout Shift) | ≤ 0.1 | 0.1–0.25 | > 0.25 |
| INP (Interaction to Next Paint) | ≤ 200 ms | 200–500 ms | > 500 ms |
| FCP (First Contentful Paint) | ≤ 1.8 s | 1.8–3.0 s | > 3.0 s |
| TTFB (Time to First Byte) | ≤ 800 ms | 800 ms–1.8 s | > 1.8 s |

**Implementation**: `src/main.tsx` calls `web-vitals` functions and sends metrics to an analytics endpoint. Results feed into the Operational Overview Dashboard.

---

## 7. Supabase Observability

### Available Natively

- **Supabase Dashboard → Logs**: Edge Function logs, Auth logs, Storage logs, Database logs.
- **Supabase Dashboard → Reports**: API performance, query performance.
- **Supabase Dashboard → Database → Slow queries**: Queries taking > 1 s.

### Recommended Queries

**Slow queries in last hour**:
```sql
SELECT query, calls, total_time / calls AS avg_ms, rows
FROM pg_stat_statements
WHERE total_time / calls > 100
ORDER BY avg_ms DESC
LIMIT 20;
```

**Failed login attempts per hour (last 24 h)**:
```sql
SELECT date_trunc('hour', attempted_at) AS hour, COUNT(*) AS attempts
FROM public.failed_login_attempts
WHERE attempted_at > now() - interval '24 hours'
GROUP BY hour
ORDER BY hour DESC;
```

**Security alerts in last 7 days**:
```sql
SELECT alert_type, severity, COUNT(*) AS count
FROM public.security_alerts
WHERE triggered_at > now() - interval '7 days'
GROUP BY alert_type, severity
ORDER BY count DESC;
```

---

## 8. Edge Function Monitoring

Each edge function should emit the following structured log on every invocation:

```typescript
// At function start
console.log(JSON.stringify({
  event: 'function_invoked',
  function: 'chat-with-tessa-secure',
  request_id: requestId,
  timestamp: new Date().toISOString(),
}));

// On success
console.log(JSON.stringify({
  event: 'function_completed',
  function: 'chat-with-tessa-secure',
  request_id: requestId,
  duration_ms: Date.now() - startTime,
  status: 'success',
}));

// On error
console.error(JSON.stringify({
  event: 'function_error',
  function: 'chat-with-tessa-secure',
  request_id: requestId,
  error_code: 'CHAT_001',
  message: error.message,
  duration_ms: Date.now() - startTime,
}));
```

---

## 9. Error Tracking

### Recommended: Sentry Integration

```typescript
// src/main.tsx
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  tracesSampleRate: 0.1,            // 10% of transactions
  replaysSessionSampleRate: 0.01,   // 1% of sessions
  replaysOnErrorSampleRate: 1.0,    // 100% on error
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration(),
  ],
  beforeSend(event) {
    // Strip PII before sending
    if (event.user) {
      delete event.user.email;
      delete event.user.username;
    }
    return event;
  },
});
```

**Privacy rule**: Strip `email`, `username`, and any field matching `/key|secret|password|token/i` before sending to Sentry.

---

## 10. Observability Checklist

### Deployment Prerequisites

- [ ] Structured logging implemented in all edge functions
- [ ] `web-vitals` reporting configured and verified
- [ ] Sentry (or equivalent) configured with PII scrubbing
- [ ] All alerts created and tested in staging
- [ ] Dashboard panels populated with real data
- [ ] On-call rotation configured in PagerDuty / alerting tool
- [ ] Runbook linked from every alert

### Per-Sprint Check

- [ ] No new `console.log` statements in production code (use structured logger)
- [ ] New features have at least one business metric tracked
- [ ] New failure modes added to `docs/FAILURE_MODES.md`
- [ ] Alert thresholds reviewed if feature changes load patterns

---

## Related Documentation

- [Operational Runbook](RUNBOOK.md)
- [Failure Modes](FAILURE_MODES.md)
- [Incident Response](INCIDENT_RESPONSE.md)
- [Error Handling Guide](ERROR_HANDLING_GUIDE.md)
- [Security Documentation](SECURITY.md)
