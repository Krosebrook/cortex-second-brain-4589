# Roadmap — Cortex Second Brain

This roadmap reflects planned improvements based on the current state of the codebase (v0.1.2) and known technical debt.

---

## Current Release — v0.1.2

✅ **Completed**

- Full knowledge base CRUD (notes, documents, web pages, files)
- TESSA AI chat with OpenAI integration and rate limiting
- Multi-source import: CSV, URL, file upload, PDF parsing, Google Drive OAuth
- Supabase Auth with email/password, MFA/TOTP, account lockout
- PWA with service worker caching and offline fallback
- Background sync queue with exponential backoff
- Command palette (`Ctrl+K`)
- Undo/redo for knowledge edits
- Bulk operations (select, delete, tag)
- Filter presets (saved search configurations)
- Dark/light theme
- Admin dashboard (usage, rate limits, login tracking)
- Email backup via Resend
- Notifications system
- Virtualised lists for performance
- Web Vitals monitoring
- 206 passing tests (70% coverage thresholds)

---

## Milestone v0.2 — Technical Debt & Quality

**Target**: Near-term  
**Focus**: Code quality, security hardening, type safety

### Security

- [ ] Upgrade `esbuild` / `vite` to resolve moderate dev-server vulnerability
- [ ] Upgrade `flatted`, `serialize-javascript`, `@rollup/plugin-terser` (build-time highs)
- [ ] Track `workbox-build` upstream fix for `@rollup/plugin-terser` dependency
- [x] Add Dependabot / Renovate configuration

### Type Safety

- [x] Eliminate `as any` in `src/services/` production code (5 occurrences in `notification.service.ts` fixed)
- [ ] Eliminate `as any` in `src/hooks/` (20 occurrences in test files)
- [ ] Reduce `as any` in `src/components/` and `src/utils/`
- [ ] Enable `ts-unused-exports` in CI to catch dead exports

### Testing

- [ ] Raise branch coverage from 65% to ≥ 75%
- [ ] Add E2E tests for critical paths (auth → create note → TESSA chat)
- [ ] Add smoke tests for all 8 edge functions

### CI/CD

- [x] Add `npm audit` check (fail on high severity in non-dev deps)
- [x] Add `npm run type-check` to CI pipeline
- [x] Add bundle size tracking with budget alerts

---

## Milestone v0.3 — UX & Performance

**Target**: Q2 2025  
**Focus**: Polish, accessibility, performance

- [ ] WCAG 2.1 AA audit and remediation
- [ ] Keyboard navigation audit for all interactive components
- [ ] Lighthouse Performance score ≥ 85
- [ ] Lighthouse Accessibility score ≥ 90
- [ ] PWA score ≥ 90
- [ ] Image optimisation and lazy loading
- [ ] Skeleton loading states for all async content
- [ ] Improve conflict detection UX (clearer merge UI)
- [ ] Mobile layout refinements

---

## Milestone v0.4 — Features

**Target**: Q3 2025  
**Focus**: Power user features and integrations

- [ ] Bi-directional note linking (wiki-style `[[links]]`)
- [ ] Full-text search with highlighted snippets
- [ ] Knowledge graph visualisation (neural network view)
- [ ] Webhook support for importing from Zapier/Make
- [ ] Notion import integration
- [ ] Obsidian vault import
- [ ] Browser extension for one-click web clipping
- [ ] Scheduled email digests (weekly knowledge summary)
- [ ] Shareable read-only knowledge cards (public links)

---

## Milestone v1.0 — Stable Release

**Target**: Q4 2025  
**Focus**: Production hardening, documentation, community

- [ ] All P0/P1 user stories verified with E2E tests
- [ ] Security audit (external)
- [ ] Performance audit (external)
- [ ] Complete API documentation with OpenAPI spec
- [ ] Self-hosting guide (bring your own Supabase)
- [ ] Contributor onboarding documentation
- [ ] Stable public API contract for edge functions

---

## Future Considerations (Post v1.0)

These items are under consideration but not yet committed:

| Idea | Rationale | Complexity |
|---|---|---|
| Real-time collaboration | Shared workspaces for teams | High |
| Native mobile apps | Better offline experience on mobile | High |
| Custom AI model | Fine-tuning on personal knowledge | Very High |
| Self-hosted LLM | Privacy-first AI (Ollama) | Medium |
| Plugin system | Community-built importers/exporters | High |
| Spaced repetition | Flashcard-style knowledge review | Medium |
| Tauri desktop app | Better OS integration than PWA | Medium |

---

## Completed & Deferred

| Item | Decision | Reason |
|---|---|---|
| Anthropic Claude support | Deferred to v0.4 | OpenAI sufficient for v0.1 |
| Team billing UI | Out of scope | Single-user focus for v1 |
| iOS/Android native | Out of scope | PWA covers most use cases |
