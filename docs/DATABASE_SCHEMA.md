# Database Schema Documentation

**Version**: 1.0.0 · **Last Updated**: 2026-03-08 · **Owner**: Backend / DevOps Lead

This document provides the complete database schema for the Tessa AI Platform, derived from `supabase/migrations/`. It covers all tables, column definitions, RLS policies, indexes, triggers, and migration procedures.

---

## Table of Contents

1. [Database Overview](#1-database-overview)
2. [Entity Relationship Diagram](#2-entity-relationship-diagram)
3. [Core Tables](#3-core-tables)
4. [Security Tables](#4-security-tables)
5. [Feature Tables](#5-feature-tables)
6. [Enums and Custom Types](#6-enums-and-custom-types)
7. [Functions and Triggers](#7-functions-and-triggers)
8. [Row Level Security (RLS) Policy Matrix](#8-row-level-security-rls-policy-matrix)
9. [Index Catalogue](#9-index-catalogue)
10. [Migration Workflow](#10-migration-workflow)

---

## 1. Database Overview

| Property | Value |
|---|---|
| Engine | PostgreSQL 15 (Supabase-managed) |
| Auth integration | Supabase Auth (`auth.users`) |
| RLS | Enabled on **all** user-facing tables |
| Migration tooling | Supabase CLI (`supabase migration new`) |
| Migration directory | `supabase/migrations/` |
| Naming convention | `YYYYMMDDHHMMSS_<uuid>.sql` (auto-generated) |
| Backup | Supabase automated daily backups (Point-in-Time Recovery on Pro plan) |

---

## 2. Entity Relationship Diagram

```mermaid
erDiagram
    auth_users ||--o{ user_profiles : "1:1"
    auth_users ||--o{ user_roles : "1:N"
    auth_users ||--o{ chats : "1:N"
    auth_users ||--o{ messages : "1:N"
    auth_users ||--o{ knowledge_base : "1:N"
    auth_users ||--o{ notifications : "1:N"
    auth_users ||--o{ filter_presets : "1:N"
    auth_users ||--o{ usage_tracking : "1:N"
    auth_users ||--o{ profile_access_logs : "1:N"
    auth_users ||--o{ user_goals : "1:N"

    chats ||--o{ messages : "1:N"

    auth_users {
        uuid id PK
        text email
    }
    user_profiles {
        uuid id PK_FK
        text email
        text full_name
        text username UK
        text avatar_url
        text bio
        timestamptz created_at
        timestamptz updated_at
    }
    user_roles {
        uuid id PK
        uuid user_id FK
        app_role role
        timestamptz created_at
    }
    chats {
        uuid id PK
        uuid user_id FK
        text title
        int order_index
        timestamptz deleted_at
        timestamptz created_at
        timestamptz updated_at
    }
    messages {
        uuid id PK
        uuid chat_id FK
        uuid user_id FK
        text role
        text content
        timestamptz created_at
    }
    knowledge_base {
        uuid id PK
        uuid user_id FK
        text title
        text content
        text category
        text[] tags
        text source_url
        bool is_favorite
        int version
        timestamptz deleted_at
        timestamptz created_at
        timestamptz updated_at
    }
    notifications {
        uuid id PK
        uuid user_id FK
        text title
        text message
        notification_type type
        notification_category category
        bool is_read
        timestamptz read_at
        bool is_archived
        text action_url
        jsonb metadata
        timestamptz expires_at
        timestamptz created_at
    }
    filter_presets {
        uuid id PK
        uuid user_id FK
        text name
        jsonb filters
        bool is_default
        int order_index
        timestamptz created_at
        timestamptz updated_at
    }
    failed_login_attempts {
        uuid id PK
        text email
        text ip_address
        text user_agent
        text country
        text city
        timestamptz attempted_at
    }
    blocked_ips {
        uuid id PK
        text ip_address
        text reason
        timestamptz blocked_until
        bool permanent
        timestamptz created_at
    }
    security_alerts {
        uuid id PK
        text alert_type
        text severity
        text ip_address
        uuid user_id FK
        jsonb event_data
        timestamptz triggered_at
    }
    usage_tracking {
        uuid id PK
        uuid user_id FK
        text action_type
        jsonb metadata
        timestamptz created_at
    }
    profile_access_logs {
        uuid id PK
        uuid user_id FK
        text resource_id
        text action
        text ip_address
        jsonb metadata
        timestamptz created_at
    }
    user_goals {
        uuid id PK
        uuid user_id FK
        text title
        int target_value
        int current_value
        text goal_type
        text period
        timestamptz created_at
        timestamptz updated_at
    }
```

---

## 3. Core Tables

### 3.1 `user_profiles`

Stores extended profile data for each authenticated user. Created automatically by the `handle_new_user` trigger.

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| `id` | `uuid` | NO | — | PK; references `auth.users(id) ON DELETE CASCADE` |
| `email` | `text` | YES | — | Copied from auth.users |
| `full_name` | `text` | YES | — | User's display name |
| `username` | `text` | YES | — | Unique handle |
| `avatar_url` | `text` | YES | — | Profile image URL |
| `bio` | `text` | YES | — | Short user biography |
| `created_at` | `timestamptz` | NO | `now()` | Auto-set on insert |
| `updated_at` | `timestamptz` | NO | `now()` | Auto-updated by trigger |

**Indexes**: Primary key on `id`; unique index on `username`.

---

### 3.2 `user_roles`

Assigns application-level roles to users. Used by `has_role()` for policy checks.

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| `id` | `uuid` | NO | `gen_random_uuid()` | PK |
| `user_id` | `uuid` | NO | — | FK → `auth.users(id) ON DELETE CASCADE` |
| `role` | `app_role` | NO | — | ENUM: `admin`, `moderator`, `user` |
| `created_at` | `timestamptz` | NO | `now()` | |

**Constraint**: `UNIQUE (user_id, role)`.

---

### 3.3 `chats`

Represents an AI chat session. Supports soft-delete via `deleted_at`.

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| `id` | `uuid` | NO | `gen_random_uuid()` | PK |
| `user_id` | `uuid` | NO | — | FK → `auth.users(id) ON DELETE CASCADE` |
| `title` | `text` | NO | `'New Chat'` | Display title |
| `order_index` | `integer` | YES | `0` | Manual sort order |
| `deleted_at` | `timestamptz` | YES | `NULL` | Soft-delete timestamp |
| `created_at` | `timestamptz` | NO | `now()` | |
| `updated_at` | `timestamptz` | NO | `now()` | Auto-updated by trigger |

---

### 3.4 `messages`

Individual messages within a chat session.

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| `id` | `uuid` | NO | `gen_random_uuid()` | PK |
| `chat_id` | `uuid` | NO | — | FK → `chats(id) ON DELETE CASCADE` |
| `user_id` | `uuid` | NO | — | FK → `auth.users(id) ON DELETE CASCADE` |
| `role` | `text` | NO | — | CHECK: `'user'` or `'assistant'` |
| `content` | `text` | NO | — | Message body |
| `created_at` | `timestamptz` | NO | `now()` | |

---

### 3.5 `knowledge_base`

User's knowledge items — notes, documents, web pages. Supports soft-delete and optimistic-locking via `version`.

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| `id` | `uuid` | NO | `gen_random_uuid()` | PK |
| `user_id` | `uuid` | NO | — | FK → `auth.users(id) ON DELETE CASCADE` |
| `title` | `text` | NO | — | Item title |
| `content` | `text` | NO | `''` | Item body |
| `category` | `text` | YES | `'general'` | User-defined category |
| `tags` | `text[]` | YES | `'{}'` | Array of tag strings |
| `source_url` | `text` | YES | — | Original source link |
| `is_favorite` | `boolean` | YES | `false` | Starred flag |
| `version` | `integer` | YES | `1` | Incremented by trigger on update |
| `deleted_at` | `timestamptz` | YES | `NULL` | Soft-delete timestamp |
| `created_at` | `timestamptz` | NO | `now()` | |
| `updated_at` | `timestamptz` | NO | `now()` | Auto-updated by trigger |

---

### 3.6 `notifications`

System and user-generated notifications.

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| `id` | `uuid` | NO | `gen_random_uuid()` | PK |
| `user_id` | `uuid` | NO | — | FK → `auth.users(id) ON DELETE CASCADE` |
| `title` | `text` | NO | — | Notification headline |
| `message` | `text` | NO | — | Notification body |
| `type` | `notification_type` | YES | `'info'` | ENUM value |
| `category` | `notification_category` | YES | `'general'` | ENUM value |
| `is_read` | `boolean` | YES | `false` | Read status |
| `read_at` | `timestamptz` | YES | — | When marked read |
| `is_archived` | `boolean` | YES | `false` | Archive flag |
| `archived_at` | `timestamptz` | YES | — | When archived |
| `action_url` | `text` | YES | — | Deep-link for CTA |
| `action_label` | `text` | YES | — | CTA button label |
| `metadata` | `jsonb` | YES | `'{}'` | Arbitrary extra data |
| `expires_at` | `timestamptz` | YES | — | Auto-expire timestamp |
| `created_at` | `timestamptz` | NO | `now()` | |

---

## 4. Security Tables

### 4.1 `failed_login_attempts`

Tracks failed authentication attempts for rate limiting and lockout. Admin-only access.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | PK |
| `email` | `text` | Attempted email address |
| `ip_address` | `text` | Client IP |
| `user_agent` | `text` | Browser user agent |
| `country` / `city` / `region` / `country_code` | `text` | Geo-lookup fields |
| `attempted_at` | `timestamptz` | When the attempt occurred |

**Access**: Admin role only. Anonymous access blocked by RLS.

---

### 4.2 `blocked_ips`

IP addresses blocked from accessing the platform.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | PK |
| `ip_address` | `text` | Blocked IP |
| `reason` | `text` | Human-readable reason |
| `blocked_until` | `timestamptz` | Temporary block expiry (NULL = permanent) |
| `permanent` | `boolean` | Permanent block flag |
| `blocked_by_user_id` | `uuid` | FK → auth.users |
| `created_at` | `timestamptz` | |

---

### 4.3 `rate_limit_config`

Configurable rate-limit thresholds. Default row: `failed_login` (5 attempts / 15 min / 30 min block).

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | PK |
| `config_key` | `text` | UNIQUE identifier (e.g. `'failed_login'`) |
| `max_attempts` | `integer` | Default: 5 |
| `time_window_minutes` | `integer` | Default: 15 |
| `block_duration_minutes` | `integer` | Default: 30 |
| `enabled` | `boolean` | Default: true |
| `updated_at` | `timestamptz` | |
| `updated_by` | `uuid` | FK → auth.users |

---

### 4.4 `security_alerts`

Audit log of security events (brute force, unusual access, etc.).

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | PK |
| `alert_type` | `text` | E.g. `'brute_force'`, `'unusual_access'` |
| `severity` | `text` | CHECK: `low`, `medium`, `high`, `critical` |
| `ip_address` | `text` | |
| `user_id` | `uuid` | FK → auth.users (nullable) |
| `event_data` | `jsonb` | Arbitrary event payload |
| `triggered_at` | `timestamptz` | |
| `email_sent` | `boolean` | Alert email dispatched |
| `email_sent_at` | `timestamptz` | |

---

### 4.5 `profile_access_logs`

Audit trail for profile read/write operations.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | PK |
| `user_id` | `uuid` | FK → auth.users — the actor |
| `resource_id` | `text` | Target resource identifier |
| `action` | `text` | E.g. `'view'`, `'update'`, `'delete'` |
| `ip_address` | `text` | |
| `metadata` | `jsonb` | |
| `created_at` | `timestamptz` | |

---

## 5. Feature Tables

### 5.1 `filter_presets`

Saved search/filter configurations per user.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | PK |
| `user_id` | `uuid` | FK → auth.users |
| `name` | `text` | Preset display name |
| `filters` | `jsonb` | Filter criteria object |
| `is_default` | `boolean` | Default: false |
| `order_index` | `integer` | Sort order |
| `created_at` / `updated_at` | `timestamptz` | |

---

### 5.2 `usage_tracking`

Tracks user actions for analytics.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | PK |
| `user_id` | `uuid` | FK → auth.users |
| `action_type` | `text` | E.g. `'chat_message'`, `'knowledge_create'` |
| `metadata` | `jsonb` | Additional context |
| `created_at` | `timestamptz` | |

---

### 5.3 `user_goals`

User-defined progress goals (e.g. monthly import target).

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | PK |
| `user_id` | `uuid` | FK → auth.users |
| `title` | `text` | Goal label |
| `target_value` | `integer` | Target count |
| `current_value` | `integer` | Default: 0 |
| `goal_type` | `text` | `'imports'`, `'searches'`, `'cortexes'` |
| `period` | `text` | `'daily'`, `'weekly'`, `'monthly'` |
| `created_at` / `updated_at` | `timestamptz` | |

---

## 6. Enums and Custom Types

| Type | Values |
|---|---|
| `app_role` | `admin`, `moderator`, `user` |
| `notification_type` | `info`, `success`, `warning`, `error`, `mention`, `comment`, `share`, `system`, `security`, `update` |
| `notification_category` | `general`, `chat`, `knowledge`, `project`, `design`, `security`, `billing`, `collaboration` |

---

## 7. Functions and Triggers

| Function | Purpose | Security |
|---|---|---|
| `public.handle_new_user()` | Creates `user_profiles` row on `auth.users` INSERT | `SECURITY DEFINER`, `search_path = public` |
| `public.update_updated_at()` | Sets `updated_at = now()` on UPDATE | `SECURITY DEFINER`, `search_path = public` |
| `public.increment_version()` | Bumps `version` column on `knowledge_base` / `chats` UPDATE | `SECURITY DEFINER`, `search_path = public` |
| `public.has_role(uuid, app_role)` | Returns `true` if user has the specified role | `SECURITY DEFINER STABLE`, `search_path = public` |
| `public.increment_preset_usage(uuid)` | Increments `usage_count` + sets `last_used_at` for a preset | `SECURITY DEFINER`, `search_path = public` |
| `public.mark_notification_read(uuid)` | Marks one notification read | `SECURITY DEFINER`, `search_path = public` |
| `public.mark_all_notifications_read()` | Marks all unread notifications for current user | `SECURITY DEFINER`, `search_path = public` |
| `public.get_unread_notification_count()` | Returns integer count | `SECURITY DEFINER`, `search_path = public` |
| `public.create_notification(...)` | Helper used by triggers and edge functions | `SECURITY DEFINER`, `search_path = public` |
| `public.log_profile_access(...)` | Inserts a `profile_access_logs` row | `SECURITY DEFINER`, `search_path = public` |

**Security note**: All functions use `SECURITY DEFINER SET search_path = public` to prevent search-path injection attacks.

---

## 8. Row Level Security (RLS) Policy Matrix

| Table | RLS Enabled | SELECT | INSERT | UPDATE | DELETE |
|---|---|---|---|---|---|
| `user_profiles` | ✅ | own row | own row | own row | own row |
| `user_roles` | ✅ | own rows; admin: all | admin only | admin only | admin only |
| `chats` | ✅ | own rows | own rows | own rows | own rows |
| `messages` | ✅ | own rows | own rows | own rows | own rows |
| `knowledge_base` | ✅ | own rows | own rows | own rows | own rows |
| `notifications` | ✅ | own rows | service role | own rows | own rows |
| `filter_presets` | ✅ | own rows | own rows | own rows | own rows |
| `usage_tracking` | ✅ | own rows; admin: all | own rows | — | — |
| `profile_access_logs` | ✅ | own rows | own rows | — | — |
| `user_goals` | ✅ | own rows | own rows | own rows | own rows |
| `failed_login_attempts` | ✅ | admin only | admin only | — | admin only |
| `blocked_ips` | ✅ | admin only | admin only | admin only | admin only |
| `rate_limit_config` | ✅ | authenticated | admin only | admin only | admin only |
| `security_alerts` | ✅ | admin only | admin only | admin only | admin only |

**Rule**: Anonymous (unauthenticated) users are denied access to all tables via `TO authenticated` scoping.

---

## 9. Index Catalogue

| Table | Index Name | Columns | Purpose |
|---|---|---|---|
| `chats` | `idx_chats_user_id` | `(user_id)` | Filter chats by owner |
| `chats` | `idx_chats_created_at` | `(created_at DESC)` | Sort by newest |
| `chats` | `idx_chats_deleted` | `(user_id, deleted_at)` | Efficient soft-delete filtering |
| `messages` | `idx_messages_chat_id` | `(chat_id)` | Join from chats |
| `messages` | `idx_messages_created_at` | `(created_at)` | Chronological ordering |
| `knowledge_base` | `idx_knowledge_user_id` | `(user_id)` | Filter by owner |
| `knowledge_base` | `idx_knowledge_created_at` | `(created_at DESC)` | Default sort |
| `knowledge_base` | `idx_knowledge_deleted` | `(user_id, deleted_at)` | Soft-delete filtering |
| `filter_presets` | `idx_filter_presets_user_scope` | `(user_id, scope)` | Preset lookup |
| `filter_presets` | `idx_filter_presets_sort` | `(user_id, scope, sort_order)` | Ordered presets |
| `filter_presets` | `unique_default_per_scope` | `(user_id, scope) WHERE is_default` | Enforce single default |
| `notifications` | `idx_notifications_user_id` | `(user_id)` | Filter by owner |
| `notifications` | `idx_notifications_is_read` | `(user_id, is_read)` | Unread badge count |
| `notifications` | `idx_notifications_created_at` | `(user_id, created_at DESC)` | Sort newest first |
| `profile_access_logs` | `idx_profile_access_logs_profile` | `(accessed_profile_id, created_at DESC)` | Profile audit trail |
| `profile_access_logs` | `idx_profile_access_logs_accessor` | `(accessor_user_id, created_at DESC)` | Actor audit trail |

---

## 10. Migration Workflow

### Creating a New Migration

```bash
# Generate a new migration file (timestamped UUID filename)
supabase migration new <descriptive_name>

# Edit the generated file in supabase/migrations/
# Apply locally
supabase db reset

# Apply to remote project
supabase db push --project-ref <project-id>
```

### Rules

1. **Never modify an existing migration file** after it has been committed. Create a new migration instead.
2. All new user-facing tables **must** have `ALTER TABLE … ENABLE ROW LEVEL SECURITY` and at least one policy.
3. All `SECURITY DEFINER` functions **must** set `search_path = public`.
4. Test migrations in a local Supabase environment (`supabase start`) before pushing.

### Zero-Downtime Patterns

| Scenario | Approach |
|---|---|
| Add a nullable column | Safe — no downtime. |
| Add a NOT NULL column | Add as nullable, backfill, then add NOT NULL constraint in a second migration. |
| Rename a column | Add new column, backfill, update code, drop old column in a separate release. |
| Drop a column | Deprecate in code first, then drop in a later migration. |
| Add an index | Use `CREATE INDEX CONCURRENTLY` to avoid table lock. |

### Rollback

Supabase does not auto-rollback migrations. Write an explicit rollback migration if needed:

```sql
-- Example rollback for a column addition
ALTER TABLE knowledge_base DROP COLUMN IF EXISTS new_column;
```

---

## Related Documentation

- [Architecture Overview](ARCHITECTURE.md)
- [Security Documentation](SECURITY.md)
- [Deployment Guide](DEPLOYMENT.md)
- [Configuration Management](CONFIGURATION_MANAGEMENT.md)
