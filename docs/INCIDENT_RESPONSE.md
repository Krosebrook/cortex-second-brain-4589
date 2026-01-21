# Incident Response Plan

## Overview

This document outlines the procedures for identifying, containing, communicating, and recovering from security incidents affecting the Tessa AI Platform.

**Last Updated:** January 2025  
**Document Owner:** Security Team  
**Review Cycle:** Quarterly

---

## Table of Contents

1. [Incident Classification](#incident-classification)
2. [Identification Procedures](#identification-procedures)
3. [Containment Strategies](#containment-strategies)
4. [Communication Templates](#communication-templates)
5. [Recovery Runbooks](#recovery-runbooks)
6. [Post-Incident Review](#post-incident-review)

---

## Incident Classification

### Severity Levels

| Level | Name | Description | Response Time | Examples |
|-------|------|-------------|---------------|----------|
| **P1** | Critical | Complete service outage or active data breach | < 15 min | Database breach, auth bypass, ransomware |
| **P2** | High | Significant security vulnerability or partial outage | < 1 hour | RLS bypass, API key exposure, DDoS attack |
| **P3** | Medium | Limited impact security issue | < 4 hours | Single account compromise, failed brute force |
| **P4** | Low | Minor security concern | < 24 hours | Suspicious activity, policy violation |

### Incident Categories

- **Authentication**: Failed logins, credential stuffing, session hijacking
- **Authorization**: RLS bypass, privilege escalation, unauthorized access
- **Data Breach**: PII exposure, database leak, backup compromise
- **Availability**: DDoS, service outage, resource exhaustion
- **Malware**: Injected scripts, compromised dependencies
- **Insider Threat**: Unauthorized data access by employees/contractors

---

## Identification Procedures

### 1. Automated Detection

#### Security Monitoring Alerts

```sql
-- Query for suspicious login patterns
SELECT 
  email,
  ip_address,
  COUNT(*) as attempts,
  MIN(attempted_at) as first_attempt,
  MAX(attempted_at) as last_attempt
FROM failed_login_attempts
WHERE attempted_at > NOW() - INTERVAL '1 hour'
GROUP BY email, ip_address
HAVING COUNT(*) >= 5
ORDER BY attempts DESC;
```

#### Key Metrics to Monitor

| Metric | Normal | Warning | Critical |
|--------|--------|---------|----------|
| Failed logins/hour | < 10 | 10-50 | > 50 |
| Rate limit blocks/hour | < 20 | 20-100 | > 100 |
| Error rate (5xx) | < 0.1% | 0.1-1% | > 1% |
| Auth API latency | < 200ms | 200-500ms | > 500ms |
| Blocked IPs/hour | < 5 | 5-20 | > 20 |

#### Alert Sources

1. **Supabase Dashboard**: Real-time auth and database logs
2. **Edge Function Logs**: API errors and rate limiting events
3. **Security Events Table**: Custom security event tracking
4. **External Monitoring**: Uptime and performance alerts

### 2. Manual Detection

#### Daily Security Checklist

- [ ] Review failed login attempts for patterns
- [ ] Check blocked IP list for false positives
- [ ] Audit admin actions log
- [ ] Review error logs for anomalies
- [ ] Verify backup completion status

#### Weekly Security Checklist

- [ ] Audit RLS policy effectiveness
- [ ] Review user privilege changes
- [ ] Check for stale sessions
- [ ] Analyze API usage patterns
- [ ] Review security event trends

### 3. User Reports

**Security Report Channels:**
- Email: security@tessa.ai
- In-app: Report Security Issue button
- GitHub: Security advisory (for researchers)

**Report Triage Process:**
1. Acknowledge receipt within 1 hour
2. Assign severity level within 4 hours
3. Provide initial response within 24 hours
4. Track to resolution in security tracker

---

## Containment Strategies

### Immediate Actions by Incident Type

#### A. Credential Compromise

```typescript
// 1. Revoke all sessions for affected user
await supabase.auth.admin.signOut(userId, 'global');

// 2. Force password reset
await supabase.auth.resetPasswordForEmail(userEmail, {
  redirectTo: `${SITE_URL}/reset-password`,
});

// 3. Add to monitoring watchlist
await supabase.from('security_watchlist').insert({
  user_id: userId,
  reason: 'credential_compromise',
  expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
});
```

#### B. Active Attack (DDoS/Brute Force)

1. **Enable aggressive rate limiting:**
```sql
UPDATE rate_limit_config 
SET max_attempts = 3, 
    time_window_minutes = 5,
    block_duration_minutes = 60
WHERE config_key = 'login_rate_limit';
```

2. **Block attacking IPs:**
```sql
INSERT INTO blocked_ips (ip_address, reason, permanent)
SELECT DISTINCT ip_address, 'active_attack', false
FROM failed_login_attempts
WHERE attempted_at > NOW() - INTERVAL '10 minutes'
GROUP BY ip_address
HAVING COUNT(*) > 10;
```

3. **Enable CAPTCHA** (if available)

#### C. Data Breach Detected

1. **Isolate affected systems:**
   - Revoke API keys that may be compromised
   - Rotate Supabase service role key if needed
   - Disable affected edge functions

2. **Preserve evidence:**
   - Export relevant logs before retention expires
   - Take database snapshots
   - Document timeline of events

3. **Assess scope:**
```sql
-- Identify potentially affected users
SELECT DISTINCT user_id, created_at, ip_address
FROM profile_access_logs
WHERE created_at >= '[BREACH_START_TIME]'
  AND access_type IN ('view', 'export')
ORDER BY created_at;
```

#### D. RLS Policy Bypass

1. **Immediate lockdown:**
```sql
-- Add emergency deny-all policy
CREATE POLICY "emergency_lockdown" ON affected_table
  FOR ALL USING (false);

-- Disable the bypassed policy
ALTER POLICY "vulnerable_policy" ON affected_table DISABLE;
```

2. **Audit access during vulnerability window:**
```sql
SELECT * FROM audit_logs
WHERE table_name = 'affected_table'
  AND action IN ('SELECT', 'UPDATE', 'DELETE')
  AND created_at >= '[VULNERABILITY_DISCOVERED]';
```

### Containment Decision Tree

```
Is data actively being exfiltrated?
├── YES → Block all external access immediately
│         └── Rotate all secrets
│         └── Enable maintenance mode
└── NO → Is the vulnerability exploitable remotely?
         ├── YES → Block attack vector (IP/endpoint)
         │         └── Deploy hotfix if available
         └── NO → Document and schedule fix
                  └── Monitor for exploitation attempts
```

---

## Communication Templates

### Internal Escalation

#### Slack/Teams Alert Template

```
🚨 SECURITY INCIDENT - [SEVERITY]

Type: [INCIDENT_TYPE]
Detected: [TIMESTAMP]
Status: [INVESTIGATING/CONTAINED/RESOLVED]

Summary: [BRIEF_DESCRIPTION]

Affected Systems:
- [SYSTEM_1]
- [SYSTEM_2]

Immediate Actions Taken:
- [ACTION_1]
- [ACTION_2]

Next Steps:
- [STEP_1]
- [STEP_2]

Incident Lead: @[PERSON]
War Room: [LINK]
```

### User Notification Templates

#### Credential Compromise Notification

```
Subject: Security Alert: Action Required for Your Tessa Account

Dear [USER_NAME],

We detected unusual activity on your Tessa account on [DATE] that may indicate unauthorized access.

What Happened:
[BRIEF_DESCRIPTION]

What We've Done:
- Signed out all active sessions
- Enabled additional monitoring on your account

What You Should Do:
1. Reset your password immediately: [RESET_LINK]
2. Review your recent activity in Settings > Security
3. Enable two-factor authentication if not already active
4. Contact us if you notice anything suspicious

If you did not attempt to access your account from [LOCATION/IP], please contact our security team immediately at security@tessa.ai.

We take your security seriously and apologize for any inconvenience.

Best regards,
The Tessa Security Team
```

#### Data Breach Notification (GDPR Compliant)

```
Subject: Important Security Notice Regarding Your Data

Dear [USER_NAME],

We are writing to inform you of a security incident that may have affected your personal data.

Incident Summary:
- Date Discovered: [DATE]
- Type of Incident: [DESCRIPTION]
- Data Potentially Affected: [DATA_TYPES]

Actions We Have Taken:
- [ACTION_1]
- [ACTION_2]
- [ACTION_3]

Recommended Actions for You:
- [RECOMMENDATION_1]
- [RECOMMENDATION_2]

Your Rights:
Under GDPR, you have the right to:
- Request a copy of your data
- Request deletion of your data
- Lodge a complaint with your local data protection authority

Contact Information:
- Security Team: security@tessa.ai
- Data Protection Officer: dpo@tessa.ai

We sincerely apologize for this incident and are committed to protecting your data.

Regards,
[COMPANY_NAME]
```

### Regulatory Notification Template

```
SECURITY INCIDENT REPORT

Organization: [COMPANY_NAME]
Date of Notification: [DATE]
Incident Reference: [INCIDENT_ID]

1. Nature of Breach:
[DESCRIPTION]

2. Categories of Data Affected:
- [ ] Names
- [ ] Email addresses
- [ ] Passwords (hashed)
- [ ] Financial data
- [ ] Other: [SPECIFY]

3. Approximate Number of Affected Individuals:
[NUMBER]

4. Likely Consequences:
[RISK_ASSESSMENT]

5. Measures Taken:
[REMEDIATION_STEPS]

6. Data Protection Officer Contact:
[DPO_DETAILS]
```

---

## Recovery Runbooks

### Runbook 1: Account Recovery After Compromise

**Prerequisites:**
- Confirmed credential compromise
- User identity verified through secondary channel

**Steps:**

1. **Revoke Access (5 min)**
   ```bash
   # Using Supabase CLI or dashboard
   supabase auth user signout [USER_ID] --scope global
   ```

2. **Reset Credentials (2 min)**
   - Trigger password reset email
   - Invalidate any API keys
   - Revoke OAuth tokens if applicable

3. **Audit Activity (15 min)**
   ```sql
   SELECT * FROM user_activity
   WHERE user_id = '[USER_ID]'
     AND created_at >= '[COMPROMISE_TIME]'
   ORDER BY created_at DESC;
   ```

4. **Restore Data (if needed)**
   - Compare current state with last known good backup
   - Restore modified/deleted items if confirmed malicious

5. **Re-enable Access (5 min)**
   - User completes password reset
   - Verify MFA enrollment
   - Monitor for 48 hours

### Runbook 2: Service Recovery After DDoS

**Prerequisites:**
- Attack confirmed and source identified
- Upstream provider notified if applicable

**Steps:**

1. **Mitigate Attack (Immediate)**
   - Enable Cloudflare/CDN protection rules
   - Block attacking IP ranges at firewall level
   - Scale up infrastructure if needed

2. **Monitor Recovery (Ongoing)**
   ```sql
   -- Check request rates returning to normal
   SELECT 
     date_trunc('minute', timestamp) as minute,
     COUNT(*) as requests
   FROM function_edge_logs
   WHERE timestamp > NOW() - INTERVAL '1 hour'
   GROUP BY minute
   ORDER BY minute;
   ```

3. **Validate Services (30 min)**
   - Test all critical endpoints
   - Verify auth flows working
   - Check database connectivity
   - Validate edge functions

4. **Gradually Restore (1-2 hours)**
   - Re-enable features one at a time
   - Monitor error rates
   - Keep enhanced logging enabled

5. **Post-Attack Analysis (24 hours)**
   - Document attack vectors
   - Update firewall rules
   - Enhance rate limiting
   - Consider DDoS protection service

### Runbook 3: Secret Rotation After Exposure

**Prerequisites:**
- Secret confirmed exposed (in logs, git, etc.)
- Impact assessment completed

**Steps:**

1. **Identify Affected Secrets**
   - API keys (Supabase, OpenAI, etc.)
   - Database credentials
   - JWT signing keys
   - OAuth client secrets

2. **Generate New Secrets**
   ```bash
   # Generate new secure random keys
   openssl rand -base64 32
   ```

3. **Deploy New Secrets (Zero-downtime)**
   - Update in Supabase Edge Function secrets
   - Update environment variables
   - Deploy with both old and new valid temporarily

4. **Revoke Old Secrets**
   - Deactivate old API keys in provider dashboards
   - Update Supabase service role key if needed
   - Invalidate old JWT signing key

5. **Verify Rotation**
   - Test all integrations
   - Monitor for authentication failures
   - Confirm old secrets no longer work

### Runbook 4: Database Recovery After Breach

**Prerequisites:**
- Breach scope identified
- Clean backup identified

**Steps:**

1. **Enable Maintenance Mode**
   - Block all non-admin access
   - Preserve database state

2. **Export Evidence**
   ```sql
   -- Export audit trail for investigation
   COPY (
     SELECT * FROM audit_logs
     WHERE created_at >= '[BREACH_START]'
   ) TO '/tmp/audit_export.csv' WITH CSV HEADER;
   ```

3. **Assess Damage**
   - Compare current state with backup
   - Identify modified/deleted records
   - Document all changes

4. **Restore from Backup (if needed)**
   - Use Supabase point-in-time recovery
   - Or restore from daily backup

5. **Apply Security Fixes**
   - Fix RLS policies
   - Rotate compromised credentials
   - Add additional monitoring

6. **Validate Integrity**
   ```sql
   -- Check for unauthorized modifications
   SELECT * FROM knowledge_base
   WHERE updated_at > '[LAST_KNOWN_GOOD]'
     AND updated_at < '[BREACH_DETECTED]';
   ```

7. **Resume Service**
   - Disable maintenance mode
   - Enable enhanced monitoring
   - Notify affected users

---

## Post-Incident Review

### Review Meeting Agenda

1. **Timeline Review** (15 min)
   - When was the incident detected?
   - When was it contained?
   - When was it resolved?

2. **Root Cause Analysis** (30 min)
   - What was the root cause?
   - Why wasn't it detected earlier?
   - What controls failed?

3. **Response Evaluation** (15 min)
   - What went well?
   - What could be improved?
   - Were runbooks followed?

4. **Action Items** (15 min)
   - Preventive measures
   - Detection improvements
   - Process updates

### Post-Incident Report Template

```markdown
# Post-Incident Report

## Incident Summary
- **ID:** [INCIDENT_ID]
- **Severity:** [P1-P4]
- **Type:** [CATEGORY]
- **Duration:** [START] to [END]

## Timeline
| Time | Event |
|------|-------|
| HH:MM | Incident detected |
| HH:MM | Containment initiated |
| HH:MM | Resolution confirmed |

## Root Cause
[DETAILED_EXPLANATION]

## Impact
- Users affected: [NUMBER]
- Data compromised: [DESCRIPTION]
- Service downtime: [DURATION]

## Response Actions
1. [ACTION_1]
2. [ACTION_2]

## Lessons Learned
- [LESSON_1]
- [LESSON_2]

## Action Items
| Item | Owner | Due Date | Status |
|------|-------|----------|--------|
| [ITEM] | [OWNER] | [DATE] | [STATUS] |

## Appendix
- Related logs
- Screenshots
- Supporting documentation
```

---

## Contact Information

### Security Team

| Role | Name | Contact |
|------|------|---------|
| Security Lead | TBD | security@tessa.ai |
| On-Call Engineer | Rotating | PagerDuty |
| DPO | TBD | dpo@tessa.ai |

### External Contacts

| Organization | Purpose | Contact |
|--------------|---------|---------|
| Supabase Support | Infrastructure | support@supabase.io |
| Legal Counsel | Breach notification | TBD |
| Cyber Insurance | Claims | TBD |

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | Jan 2025 | Security Team | Initial release |
