# ADR 001 — Frontend Framework Selection: React + TypeScript + Vite

**Status**: Accepted  
**Date**: 2025-01-01  
**Deciders**: Core team

---

## Context

We needed to select a frontend framework for Cortex Second Brain — a personal knowledge management PWA. Requirements were:

- Strong TypeScript support
- Rich ecosystem for UI components, animations, and data fetching
- Fast development experience with HMR
- PWA/service worker support
- Sufficient maturity and community support for long-term maintenance

## Decision

We chose **React 18.3.1** with **TypeScript 5.5.3**, built by **Vite 5.4.1** using the `@vitejs/plugin-react-swc` plugin.

## Rationale

| Option | Considered | Reason for/against |
|---|---|---|
| React 18 | ✅ **Selected** | Largest ecosystem, concurrent rendering, excellent TypeScript support |
| Next.js | Considered | Rejected — server-side rendering adds unnecessary complexity for a client-only PWA |
| Vue 3 | Considered | Smaller component library ecosystem; Radix UI / shadcn unavailable |
| Svelte | Considered | Smaller ecosystem; fewer AI/data viz libraries available |
| Angular | Rejected | Over-engineered for a single-user app; steep learning curve |

**Vite over CRA/webpack**: Vite's native ES module dev server provides near-instant HMR. SWC (via `@vitejs/plugin-react-swc`) is significantly faster than Babel for the TypeScript/JSX transform.

## Consequences

- We benefit from the full React ecosystem: shadcn/ui, TanStack Query, React Router, Framer Motion, Recharts
- TypeScript strict mode is enabled, providing compile-time type safety
- Bundle splitting is configured manually in `vite.config.ts` (5 vendor chunks)
- Dev server runs on port 8080 (configured in `vite.config.ts`)
- Test runner (Vitest) integrates natively with Vite config
