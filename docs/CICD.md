# CI/CD Pipeline Documentation

**Version**: 1.0.0 · **Last Updated**: 2026-03-08 · **Owner**: DevOps / Tech Lead

This document describes all GitHub Actions workflows, their triggers, jobs, gates, and the end-to-end deployment pipeline for the Tessa AI Platform.

---

## Table of Contents

1. [Pipeline Overview](#1-pipeline-overview)
2. [Workflow Inventory](#2-workflow-inventory)
3. [Workflow Details](#3-workflow-details)
4. [Deployment Pipeline](#4-deployment-pipeline)
5. [Branch Protection Rules](#5-branch-protection-rules)
6. [Secrets and Environment Variables](#6-secrets-and-environment-variables)
7. [Failure Handling](#7-failure-handling)
8. [Adding a New Workflow](#8-adding-a-new-workflow)

---

## 1. Pipeline Overview

```
Developer pushes branch
        │
        ▼
┌──────────────────────────────────────────────────────────┐
│  On Pull Request to main / develop                        │
│                                                          │
│  ci.yml          test.yml         codeql.yml             │
│  (build/lint)    (test+coverage)  (security scan)        │
│                                                          │
│  All must pass before merge is allowed                    │
└────────────────────────┬─────────────────────────────────┘
                         │ PR merged to main
                         ▼
┌──────────────────────────────────────────────────────────┐
│  release-please.yml                                       │
│  Creates / updates Release PR (CHANGELOG, version bump)  │
└────────────────────────┬─────────────────────────────────┘
                         │ Release PR merged
                         ▼
┌──────────────────────────────────────────────────────────┐
│  release.yml → deploy.yml                                 │
│  Tag created → Production deploy triggered                │
└──────────────────────────────────────────────────────────┘
```

---

## 2. Workflow Inventory

| File | Trigger | Purpose |
|---|---|---|
| `ci.yml` | PR to `main`; push to `main` | Build, type-check, lint, unit test |
| `test.yml` | PR to `main`/`develop`; push to `main`/`develop` | Tests with coverage enforcement (≥ 70%) |
| `codeql.yml` | PR to `main`; push to `main`; weekly schedule | Static security analysis |
| `deploy.yml` | Push to `main`; workflow dispatch | Deploy to production hosting |
| `release-please.yml` | Push to `main` | Automated versioning and release PR |
| `release.yml` | Push of `v*` tag | Create GitHub release; trigger deployment |
| `labeler.yml` | PR opened/edited | Auto-label PRs by changed files |
| `stale.yml` | Daily schedule | Close stale issues and PRs |
| `branch-cleanup.yml` | PR closed | Delete merged feature branches |
| `welcome.yml` | First-time contributor | Post welcome comment |
| `visual-regression.yml` | PR to `main` | Screenshot comparison (Playwright) |

---

## 3. Workflow Details

### 3.1 `ci.yml` — Continuous Integration

**Triggers**: PR to `main`; push to `main`.

**Jobs**:

1. **`build-test`** (Node 20, Ubuntu Latest)
   - Checkout code
   - Setup Node.js with npm cache
   - `npm ci` — clean install
   - `npm run typecheck --if-present` — TypeScript check
   - `npm run lint --if-present` — ESLint
   - `npm test --if-present` — unit tests
   - `npm run build` — production build

**Concurrency**: `ci-<ref>` — cancels in-progress runs for the same ref.

**Permissions**: `contents: read` only.

---

### 3.2 `test.yml` — Test with Coverage

**Triggers**: PR and push to `main`/`develop`; manual dispatch (`workflow_dispatch`).

**Jobs**:

1. **`test-coverage`** — Runs `npm run test:coverage`; checks thresholds:

   | Metric | Threshold |
   |---|---|
   | Statements | ≥ 70% |
   | Branches | ≥ 65% |
   | Functions | ≥ 70% |
   | Lines | ≥ 70% |

   - Uploads coverage report as artefact (retained 30 days).
   - Posts coverage table as PR comment.

2. **`test-summary`** — Final pass/fail gate; always runs.

3. **`openapi-validation`** — Validates `docs/openapi.yaml` with `@apidevtools/swagger-cli`.

**Key Configuration**:
- `HUSKY: 0` — disables git hooks in CI.
- `CI: true` — enables CI mode in Vitest.
- Coverage summary read from `coverage/coverage-summary.json`.

---

### 3.3 `codeql.yml` — Security Analysis

**Triggers**: PR and push to `main`; weekly schedule (Monday 00:00 UTC).

**Language**: JavaScript/TypeScript.

**Actions**:
- `github/codeql-action/init`
- `github/codeql-action/autobuild`
- `github/codeql-action/analyze`

Results appear in the **Security → Code scanning** tab.

---

### 3.4 `release-please.yml` — Automated Versioning

**Triggers**: Push to `main`.

**Tool**: `google-github-actions/release-please-action`

**Config file**: `release-please-config.json`  
**Manifest file**: `.release-please-manifest.json`

**What it does**:
1. Reads Conventional Commit messages since last release.
2. Determines version bump (major/minor/patch).
3. Creates or updates a "Release PR" that updates `CHANGELOG.md` and `package.json`.
4. When the Release PR is merged, creates a GitHub Release and a `v*` tag.

**Version bump rules**:
- `feat:` → minor
- `fix:`, `docs:`, `chore:` → patch
- `feat!:` / `BREAKING CHANGE:` → major

---

### 3.5 `release.yml` — GitHub Release Creation

**Triggers**: Push of tags matching `v*.*.*`.

**Jobs**:
1. Build production artefact.
2. Create GitHub Release with auto-generated notes.
3. Upload build artefacts.
4. Trigger `deploy.yml` (via `workflow_dispatch`).

---

### 3.6 `deploy.yml` — Production Deployment

**Triggers**: Push to `main`; called by `release.yml`; manual `workflow_dispatch`.

**Jobs**:
1. Build (`npm run build`) — produces `dist/`.
2. Deploy to hosting platform (Vercel / Netlify via CLI or platform auto-deploy).
3. Run `supabase db push` for pending migrations.
4. Redeploy Edge Functions: `supabase functions deploy`.
5. Post-deploy smoke test.

**Required Secrets** (configured in GitHub repository settings):

| Secret | Description |
|---|---|
| `VERCEL_TOKEN` | Vercel API token |
| `VERCEL_ORG_ID` | Vercel organisation ID |
| `VERCEL_PROJECT_ID` | Vercel project ID |
| `SUPABASE_ACCESS_TOKEN` | Supabase access token for CLI |
| `SUPABASE_PROJECT_REF` | Supabase project reference ID |

---

### 3.7 `visual-regression.yml` — Visual Regression Testing

**Triggers**: PR to `main`.

**Tool**: Playwright screenshot comparison.

**Jobs**:
1. Build app.
2. Start preview server.
3. Take screenshots of key routes.
4. Compare against baseline screenshots (stored as artefacts).
5. Fail PR if pixel difference > threshold.

**Updating Baselines**:
```bash
npx playwright test --update-snapshots
git add e2e/screenshots/
git commit -m "chore: update visual regression baselines"
```

---

## 4. Deployment Pipeline

### 4.1 Environment Promotion

```
feature branch → PR → develop (integration)
                              │
                              ▼
                     PR → main (production)
                              │
                              ▼
                     Release Please PR → tag → deploy
```

### 4.2 Production Deploy Steps (manual reference)

If automated deployment fails, follow these steps:

```bash
# 1. Build
npm ci
npm run build

# 2. Deploy frontend
vercel --prod --token $VERCEL_TOKEN
# OR
netlify deploy --prod --dir=dist --auth=$NETLIFY_TOKEN

# 3. Apply database migrations
supabase db push --project-ref $SUPABASE_PROJECT_REF

# 4. Redeploy edge functions
supabase functions deploy --project-ref $SUPABASE_PROJECT_REF

# 5. Verify deployment
curl https://your-app.vercel.app/health
```

### 4.3 Rollback

See [Operational Runbook — Rollback Procedures](RUNBOOK.md#6-rollback-procedures).

---

## 5. Branch Protection Rules

Applied to `main`:

| Rule | Setting |
|---|---|
| Require PR | Yes — direct push to `main` is blocked |
| Required status checks | `ci.yml/build-test`, `test.yml/test-coverage`, `codeql.yml/analyze` |
| Dismiss stale approvals | Yes — new commits dismiss existing approvals |
| Required approvals | 1 |
| Include administrators | Yes |
| Restrict force push | Yes |

---

## 6. Secrets and Environment Variables

### GitHub Actions Secrets

Secrets are stored in **Settings → Secrets and variables → Actions**.

| Secret | Used By | Description |
|---|---|---|
| `VERCEL_TOKEN` | `deploy.yml` | Deploy to Vercel |
| `VERCEL_ORG_ID` | `deploy.yml` | Vercel org |
| `VERCEL_PROJECT_ID` | `deploy.yml` | Vercel project |
| `SUPABASE_ACCESS_TOKEN` | `deploy.yml` | Supabase CLI auth |
| `SUPABASE_PROJECT_REF` | `deploy.yml` | Supabase project ID |
| `VITE_SUPABASE_URL` | CI build | Supabase project URL (staging/prod) |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | CI build | Supabase anon key (staging/prod) |

### Variable vs Secret

- **Secret**: sensitive values (API keys, tokens) — masked in logs.
- **Variable**: non-sensitive config (URLs, feature flags) — visible in logs.

---

## 7. Failure Handling

### Interpreting CI Failures

| Failure | Cause | Resolution |
|---|---|---|
| `npm ci` fails | Corrupt `package-lock.json` or registry outage | Delete `node_modules`, run `npm install`, commit lock file |
| TypeScript errors | Type mismatch introduced | Run `npm run type-check` locally, fix errors |
| ESLint errors | Coding standard violation | Run `npm run lint:fix` locally |
| Coverage below threshold | Test coverage reduced | Add/fix tests before merging |
| `codeql` alert | Security vulnerability detected | Review alert in Security tab; fix before merge |
| OpenAPI validation fails | `docs/openapi.yaml` out of sync | Update spec to match edge function changes |
| Visual regression fails | UI change without updating baselines | Update baselines if intentional; fix if regression |

### Re-running a Failed Job

1. Go to the failing workflow run on GitHub.
2. Click **Re-run failed jobs** (top right).
3. If flaky, re-run all jobs.

---

## 8. Adding a New Workflow

1. Create `<name>.yml` in `.github/workflows/`.
2. Set `permissions` to the minimum needed (`contents: read` by default).
3. Add `concurrency` group to cancel duplicate runs.
4. Use pinned action versions (e.g. `actions/checkout@v4`).
5. Do **not** print secrets to logs.
6. Document the workflow in this file.

### Workflow Template

```yaml
name: My New Workflow

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

permissions:
  contents: read

jobs:
  my-job:
    runs-on: ubuntu-latest
    timeout-minutes: 15
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: # your commands here
```

---

## Related Documentation

- [Release Policy](RELEASE_POLICY.md)
- [Deployment Guide](DEPLOYMENT.md)
- [Operational Runbook](RUNBOOK.md)
- [Security Guide](SECURITY.md)
