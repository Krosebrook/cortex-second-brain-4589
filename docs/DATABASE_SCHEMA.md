# Database Schema Documentation

**Status**: 🔴 Not Started  
**Priority**: P0 - Production Blocker  
**Owner**: TBD  
**Last Updated**: 2026-01-21  
**Estimated Effort**: 8 hours

---

## Purpose

This document should provide comprehensive documentation of the Tessa AI Platform database schema, including:

- All database tables with column definitions
- Relationships and foreign keys
- Indexes and performance considerations
- Row Level Security (RLS) policies per table
- Migration strategy and versioning
- Data model diagrams
- Constraints and validation rules

## Why This Is Critical

Without database schema documentation:
- Developers cannot safely modify the database
- Migration risks increase significantly
- Onboarding new developers takes 3-5x longer
- Data integrity issues may go undetected
- RLS policy gaps could cause security vulnerabilities

## Required Content

### 1. Database Overview
- [ ] Database engine and version
- [ ] Connection pool configuration
- [ ] Database sizing and resource limits
- [ ] Backup and recovery strategy

### 2. Table Catalog
For each table, document:
- [ ] Table name and purpose
- [ ] Column definitions (name, type, nullable, default)
- [ ] Primary keys
- [ ] Foreign keys and relationships
- [ ] Indexes (and rationale for each)
- [ ] RLS policies enabled
- [ ] Triggers and stored procedures
- [ ] Approximate row counts

**Known Tables** (from code analysis):
- `users` / `profiles`
- `chats`
- `messages`
- `knowledge_items`
- `tags`
- `knowledge_tags` (junction table)
- `search_presets`
- `notifications`
- `rate_limits`
- `failed_login_attempts`
- `blocked_ips`
- `action_history`
- Additional tables TBD

### 3. Entity Relationship Diagrams
- [ ] High-level ER diagram (all tables)
- [ ] Domain-specific diagrams (chat, knowledge, auth, etc.)
- [ ] Mermaid.js diagram source code

### 4. Row Level Security (RLS)
For each table, document:
- [ ] RLS enabled: yes/no
- [ ] SELECT policy
- [ ] INSERT policy
- [ ] UPDATE policy
- [ ] DELETE policy
- [ ] Policy rationale and security implications

### 5. Migration Management
- [ ] Migration file naming convention
- [ ] Migration workflow (create, test, deploy)
- [ ] Rollback procedures
- [ ] Zero-downtime migration patterns
- [ ] Migration testing checklist

### 6. Performance Considerations
- [ ] Index strategy and rationale
- [ ] Query performance benchmarks
- [ ] Known slow queries and optimizations
- [ ] Connection pool tuning
- [ ] Cache strategies

---

## Next Steps

1. **Analyze Supabase Migrations**: Review `supabase/migrations/` folder
2. **Extract Schema**: Use `pg_dump` or Supabase dashboard to extract schema
3. **Generate ER Diagrams**: Use tool like dbdiagram.io or Mermaid.js
4. **Document RLS Policies**: Review and document each policy
5. **Create Migration Guide**: Document migration workflow
6. **Validate**: Review with team for accuracy

---

## Related Documentation

- [Migration Guide](DATABASE_MIGRATIONS.md) - Not Started
- [Data Migration Guide](DATA_MIGRATION_GUIDE.md) - Not Started
- [Backend Architecture](ARCHITECTURE.md)
- [Security Documentation](SECURITY.md)

---

**⚠️ PRODUCTION BLOCKER**: This documentation must be completed before production deployment.
