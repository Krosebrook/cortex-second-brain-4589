# New Developer Onboarding Checklist

**Version**: 1.0.0 · **Last Updated**: 2026-03-08 · **Owner**: Tech Lead

Welcome to the Tessa AI Platform team! This checklist guides you through everything you need to be fully productive. Aim to complete Day 1–2 items before your first standup, and Day 3–5 items within your first week.

---

## Table of Contents

1. [Before You Start](#1-before-you-start)
2. [Day 1 — Environment & Access](#2-day-1--environment--access)
3. [Day 2 — Codebase Exploration](#3-day-2--codebase-exploration)
4. [Day 3 — First Contribution](#4-day-3--first-contribution)
5. [Day 4–5 — Deep Dive](#5-day-45--deep-dive)
6. [First Week Milestones](#6-first-week-milestones)
7. [Useful Resources](#7-useful-resources)
8. [Who to Ask for What](#8-who-to-ask-for-what)

---

## 1. Before You Start

These should be completed by your manager or team lead **before** your first day.

- [ ] GitHub organisation invitation sent and accepted
- [ ] Supabase project access granted (staging environment)
- [ ] Slack workspace invitation sent
- [ ] Password manager / secrets vault access set up
- [ ] Meeting invitations: daily standup, sprint planning, retrospective

---

## 2. Day 1 — Environment & Access

### 2.1 Accounts and Access

- [ ] Log into GitHub; confirm you can access the repository
- [ ] Log into Supabase dashboard — staging project only on Day 1
- [ ] Log into team Slack; join `#general`, `#dev`, `#incidents`, `#deployments`
- [ ] Set up 2FA on GitHub and Supabase accounts

### 2.2 Local Development Setup

- [ ] Install Node.js ≥ 18.x (Node 20 LTS recommended)
- [ ] Install Git ≥ 2.30 and configure user name + email
- [ ] Install VS Code with recommended extensions (see `docs/DEVELOPER_GUIDE.md` §1)
- [ ] Install Supabase CLI: `npm install -g supabase`

### 2.3 Clone and Run

```bash
git clone https://github.com/Krosebrook/cortex-second-brain-4589.git
cd cortex-second-brain-4589
npm install
npx husky install
cp .env.example .env
# Fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
# (get values from the team password manager)
npm run dev
```

- [ ] App runs at `http://localhost:8080` without errors
- [ ] You can sign in with a test account
- [ ] You can create a chat message and see the AI response

### 2.4 Run Tests

```bash
npm run test          # Unit tests
npm run test:coverage # Coverage report
```

- [ ] All tests pass (or known failures are explained by your buddy)
- [ ] Coverage report generated in `coverage/`

### 2.5 Read Core Documentation

- [ ] [README.md](../README.md) — project overview
- [ ] [docs/ARCHITECTURE.md](ARCHITECTURE.md) — system design
- [ ] [docs/SECURITY.md](SECURITY.md) — security model and RLS
- [ ] [CONTRIBUTING.md](../CONTRIBUTING.md) — contribution process

---

## 3. Day 2 — Codebase Exploration

### 3.1 Read Developer Documentation

- [ ] [docs/DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md) — coding conventions, patterns
- [ ] [docs/DATABASE_SCHEMA.md](DATABASE_SCHEMA.md) — table structure and RLS
- [ ] [docs/TESTING.md](TESTING.md) — testing strategy
- [ ] [docs/CICD.md](CICD.md) — CI/CD pipeline overview

### 3.2 Explore the Codebase

Walk through each section of `src/`:

- [ ] `src/components/` — identify 3 key components and understand their props
- [ ] `src/hooks/` — read `useChat.ts` and `useKnowledgeItems.ts` (or similar)
- [ ] `src/services/` — understand the data access layer pattern
- [ ] `src/utils/security.ts` and `src/utils/exportUtils.ts` — utilities
- [ ] `supabase/functions/chat-with-tessa-secure/` — read the AI chat edge function

### 3.3 Run the App End-to-End

- [ ] Create a knowledge item (note or document)
- [ ] Search the knowledge base
- [ ] Start a new chat and ask the AI about your knowledge item
- [ ] Export results to PDF (`exportUtils` → jsPDF)

### 3.4 Review Recent Pull Requests

- [ ] Read the last 3 merged PRs on GitHub to understand the team's coding style
- [ ] Note any patterns you see repeated (component structure, hook patterns)

---

## 4. Day 3 — First Contribution

### 4.1 Pick a Starter Task

Ask your buddy or tech lead for a `good-first-issue` ticket. Ideal first tasks:
- Fix a minor UI bug
- Add a missing unit test
- Update a documentation section

### 4.2 Development Workflow

```bash
# Create your branch
git checkout develop
git pull origin develop
git checkout -b fix/<ticket-id>-short-description

# Make changes
# … edit files …

# Verify
npm run lint:fix
npm run type-check
npm run test

# Commit (use Conventional Commits)
git commit -m "fix(component): describe what you fixed"

# Push and open PR against develop
git push origin fix/<ticket-id>-short-description
```

- [ ] Branch created from `develop`
- [ ] ESLint and TypeScript pass locally
- [ ] Tests pass locally
- [ ] PR opened with description filled in
- [ ] PR linked to the issue (`Fixes #<issue-number>`)
- [ ] CI checks pass on your PR

### 4.3 Code Review

- [ ] Request a review from your buddy or tech lead
- [ ] Address feedback and push updates
- [ ] PR merged 🎉

---

## 5. Day 4–5 — Deep Dive

### 5.1 Advanced Documentation

- [ ] [docs/FAILURE_MODES.md](FAILURE_MODES.md) — understand failure scenarios
- [ ] [docs/ERROR_HANDLING_GUIDE.md](ERROR_HANDLING_GUIDE.md) — error patterns
- [ ] [docs/OBSERVABILITY.md](OBSERVABILITY.md) — logging and monitoring
- [ ] [docs/CONFIGURATION_MANAGEMENT.md](CONFIGURATION_MANAGEMENT.md) — all environment variables
- [ ] [docs/RELEASE_POLICY.md](RELEASE_POLICY.md) — release and versioning process

### 5.2 Supabase Deep Dive

- [ ] Explore the Supabase Dashboard (staging) — Database, Auth, Edge Functions, Logs
- [ ] Run a raw SQL query in the SQL Editor to understand the schema
- [ ] View the RLS policies on the `knowledge_base` table
- [ ] Read the `chat-with-tessa-secure` edge function logs

### 5.3 E2E Testing

```bash
npx playwright install --with-deps
npx playwright test --headed   # Watch tests run in browser
```

- [ ] E2E tests run successfully
- [ ] You understand what each E2E spec is testing (`e2e/` directory)

### 5.4 Security Awareness

- [ ] Read and acknowledge the [Security Guide](SECURITY.md)
- [ ] Understand what data must **never** be logged (passwords, API keys, PII)
- [ ] Understand RLS: why every table has it and how policies work
- [ ] Understand the secrets management approach (`.env` local; Supabase secrets for edge functions)

---

## 6. First Week Milestones

By end of Week 1, you should be able to:

| Milestone | Verified By |
|---|---|
| ✅ Run the app locally without help | Self |
| ✅ Run all tests and understand the coverage report | Self |
| ✅ Explain the system architecture (diagram in ARCHITECTURE.md) | Buddy |
| ✅ Open, review, and merge a PR | Tech Lead |
| ✅ Explain what RLS is and why it matters | Tech Lead |
| ✅ Locate and describe the error handling pattern | Self |
| ✅ Create a Supabase migration (in a dev branch, not pushed) | Self |

---

## 7. Useful Resources

| Resource | Link |
|---|---|
| Architecture Overview | [docs/ARCHITECTURE.md](ARCHITECTURE.md) |
| Developer Guide | [docs/DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md) |
| Database Schema | [docs/DATABASE_SCHEMA.md](DATABASE_SCHEMA.md) |
| API Reference | [docs/API.md](API.md) + [docs/openapi.yaml](openapi.yaml) |
| Testing Guide | [docs/TESTING.md](TESTING.md) |
| Security Guide | [docs/SECURITY.md](SECURITY.md) |
| Deployment Guide | [docs/DEPLOYMENT.md](DEPLOYMENT.md) |
| CI/CD Pipelines | [docs/CICD.md](CICD.md) |
| Error Handling | [docs/ERROR_HANDLING_GUIDE.md](ERROR_HANDLING_GUIDE.md) |
| Failure Modes | [docs/FAILURE_MODES.md](FAILURE_MODES.md) |
| Contributing | [CONTRIBUTING.md](../CONTRIBUTING.md) |
| Supabase Docs | [supabase.com/docs](https://supabase.com/docs) |
| TanStack Query | [tanstack.com/query](https://tanstack.com/query/latest) |
| React Testing Library | [testing-library.com](https://testing-library.com/docs/react-testing-library/intro) |
| Tailwind CSS | [tailwindcss.com/docs](https://tailwindcss.com/docs) |

---

## 8. Who to Ask for What

| Topic | Ask |
|---|---|
| Codebase questions / architecture | Tech Lead |
| Day-to-day development questions | Your Buddy |
| Product requirements / feature scope | Product Owner |
| CI/CD and infrastructure | DevOps |
| Test strategy and quality | QA Lead |
| Security concerns | Tech Lead + report to manager |
| Access and permissions | Manager |
| Incident response | On-call rotation (see `docs/RUNBOOK.md`) |

---

*Welcome to the team! If you find anything in this checklist that is outdated or unclear, please open a PR to fix it — that's your first contribution!* 🚀
