# Changelog

All notable changes to Cortex Second Brain are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

---

## [0.1.3] — 2026-03-15

### Added
- Documentation: comprehensive docs suite (ARCHITECTURE, API, DATABASE, SECURITY, RUNBOOK, ROADMAP, PRD, ADRs, DEAD-CODE-TRIAGE, AUDIT-REPORT)
- `.env.example`: Added all `VITE_` variables from `app-config.ts` with descriptions; fixed `VITE_SUPABASE_PUBLISHABLE_KEY` variable name (was incorrectly `VITE_SUPABASE_ANON_KEY`)

### Fixed
- Updated all documentation files to use the correct `VITE_SUPABASE_PUBLISHABLE_KEY` environment variable name (previously referenced as `VITE_SUPABASE_ANON_KEY` in DEPLOYMENT.md, DEVELOPER_GUIDE.md, ONBOARDING_CHECKLIST.md, DOCUMENTATION_FRAMEWORK.md, CONFIGURATION_MANAGEMENT.md, CICD.md, COMPREHENSIVE_DOCUMENTATION.md)
- Updated `docs/CONFIGURATION_MANAGEMENT.md`: replaced `SENDGRID_API_KEY` with the correct `RESEND_API_KEY`, updated document status to reflect completed state

---

## [0.1.2] — 2025-01-14

### Added
- `parse-pdf` Supabase Edge Function for PDF text extraction without external dependencies
- PDF import support in the Import page

### Changed
- Upgraded Framer Motion to 12.35.1

---

## [0.1.1] — 2025-01-10

### Added
- `send-backup-email` Edge Function (Resend API integration)
- Email backup option in Settings

### Fixed
- Background sync queue retry delay now respects `VITE_SYNC_MAX_DELAY` cap
- Service worker registration failure no longer blocks app boot

---

## [0.1.0] — 2025-01-01

### Added

**Core Application**
- React 18.3.1 + TypeScript 5.5.3 + Vite 5.4.1 project scaffold
- React Router v6 with protected route guard (`ProtectedRoute`)
- TanStack Query 5.84.1 for server state management
- Tailwind CSS 3.4.11 + shadcn/ui component library
- Framer Motion animations and page transitions
- Dark/light theme with system preference detection
- Command palette (`Ctrl+K`) via `cmdk`
- Keyboard shortcuts throughout the app

**Authentication**
- Supabase Auth: email/password sign-up and sign-in
- Email verification banner
- Password reset via email
- TOTP Multi-Factor Authentication (`TwoFactorAuth` component)
- Session persistence in `localStorage` with auto-refresh
- Connection error detection with retry UI

**Knowledge Base**
- Full CRUD for knowledge entries (notes, documents, web pages, files)
- Tagging and categorisation
- Favourite/star entries
- Soft-delete with restore capability
- Undo/redo history for edits
- Bulk operations: select all, delete selected, bulk tag
- Filter presets (save/load/delete custom filters)
- Conflict detection and resolution on concurrent edits
- Optimistic UI updates via TanStack Query mutations
- Virtualised list rendering (`@tanstack/react-virtual`) for large datasets

**Import**
- CSV import with column mapping
- URL import (web scraping)
- File upload (PDF, plain text, markdown)
- Plain text paste import
- Google Drive OAuth integration (list and import files)
- PDF text extraction via `parse-pdf` Edge Function

**TESSA AI Chat**
- Multi-session chat with persistent history
- OpenAI-powered responses via `chat-with-tessa-secure` Edge Function
- Rate limiting via `usage_tracking` table
- Chat session management (create, rename, delete)

**PWA & Offline**
- Installable PWA via `vite-plugin-pwa` / Workbox
- Service worker with caching strategies:
  - CacheFirst for fonts and images
  - StaleWhileRevalidate for JS/CSS
  - NetworkFirst for Supabase API calls
- Offline fallback page (`/offline` route)
- Background sync queue with exponential backoff
- Offline indicator in UI

**Notifications**
- In-app notification centre
- Notification types: info, warning, error, success
- Category filtering (sync, import, security)
- Mark as read / mark all as read

**Admin Dashboard**
- Usage metrics and charts (Recharts)
- Rate limit monitoring
- Failed login attempt tracking
- System health status

**Edge Functions (Deno)**
- `chat-with-tessa-secure`: Authenticated AI chat with rate limiting
- `account-lockout`: Login attempt tracking and account lockout
- `google-drive-oauth`: Full OAuth 2.0 flow for Google Drive
- `ip-geolocation`: IP-to-location lookup via ip-api.com
- `security-headers`: Security header configuration endpoint
- `system-status`: Health check with public/admin response tiers
- `send-backup-email`: Data backup via Resend API

**Infrastructure**
- Supabase PostgreSQL with 9 tables and full RLS
- `has_role()` RPC for admin access control
- `handle_new_user()` trigger for automatic profile creation
- Audit logging via `profile_access_logs`
- `ApplicationError` class with `ErrorCode` enum for typed error handling
- Centralised `AppConfig` in `src/config/app-config.ts` (all VITE_ vars)
- Vite code-splitting: 5 vendor chunks (react, ui, supabase, query, charts)

**Testing**
- Vitest 4.0.18 test suite with 206 passing tests
- Coverage thresholds: 70% statements, 65% branches, 70% functions, 70% lines
- Playwright E2E test scaffold

---

[Unreleased]: https://github.com/Krosebrook/cortex-second-brain-4589/compare/v0.1.3...HEAD
[0.1.3]: https://github.com/Krosebrook/cortex-second-brain-4589/compare/v0.1.2...v0.1.3
[0.1.2]: https://github.com/Krosebrook/cortex-second-brain-4589/compare/v0.1.1...v0.1.2
[0.1.1]: https://github.com/Krosebrook/cortex-second-brain-4589/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/Krosebrook/cortex-second-brain-4589/releases/tag/v0.1.0
