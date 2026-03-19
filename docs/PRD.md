# Product Requirements Document — Cortex Second Brain

**Version**: 0.1.2  
**Status**: Active Development  
**Last Updated**: 2025-01-15

---

## 1. Product Vision

Cortex Second Brain is a personal AI-powered knowledge management system. It enables individuals to capture, organise, and intelligently retrieve information from multiple sources, then converse with an AI assistant (TESSA) that understands their entire knowledge base.

**Core proposition**: *Your notes, documents, and ideas — searchable, connected, and conversational.*

---

## 2. Problem Statement

Modern knowledge workers are overwhelmed by information scattered across notes apps, browser bookmarks, PDFs, email threads, and cloud documents. Existing tools are either:

- **Too simple** (notes apps with no AI): Can't surface relevant context
- **Too complex** (enterprise PKM): Heavy, expensive, steep learning curve
- **Siloed** (single-source): Can't ingest from multiple channels

Cortex Second Brain solves this by providing a lightweight, privacy-respecting, offline-capable PWA that centralises knowledge and makes it conversational via TESSA.

---

## 3. Target Users

### Primary: The Knowledge Worker

- Software engineers, researchers, writers, students
- Manages 100s–10,000s of notes/documents
- Wants to "talk to their notes" rather than manually search
- Values privacy (data owned in their Supabase instance)
- Comfortable with technical setup

### Secondary: The Power User / Team Lead

- Wants admin visibility into usage and costs
- May manage a shared Supabase project for a small team
- Uses bulk operations and filter presets for organisation

---

## 4. User Stories

### Authentication & Onboarding

| ID | Story | Priority |
|---|---|---|
| US-01 | As a new user, I can sign up with email and password | P0 |
| US-02 | As a user, I can verify my email address | P0 |
| US-03 | As a user, I can sign in and have my session persist | P0 |
| US-04 | As a user, I can reset my password via email | P0 |
| US-05 | As a security-conscious user, I can enable TOTP MFA | P1 |
| US-06 | As a user, I am locked out after repeated failed login attempts | P1 |

### Knowledge Base

| ID | Story | Priority |
|---|---|---|
| US-10 | As a user, I can create text notes | P0 |
| US-11 | As a user, I can import content from a URL | P0 |
| US-12 | As a user, I can upload files (PDF, text) | P0 |
| US-13 | As a user, I can import from CSV | P1 |
| US-14 | As a user, I can import from Google Drive | P1 |
| US-15 | As a user, I can tag and categorise entries | P0 |
| US-16 | As a user, I can favourite entries | P1 |
| US-17 | As a user, I can search all my content | P0 |
| US-18 | As a user, I can bulk-select and delete/tag entries | P1 |
| US-19 | As a user, I can undo/redo knowledge edits | P1 |
| US-20 | As a user, I can soft-delete entries (with restore) | P1 |
| US-21 | As a user, I can save filter presets for quick access | P2 |
| US-22 | As a user, I can export my knowledge base via email | P2 |

### TESSA AI Chat

| ID | Story | Priority |
|---|---|---|
| US-30 | As a user, I can start a new chat with TESSA | P0 |
| US-31 | As a user, TESSA answers questions using my knowledge base | P0 |
| US-32 | As a user, I can have multiple named chat sessions | P1 |
| US-33 | As a user, I can delete chat sessions | P1 |
| US-34 | As a user, I receive a clear error if I hit rate limits | P1 |

### Offline & PWA

| ID | Story | Priority |
|---|---|---|
| US-40 | As a user, I can install the app to my home screen | P1 |
| US-41 | As a user, I can read my knowledge base offline | P1 |
| US-42 | As a user, edits I make offline sync when I reconnect | P1 |
| US-43 | As a user, I see an offline indicator when disconnected | P1 |

### Settings & Profile

| ID | Story | Priority |
|---|---|---|
| US-50 | As a user, I can update my profile (name, bio, avatar) | P1 |
| US-51 | As a user, I can switch between dark and light theme | P1 |
| US-52 | As a user, I can change my password | P1 |
| US-53 | As a user, I can use `Ctrl+K` command palette | P1 |

### Admin

| ID | Story | Priority |
|---|---|---|
| US-60 | As an admin, I can view usage metrics across users | P2 |
| US-61 | As an admin, I can monitor rate limit usage | P2 |
| US-62 | As an admin, I can view failed login attempts | P2 |
| US-63 | As an admin, I can see system health status | P2 |

---

## 5. Non-Functional Requirements

| Category | Requirement |
|---|---|
| **Performance** | Initial page load < 3s on 3G; LCP < 2.5s |
| **Offline** | Core read operations available with no network |
| **Accessibility** | WCAG 2.1 AA compliance |
| **Security** | All user data isolated via RLS; MFA available; HTTPS only |
| **Test coverage** | ≥ 70% statements, ≥ 65% branches |
| **Bundle size** | Main JS chunk < 200KB gzipped |
| **Compatibility** | Chrome/Edge/Firefox/Safari (last 2 major versions) |
| **Privacy** | No third-party analytics in production by default |

---

## 6. Feature Flags

All features below are controlled by environment variables (see `src/config/app-config.ts`):

| Flag | Default | Controls |
|---|---|---|
| `VITE_OFFLINE_MODE` | `true` | Background sync and offline support |
| `VITE_PREFETCH_ENABLED` | `true` | Data prefetching on hover/focus |
| `VITE_VIRTUAL_SCROLL` | `true` | Virtualised lists for performance |
| `VITE_PERF_MONITORING` | `true` | Web Vitals reporting |

---

## 7. Out of Scope (v0.1.x)

- Real-time collaboration / shared workspaces
- Native mobile apps (iOS/Android)
- Custom AI model fine-tuning
- Public knowledge base sharing
- Self-hosted Supabase orchestration tooling
- Billing / subscription management UI

---

## 8. Success Metrics

| Metric | Target (v1.0) |
|---|---|
| Test pass rate | 100% |
| Test coverage | ≥ 70% all categories |
| Lighthouse PWA score | ≥ 90 |
| Lighthouse Performance score | ≥ 80 |
| Open GitHub issues (bugs) | < 5 |
| npm audit high/critical | 0 in production deps |
