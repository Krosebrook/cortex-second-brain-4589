# ADR 003 — UI Component Library: shadcn/ui + Radix UI

**Status**: Accepted  
**Date**: 2025-01-01  
**Deciders**: Core team

---

## Context

We needed a UI component library that provides:
- Accessible, keyboard-navigable primitives
- Full control over styling (Tailwind CSS compatible)
- Dark/light theme support
- No vendor lock-in — components owned in the codebase

## Decision

We use **shadcn/ui** — a collection of copy-paste components built on **Radix UI** primitives, styled with **Tailwind CSS**.

Components live in `src/components/ui/` and are owned by the project (not installed as a package).

## Rationale

| Option | Considered | Reason for/against |
|---|---|---|
| shadcn/ui | ✅ **Selected** | Full ownership, Radix accessibility, Tailwind-native, no runtime library |
| Chakra UI | Considered | Large runtime bundle; less Tailwind-compatible |
| MUI (Material UI) | Considered | Opinionated styling system conflicts with Tailwind |
| Headless UI | Considered | Fewer components; less complete than Radix |
| Mantine | Considered | Solid option, but shadcn/Radix has stronger ecosystem momentum |

Radix UI provides robust accessibility (ARIA, keyboard navigation, focus management) out of the box. Because components are copied into `src/components/ui/`, we can customise any component without fighting an upstream API.

## Consequences

- No `@shadcn/ui` package in `package.json` — components are source files
- New shadcn components are added via `npx shadcn-ui@latest add <component>`
- Theme tokens defined in `tailwind.config.ts` using CSS variables
- `cn()` utility (`src/lib/utils.ts`) merges Tailwind classes with `clsx` + `tailwind-merge`
- Lucide React (0.537.0) provides the icon set, consistent with shadcn/ui conventions
