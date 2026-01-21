# Configuration Management

**Status**: 🟠 Not Started  
**Priority**: P1 - High Priority  
**Owner**: TBD  
**Last Updated**: 2026-01-21  
**Estimated Effort**: 6 hours

---

## Purpose

This document provides comprehensive documentation of all configuration options, environment variables, feature flags, and secrets management for the Tessa AI Platform.

## Why This Is Critical

Without configuration documentation:
- Environment setup is error-prone
- Production configuration drift occurs
- Security vulnerabilities arise from misconfigurations
- Troubleshooting is difficult
- Onboarding new developers takes longer

---

## Required Content

### 1. Environment Variables Reference

**Frontend Environment Variables** (`.env`):

```bash
# Supabase Configuration (Required)
VITE_SUPABASE_URL=                    # Supabase project URL
VITE_SUPABASE_ANON_KEY=               # Supabase anonymous key
VITE_SUPABASE_PROJECT_ID=             # Supabase project ID

# Optional: Analytics and Monitoring
VITE_ANALYTICS_ID=                    # Analytics provider ID
VITE_SENTRY_DSN=                      # Sentry error tracking DSN

# Optional: Feature Flags
VITE_FEATURE_OFFLINE_MODE=true        # Enable offline mode
VITE_FEATURE_REAL_TIME=true           # Enable real-time features
VITE_FEATURE_ADMIN_DASHBOARD=false    # Enable admin features

# Development Settings
NODE_ENV=development|production       # Environment mode
```

**Backend Environment Variables** (Supabase Edge Functions):

```bash
# AI Provider API Keys (Required for chat)
OPENAI_API_KEY=                       # OpenAI API key
ANTHROPIC_API_KEY=                    # Anthropic API key (optional)
GOOGLE_AI_API_KEY=                    # Google AI API key (optional)

# Email Configuration (Required for notifications)
SENDGRID_API_KEY=                     # SendGrid API key
EMAIL_FROM=                           # Sender email address

# Security Configuration
RATE_LIMIT_REQUESTS_PER_MINUTE=20     # API rate limit
ACCOUNT_LOCKOUT_THRESHOLD=5           # Failed login attempts before lockout
ACCOUNT_LOCKOUT_DURATION=900          # Lockout duration in seconds

# Feature Configuration
MAX_MESSAGE_LENGTH=10000              # Maximum chat message length
MAX_KNOWLEDGE_ITEM_SIZE=10485760      # Maximum knowledge item size (10MB)
MAX_UPLOAD_SIZE=52428800              # Maximum upload size (50MB)
```

**For Each Variable Document**:
- [ ] Variable name
- [ ] Required or optional
- [ ] Default value (if any)
- [ ] Valid values or format
- [ ] Purpose and usage
- [ ] Environment-specific values (dev, staging, prod)
- [ ] Security considerations

### 2. Configuration Validation

**Startup Validation**:
```typescript
// TBD: Document configuration validation on startup
// - Check required variables are present
// - Validate variable formats
// - Warn about missing optional variables
```

**Runtime Validation**:
```typescript
// TBD: Document runtime configuration checks
// - Verify API keys are valid
// - Check database connectivity
// - Validate feature flag values
```

### 3. Secrets Management

**DO NOT Commit**:
- ❌ API keys
- ❌ Database credentials
- ❌ JWT secrets
- ❌ OAuth client secrets
- ❌ Encryption keys

**Secrets Storage**:

**Development**:
- [ ] Local `.env` file (git-ignored)
- [ ] 1Password or similar for team sharing

**Production**:
- [ ] Supabase Edge Function Secrets
- [ ] Vercel/Netlify environment variables
- [ ] Never in source control

**Secrets Rotation**:
- [ ] API keys: Rotate every 90 days
- [ ] Database passwords: Rotate every 90 days
- [ ] Document rotation procedures

### 4. Feature Flags

**Feature Flag System**:

```typescript
interface FeatureFlags {
  offlineMode: boolean;
  realTimeSync: boolean;
  adminDashboard: boolean;
  experimentalSearch: boolean;
  // TBD: Add all feature flags
}
```

**Feature Flag Usage**:
```typescript
// TBD: Document how to check feature flags
// TBD: Document how to add new feature flags
// TBD: Document how to deprecate feature flags
```

**Feature Flag Strategy**:
- [ ] Development: All flags enabled
- [ ] Staging: Production-like flags
- [ ] Production: Gradual rollout

### 5. Environment-Specific Configuration

**Development**:
```bash
VITE_SUPABASE_URL=http://localhost:54321
NODE_ENV=development
# Debug features enabled
# Mock data available
# Relaxed rate limits
```

**Staging**:
```bash
VITE_SUPABASE_URL=https://staging-project.supabase.co
NODE_ENV=production
# Production-like configuration
# Test data
# Same rate limits as production
```

**Production**:
```bash
VITE_SUPABASE_URL=https://prod-project.supabase.co
NODE_ENV=production
# Real API keys
# Real data
# Production rate limits
# Monitoring enabled
```

### 6. Configuration Best Practices

**Principles**:
- [ ] **Explicit over Implicit**: No magic defaults
- [ ] **Fail Fast**: Validate on startup
- [ ] **Environment Parity**: Dev/staging/prod similar
- [ ] **Secrets Never in Code**: Use environment variables
- [ ] **Document Everything**: No undocumented variables

**Anti-Patterns to Avoid**:
- ❌ Hardcoded configuration in code
- ❌ Different behavior based on hostname detection
- ❌ Secrets in source control
- ❌ Missing validation
- ❌ Undocumented environment variables

### 7. Database Configuration

**Connection Configuration**:
```typescript
// TBD: Document database connection settings
// - Connection pool size
// - Connection timeout
// - Query timeout
// - Statement timeout
```

**RLS Configuration**:
```sql
-- TBD: Document RLS configuration
-- - Enable RLS on all tables
-- - Policy definitions
-- - Performance considerations
```

### 8. Rate Limiting Configuration

**Rate Limit Tiers**:

| Feature | Requests per Minute | Burst Allowance |
|---------|-------------------|-----------------|
| Authentication | 10 | 5 |
| AI Chat | 20 | 0 |
| API Endpoints | 60 | 10 |
| Search | 30 | 5 |

**Configuration**:
```typescript
// TBD: Document rate limit configuration
// - Where rate limits are defined
// - How to adjust rate limits
// - How rate limits are enforced
```

### 9. Logging Configuration

**Log Levels**:
- [ ] ERROR - Production
- [ ] WARN - Production
- [ ] INFO - Staging and Production
- [ ] DEBUG - Development only

**Log Destinations**:
- [ ] Development: Console
- [ ] Production: Supabase Logs or CloudWatch

### 10. Performance Configuration

**Frontend**:
```typescript
// TBD: Document performance settings
// - Virtual scroll buffer size
// - Lazy load thresholds
// - Cache TTL
// - Prefetch settings
```

**Backend**:
```typescript
// TBD: Document backend performance settings
// - Edge function timeout
// - Database query timeout
// - Connection pool size
// - Memory limits
```

---

## Configuration Checklist

### Development Environment
- [ ] Copy `.env.example` to `.env`
- [ ] Fill in required Supabase variables
- [ ] (Optional) Add AI API keys for chat testing
- [ ] Verify configuration with `npm run dev`

### Staging Environment
- [ ] Set all environment variables in deployment platform
- [ ] Use staging Supabase project
- [ ] Verify configuration
- [ ] Test with production-like data

### Production Environment
- [ ] Set all environment variables in deployment platform
- [ ] Use production Supabase project
- [ ] Rotate all secrets
- [ ] Enable monitoring
- [ ] Verify configuration
- [ ] Document configuration in secure location

---

## Troubleshooting

### "Supabase client not initialized"
- Check `VITE_SUPABASE_URL` is set
- Check `VITE_SUPABASE_ANON_KEY` is set
- Verify variables are prefixed with `VITE_`

### "AI chat not working"
- Check `OPENAI_API_KEY` is set in Edge Function secrets
- Verify API key is valid
- Check OpenAI API status

### "Rate limit too restrictive"
- Review rate limit settings
- Consider adjusting per feature
- Check for abuse before loosening limits

---

## Next Steps

1. **Audit All Variables**: List all environment variables in use
2. **Document Each Variable**: Complete variable reference
3. **Create Validation**: Implement configuration validation
4. **Test Environments**: Verify all environments configured correctly
5. **Document Secrets**: Secure secrets documentation
6. **Review Quarterly**: Update configuration documentation

---

## Related Documentation

- [Deployment Guide](DEPLOYMENT.md)
- [Security Documentation](SECURITY.md)
- [Development Guide](../DEVELOPMENT.md)
- [Runbook](RUNBOOK.md) - Not Started

---

**⚠️ HIGH PRIORITY**: Configuration documentation critical for reliable deployments.
