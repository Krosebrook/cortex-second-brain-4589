# Operational Runbook

**Status**: 🔴 Not Started  
**Priority**: P0 - Production Blocker  
**Owner**: TBD  
**Last Updated**: 2026-01-21  
**Estimated Effort**: 8 hours

---

## Purpose

This runbook provides step-by-step procedures for common operational tasks, incident response, and emergency procedures for the Tessa AI Platform.

## Why This Is Critical

Without operational runbooks:
- Mean Time to Resolution (MTTR) increases 5-10x
- Inconsistent incident response
- Knowledge locked in individual team members' heads
- New on-call engineers cannot respond effectively
- Emergency procedures are improvised under pressure

---

## Table of Contents

1. [Emergency Contacts](#emergency-contacts)
2. [Quick Reference](#quick-reference)
3. [Health Check Procedures](#health-check-procedures)
4. [Common Issues & Solutions](#common-issues--solutions)
5. [Incident Response Procedures](#incident-response-procedures)
6. [Rollback Procedures](#rollback-procedures)
7. [Database Maintenance](#database-maintenance)
8. [Performance Troubleshooting](#performance-troubleshooting)
9. [Security Incidents](#security-incidents)

---

## 1. Emergency Contacts

### On-Call Rotation
- **Primary On-Call**: [Name/Phone/Slack]
- **Secondary On-Call**: [Name/Phone/Slack]
- **Manager/Escalation**: [Name/Phone/Slack]

### Third-Party Support
- **Supabase Support**: [Contact info]
- **OpenAI Support**: [Contact info]
- **Hosting Provider**: [Contact info]

### Communication Channels
- **Incident Slack Channel**: #incidents
- **Status Page**: [URL]
- **Monitoring Dashboard**: [URL]

---

## 2. Quick Reference

### Service URLs
```
Production Frontend:  https://[production-url]
Staging Frontend:     https://[staging-url]
Supabase Dashboard:   https://app.supabase.com/project/[project-id]
Monitoring Dashboard: [URL]
Log Aggregation:      [URL]
```

### Common Commands

**Check Service Status**:
```bash
# Frontend health check
curl https://[production-url]/health

# Database connectivity
curl https://[production-url]/health/database
```

**View Recent Logs**:
```bash
# Supabase CLI
supabase logs --project [project-id] --limit 100

# Filter by service
supabase logs --project [project-id] --service edge-functions
```

**Restart Edge Function**:
```bash
# Redeploy edge function
supabase functions deploy [function-name] --project-ref [project-id]
```

---

## 3. Health Check Procedures

### Daily Health Check (5 minutes)

**Procedure**:
1. [ ] Check monitoring dashboard for alerts
2. [ ] Verify all services are green
3. [ ] Check error rate (should be <1%)
4. [ ] Check API latency (p95 <2 seconds)
5. [ ] Review overnight incidents
6. [ ] Check backup status

**Commands**:
```bash
# TBD: Add specific health check commands
```

### Weekly Health Review (30 minutes)

**Procedure**:
1. [ ] Review error trends (week-over-week)
2. [ ] Check slow query log
3. [ ] Review database growth
4. [ ] Check storage usage
5. [ ] Review cost trends
6. [ ] Update capacity planning

---

## 4. Common Issues & Solutions

### Issue: "Service Unavailable" Error

**Symptoms**:
- Users seeing 503 errors
- High error rate in monitoring

**Diagnosis**:
```bash
# Check service status
curl https://[production-url]/health

# Check recent deployments
git log --oneline -10

# Check error logs
[TBD: Log query command]
```

**Resolution**:
1. Check if recent deployment caused issue
2. If yes, proceed to [Rollback Procedures](#rollback-procedures)
3. If no, check database connectivity
4. Check edge function status
5. Escalate if unresolved within 15 minutes

**Time to Resolution**: 5-15 minutes

---

### Issue: "Login Failures Spike"

**Symptoms**:
- Login failure rate >10%
- Users reporting cannot login

**Diagnosis**:
```bash
# Check Supabase Auth status
[TBD: Auth status check]

# Check recent failed login attempts
[TBD: Query failed_login_attempts table]
```

**Resolution**:
1. Check Supabase Auth status page
2. If Supabase issue, update status page and wait
3. If local issue, check RLS policies
4. Check if rate limiting too aggressive
5. Review recent auth configuration changes

**Time to Resolution**: 10-30 minutes

---

### Issue: "AI Chat Not Responding"

**Symptoms**:
- Chat messages timing out
- AI request failure rate >5%

**Diagnosis**:
```bash
# Check OpenAI status
curl https://status.openai.com/api/v2/status.json

# Check edge function logs
[TBD: Edge function log query]
```

**Resolution**:
1. Check OpenAI status page
2. If OpenAI issue, implement fallback message
3. Check rate limits (both OpenAI and application)
4. Check edge function timeout settings
5. Review recent OpenAI API key changes

**Time to Resolution**: 5-20 minutes

---

### Issue: "Database Slow Queries"

**Symptoms**:
- API latency p95 >5 seconds
- Slow query count increasing

**Diagnosis**:
```bash
# Check database performance
[TBD: Database performance query]

# View slow queries
[TBD: Slow query log]
```

**Resolution**:
1. Identify slow queries from logs
2. Check if missing index (add if needed)
3. Check database connection pool saturation
4. Consider query optimization
5. Scale database if needed

**Time to Resolution**: 30-60 minutes

---

### Issue: "Sync Failures"

**Symptoms**:
- Sync failure rate >5%
- Users reporting data not syncing

**Diagnosis**:
```bash
# Check sync queue length
[TBD: Query sync status]

# Check network connectivity issues
[TBD: Network check]
```

**Resolution**:
1. Check database connectivity
2. Check real-time subscription status
3. Review conflict resolution logs
4. Check IndexedDB quota issues
5. Consider manual sync retry

**Time to Resolution**: 15-30 minutes

---

## 5. Incident Response Procedures

### Incident Severity Levels

| Severity | Description | Response Time | Example |
|----------|-------------|---------------|---------|
| **SEV1** | Service Down | <15 minutes | Complete outage |
| **SEV2** | Major Feature Down | <30 minutes | Auth down, AI chat down |
| **SEV3** | Degraded Performance | <2 hours | Slow queries, high latency |
| **SEV4** | Minor Issue | <24 hours | UI bug, typo |

### SEV1: Service Down

**Immediate Actions (0-5 minutes)**:
1. [ ] Acknowledge alert in PagerDuty
2. [ ] Post in #incidents Slack channel
3. [ ] Update status page: "Investigating"
4. [ ] Check recent deployments (last 2 hours)

**Investigation (5-15 minutes)**:
1. [ ] Run health checks on all services
2. [ ] Check monitoring dashboard for root cause
3. [ ] Review error logs
4. [ ] Identify affected component

**Resolution (15-30 minutes)**:
1. [ ] If recent deployment, rollback immediately
2. [ ] If infrastructure, contact hosting provider
3. [ ] If third-party (Supabase, OpenAI), update status page
4. [ ] Implement workaround if possible

**Post-Incident (After resolution)**:
1. [ ] Update status page: "Resolved"
2. [ ] Post resolution in #incidents
3. [ ] Schedule post-mortem within 48 hours
4. [ ] Document in incident log

### SEV2: Major Feature Down

**Follow SEV1 procedure with extended timelines**

Response time: 30 minutes

### Post-Mortem Template

**Incident Summary**:
- Date/Time:
- Duration:
- Severity:
- Services Affected:
- User Impact:

**Timeline**:
- HH:MM - Incident began
- HH:MM - Detected (how?)
- HH:MM - On-call acknowledged
- HH:MM - Root cause identified
- HH:MM - Resolution applied
- HH:MM - Verified resolved

**Root Cause**:
- What happened?
- Why did it happen?
- Why wasn't it caught earlier?

**Resolution**:
- What fixed it?

**Action Items**:
- [ ] [Owner] - Prevent recurrence (e.g., add monitoring)
- [ ] [Owner] - Update runbook
- [ ] [Owner] - Improve detection

---

## 6. Rollback Procedures

### Frontend Rollback

**Vercel/Netlify**:
```bash
# Via dashboard:
1. Go to Deployments
2. Find previous stable deployment
3. Click "Promote to Production"
```

**Time to Rollback**: 2-5 minutes

### Edge Function Rollback

```bash
# Identify previous working commit
git log --oneline supabase/functions/[function-name]

# Checkout previous version
git checkout [commit-hash] -- supabase/functions/[function-name]

# Redeploy
supabase functions deploy [function-name] --project-ref [project-id]
```

**Time to Rollback**: 5-10 minutes

### Database Migration Rollback

**⚠️ CRITICAL**: Database rollbacks are dangerous

**Procedure**:
1. [ ] Assess data loss risk
2. [ ] Create database backup
3. [ ] Run rollback migration (if available)
4. [ ] Verify data integrity
5. [ ] Communicate data loss (if any)

**Time to Rollback**: 15-30 minutes

---

## 7. Database Maintenance

### Create Database Backup

```bash
# Manual backup
[TBD: Supabase backup command]
```

### Restore Database from Backup

```bash
# ⚠️ CRITICAL: Test restore procedure in staging first
[TBD: Supabase restore command]
```

### Vacuum Database

```sql
-- Analyze database statistics
ANALYZE;

-- Vacuum tables (reclaim space)
VACUUM ANALYZE;
```

**Frequency**: Weekly (automated)

### Check Database Size

```sql
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
LIMIT 10;
```

---

## 8. Performance Troubleshooting

### High CPU Usage

**Diagnosis**:
1. Check slow query log
2. Identify expensive queries
3. Check for missing indexes

**Resolution**:
1. Add missing indexes
2. Optimize queries
3. Consider database scaling

### High Memory Usage

**Diagnosis**:
1. Check connection pool usage
2. Check for memory leaks in edge functions
3. Review long-running queries

**Resolution**:
1. Tune connection pool settings
2. Restart edge functions
3. Kill long-running queries

### High Latency

**Diagnosis**:
1. Check API latency dashboard
2. Identify slow endpoints
3. Check database query performance

**Resolution**:
1. Add caching where appropriate
2. Optimize slow queries
3. Consider CDN for static assets

---

## 9. Security Incidents

### Suspected Account Compromise

**Procedure**:
1. [ ] Lock affected user account
2. [ ] Review audit logs for suspicious activity
3. [ ] Force password reset
4. [ ] Notify user via email
5. [ ] Document incident

### Suspected Data Breach

**⚠️ CRITICAL - Escalate immediately**

**Procedure**:
1. [ ] Notify security team immediately
2. [ ] Do NOT discuss publicly
3. [ ] Preserve logs and evidence
4. [ ] Follow incident response plan
5. [ ] Notify legal/compliance team

### DDoS Attack

**Procedure**:
1. [ ] Check rate limiting effectiveness
2. [ ] Block malicious IPs
3. [ ] Enable additional DDoS protection
4. [ ] Contact hosting provider
5. [ ] Update status page

---

## Next Steps

1. **Complete Missing Sections**: Add TBD commands and queries
2. **Test Procedures**: Run through each procedure in staging
3. **Create Checklists**: Convert procedures to checklists
4. **Train Team**: Ensure all on-call engineers familiar with runbook
5. **Review Quarterly**: Update based on new incidents

---

## Related Documentation

- [Incident Response](INCIDENT_RESPONSE.md) - Incomplete
- [Observability](OBSERVABILITY.md) - Not Started
- [Failure Modes](FAILURE_MODES.md) - Not Started
- [Deployment Guide](DEPLOYMENT.md)

---

**⚠️ PRODUCTION BLOCKER**: This runbook must be completed and tested before production deployment.
