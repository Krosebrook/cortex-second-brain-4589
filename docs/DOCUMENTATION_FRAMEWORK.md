# Documentation Framework — Tessa AI Platform

> **Version**: 1.0.0 · **Last Updated**: 2026-03-08 · **Owner**: Documentation Lead / Tech Lead

This document is the master documentation strategy for the Tessa AI Platform (also known as Cortex Second Brain). It covers the project summary, gap analysis, required deliverables, coding and documentation standards, sample templates, an update plan, and a validation/maintenance strategy.

---

## Table of Contents

1. [Project Summary](#1-project-summary)
2. [Documentation Inventory & Gap Analysis](#2-documentation-inventory--gap-analysis)
3. [Required Documentation Checklist](#3-required-documentation-checklist)
4. [Standards and Conventions](#4-standards-and-conventions)
5. [Sample Templates and Snippets](#5-sample-templates-and-snippets)
6. [Update Plan and Timeline](#6-update-plan-and-timeline)
7. [Validation and Maintenance Strategy](#7-validation-and-maintenance-strategy)
8. [Repository Directory Structure](#8-repository-directory-structure)

---

## 1. Project Summary

**Tessa AI Platform** (repository: `cortex-second-brain-4589`) is a cloud-hosted, offline-capable knowledge-management and AI-assistant web application. Users can organise notes, documents and web pages into a searchable knowledge base, then hold natural-language conversations with an AI assistant that has access to that context.

The stack is **React 18 + TypeScript + Vite** on the frontend, **Supabase** (PostgreSQL + Auth + Edge Functions) on the backend, and **OpenAI / Anthropic / Google Gemini** for AI inference. The application is delivered as a Progressive Web App (PWA) and targets modern evergreen browsers. Deployment targets include Vercel, Netlify, and self-hosted Docker environments. There is no AL / Business Central component; documentation standards here are adapted accordingly.

### Key Assumptions

- **Team roles available**: Developer, DevOps, Product Owner, QA.
- **Versioning**: Semantic Versioning (SemVer) managed by Release Please.
- **Branching**: `main` = production; `develop` = integration; feature branches off `develop`.
- **No proprietary BC/AL artifacts** are present; all recommendations are for a TypeScript/React/Supabase stack.

---

## 2. Documentation Inventory & Gap Analysis

| Document Name | Exists? | Location | Last Updated | Completeness | Recommended Actions |
|---|---|---|---|---|---|
| README | ✅ | `README.md` | 2026-03 | High | Keep current; auto-update badge links |
| Architecture Overview | ✅ | `docs/ARCHITECTURE.md` | 2026-01 | High | Add Mermaid C4 diagrams; add ADR section |
| Deployment Guide | ✅ | `docs/DEPLOYMENT.md` | 2026-01 | High | Add zero-downtime migration checklist |
| API Reference | ✅ | `docs/API.md` + `docs/openapi.yaml` | 2026-01 | High | Keep OpenAPI spec in sync with edge functions |
| Security Guide | ✅ | `docs/SECURITY.md` | 2026-01 | High | Add secrets-rotation runbook |
| Testing Guide | ✅ | `docs/TESTING.md` | 2026-01 | High | Add AI/edge-function testing section |
| Troubleshooting Guide | ✅ | `docs/TROUBLESHOOTING.md` | 2026-01 | High | Keep in sync with new features |
| Contributing Guide | ✅ | `CONTRIBUTING.md` | 2026-01 | High | Reference new DEVELOPER_GUIDE |
| Change Log | ✅ | `CHANGELOG.md` | 2026-03 | High | Maintained by Release Please automation |
| Technical Whitepaper | ✅ | `docs/TECHNICAL_WHITEPAPER.md` | 2026-01 | Medium | Expand AI provider section |
| Roadmap | ✅ | `docs/ROADMAP.md` | 2026-01 | Medium | Sync with PRODUCT_AUDIT_AND_ROADMAP.md |
| Database Schema | ⚠️ Stub | `docs/DATABASE_SCHEMA.md` | 2026-01 | Low | **Complete with migration-derived schema** (P0) |
| Failure Modes | ⚠️ Stub | `docs/FAILURE_MODES.md` | 2026-01 | Low | **Complete catalogue of failure scenarios** (P0) |
| Observability & Monitoring | ⚠️ Stub | `docs/OBSERVABILITY.md` | 2026-01 | Low | **Complete logging/alerting guidance** (P0) |
| Operational Runbook | ⚠️ Skeleton | `docs/RUNBOOK.md` | 2026-01 | Medium | **Replace TBD placeholders** (P0) |
| Error Handling Guide | ⚠️ Stub | `docs/ERROR_HANDLING_GUIDE.md` | 2026-01 | Low | **Complete error taxonomy & patterns** (P0) |
| Configuration Management | ⚠️ Skeleton | `docs/CONFIGURATION_MANAGEMENT.md` | 2026-01 | Medium | **Complete variable reference** (P1) |
| Developer Guide | ❌ Missing | — | — | — | **Create**: coding conventions, patterns (P0) |
| CI/CD Pipeline Docs | ❌ Missing | — | — | — | **Create**: workflow descriptions (P1) |
| Release & Versioning Policy | ❌ Missing | — | — | — | **Create**: SemVer rules, branching (P1) |
| Onboarding Checklist | ❌ Missing | — | — | — | **Create**: new-developer checklist (P1) |
| Incident Response | ✅ | `docs/INCIDENT_RESPONSE.md` | 2026-01 | High | Validate against current on-call process |
| Pull Request Template | ✅ | `.github/PULL_REQUEST_TEMPLATE.md` | 2026-01 | High | No changes needed |
| Issue Templates | ✅ | `.github/ISSUE_TEMPLATE/` | 2026-01 | High | No changes needed |

### Priority Legend

| Priority | Meaning |
|---|---|
| **P0 – Critical** | Blocks production go-live or developer onboarding; complete within Week 1-2 |
| **P1 – High** | Needed for reliable operations; complete within Week 3-4 |
| **P2 – Medium** | Improves quality; complete within Week 5-6 |
| **P3 – Low** | Nice to have; complete within Week 7-8 |

---

## 3. Required Documentation Checklist

### Core (P0)

- [x] **Architecture Overview** — `docs/ARCHITECTURE.md`
  - *Purpose*: Explain system design and component relationships.
  - *Audience*: Developers, DevOps, New Starters.
  - *Sections*: Overview, C4 diagrams, Frontend arch, Backend arch, Data flow, Security arch.
  - *Format*: Markdown.
  - *Effort*: 4 h (update existing).

- [ ] **Database Schema** — `docs/DATABASE_SCHEMA.md`
  - *Purpose*: Document all tables, columns, RLS policies, indexes, triggers.
  - *Audience*: Developers, DBAs, Security reviewers.
  - *Sections*: Overview, Table catalogue, ER diagram, RLS policy matrix, Migration workflow.
  - *Format*: Markdown + Mermaid ERD.
  - *Effort*: 8 h.

- [ ] **Failure Modes & Edge Cases** — `docs/FAILURE_MODES.md`
  - *Purpose*: Catalogue known failure scenarios, timeouts, circuit-breaker patterns.
  - *Audience*: Developers, On-call engineers.
  - *Sections*: Auth failures, AI chat failures, Sync failures, Storage failures, Cascading failures.
  - *Format*: Markdown tables.
  - *Effort*: 12 h.

- [ ] **Observability & Monitoring** — `docs/OBSERVABILITY.md`
  - *Purpose*: Define logging strategy, metrics, alerts, dashboards.
  - *Audience*: DevOps, On-call engineers.
  - *Sections*: Logging strategy, Metrics catalogue, Alerting thresholds, Dashboard specs.
  - *Format*: Markdown.
  - *Effort*: 10 h.

- [ ] **Operational Runbook** — `docs/RUNBOOK.md`
  - *Purpose*: Step-by-step procedures for common operational tasks and incidents.
  - *Audience*: On-call engineers, DevOps.
  - *Sections*: Quick reference, Health checks, Common issues, Incident procedures, Rollback.
  - *Format*: Markdown checklists.
  - *Effort*: 8 h.

- [ ] **Error Handling Guide** — `docs/ERROR_HANDLING_GUIDE.md`
  - *Purpose*: Standardise error codes, patterns, recovery strategies.
  - *Audience*: Developers.
  - *Sections*: Error taxonomy, Client patterns, Server patterns, Logging, Recovery.
  - *Format*: Markdown + code snippets.
  - *Effort*: 6 h.

- [ ] **Developer Guide** — `docs/DEVELOPER_GUIDE.md`
  - *Purpose*: Coding conventions, naming standards, patterns, component structure.
  - *Audience*: All developers (especially new joiners).
  - *Sections*: Setup, File naming, Component patterns, Hooks, State management, Testing.
  - *Format*: Markdown.
  - *Effort*: 8 h.

### High Priority (P1)

- [ ] **Configuration Management** — `docs/CONFIGURATION_MANAGEMENT.md`
  - *Effort*: 6 h. *Status*: Skeleton exists; complete variable reference.

- [ ] **CI/CD Pipeline Docs** — `docs/CICD.md`
  - *Purpose*: Describe all workflows, triggers, gates, and deployment steps.
  - *Audience*: Developers, DevOps.
  - *Effort*: 4 h.

- [ ] **Release & Versioning Policy** — `docs/RELEASE_POLICY.md`
  - *Purpose*: Define SemVer rules, branching strategy, release-please config.
  - *Audience*: Developers, Product Owner.
  - *Effort*: 3 h.

- [ ] **Onboarding Checklist** — `docs/ONBOARDING_CHECKLIST.md`
  - *Purpose*: Day 1–Day 5 checklist for new developers.
  - *Audience*: New developers.
  - *Effort*: 2 h.

### Medium Priority (P2)

- [ ] **Unit/Integration Testing Guide** — `docs/TESTING.md` (update)
  - *Effort*: 3 h. *Status*: Good; add Supabase mock patterns.

- [ ] **Security & Data Handling Guide** — `docs/SECURITY.md` (update)
  - *Effort*: 2 h. *Status*: Good; add secrets-rotation runbook.

- [ ] **API/Interoperability Reference** — `docs/API.md` + `docs/openapi.yaml` (update)
  - *Effort*: 3 h. Keep OpenAPI spec in sync.

---

## 4. Standards and Conventions

### 4.1 File and Folder Naming

| Convention | Rule | Rationale |
|---|---|---|
| React components | `PascalCase.tsx` | Matches React convention; distinguishable at a glance. |
| Hooks | `useCamelCase.ts` | Community standard for React hook naming. |
| Utilities | `camelCase.ts` | Distinguishes utilities from components. |
| Test files | `*.test.ts` / `*.test.tsx` adjacent to source | Co-location makes test discovery trivial. |
| E2E tests | `e2e/*.spec.ts` | Separate directory prevents confusion with unit tests. |
| Doc files | `UPPER_SNAKE_CASE.md` in `docs/` | Consistent with existing docs convention. |
| Supabase migrations | `YYYYMMDDHHMMSS_<uuid>.sql` | Auto-generated by Supabase CLI; never rename. |

### 4.2 TypeScript Standards

| Rule | Detail |
|---|---|
| Strict mode | `"strict": true` in `tsconfig.app.json` — always on. |
| No `any` | Prefer `unknown` + type narrowing; ESLint rule `no-explicit-any: warn`. |
| Interfaces vs types | Use `interface` for public API shapes; `type` for unions/intersections. |
| Exports | Named exports preferred over default exports (easier refactoring). |
| Async error handling | Always `try/catch` async calls; never swallow errors silently. |

### 4.3 React Component Patterns

| Rule | Detail |
|---|---|
| Single responsibility | One primary concern per component; extract sub-components freely. |
| Composition over props drilling | Use React Context or TanStack Query for cross-cutting state. |
| Event handlers | Prefix with `handle` (`handleSubmit`, `handleChange`). |
| Props interfaces | Define `interface XxxProps` directly above the component. |
| Memoisation | Apply `React.memo` / `useMemo` / `useCallback` only when profiling shows a real need. |
| Accessibility | All interactive elements need keyboard support and ARIA labels. |

### 4.4 Supabase / Database Standards

| Rule | Detail |
|---|---|
| RLS on every table | No table may have data without RLS enabled and tested. |
| Migrations immutable | Never modify a committed migration file; create a new one. |
| Functions use `SET search_path = public` | Prevents search-path injection attacks. |
| Foreign keys explicit | Always specify `ON DELETE` behaviour. |
| Secrets via Edge Function env | API keys are never in frontend bundles or source control. |

### 4.5 Testing Standards

| Metric | Threshold |
|---|---|
| Statements | ≥ 70% |
| Branches | ≥ 65% |
| Functions | ≥ 70% |
| Lines | ≥ 70% |

- Unit tests with Vitest + React Testing Library.
- E2E tests with Playwright for critical user flows.
- Mocks: use `vi.fn()` / `vi.mock()` for external calls; prefer MSW for API-level mocking.
- Test file co-location: `src/utils/__tests__/myUtil.test.ts`.

### 4.6 Documentation Standards

| Rule | Detail |
|---|---|
| Markdown only | All docs in Markdown; render-check in GitHub. |
| Heading hierarchy | One `#` H1 per file; sub-sections `##`, `###`. |
| Code blocks language-tagged | ` ```ts ` not ` ``` `. |
| Tables for comparisons | Use Markdown tables for side-by-side information. |
| No broken links | CI validates links via `markdown-link-check`. |
| Doc header | Each doc must include version, last updated date, owner. |

### 4.7 Branching Strategy

```
main           ← production; protected; merges via PR only
  └─ develop   ← integration branch; PRs squash-merged from features
       ├─ feature/<ticket-id>-short-description
       ├─ fix/<ticket-id>-short-description
       └─ chore/<description>
```

- **`main`** is always deployable.
- **Release Please** creates automated release PRs from `main`.
- **Hotfixes** branch from `main`, merge back to both `main` and `develop`.

### 4.8 Semantic Versioning Rules

| Change Type | Version Bump | Example |
|---|---|---|
| Breaking API / DB schema change | Major (`X.0.0`) | Removing a field |
| New backward-compatible feature | Minor (`0.X.0`) | New edge function |
| Bug fix, docs, refactor | Patch (`0.0.X`) | Typo fix |

Release Please reads Conventional Commits to determine the version bump automatically.

### 4.9 Secrets Handling

| Rule | Detail |
|---|---|
| Never in source control | `.env` is git-ignored; secrets managed per environment. |
| Frontend secrets | None — only `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are public-safe. |
| Backend secrets | Stored as Supabase Edge Function secrets (encrypted at rest). |
| CI secrets | GitHub Actions secrets only; never echoed in logs. |
| Rotation cadence | AI API keys: 90 days; DB passwords: 90 days; document in secure vault. |

### 4.10 Code Review Checklist

- [ ] PR description explains *why*, not just *what*.
- [ ] TypeScript compiles with no new errors.
- [ ] ESLint passes with no new warnings.
- [ ] New logic has unit tests.
- [ ] New DB tables have RLS policies.
- [ ] No secrets, PII, or `console.log` in production code.
- [ ] Accessibility: interactive elements keyboard-navigable.
- [ ] CHANGELOG entry added (if user-facing change).
- [ ] Docs updated if API / config / behaviour changes.

---

## 5. Sample Templates and Snippets

### 5.1 README Template

```markdown
# <Project Name>

<Short tagline – one sentence.>

[![CI](https://github.com/<org>/<repo>/actions/workflows/ci.yml/badge.svg)](<link>)
[![Test Coverage](https://img.shields.io/badge/coverage-70%25+-brightgreen)](<link>)

## Overview
<2-4 sentences describing purpose, audience, and key differentiators.>

## Quick Start
\`\`\`bash
npm install
cp .env.example .env   # fill in VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
npm run dev
\`\`\`

## Documentation
| Document | Description |
|---|---|
| [Architecture](docs/ARCHITECTURE.md) | System design and component overview |
| [Deployment](docs/DEPLOYMENT.md) | Deployment instructions |
| [Security](docs/SECURITY.md) | Auth, RLS, secrets |
| [API Reference](docs/API.md) | Edge function endpoints |
| [Contributing](CONTRIBUTING.md) | How to contribute |

## License
MIT — see [LICENSE](LICENSE).
```

### 5.2 Architecture Diagram Components

For a textual C4-style diagram, include the following component groups:

```
System Context:
  [User] → [Tessa AI Web App] → [Supabase Platform]
                               → [OpenAI / Anthropic / Gemini]

Container Diagram:
  [Browser / PWA]      : React 18 SPA + Service Worker
  [Supabase Auth]      : JWT-based auth with email / OAuth
  [Supabase Database]  : PostgreSQL with RLS
  [Edge Functions]     : Deno serverless; one per AI provider
  [Storage Bucket]     : User file uploads

Component Diagram (Frontend):
  Pages → Components → Hooks → Services → Supabase Client
```

### 5.3 Deployment Checklist Template

```markdown
## Deployment Checklist — v<X.Y.Z>

### Pre-Deployment
- [ ] All CI checks green on `main`
- [ ] Coverage ≥ 70%
- [ ] E2E tests pass in staging
- [ ] Database migrations tested in staging
- [ ] Environment variables verified (prod vs staging)
- [ ] CHANGELOG updated

### Deployment Steps
- [ ] Merge release PR created by Release Please
- [ ] Vercel/Netlify auto-deploys `main` → production
- [ ] Run Supabase migrations: `supabase db push --project-ref <id>`
- [ ] Redeploy Edge Functions: `supabase functions deploy --project-ref <id>`

### Post-Deployment Validation
- [ ] Smoke test: login, create chat, send message
- [ ] Check error rate in monitoring (< 1%)
- [ ] Check p95 latency (< 2 s)
- [ ] Verify AI chat works end-to-end

### Rollback Trigger
- Error rate > 5% sustained for 5 minutes
- P95 latency > 10 seconds
- Any SEV1 incident
```

### 5.4 Release Notes Template

```markdown
## Release v<X.Y.Z> — <YYYY-MM-DD>

### ✨ New Features
- <Feature description> (#<issue>)

### 🐛 Bug Fixes
- <Bug description> (#<issue>)

### ⚠️ Breaking Changes
- <Change description> — **migration required**: <steps>

### 🔧 Internal Changes
- <Refactor / dependency update>

### 📈 Performance Improvements
- <Improvement description>

### 🔒 Security Fixes
- <Security fix> (CVE-YYYY-XXXXX if applicable)

### 📝 Documentation
- <Doc update>

### Upgrade Notes
<Steps required to upgrade from previous version.>
```

### 5.5 Issue Report Template

```markdown
## Bug Report

**Description**
<Clear description of the bug.>

**Steps to Reproduce**
1.
2.
3.

**Expected Behaviour**
<What should happen.>

**Actual Behaviour**
<What actually happens.>

**Environment**
- OS: 
- Browser + version:
- App version / commit:
- Feature flags:

**Screenshots / Logs**
<Attach if applicable.>

**Severity**
- [ ] Critical (data loss / security)
- [ ] High (feature broken)
- [ ] Medium (degraded experience)
- [ ] Low (cosmetic)
```

### 5.6 Pull Request Template

See `.github/PULL_REQUEST_TEMPLATE.md` — already comprehensive and should be kept as-is.

### 5.7 Example Unit Test (TypeScript / Vitest)

```typescript
// src/utils/__tests__/exportUtils.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { exportToPdf } from '../exportUtils';

// Mock jsPDF to avoid browser API dependencies in unit tests
vi.mock('jspdf', () => ({
  default: vi.fn().mockImplementation(() => ({
    text: vi.fn(),
    save: vi.fn(),
    addPage: vi.fn(),
  })),
}));

describe('exportToPdf', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call jsPDF.save with the provided filename', async () => {
    const { default: JsPDF } = await import('jspdf');
    const mockInstance = new JsPDF();

    await exportToPdf({ title: 'My Report', rows: [['col1', 'col2']] }, 'report.pdf');

    expect(mockInstance.save).toHaveBeenCalledWith('report.pdf');
  });

  it('should throw when rows is empty', async () => {
    await expect(exportToPdf({ title: 'Empty', rows: [] }, 'empty.pdf')).rejects.toThrow(
      /no data/i
    );
  });
});
```

---

## 6. Update Plan and Timeline

### Phase 1 — Critical Foundations (Weeks 1–2)

| Task | Owner | Effort | Dependency | Done |
|---|---|---|---|---|
| Complete `docs/DATABASE_SCHEMA.md` | Developer | 8 h | Supabase migration files | ☐ |
| Complete `docs/FAILURE_MODES.md` | Developer + QA | 12 h | Architecture review | ☐ |
| Complete `docs/OBSERVABILITY.md` | DevOps | 10 h | Monitoring tool decision | ☐ |
| Complete `docs/RUNBOOK.md` (TBDs) | DevOps | 4 h | Observability doc | ☐ |
| Complete `docs/ERROR_HANDLING_GUIDE.md` | Developer | 6 h | None | ☐ |
| Create `docs/DEVELOPER_GUIDE.md` | Tech Lead | 8 h | None | ☐ |

**Week 1 Milestone**: Database schema, error handling guide, and developer guide complete.  
**Week 2 Milestone**: Failure modes, observability, and runbook complete; all P0 docs reviewed.

### Phase 2 — Operational Completeness (Weeks 3–4)

| Task | Owner | Effort | Dependency | Done |
|---|---|---|---|---|
| Complete `docs/CONFIGURATION_MANAGEMENT.md` | Developer | 6 h | None | ☐ |
| Create `docs/CICD.md` | DevOps | 4 h | Workflow audit | ☐ |
| Create `docs/RELEASE_POLICY.md` | Tech Lead | 3 h | None | ☐ |
| Create `docs/ONBOARDING_CHECKLIST.md` | Tech Lead | 2 h | Developer guide | ☐ |
| Update `docs/TESTING.md` — Supabase mock patterns | QA | 3 h | None | ☐ |

**Week 3 Milestone**: Configuration, CI/CD, and release policy docs complete.  
**Week 4 Milestone**: Onboarding checklist and updated testing guide complete; first new-joiner walkthrough.

### Phase 3 — Quality and Automation (Weeks 5–6)

| Task | Owner | Effort | Dependency | Done |
|---|---|---|---|---|
| Add Mermaid C4 diagrams to `docs/ARCHITECTURE.md` | Developer | 4 h | None | ☐ |
| Add ADR (Architecture Decision Records) section | Tech Lead | 6 h | None | ☐ |
| Add link-check CI step | DevOps | 2 h | None | ☐ |
| Secrets rotation runbook in `docs/SECURITY.md` | DevOps | 2 h | None | ☐ |
| Update `docs/API.md` to match current edge functions | Developer | 3 h | None | ☐ |

**Week 5 Milestone**: Architecture diagrams and ADRs added.  
**Week 6 Milestone**: Automated link checking live; API docs up to date.

### Phase 4 — Review and Hardening (Weeks 7–8)

| Task | Owner | Effort | Dependency | Done |
|---|---|---|---|---|
| Peer review all P0 docs (two-person sign-off) | All | 8 h | Phases 1–3 done | ☐ |
| New-developer dry run of onboarding checklist | 1 new developer | 4 h | Phase 2 done | ☐ |
| Publish consolidated docs index to `docs/README.md` | Tech Lead | 1 h | All docs complete | ☐ |
| Set up quarterly review calendar events | Tech Lead | 0.5 h | None | ☐ |

**Week 7 Milestone**: All docs peer reviewed.  
**Week 8 Milestone**: Documentation suite signed off; new-developer walkthrough complete.

---

## 7. Validation and Maintenance Strategy

### 7.1 Peer Review Checklist

For each new or updated doc, a second team member confirms:

- [ ] Content is accurate and matches current code/config.
- [ ] All code snippets are syntactically correct and runnable.
- [ ] No broken internal links (`[text](path)`).
- [ ] Sections clearly headed with correct heading levels.
- [ ] No sensitive data (keys, passwords, PII).
- [ ] Version and last-updated date set in doc header.
- [ ] Grammar and spelling pass basic review.

### 7.2 Automated Validation

| Check | Tool | Trigger |
|---|---|---|
| Link validation | `markdown-link-check` | CI on PR |
| OpenAPI spec validation | `@apidevtools/swagger-cli` | CI on PR |
| TypeScript examples compile | `tsc --noEmit` on snippets | Weekly scheduled run |
| Spell check | `cspell` | CI on PR |

### 7.3 Trigger Events for Documentation Updates

| Event | Documentation to Update |
|---|---|
| New database table added | `docs/DATABASE_SCHEMA.md` |
| New edge function added | `docs/API.md`, `docs/openapi.yaml` |
| New environment variable | `docs/CONFIGURATION_MANAGEMENT.md` |
| New GitHub Actions workflow | `docs/CICD.md` |
| New feature deployed | `CHANGELOG.md`, potentially `docs/ARCHITECTURE.md` |
| Security vulnerability patched | `docs/SECURITY.md`, `CHANGELOG.md` |
| New team member joining | Review `docs/ONBOARDING_CHECKLIST.md` |
| Incident post-mortem | `docs/RUNBOOK.md`, `docs/FAILURE_MODES.md` |

### 7.4 Maintenance Cadence

| Cadence | Activity | Owner |
|---|---|---|
| On every PR | Author updates docs for any behaviour/config change | PR Author |
| Weekly | Review open doc-related issues and PRs | Tech Lead |
| Monthly | Check for stale content in high-churn docs (RUNBOOK, CONFIGURATION) | DevOps |
| Quarterly | Full docs audit: completeness, accuracy, coverage metrics | Tech Lead + 1 Developer |
| Per release | Update CHANGELOG and release notes | Release Automation + Tech Lead |

### 7.5 Documentation Health Metrics

| Metric | Target | Measurement |
|---|---|---|
| Doc coverage (% required docs complete) | 100% | Manual checklist audit |
| Staleness (docs not updated > 90 days) | 0 critical docs | `git log --since` audit |
| Broken links | 0 | CI `markdown-link-check` |
| Spell-check errors | 0 | CI `cspell` |
| New-developer time-to-first-PR | ≤ 2 days | Onboarding survey |
| Post-mortem doc update rate | 100% (within 48 h) | Incident tracker |

---

## 8. Repository Directory Structure

Recommended `docs/` structure with all required documents:

```
docs/
├── README.md                      # Docs index and navigation
├── ARCHITECTURE.md                # System architecture, C4 diagrams, ADRs
├── API.md                         # Edge function API reference
├── openapi.yaml                   # Machine-readable OpenAPI 3.0 spec
├── api.html                       # Rendered HTML API docs
├── DEPLOYMENT.md                  # Vercel / Netlify / self-host guide
├── DEVELOPER_GUIDE.md             # Coding conventions, patterns, setup
├── TESTING.md                     # Testing strategy, examples, coverage
├── SECURITY.md                    # Auth, RLS, secrets, vulnerability response
├── CONFIGURATION_MANAGEMENT.md   # All env vars, feature flags, secrets
├── DATABASE_SCHEMA.md             # Full schema, RLS matrix, ERD
├── FAILURE_MODES.md               # Failure scenarios, recovery procedures
├── OBSERVABILITY.md               # Logging, metrics, alerts, dashboards
├── RUNBOOK.md                     # Operational procedures, health checks
├── INCIDENT_RESPONSE.md           # Incident severity, response, post-mortem
├── ERROR_HANDLING_GUIDE.md        # Error taxonomy, patterns, recovery
├── TROUBLESHOOTING.md             # Common issues, debugging steps
├── CICD.md                        # CI/CD workflows, gates, deployment steps
├── RELEASE_POLICY.md              # SemVer rules, branching, release process
├── ONBOARDING_CHECKLIST.md        # New-developer day 1–5 checklist
├── ROADMAP.md                     # Planned features
└── TECHNICAL_WHITEPAPER.md        # In-depth technical reference

Root-level docs:
README.md          ← Project overview and quick start
CONTRIBUTING.md    ← Contribution process
CHANGELOG.md       ← Auto-generated by Release Please
DEVELOPMENT.md     ← Local dev guide
TESTING.md         ← Top-level test commands (links to docs/TESTING.md)
CODE_OF_CONDUCT.md
SECURITY.md        ← Security policy (links to docs/SECURITY.md)
LICENSE

.github/
├── PULL_REQUEST_TEMPLATE.md
├── ISSUE_TEMPLATE/
│   ├── bug_report.md
│   ├── feature_request.md
│   └── config.yml
├── workflows/
│   ├── ci.yml
│   ├── test.yml
│   ├── deploy.yml
│   ├── release-please.yml
│   └── codeql.yml
└── CODEOWNERS
```
