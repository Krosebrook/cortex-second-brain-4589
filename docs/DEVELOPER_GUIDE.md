# Developer Guide

**Version**: 1.0.0 · **Last Updated**: 2026-03-08 · **Owner**: Tech Lead

This guide defines coding conventions, architectural patterns, component structure, and development workflows for all contributors to the Tessa AI Platform.

---

## Table of Contents

1. [Development Environment Setup](#1-development-environment-setup)
2. [Project Structure](#2-project-structure)
3. [TypeScript Conventions](#3-typescript-conventions)
4. [React Component Patterns](#4-react-component-patterns)
5. [Custom Hooks](#5-custom-hooks)
6. [State Management](#6-state-management)
7. [Supabase Integration](#7-supabase-integration)
8. [Edge Function Development](#8-edge-function-development)
9. [Styling Conventions](#9-styling-conventions)
10. [Testing Conventions](#10-testing-conventions)
11. [Performance Guidelines](#11-performance-guidelines)
12. [Security Coding Guidelines](#12-security-coding-guidelines)
13. [Git Workflow](#13-git-workflow)

---

## 1. Development Environment Setup

### Prerequisites

| Tool | Minimum Version | Recommended | Download |
|---|---|---|---|
| Node.js | 18.x | 20.x LTS | [nodejs.org](https://nodejs.org/) |
| npm | 9.x | Latest | Bundled with Node.js |
| Git | 2.30 | Latest | [git-scm.com](https://git-scm.com/) |
| VS Code | Any | Latest | [code.visualstudio.com](https://code.visualstudio.com/) |
| Supabase CLI | 1.x | Latest | `npm install -g supabase` |

### First-Time Setup

```bash
# 1. Clone the repository
git clone https://github.com/Krosebrook/cortex-second-brain-4589.git
cd cortex-second-brain-4589

# 2. Install dependencies
npm install

# 3. Install Husky git hooks
npx husky install

# 4. Configure environment
cp .env.example .env   # then fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY

# 5. Start development server
npm run dev
# → http://localhost:8080
```

### Recommended VS Code Extensions

Create `.vscode/extensions.json`:

```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-typescript-next",
    "formulahendry.auto-rename-tag"
  ]
}
```

### Available Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start dev server on port 8080 |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Serve production build locally |
| `npm run lint` | Run ESLint |
| `npm run lint:fix` | Auto-fix ESLint issues |
| `npm run type-check` | TypeScript type check (no emit) |
| `npm run test` | Run unit + integration tests |
| `npm run test:watch` | Tests in watch mode |
| `npm run test:coverage` | Tests with coverage report |
| `npx playwright test` | Run E2E tests |

---

## 2. Project Structure

```
src/
├── __tests__/               # Test utilities and global test helpers
├── App.tsx                  # Root component: router, providers
├── main.tsx                 # Entry point: React DOM render, web-vitals
├── index.css                # Global CSS (Tailwind base layer)
├── vite-env.d.ts            # Vite type declarations
│
├── components/              # Reusable UI components
│   ├── ui/                  # shadcn/ui generated components (do not edit)
│   ├── auth/                # Authentication components
│   ├── features/            # Feature-specific components
│   ├── layout/              # Layout: Navbar, sidebars, shells
│   ├── error/               # ErrorBoundary, error displays
│   └── <feature>/           # Components scoped to a feature domain
│
├── pages/                   # Route-level page components
│   └── <PageName>.tsx
│
├── hooks/                   # Custom React hooks
│   ├── __tests__/
│   ├── use<FeatureName>.ts  # Feature hooks
│   └── use-mobile.tsx       # Utility hooks
│
├── services/                # Data access layer (Supabase calls)
│   └── <domain>Service.ts
│
├── contexts/                # React context providers
│   └── <Feature>Context.tsx
│
├── utils/                   # Pure utility functions
│   ├── __tests__/
│   ├── exportUtils.ts       # PDF/CSV export (jsPDF)
│   ├── chatUtils.ts         # Chat formatting helpers
│   ├── crypto.ts            # Hashing utilities
│   └── security.ts          # Input sanitisation (DOMPurify)
│
├── types/                   # Shared TypeScript type definitions
│   └── <domain>.ts
│
├── config/                  # App configuration constants
│   └── constants.ts
│
└── integrations/
    └── supabase/
        ├── client.ts        # Supabase JS client singleton
        └── types.ts         # Auto-generated DB types
```

**Rule**: Only `src/integrations/supabase/client.ts` may import and create the Supabase client. All other files import from there.

---

## 3. TypeScript Conventions

### 3.1 Type Declarations

```typescript
// ✅ Interfaces for public object shapes
interface KnowledgeItem {
  id: string;
  userId: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: Date;
}

// ✅ Type aliases for unions and computed types
type KnowledgeCategory = 'general' | 'note' | 'document' | 'web_page';
type PartialKnowledgeItem = Partial<KnowledgeItem>;

// ❌ Avoid 'any'
const data: any = fetchData();    // BAD
const data: unknown = fetchData(); // GOOD — narrow before use
```

### 3.2 Nullability

```typescript
// ✅ Use optional chaining
const title = item?.title ?? 'Untitled';

// ✅ Narrow before accessing
function processItem(item: KnowledgeItem | null) {
  if (!item) return;
  console.log(item.title); // TypeScript knows item is not null here
}
```

### 3.3 Async Functions

```typescript
// ✅ Always type return values
async function fetchItem(id: string): Promise<KnowledgeItem> { … }

// ✅ Handle errors explicitly — never swallow
async function safeDelete(id: string): Promise<void> {
  try {
    await deleteKnowledgeItem(id);
  } catch (error) {
    logError(error);
    throw error; // Re-throw so callers can handle
  }
}
```

---

## 4. React Component Patterns

### 4.1 Component File Structure

```typescript
// src/components/knowledge/KnowledgeCard.tsx

import { type FC } from 'react';          // 1. React imports
import { Trash2 } from 'lucide-react';    // 2. Third-party
import { Button } from '@/components/ui/button'; // 3. Internal components
import { type KnowledgeItem } from '@/types/knowledge'; // 4. Types

// 5. Props interface (directly above component)
interface KnowledgeCardProps {
  item: KnowledgeItem;
  onDelete: (id: string) => void;
  isSelected?: boolean;
}

// 6. Component
export const KnowledgeCard: FC<KnowledgeCardProps> = ({
  item,
  onDelete,
  isSelected = false,
}) => {
  function handleDeleteClick() {
    onDelete(item.id);
  }

  return (
    <article aria-selected={isSelected}>
      <h3>{item.title}</h3>
      <Button
        variant="ghost"
        size="icon"
        onClick={handleDeleteClick}
        aria-label={`Delete ${item.title}`}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </article>
  );
};
```

### 4.2 Naming Conventions

| Pattern | Convention | Example |
|---|---|---|
| Component files | `PascalCase.tsx` | `KnowledgeCard.tsx` |
| Event handlers | `handle<Event>` | `handleSubmit`, `handleDeleteClick` |
| Boolean props | `is<State>` / `has<State>` | `isLoading`, `hasError` |
| Callback props | `on<Event>` | `onDelete`, `onSuccess` |
| Context files | `<Feature>Context.tsx` | `AuthContext.tsx` |

### 4.3 Component Composition

```typescript
// ✅ Compose small components rather than one large one
export function KnowledgeList({ items }: { items: KnowledgeItem[] }) {
  return (
    <ul>
      {items.map(item => (
        <li key={item.id}>
          <KnowledgeCard item={item} onDelete={handleDelete} />
        </li>
      ))}
    </ul>
  );
}

// ❌ Avoid mega-components with > 200 lines; extract sub-components
```

---

## 5. Custom Hooks

### 5.1 Hook Structure

```typescript
// src/hooks/useKnowledgeItems.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchKnowledgeItems, deleteKnowledgeItem } from '@/services/knowledgeService';
import { toast } from 'sonner';

export function useKnowledgeItems() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['knowledge-items'],
    queryFn: fetchKnowledgeItems,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteKnowledgeItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge-items'] });
      toast.success('Item deleted');
    },
    onError: (error) => {
      toast.error('Failed to delete item');
      logError(error);
    },
  });

  return {
    items: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    deleteItem: deleteMutation.mutate,
    isDeletingItem: deleteMutation.isPending,
  };
}
```

### 5.2 Hook Naming

- Prefix all hooks with `use`: `useChat`, `useDashboardData`.
- Return an **object** (not an array) so callers destructure by name.
- Keep a single responsibility per hook; compose hooks.

---

## 6. State Management

| State Type | Tool | Example |
|---|---|---|
| Server / async state | TanStack Query | Fetching, caching, mutating DB data |
| Global UI state | React Context | Auth session, theme, current user |
| Local component state | `useState` / `useReducer` | Form values, modal open/close |
| Form state | React Hook Form + Zod | All forms |
| Persistent local state | `localStorage` + `useState` | User preferences |

**Rule**: Do **not** duplicate server state in React state. TanStack Query is the single source of truth for remote data. Local `useState` is for UI-only state.

---

## 7. Supabase Integration

### 7.1 Client Usage

```typescript
// ✅ Always import from the shared client
import { supabase } from '@/integrations/supabase/client';

// ❌ Never create a second client instance
import { createClient } from '@supabase/supabase-js'; // BAD
```

### 7.2 Typed Database Queries

```typescript
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type KnowledgeRow = Database['public']['Tables']['knowledge_base']['Row'];

const { data, error } = await supabase
  .from('knowledge_base')
  .select('id, title, content, tags')
  .eq('user_id', userId)
  .is('deleted_at', null)      // Exclude soft-deleted
  .order('created_at', { ascending: false })
  .returns<KnowledgeRow[]>();
```

### 7.3 Real-Time Subscriptions

```typescript
useEffect(() => {
  const channel = supabase
    .channel('knowledge-changes')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'knowledge_base', filter: `user_id=eq.${userId}` },
      (payload) => {
        queryClient.invalidateQueries({ queryKey: ['knowledge-items'] });
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel); // Always unsubscribe on cleanup
  };
}, [userId, queryClient]);
```

### 7.4 Input Sanitisation

```typescript
import DOMPurify from 'dompurify';

// Sanitise user HTML before storing or rendering
const safeContent = DOMPurify.sanitize(userInput, {
  ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'a', 'ul', 'ol', 'li'],
  ALLOWED_ATTR: ['href'],
});
```

---

## 8. Edge Function Development

### 8.1 File Structure

```
supabase/functions/
├── _shared/           # Shared helpers (errorResponse, auth, cors)
│   ├── cors.ts
│   ├── auth.ts
│   └── errorResponse.ts
└── <function-name>/
    └── index.ts       # Single entry point per function
```

### 8.2 Standard Function Template

```typescript
// supabase/functions/my-function/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const requestId = crypto.randomUUID();
  const startTime = Date.now();

  try {
    // 1. Authenticate
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return errorResponse('AUTH-001', 'Unauthorized', 401, requestId);
    }

    // 2. Validate input
    const body = await req.json();
    // … validation …

    // 3. Business logic
    // … process …

    // 4. Return success
    console.log(JSON.stringify({ event: 'function_completed', request_id: requestId, duration_ms: Date.now() - startTime }));
    return new Response(JSON.stringify({ success: true, data: result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error(JSON.stringify({ event: 'function_error', request_id: requestId, message: String(err), duration_ms: Date.now() - startTime }));
    return errorResponse('EDGE-001', 'Internal server error', 500, requestId);
  }
});
```

### 8.3 Secrets Access

```typescript
// ✅ Access secrets via Deno.env
const apiKey = Deno.env.get('OPENAI_API_KEY');
if (!apiKey) {
  return errorResponse('EDGE-002', 'Configuration error', 500, requestId);
}

// ❌ Never hardcode API keys
const apiKey = 'sk-abc123...'; // NEVER
```

---

## 9. Styling Conventions

### 9.1 Tailwind CSS

- Use Tailwind utility classes directly on elements.
- Group related utilities: layout → spacing → sizing → typography → colours → states.
- Use `cn()` helper (from `lib/utils.ts`) to conditionally merge classes.

```typescript
import { cn } from '@/lib/utils';

<div className={cn(
  'flex items-center gap-2 p-4',                   // layout + spacing
  'rounded-md border',                              // shape
  'text-sm font-medium text-foreground',            // typography
  'bg-background hover:bg-accent',                  // colours + states
  { 'opacity-50 cursor-not-allowed': disabled }     // conditional
)} />
```

### 9.2 Component Variants with CVA

```typescript
import { cva, type VariantProps } from 'class-variance-authority';

const cardVariants = cva('rounded-lg border p-4', {
  variants: {
    variant: {
      default: 'bg-background',
      highlighted: 'bg-accent border-accent-foreground',
    },
    size: {
      sm: 'p-2 text-sm',
      md: 'p-4 text-base',
    },
  },
  defaultVariants: { variant: 'default', size: 'md' },
});
```

### 9.3 Dark Mode

Use `dark:` prefix variants; never hardcode hex colours. The app respects system preference via `next-themes`.

---

## 10. Testing Conventions

### 10.1 Test File Location

```
src/utils/__tests__/exportUtils.test.ts    # Unit test adjacent to source
src/hooks/__tests__/useChat.test.ts        # Hook tests
e2e/chat.spec.ts                           # E2E tests
```

### 10.2 Unit Test Template

```typescript
// src/utils/__tests__/myUtil.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { myFunction } from '../myUtil';

describe('myFunction', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('should return expected value for valid input', () => {
    const result = myFunction('valid');
    expect(result).toBe('expected');
  });

  it('should throw AppError for invalid input', () => {
    expect(() => myFunction('')).toThrow('VAL-001');
  });
});
```

### 10.3 Component Test Template

```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { KnowledgeCard } from '../KnowledgeCard';

const mockItem = { id: '1', title: 'Test', content: '', tags: [], createdAt: new Date() };

describe('KnowledgeCard', () => {
  it('renders the item title', () => {
    render(<KnowledgeCard item={mockItem} onDelete={vi.fn()} />);
    expect(screen.getByText('Test')).toBeInTheDocument();
  });

  it('calls onDelete when delete button clicked', async () => {
    const onDelete = vi.fn();
    render(<KnowledgeCard item={mockItem} onDelete={onDelete} />);
    await userEvent.click(screen.getByRole('button', { name: /delete/i }));
    expect(onDelete).toHaveBeenCalledWith('1');
  });
});
```

### 10.4 Coverage Thresholds

| Metric | Minimum |
|---|---|
| Statements | 70% |
| Branches | 65% |
| Functions | 70% |
| Lines | 70% |

---

## 11. Performance Guidelines

| Guideline | Detail |
|---|---|
| **Lazy load routes** | Use `React.lazy` + `Suspense` for page-level code splitting |
| **Virtualise long lists** | Any list with potentially > 100 items must use `@tanstack/react-virtual` |
| **Memoisation** | Apply `React.memo` / `useMemo` only when profiling shows a real benefit |
| **Image optimisation** | Use appropriate formats (WebP); set explicit `width` and `height` to prevent CLS |
| **Bundle analysis** | Run `npx vite-bundle-visualizer` before adding large dependencies |
| **Web Vitals targets** | LCP < 2.5 s; CLS < 0.1; INP < 200 ms |

---

## 12. Security Coding Guidelines

| Rule | Detail |
|---|---|
| **Sanitise all user HTML** | Use `DOMPurify.sanitize()` before rendering or storing user-supplied HTML |
| **Validate on both sides** | Client validation for UX; server/DB validation for security |
| **No secrets in frontend** | Only `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are safe in the browser |
| **Use parameterised queries** | Always use Supabase query builder; never string-concatenate SQL |
| **RLS on every table** | New tables must have RLS enabled before the PR is merged |
| **Content Security Policy** | Ensure CSP headers are set via the `security-headers` edge function |
| **Dependency scanning** | `npm audit` runs in CI; address high/critical findings before merge |

---

## 13. Git Workflow

### Branching

```bash
# New feature
git checkout develop
git pull origin develop
git checkout -b feature/KB-42-add-tag-filter

# Bug fix
git checkout -b fix/CHAT-31-timeout-handling

# Chore
git checkout -b chore/upgrade-tanstack-query
```

### Commit Convention (Conventional Commits)

```
feat: add tag filter to knowledge base search
fix: handle chat timeout gracefully
docs: update API reference for chat endpoint
refactor: extract knowledge service from hook
test: add unit tests for exportUtils
chore: upgrade jspdf to 4.2.0
```

### Pre-commit Hooks (Husky + lint-staged)

On every commit:
1. ESLint auto-fix on staged `.ts`/`.tsx` files.
2. Prettier format on staged `.ts`/`.tsx`/`.md` files.
3. TypeScript type-check.

### Pull Request Requirements

- [ ] All CI checks green.
- [ ] At least one approving review.
- [ ] Test coverage not reduced below thresholds.
- [ ] CHANGELOG entry (if user-facing change).
- [ ] Docs updated (if API / config / behaviour changes).

---

## Related Documentation

- [Contributing Guide](../CONTRIBUTING.md)
- [Testing Guide](TESTING.md)
- [Security Guide](SECURITY.md)
- [Database Schema](DATABASE_SCHEMA.md)
- [Onboarding Checklist](ONBOARDING_CHECKLIST.md)
