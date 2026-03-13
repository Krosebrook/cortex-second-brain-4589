# ADR 004 — State Management: TanStack Query + React Context

**Status**: Accepted  
**Date**: 2025-01-01  
**Deciders**: Core team

---

## Context

The application has two categories of state:
1. **Server state**: knowledge entries, chats, messages, notifications — async, cached, shared
2. **Local UI state**: auth session, theme, command palette open/closed, form state

We needed a strategy that avoids unnecessary complexity while providing caching, background refetching, and optimistic updates for server state.

## Decision

- **Server state**: **TanStack Query 5.84.1** (`@tanstack/react-query`) — handles caching, background refetching, optimistic mutations, and cache invalidation
- **Auth state**: **React Context** (`AuthContext`) — wraps Supabase Auth session, provides `user`, `session`, and auth methods to the component tree
- **Local UI state**: React `useState` / `useReducer` — no global state manager needed for UI-only state

## Rationale

| Option | Considered | Reason for/against |
|---|---|---|
| TanStack Query | ✅ **Selected** | Best-in-class async state; built-in devtools; v5 has improved TypeScript generics |
| Redux Toolkit | Considered | Over-engineered for a single-user app; boilerplate overhead |
| Zustand | Considered | Good for client state but doesn't replace async/caching capabilities |
| SWR | Considered | Less feature-complete than TanStack Query; no mutations API |
| Jotai | Considered | Atomic state model; better for UI state than server state |

**Context for auth only**: Auth state is global and changes rarely; Context with `onAuthStateChange` subscription is idiomatic and avoids the overhead of a server state library for synchronous data.

## Consequences

- All data fetching uses TanStack Query `useQuery` / `useMutation` hooks — no `useEffect` for data fetching
- Cache invalidation is explicit (`queryClient.invalidateQueries`)
- Optimistic updates are implemented via `onMutate` / `onError` / `onSettled` pattern
- Auth state is accessed via `useAuth()` hook (wraps `useContext(AuthContext)`)
- QueryClient is configured with retry logic from `ApiConfig.maxRetries` and `ApiConfig.baseRetryDelay`
