# Copilot Instructions for cortex-second-brain-4589

## Project Overview

Cortex Second Brain is an AI-powered, offline-capable Progressive Web App (PWA) for personal knowledge management. Users capture notes, documents, and web content into a searchable knowledge base and interact with **TESSA**, an AI assistant backed by OpenAI, to surface insights across their saved content. The app runs entirely in the browser (React SPA) backed by Supabase (PostgreSQL + Auth + Edge Functions).

## Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Language | TypeScript | 5.5.3 |
| UI Framework | React | 18.3.1 |
| Router | React Router DOM | 6.26.2 |
| Build Tool | Vite + @vitejs/plugin-react-swc | 5.4.1 |
| Backend | Supabase (PostgreSQL, Auth, Edge Functions) | @supabase/supabase-js 2.98.0 |
| Server State | TanStack Query (React Query) | v5.84.1 |
| CSS | Tailwind CSS | 3.4.11 |
| Component Library | Radix UI primitives + shadcn/ui | various |
| Animation | Framer Motion | 12.35.1 |
| Forms | React Hook Form + Zod | 7.53.0 / 3.23.8 |
| PDF Export | jsPDF + jsPDF-AutoTable | 4.2.0 / 5.0.2 |
| HTML Sanitization | DOMPurify | 3.2.6 |
| PWA | vite-plugin-pwa (Workbox) | 0.19.8 |
| Unit/Integration Tests | Vitest | 4.0.18 |
| E2E Tests | Playwright | 1.57.0 |
| Node runtime (CI/tooling) | Node.js | 20 (CI), ≥18 supported |

## Architecture

### Directory Map

```
src/
├── App.tsx               # Root component — providers, routing, lazy-loaded pages
├── main.tsx              # Entry point — Web Vitals, background sync init
├── components/           # UI components, organised by domain
│   ├── admin/            # Admin dashboard components
│   ├── auth/             # Login, MFA, password-reset components
│   ├── error/            # ErrorBoundary
│   ├── feedback/         # Toast, confirmation dialogs, shortcuts help
│   ├── knowledge/        # Knowledge item cards, editors, lists
│   ├── layout/           # ProtectedRoute, AdminRoute, SecurityHeaders, Navbar
│   ├── loading/          # Skeleton screens
│   ├── navigation/       # Navbar
│   ├── pwa/              # InstallPromptBanner
│   ├── search/           # Search components
│   ├── settings/         # Settings panels
│   ├── tessa/            # TESSA chat components
│   └── ui/               # Generic shadcn/ui primitives (button, dialog, etc.)
├── config/               # App config: app-config.ts, cache-policies.ts
├── constants/            # Error messages, route names, other string constants
├── contexts/             # AuthContext, OfflineContext, ThemeContext
├── hooks/                # 40+ custom React hooks
├── integrations/
│   └── supabase/         # Auto-generated Supabase client + Database types (DO NOT EDIT)
├── lib/                  # Core utilities
│   ├── api-utils.ts      # withRetry, parseSupabaseError, RetryConfig
│   ├── error-handling.ts # AppError, ApplicationError, ErrorCode, createAppError
│   ├── offline-storage.ts
│   └── background-sync.ts
├── pages/                # Route-level page components (lazy-loaded via React.lazy)
├── services/             # Service classes — data access layer
│   ├── base.service.ts   # Abstract BaseService with retry, logging, error handling
│   ├── knowledge.service.ts
│   ├── chat.service.ts
│   ├── search.service.ts
│   ├── notification.service.ts
│   ├── user.service.ts
│   ├── admin.service.ts
│   └── audit.service.ts
├── types/                # Shared TypeScript types (index.ts re-exports all)
└── utils/                # Pure utility functions (exportUtils, security, crypto, chatUtils)

supabase/
├── functions/            # Deno edge functions (one folder per function)
└── migrations/           # PostgreSQL migration files — DO NOT EDIT manually

e2e/                      # Playwright end-to-end tests
```

### Routing

React Router DOM v6. Explicit `<Routes>/<Route>` declarations in `App.tsx`. All page components are lazy-loaded with `React.lazy()` and wrapped in `<Suspense>`. Protected pages use `<ProtectedRoute>` (auth check) or `<AdminRoute>` (RBAC check) guards from `src/components/layout/`.

### Data Flow

1. React component calls a custom hook (e.g. `useKnowledge`, `useChat`).
2. The hook calls a service singleton (e.g. `KnowledgeService.loadItems()`).
3. The service extends `BaseService`, which wraps all DB calls in `executeWithRetry` (exponential backoff via `withRetry` from `src/lib/api-utils.ts`).
4. The service queries Supabase PostgREST client or invokes a Supabase Edge Function.
5. Errors are parsed by `parseSupabaseError` and thrown as `ApplicationError`.
6. Infrastructure hooks (notifications, dashboard data) use TanStack Query `useQuery`/`useMutation`.
7. Domain hooks (knowledge, chat) use `useState + useEffect + service classes`.

### Auth Flow

Supabase Auth (email/password + optional TOTP MFA). Session stored in `localStorage` with auto-refresh. `AuthContext` exposes `user`, `session`, `isAuthenticated`, `loading`. RBAC via `user_roles` Supabase table. `ProtectedRoute` redirects unauthenticated users; `AdminRoute` checks the `user_roles` table for admin role.

## Code Conventions

### Naming

| Type | Convention | Example |
|---|---|---|
| Non-hook source files | kebab-case | `knowledge.service.ts`, `error-handling.ts`, `api-utils.ts` |
| Hook files | camelCase prefixed `use` | `useKnowledge.ts`, `useAsyncAction.ts` |
| React component files | PascalCase | `StatusIndicator.tsx`, `PageTransition.tsx` |
| Documentation files in `docs/` | UPPER_SNAKE_CASE.md | `ARCHITECTURE.md`, `SECURITY.md` |
| CSS custom properties / Tailwind | kebab-case | `--primary-foreground`, `bg-background` |

### Imports

- Use the `@/` path alias (maps to `src/`) for all cross-directory imports. **Never** use `../../..` relative paths across directories.
- Use `import type { … }` for type-only imports (enforced by `@typescript-eslint/consistent-type-imports`).
- Barrel exports: `src/types/index.ts` re-exports all shared types; import from `@/types` rather than individual type files where possible.
- Ordering: third-party imports first, then `@/` alias imports.

```typescript
// ✅ Correct
import { useState, useEffect } from 'react';
import type { KnowledgeItem } from '@/types';
import { KnowledgeService } from '@/services/knowledge.service';

// ❌ Wrong
import { KnowledgeItem } from '../../types/index'; // relative cross-directory
import { KnowledgeItem } from '@/types'; // missing `type` keyword for type-only
```

### Components

- Functional components only — no class components.
- One component per file.
- Co-located tests in a `__tests__/` subdirectory inside the component/hook folder.
- Props interfaces are defined inline or above the component in the same file.
- Prefer named exports; default exports are used only for page-level route components.
- Use Radix UI primitives wrapped by shadcn/ui components (`src/components/ui/`); do not add raw HTML elements for interactive widgets that Radix already covers.

### Error Handling

All service errors must be `ApplicationError` instances. Use the factory from `src/lib/error-handling.ts`:

```typescript
import { createAppError, ErrorCode, ApplicationError } from '@/lib/error-handling';

// Throw
throw createAppError(ErrorCode.NOT_FOUND, 'Item not found', { id });

// Catch and re-throw
try {
  // ...
} catch (error) {
  throw error instanceof ApplicationError ? error : parseSupabaseError(error);
}
```

- Never use silent empty `catch {}` blocks.
- All async calls must be awaited or explicitly `.catch()`-handled (`@typescript-eslint/no-floating-promises` is a warning; treat it as an error in new code).
- Use `ErrorBoundary` (`src/components/error/ErrorBoundary.tsx`) to catch render-time errors in page subtrees.

### Types

- TypeScript `strict` mode is **off** (`strict: false` in `tsconfig.app.json`). `noImplicitAny: false`, `strictNullChecks: false`.
- `noUnusedLocals: true` — unused local variables/imports are compile errors.
- Prefer `interface` over `type` for object shapes; use `type` for unions, intersections, and re-exports.
- All shared types live in `src/types/` and are re-exported from `src/types/index.ts`.
- Never edit `src/integrations/supabase/types.ts` — it is auto-generated by the Supabase CLI.

## Testing

### Unit & Integration Tests (Vitest)

- **Runner**: Vitest 4.0.18, jsdom environment.
- **File pattern**: `src/**/*.{test,spec}.{ts,tsx}` — test files are co-located in `__tests__/` subdirectories next to the code they test.
- **Setup file**: `vitest.setup.ts` at project root.
- **Utilities**: `@testing-library/react` 16.3.0, `@testing-library/user-event` 14.6.1, `@testing-library/jest-dom` 6.9.1.
- **Coverage**: v8 provider; thresholds: statements 70%, branches 65%, functions 70%, lines 70%. Reporters: text, json, html, lcov, json-summary (output to `coverage/`).

```bash
npm run test               # Single run
npm run test:watch         # Watch mode
npm run test:coverage      # With coverage report
```

### E2E Tests (Playwright)

- **Runner**: Playwright 1.57.0.
- **Test directory**: `e2e/`.
- **Browsers**: Chromium, Firefox, WebKit, Mobile Chrome (Pixel 5), Mobile Safari (iPhone 12).
- **Visual regression**: Chromium-only, snapshots in `e2e/__snapshots__/`, max diff 10%.
- **Base URL**: `http://localhost:8080`.
- **Web server**: `npm run build && npm run preview` (CI) or reuse existing (local).

```bash
npx playwright test        # Run all E2E tests
```

## Security Rules

1. **No secrets in client code.** All `VITE_*` variables are public. AI provider keys (`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, etc.) and OAuth credentials (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `RESEND_API_KEY`) must only be set as Supabase Edge Function secrets via `supabase secrets set`. Never reference them with `VITE_` prefix.
2. **Sanitize all user-generated HTML** with DOMPurify before rendering. Use `src/utils/security.ts` helpers. Never use `dangerouslySetInnerHTML` without DOMPurify.
3. **Validate all user inputs** with Zod schemas before sending to services or edge functions. The `validateTag` helper in `src/utils/security.ts` must be used for tag inputs.
4. **All Supabase tables require RLS policies.** New migrations must include `ALTER TABLE … ENABLE ROW LEVEL SECURITY` and corresponding `CREATE POLICY` statements.
5. **Parameterized queries only.** Always use the Supabase PostgREST client (`.from().select().eq()`) or the typed query builder. Never interpolate user input into raw SQL strings.
6. **CSP enforcement.** The `SecurityHeaders` component (`src/components/layout/SecurityHeaders.tsx`) applies the Content Security Policy in-app; the `security-headers` Supabase Edge Function enforces it at the CDN level.
7. **TOTP MFA is supported.** Auth flows must not bypass the MFA step when it is enabled for the user.
8. **Account lockout** is enforced by the `account-lockout` Supabase Edge Function. Do not bypass or suppress failed-login tracking.

## Environment Variables

All browser-accessible variables are prefixed `VITE_`. Edge function secrets are set via `supabase secrets set` (never `VITE_`).

### Required

| Variable | Description |
|---|---|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase anon/public key (**not** `VITE_SUPABASE_ANON_KEY`) |
| `VITE_SUPABASE_PROJECT_ID` | Supabase project reference ID |

### Optional (all have defaults)

| Variable | Default | Description |
|---|---|---|
| `VITE_MAX_RETRIES` | `3` | Max retry attempts |
| `VITE_RETRY_DELAY` | `1000` | Base retry delay (ms) |
| `VITE_MAX_RETRY_DELAY` | `10000` | Max retry delay (ms) |
| `VITE_API_TIMEOUT` | `30000` | Request timeout (ms) |
| `VITE_BACKOFF_MULTIPLIER` | `2` | Exponential backoff multiplier |
| `VITE_CACHE_TTL` | `600000` | Cache item TTL (ms) |
| `VITE_MAX_CACHE_SIZE` | `1000` | Max cached items |
| `VITE_SW_CACHE_ENABLED` | `true` | Enable service worker cache |
| `VITE_RATE_LIMIT_MAX` | `60` | Max requests per rate-limit window |
| `VITE_RATE_LIMIT_WINDOW` | `60000` | Rate-limit window (ms) |
| `VITE_PREFETCH_ENABLED` | `true` | Enable data prefetching |
| `VITE_OFFLINE_MODE` | `true` | Enable offline support |
| `VITE_PERF_MONITORING` | `true` | Enable Web Vitals monitoring |
| `VITE_DEBUG` | `true` (dev only) | Enable debug logging |
| `VITE_VIRTUAL_SCROLL` | `true` | Enable virtual scrolling |
| `VITE_DEFAULT_PAGE_SIZE` | `50` | Default pagination size |
| `VITE_MAX_PAGE_SIZE` | `200` | Maximum pagination size |
| `VITE_SEARCH_DEBOUNCE` | `300` | Search input debounce (ms) |
| `VITE_TOAST_DURATION` | `5000` | Toast notification duration (ms) |
| `VITE_SYNC_MAX_RETRIES` | `5` | Max background sync retries |
| `VITE_SYNC_RETRY_DELAY` | `1000` | Sync retry base delay (ms) |
| `VITE_SYNC_MAX_DELAY` | `300000` | Sync max delay (ms) |
| `VITE_SYNC_DEBOUNCE` | `500` | Sync queue debounce (ms) |
| `VITE_BATCH_SIZE` | `50` | Default bulk operation batch size |
| `VITE_MAX_BATCH_SIZE` | `200` | Maximum batch size |
| `VITE_BATCH_DELAY` | `100` | Delay between batches (ms) |
| `VITE_OPENAI_TIMEOUT` | `60000` | OpenAI call timeout (ms) |
| `VITE_GEO_TIMEOUT` | `5000` | Geolocation API timeout (ms) |

### Edge Function Secrets (set via `supabase secrets set`, never `VITE_`)

`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GOOGLE_AI_API_KEY`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `RESEND_API_KEY`

## Common Tasks

### Add a new route/page

1. Create `src/pages/MyPage.tsx` (PascalCase, named export `default` for route components).
2. Lazy-load it in `App.tsx`: `const MyPage = lazy(() => import('./pages/MyPage'));`.
3. Add `<Route path="/my-path" element={<Suspense fallback={<ContentSkeleton />}><MyPage /></Suspense>} />` inside the existing `<Routes>`.
4. Wrap with `<ProtectedRoute>` or `<AdminRoute>` if authentication is required.

### Add a new service

1. Create `src/services/my-feature.service.ts`.
2. Define `class MyFeatureServiceImpl extends BaseService` with `super('MyFeatureService')` in the constructor.
3. Use `this.executeWithRetry('operationName', () => supabase.from(...))` for all DB calls.
4. Export a singleton: `export const MyFeatureService = new MyFeatureServiceImpl();`.
5. Add the export to `src/services/index.ts`.

### Add a new hook

1. Create `src/hooks/useMyFeature.ts` (camelCase).
2. For domain state (CRUD), use `useState + useEffect + service singleton`.
3. For infrastructure queries (read-heavy, cross-component), use TanStack Query `useQuery`/`useMutation`.
4. Add the hook export to `src/hooks/index.ts`.

### Add a new Supabase migration

Add a new `.sql` file to `supabase/migrations/` using the Supabase CLI:

```bash
supabase migration new my_migration_name
```

Always include `ENABLE ROW LEVEL SECURITY` and `CREATE POLICY` statements. Do not edit existing migration files.

### Run linting, type-checking, and tests

```bash
npm run lint           # ESLint (flat config, TypeScript type-checked)
npm run lint:fix       # ESLint with auto-fix
npm run type-check     # tsc --noEmit
npm run test           # Vitest single run
npm run test:coverage  # Vitest with coverage report
npx playwright test    # E2E tests (requires built app)
npm run build          # Production build (Vite)
npm run dev            # Dev server on :8080
```

Install dependencies with `--legacy-peer-deps` due to Vitest peer-dep conflicts:

```bash
npm install --legacy-peer-deps
```

## Do NOT

1. **Do not edit `src/integrations/supabase/types.ts`** — it is auto-generated by the Supabase CLI. Regenerate it with `supabase gen types typescript`.
2. **Do not edit migration files in `supabase/migrations/`** — only add new migration files.
3. **Do not use `VITE_SUPABASE_ANON_KEY`** — the correct variable name is `VITE_SUPABASE_PUBLISHABLE_KEY`. The deploy workflow uses `VITE_SUPABASE_ANON_KEY` in one place (a legacy reference); in all new code use `VITE_SUPABASE_PUBLISHABLE_KEY`.
4. **Do not put AI/OAuth secrets in `VITE_*` variables** — they are publicly readable in the browser bundle. Use Supabase Edge Function secrets.
5. **Do not use `dangerouslySetInnerHTML` without DOMPurify sanitization** — always pass content through `DOMPurify.sanitize()` or the helpers in `src/utils/security.ts`.
6. **Do not use raw `.then()/.catch()` chains in new code** — use `async/await` throughout.
7. **Do not use silent empty `catch {}` blocks** — always log or re-throw; `@typescript-eslint/no-floating-promises` violations in new code should be treated as errors.
8. **Do not use relative imports across directories** (e.g., `../../hooks/useKnowledge`) — always use `@/hooks/useKnowledge`.
9. **Do not add new npm dependencies without explicit approval** — use libraries already in `package.json`.
10. **Do not change public API signatures, exported function names, or route paths** during refactoring without updating all call sites and the corresponding E2E tests.
11. **Do not use `any` type unless unavoidable and justified** — `@typescript-eslint/no-explicit-any` is a warning; new code should avoid it entirely.
12. **Do not modify `src/integrations/supabase/client.ts`** — the Supabase client is a singleton configured from environment variables; do not re-instantiate it elsewhere.
