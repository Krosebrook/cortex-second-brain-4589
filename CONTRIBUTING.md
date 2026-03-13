# Contributing to Cortex Second Brain

Thank you for your interest in contributing! This guide covers everything you need to get started.

---

## Table of Contents

1. [Code of Conduct](#code-of-conduct)
2. [Getting Started](#getting-started)
3. [Development Workflow](#development-workflow)
4. [Project Structure](#project-structure)
5. [Coding Standards](#coding-standards)
6. [Testing](#testing)
7. [Submitting Changes](#submitting-changes)
8. [Edge Functions](#edge-functions)
9. [Documentation](#documentation)

---

## Code of Conduct

Please read and follow our [Code of Conduct](CODE_OF_CONDUCT.md). We are committed to maintaining a welcoming and inclusive community.

---

## Getting Started

### Prerequisites

- **Node.js** ≥ 18.0.0
- **npm** ≥ 9.0.0
- **Supabase CLI** (`npm install -g supabase`)
- A Supabase project (free tier works for development)
- Git

### Setup

```bash
# 1. Fork and clone the repository
git clone https://github.com/<your-fork>/cortex-second-brain.git
cd cortex-second-brain

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env.local
# Edit .env.local with your Supabase credentials

# 4. Set up local Supabase (optional but recommended)
supabase start
supabase db push

# 5. Start development server
npm run dev
# → http://localhost:8080
```

---

## Development Workflow

### Branch Naming

| Type | Pattern | Example |
|---|---|---|
| Feature | `feature/<short-description>` | `feature/google-drive-import` |
| Bug fix | `fix/<short-description>` | `fix/offline-sync-retry` |
| Chore | `chore/<short-description>` | `chore/upgrade-vite` |
| Documentation | `docs/<short-description>` | `docs/api-reference` |
| Refactor | `refactor/<short-description>` | `refactor/service-layer-types` |

### Before Committing

Run the full validation suite:

```bash
npm run type-check   # TypeScript compiler — must pass
npm run lint         # ESLint — must pass (0 errors)
npm run test         # 206 tests — must all pass
```

All three must pass before opening a pull request.

### Commit Messages

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <short summary>

[optional body]

[optional footer]
```

**Types**: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`, `perf`, `ci`

**Examples**:
```
feat(knowledge): add bulk tag operation for selected entries
fix(auth): prevent duplicate auth state change callbacks
docs(api): add parse-pdf endpoint documentation
chore(deps): upgrade DOMPurify to 3.2.6
```

---

## Project Structure

```
src/
├── components/          # UI components (domain-organised)
│   ├── ui/             # shadcn/ui primitives — generally don't edit
│   └── <domain>/       # Domain-specific components
├── config/
│   └── app-config.ts   # All VITE_ environment variables — add new ones here
├── contexts/           # React context providers
├── hooks/              # Custom React hooks
├── integrations/
│   └── supabase/
│       ├── client.ts   # Supabase client singleton — do not edit
│       └── types.ts    # Auto-generated DB types — do not edit
├── pages/              # Route-level components (one per route)
├── services/           # Data access layer (extend BaseService)
├── types/              # Shared TypeScript interfaces and types
└── utils/              # Shared utility functions
```

---

## Coding Standards

### TypeScript

- **Strict mode is enabled** — no implicit `any`
- Avoid `as any` except in test files; prefer proper generic types
- Use `Database['public']['Tables']['table_name']['Row']` types from `supabase/types.ts` in service files
- Export only what consumers need (avoid barrel re-exports of everything)

### React

- Functional components only (no class components)
- Custom hooks for logic that is reused across 2+ components
- Route-level components in `src/pages/` should be thin orchestrators
- Use TanStack Query for all server state; do not use `useEffect` for data fetching

### Services

All database access must go through a service class:

```typescript
// src/services/my.service.ts
import { BaseService } from './base.service';

export class MyService extends BaseService {
  async getItems(userId: string) {
    const { data, error } = await this.supabase
      .from('my_table')
      .select('*')
      .eq('user_id', userId);

    if (error) this.handleError(error, 'getItems');
    return data ?? [];
  }
}
```

### Error Handling

Use `ApplicationError` with `ErrorCode` for all thrown errors:

```typescript
import { ApplicationError, ErrorCode } from '@/lib/errors';

throw new ApplicationError(ErrorCode.NOT_FOUND, 'Knowledge entry not found');
```

### Environment Variables

Any new environment variable must:
1. Be prefixed with `VITE_` (to be available in the browser)
2. Be added to `src/config/app-config.ts` with a typed default
3. Be added to `.env.example` with a comment explaining its purpose

### Styling

- Tailwind CSS utility classes only — no custom CSS unless unavoidable
- Use `cn()` helper for conditional class merging
- Follow existing shadcn/ui component patterns; don't customise component internals

### Security

- **Always** sanitise user-generated HTML with DOMPurify before rendering
- Never use `innerHTML` with raw user data
- Never commit secrets — use Supabase Edge Function secrets for API keys
- New Edge Functions must validate the Supabase JWT before accessing user data

---

## Testing

### Running Tests

```bash
npm run test              # Run all tests
npm run test:watch        # Watch mode
npm run test:coverage     # Coverage report
npm run test:ui           # Vitest UI
```

### Coverage Thresholds

| Category | Threshold |
|---|---|
| Statements | 70% |
| Branches | 65% |
| Functions | 70% |
| Lines | 70% |

Pull requests that reduce coverage below these thresholds will not be merged.

### Writing Tests

- Tests live alongside source files in `src/__tests__/` or as `*.test.ts` colocated files
- Use Vitest's `describe`/`it`/`expect` API
- Mock Supabase calls — do not make real network requests in unit tests
- `as any` in test files is acceptable for mocking purposes

```typescript
// Example test
import { describe, it, expect, vi } from 'vitest';

describe('KnowledgeService', () => {
  it('returns empty array when no entries found', async () => {
    const mockSupabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ data: null, error: null }),
    };
    // ... test logic
  });
});
```

---

## Submitting Changes

### Pull Request Checklist

Before opening a PR, confirm:

- [ ] `npm run type-check` passes (0 errors)
- [ ] `npm run lint` passes (0 errors)
- [ ] `npm run test` passes (all 206+ tests green)
- [ ] Coverage thresholds not reduced
- [ ] New `VITE_` variables added to `.env.example` and `app-config.ts`
- [ ] New database tables have RLS policies
- [ ] New Edge Functions validate Supabase JWT
- [ ] PR description explains **what** and **why** (not just **how**)

### PR Title Format

Follow the same Conventional Commits format as commit messages:

```
feat(tessa): add streaming response support
fix(import): handle malformed CSV with missing headers
```

### Review Process

1. At least 1 approval required from a maintainer
2. All CI checks must pass
3. No unresolved review comments

---

## Edge Functions

Edge Functions are Deno TypeScript deployed to Supabase.

### Local Development

```bash
supabase start
supabase functions serve
```

### Adding a New Edge Function

```bash
supabase functions new my-function-name
```

Edit `supabase/functions/my-function-name/index.ts`:

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  // Validate auth
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // ... function logic

  return new Response(JSON.stringify({ result: 'ok' }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
```

### Deploy

```bash
supabase functions deploy my-function-name
```

---

## Documentation

- Update `docs/API.md` when adding or modifying Edge Functions
- Update `docs/DATABASE.md` when adding database tables or columns
- Update `CHANGELOG.md` for any user-facing change
- Update `.env.example` for any new environment variable
- ADRs (`docs/adr/`) should be written for significant architectural decisions

---

## Getting Help

- Open a GitHub Discussion for questions
- Open a GitHub Issue for bugs or feature requests
- Tag issues with appropriate labels: `bug`, `enhancement`, `documentation`, `good first issue`
