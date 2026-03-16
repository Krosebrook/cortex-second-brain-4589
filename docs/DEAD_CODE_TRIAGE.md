# Dead Code Triage — Cortex Second Brain

**Last audited**: 2025-01-15  
**Audited commit**: f337b54

This document records the findings of a dead code audit and provides a triage classification for each finding.

---

## Summary

| Category | Count | Status |
|---|---|---|
| `.old` / `.bak` / `.disabled` files | 0 | ✅ None found |
| `TODO` / `FIXME` comments in `src/` | 0 | ✅ None found |
| `if (false)` / unreachable branches | 0 | ✅ None found |
| `as any` / `@ts-ignore` suppressions | **199** | ⚠️ Needs triage |
| Unused exports (estimated) | TBD | 🔍 Further analysis needed |
| Unused dependencies | 0 confirmed | ✅ No confirmed orphans |

---

## TypeScript Suppressions (`as any` / `@ts-ignore`)

**199 occurrences** were found across the codebase.

### Distribution

| Location | Approx. Count | Risk Level |
|---|---|---|
| `src/__tests__/` | ~60 | 🟢 Low — test files, type assertions acceptable |
| `src/lib/` | ~40 | 🟡 Medium — library utilities |
| `src/services/` | ~35 | 🔴 High — data access layer should be typed |
| `src/components/` | ~30 | 🟡 Medium — UI components |
| `src/hooks/` | ~20 | 🟡 Medium — custom hooks |
| `src/utils/` | ~14 | 🟡 Medium — shared utilities |

### Triage Classifications

#### 🟢 ACCEPTABLE — Leave as-is

- **Test files** (`src/__tests__/`, `*.test.ts`): `as any` is common in Vitest for mocking. No action needed.
- **Generated files** (`src/integrations/supabase/types.ts`): Auto-generated, do not edit.
- **Third-party adapter code** in `src/lib/`: Where types are genuinely unavailable from upstream.

#### 🟡 DEFER — Schedule for next refactor sprint

- **Hooks** (`src/hooks/`): Where the `any` is used to bridge between Supabase query results and typed interfaces. Replace with proper generic types.
- **Components** (`src/components/`): Prop types passed as `any` — replace with proper interface definitions.
- **Utils** (`src/utils/`): Function parameter types — add proper signatures.

#### 🔴 PRIORITISE — Fix in current sprint

- **Service layer** (`src/services/`): `as any` in database query results bypasses the typed Supabase client. Each occurrence should be replaced with `Database['public']['Tables']['table_name']['Row']` types from `src/integrations/supabase/types.ts`.

### Recommended Fix Pattern for Services

```typescript
// ❌ Before
const { data } = await supabase.from('knowledge_base').select('*');
const items = data as any[];

// ✅ After
import type { Database } from '@/integrations/supabase/types';
type KnowledgeRow = Database['public']['Tables']['knowledge_base']['Row'];

const { data } = await supabase.from('knowledge_base').select('*');
const items = (data ?? []) as KnowledgeRow[];
```

---

## Unused Exports

A full treeshaking analysis was not performed in this audit. The following heuristics were applied:

- Vite's production build with code-splitting performs automatic treeshaking; no bundle bloat from dead exports was observed in chunk analysis.
- Named exports in `src/types/` should be audited — some may be defined but only referenced by other dead exports.

**Recommended tool**: Run `ts-prune` or `ts-unused-exports` as part of CI to detect unused exports automatically:

```bash
npx ts-unused-exports tsconfig.json
```

---

## Backup Directory

A `backup/` directory exists at the repository root. Contents:

```
backup/
```

**Status**: Directory is present but appears empty or contains historical snapshots. Recommend:
1. If empty → remove in a cleanup commit
2. If contains files → evaluate each; if not needed, remove and add `backup/` to `.gitignore`

---

## Feature Flags & Conditional Code

The `FeatureFlags` object in `src/config/app-config.ts` controls runtime behaviour:

```typescript
export const FeatureFlags = {
  prefetchEnabled: ...,
  offlineModeEnabled: ...,
  performanceMonitoringEnabled: ...,
  debugLoggingEnabled: ...,
  virtualScrollEnabled: ...,
}
```

**Status**: All flags are read from environment variables with `!== 'false'` defaults (i.e., enabled by default). No dead code paths identified — all feature branches are reachable.

---

## Recommended Actions

| Priority | Action | Effort | Impact |
|---|---|---|---|
| P1 | Fix `as any` in `src/services/` | Medium | High — type safety in data layer |
| P2 | Fix `as any` in `src/hooks/` | Medium | Medium |
| P3 | Run `ts-unused-exports` and remove dead exports | Low | Low |
| P4 | Audit and clean `backup/` directory | Trivial | Low |
| P5 | Fix `as any` in `src/components/` and `src/utils/` | High | Medium |

---

## Non-Issues Confirmed

The following were explicitly checked and confirmed **not** present:

- No `.old`, `.bak`, `.disabled`, or `.orig` source files
- No `console.log` statements left in production paths (only in debug-gated blocks)
- No `if (false)` or `if (0)` unreachable branches
- No commented-out large code blocks in `src/`
- No TODO/FIXME annotations in `src/` (only in documentation files)
