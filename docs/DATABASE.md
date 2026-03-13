# Database Schema — Cortex Second Brain

Cortex Second Brain uses **Supabase (PostgreSQL)**. All tables enforce **Row Level Security (RLS)**; users can only access their own rows unless granted admin privileges.

---

## Table of Contents

1. [knowledge_base](#knowledge_base)
2. [chats](#chats)
3. [messages](#messages)
4. [user_profiles](#user_profiles)
5. [user_roles](#user_roles)
6. [notifications](#notifications)
7. [filter_presets](#filter_presets)
8. [profile_access_logs](#profile_access_logs)
9. [profiles](#profiles)
10. [RLS Policies Summary](#rls-policies-summary)
11. [Functions & RPCs](#functions--rpcs)
12. [Entity Relationship Diagram](#entity-relationship-diagram)

---

## `knowledge_base`

The core table. Stores all user knowledge: notes, documents, web pages, and imported files.

| Column | Type | Nullable | Default | Description |
|---|---|---|---|---|
| `id` | `uuid` | No | `gen_random_uuid()` | Primary key |
| `user_id` | `uuid` | No | — | FK → `auth.users.id` |
| `title` | `text` | No | — | Entry title |
| `content` | `text` | Yes | — | Full text content |
| `type` | `text` | No | — | Entry type: `note`, `document`, `webpage`, `file` |
| `source_url` | `text` | Yes | — | Original URL (for web imports) |
| `tags` | `text[]` | Yes | `'{}'` | Array of string tags |
| `category` | `text` | Yes | — | User-defined category |
| `is_favorite` | `boolean` | No | `false` | Starred/favorited by user |
| `version` | `integer` | No | `1` | Optimistic concurrency version |
| `order_index` | `integer` | Yes | — | Manual sort order |
| `created_at` | `timestamptz` | No | `now()` | Creation timestamp |
| `updated_at` | `timestamptz` | No | `now()` | Last update timestamp |
| `deleted_at` | `timestamptz` | Yes | `null` | Soft-delete timestamp |

**Indexes**: `user_id`, `created_at DESC`, `deleted_at` (for soft-delete filtering), full-text search on `title || content`.

---

## `chats`

Conversation sessions for TESSA AI chat.

| Column | Type | Nullable | Default | Description |
|---|---|---|---|---|
| `id` | `uuid` | No | `gen_random_uuid()` | Primary key |
| `user_id` | `uuid` | No | — | FK → `auth.users.id` |
| `title` | `text` | No | — | Chat session title |
| `order_index` | `integer` | Yes | — | Manual sort order |
| `created_at` | `timestamptz` | No | `now()` | Creation timestamp |
| `updated_at` | `timestamptz` | No | `now()` | Last update timestamp |
| `deleted_at` | `timestamptz` | Yes | `null` | Soft-delete timestamp |

---

## `messages`

Individual messages within a chat session.

| Column | Type | Nullable | Default | Description |
|---|---|---|---|---|
| `id` | `uuid` | No | `gen_random_uuid()` | Primary key |
| `chat_id` | `uuid` | No | — | FK → `chats.id` |
| `user_id` | `uuid` | No | — | FK → `auth.users.id` |
| `role` | `text` | No | — | `user`, `assistant`, or `system` |
| `content` | `text` | No | — | Message text |
| `created_at` | `timestamptz` | No | `now()` | Creation timestamp |

**Index**: `chat_id, created_at ASC` for chronological retrieval.

---

## `user_profiles`

Extended user profile information beyond what Supabase Auth stores.

| Column | Type | Nullable | Default | Description |
|---|---|---|---|---|
| `id` | `uuid` | No | — | PK + FK → `auth.users.id` |
| `username` | `text` | Yes | — | Unique username |
| `full_name` | `text` | Yes | — | Display name |
| `email` | `text` | Yes | — | Email (mirrors auth.users) |
| `bio` | `text` | Yes | — | User biography |
| `avatar_url` | `text` | Yes | — | Profile picture URL |
| `created_at` | `timestamptz` | No | `now()` | Profile created timestamp |
| `updated_at` | `timestamptz` | No | `now()` | Last updated timestamp |

---

## `user_roles`

Role-based access control. A user can hold multiple roles.

| Column | Type | Nullable | Default | Description |
|---|---|---|---|---|
| `id` | `uuid` | No | `gen_random_uuid()` | Primary key |
| `user_id` | `uuid` | No | — | FK → `auth.users.id` |
| `role` | `text` | No | — | `admin`, `moderator`, or `user` |

**Unique constraint**: `(user_id, role)`

Used by the `has_role(role text)` RPC to gate admin functionality.

---

## `notifications`

In-app notification system.

| Column | Type | Nullable | Default | Description |
|---|---|---|---|---|
| `id` | `uuid` | No | `gen_random_uuid()` | Primary key |
| `user_id` | `uuid` | No | — | FK → `auth.users.id` |
| `title` | `text` | No | — | Notification title |
| `message` | `text` | No | — | Notification body |
| `type` | `text` | No | — | `info`, `warning`, `error`, `success` |
| `category` | `text` | Yes | — | e.g., `sync`, `import`, `security` |
| `is_read` | `boolean` | No | `false` | Read status |
| `read_at` | `timestamptz` | Yes | — | When marked as read |
| `action_url` | `text` | Yes | — | Deep-link URL for the notification |
| `expires_at` | `timestamptz` | Yes | — | Optional expiry |
| `metadata` | `jsonb` | Yes | `'{}'` | Arbitrary extra data |
| `created_at` | `timestamptz` | No | `now()` | Creation timestamp |

---

## `filter_presets`

Saved search/filter configurations per user.

| Column | Type | Nullable | Default | Description |
|---|---|---|---|---|
| `id` | `uuid` | No | `gen_random_uuid()` | Primary key |
| `user_id` | `uuid` | No | — | FK → `auth.users.id` |
| `name` | `text` | No | — | Preset display name |
| `description` | `text` | Yes | — | Optional description |
| `filters` | `jsonb` | No | — | Serialized filter state |
| `scope` | `text` | No | — | `knowledge`, `chats`, `global` |
| `is_default` | `boolean` | No | `false` | Whether applied by default |
| `icon` | `text` | Yes | — | Icon identifier |
| `color` | `text` | Yes | — | Hex or Tailwind colour class |
| `created_at` | `timestamptz` | No | `now()` | Creation timestamp |
| `updated_at` | `timestamptz` | No | `now()` | Last updated timestamp |

---

## `profile_access_logs`

Audit log for profile and sensitive data access.

| Column | Type | Nullable | Default | Description |
|---|---|---|---|---|
| `id` | `uuid` | No | `gen_random_uuid()` | Primary key |
| `user_id` | `uuid` | No | — | FK → `auth.users.id` |
| `action` | `text` | No | — | e.g., `login`, `profile_view`, `export` |
| `metadata` | `jsonb` | Yes | `'{}'` | IP, user-agent, etc. |
| `created_at` | `timestamptz` | No | `now()` | Event timestamp |

---

## `profiles`

Mirror table created by an early migration. Stores basic profile data alongside `user_profiles`.

| Column | Type | Nullable | Description |
|---|---|---|---|
| `id` | `uuid` | No | PK |
| `user_id` | `uuid` | No | FK → `auth.users.id` |
| `username` | `text` | Yes | Username |
| `full_name` | `text` | Yes | Display name |
| `avatar_url` | `text` | Yes | Avatar URL |
| `created_at` | `timestamptz` | No | Creation timestamp |
| `updated_at` | `timestamptz` | No | Last update timestamp |

---

## RLS Policies Summary

| Table | Policy | Condition |
|---|---|---|
| `knowledge_base` | SELECT / INSERT / UPDATE / DELETE | `auth.uid() = user_id` AND `deleted_at IS NULL` |
| `chats` | SELECT / INSERT / UPDATE / DELETE | `auth.uid() = user_id` AND `deleted_at IS NULL` |
| `messages` | SELECT / INSERT | `auth.uid() = user_id` |
| `user_profiles` | SELECT | Authenticated users can view all |
| `user_profiles` | UPDATE | `auth.uid() = id` |
| `user_roles` | SELECT | `auth.uid() = user_id` OR `has_role('admin')` |
| `notifications` | ALL | `auth.uid() = user_id` |
| `filter_presets` | ALL | `auth.uid() = user_id` |
| `profile_access_logs` | INSERT | `auth.uid() = user_id` |
| `profile_access_logs` | SELECT | `auth.uid() = user_id` OR `has_role('admin')` |

---

## Functions & RPCs

### `has_role(role text) → boolean`

Returns `true` if the authenticated user has the specified role.

```sql
SELECT has_role('admin');
```

Used by RLS policies and Edge Functions to gate admin-only functionality.

### `handle_new_user()` (trigger)

Automatically inserts a row into `user_profiles` (and `profiles`) when a new user is created in `auth.users`.

---

## Entity Relationship Diagram

```mermaid
erDiagram
    AUTH_USERS {
        uuid id PK
        text email
    }
    USER_PROFILES {
        uuid id PK_FK
        text username
        text full_name
        text email
        text bio
        text avatar_url
    }
    USER_ROLES {
        uuid id PK
        uuid user_id FK
        text role
    }
    KNOWLEDGE_BASE {
        uuid id PK
        uuid user_id FK
        text title
        text content
        text type
        text[] tags
        boolean is_favorite
        integer version
        timestamptz deleted_at
    }
    CHATS {
        uuid id PK
        uuid user_id FK
        text title
        timestamptz deleted_at
    }
    MESSAGES {
        uuid id PK
        uuid chat_id FK
        uuid user_id FK
        text role
        text content
    }
    NOTIFICATIONS {
        uuid id PK
        uuid user_id FK
        text title
        text type
        boolean is_read
        jsonb metadata
    }
    FILTER_PRESETS {
        uuid id PK
        uuid user_id FK
        text name
        jsonb filters
        text scope
    }
    PROFILE_ACCESS_LOGS {
        uuid id PK
        uuid user_id FK
        text action
        jsonb metadata
    }

    AUTH_USERS ||--o{ USER_PROFILES : "has"
    AUTH_USERS ||--o{ USER_ROLES : "has"
    AUTH_USERS ||--o{ KNOWLEDGE_BASE : "owns"
    AUTH_USERS ||--o{ CHATS : "owns"
    AUTH_USERS ||--o{ MESSAGES : "sends"
    AUTH_USERS ||--o{ NOTIFICATIONS : "receives"
    AUTH_USERS ||--o{ FILTER_PRESETS : "saves"
    AUTH_USERS ||--o{ PROFILE_ACCESS_LOGS : "generates"
    CHATS ||--o{ MESSAGES : "contains"
```
