# Stores Table - API Key Encryption Security

## Overview
The `stores` table contains encrypted third-party e-commerce platform API keys in the `api_key_encrypted` column. This document outlines the security measures implemented to protect these sensitive credentials.

## Encryption Implementation

### Algorithm
- **Encryption Standard**: AES-256-GCM (Galois/Counter Mode)
- **Key Size**: 256-bit encryption keys
- **Authentication**: AEAD (Authenticated Encryption with Associated Data) provides integrity verification

### Key Management
- **Storage**: Encryption keys are stored in Supabase Vault or secure environment secrets (not in database)
- **Access**: Keys are only accessible to authorized backend processes
- **Rotation**: Recommended 90-day key rotation schedule

## Row-Level Security (RLS)

The following RLS policies protect access to encrypted API keys:

```sql
-- Users can only view their own stores
CREATE POLICY "Users can view their own stores"
ON stores FOR SELECT USING (auth.uid() = user_id);

-- Users can only update their own stores
CREATE POLICY "Users can update their own stores"
ON stores FOR UPDATE USING (auth.uid() = user_id);

-- Users can only delete their own stores
CREATE POLICY "Users can delete their own stores"
ON stores FOR DELETE USING (auth.uid() = user_id);

-- Users can only insert stores for themselves
CREATE POLICY "Users can create their own stores"
ON stores FOR INSERT WITH CHECK (auth.uid() = user_id);
```

## Security Measures

1. **Defense in Depth**
   - Encryption at rest (database level)
   - Encryption in transit (TLS/SSL)
   - RLS policies prevent unauthorized access
   - API keys never exposed in client-side code

2. **Access Control**
   - Users can only access their own store credentials
   - No cross-user data access possible via RLS
   - Server-side validation for all operations

3. **Audit Trail**
   - `created_at` and `updated_at` timestamps track changes
   - Consider implementing audit logging for API key access patterns

## Risk Assessment

**Threat Model:**
- ✅ Protected against: Unauthorized user access via RLS
- ✅ Protected against: SQL injection via parameterized queries
- ✅ Protected against: Client-side credential exposure
- ⚠️ Requires monitoring: Unusual API key access patterns
- ⚠️ Requires implementation: Key rotation schedule

**Impact of Compromise:**
If an attacker gains access to decrypted API keys, they could:
- Access user's third-party e-commerce platforms
- Perform unauthorized transactions
- Access customer data on external platforms

## Best Practices

1. **Key Rotation**
   - Rotate encryption keys every 90 days
   - Implement automated rotation procedures
   - Re-encrypt existing data with new keys

2. **Monitoring**
   - Log all API key access attempts
   - Alert on unusual access patterns
   - Monitor for failed decryption attempts

3. **Principle of Least Privilege**
   - Only decrypt keys when needed
   - Use short-lived access tokens where possible
   - Minimize key exposure duration

## Implementation Checklist

- [x] AES-256 encryption implementation
- [x] RLS policies for access control
- [x] Secure key storage (Supabase Vault/secrets)
- [ ] Key rotation schedule implementation
- [ ] Access logging and monitoring
- [ ] Anomaly detection for unusual patterns
- [ ] Regular security audits

## Contact

For security concerns or questions about the encryption implementation, contact the security team.

**Last Updated**: 2025-11-25
