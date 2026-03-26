# INT Engineering — PR Governance Policy v1.0

**Owner:** Platform Engineering & AppSec  
**Effective Date:** 2026-03-26  
**Review Cycle:** Quarterly  
**Status:** Active

---

## Table of Contents

1. [Purpose & Scope](#1-purpose--scope)
2. [Branch Protection Rules](#2-branch-protection-rules)
3. [CODEOWNERS Guidance](#3-codeowners-guidance)
4. [Merge Requirements](#4-merge-requirements)
5. [PR Hygiene Standards](#5-pr-hygiene-standards)
6. [Security Review Process](#6-security-review-process)
7. [Automated Governance (pr-governance workflow)](#7-automated-governance-pr-governance-workflow)
8. [Enforcement & Escalation](#8-enforcement--escalation)
9. [Three-Phase Rollout Plan](#9-three-phase-rollout-plan)
10. [Appendix — gh CLI Branch Protection Command](#10-appendix--gh-cli-branch-protection-command)

---

## 1. Purpose & Scope

This policy establishes the minimum standards for pull-request (PR) creation, review, and merge for all repositories under the INT Engineering organisation. It applies to every engineer, contractor, and automated system (bots, CI pipelines) that opens PRs against a protected branch.

**Goals:**

- Prevent unreviewed or insecure code from reaching production.
- Ensure every change is traceable, documented, and reversible.
- Reduce review fatigue by keeping PRs small and focused.
- Automatically route security-sensitive changes to the right reviewers.

---

## 2. Branch Protection Rules

The following rules **must** be applied to the `main` branch (and any long-lived release branches) of every production service repository.

| Rule | Required Setting | Rationale |
|---|---|---|
| Require pull request before merging | ✅ Enabled | No direct pushes to `main` |
| Required approving reviews | **Minimum 1** | At least one peer review |
| Dismiss stale pull request approvals when new commits are pushed | ✅ Enabled | Re-review after force-push or new commits |
| Require review from Code Owners | ✅ Enabled | Domain experts must approve changes in their area |
| Require status checks to pass before merging | ✅ Enabled | CI must be green |
| Required status checks | `CI / build-test`, `lint`, `Test / unit-tests`, `security-scan` | All four must pass |
| Require branches to be up to date before merging | ✅ Enabled | Prevents integration surprises |
| Require conversation resolution before merging | ✅ Enabled | All review threads must be resolved |
| Include administrators | ✅ Enforced for admins | No bypass for repo admins |
| Allow force pushes | ❌ Disabled | History integrity |
| Allow deletions | ❌ Disabled | Prevent accidental branch deletion |
| Restrict pushes that create matching branches | ✅ Enabled (admins only) | Controlled branch creation |

> **Note:** These settings are applied via the `gh` CLI command provided in [Section 10 (Appendix)](#10-appendix--gh-cli-branch-protection-command). Repository administrators must run this command after reviewing it.

---

## 3. CODEOWNERS Guidance

### File Location

The `CODEOWNERS` file lives at `.github/CODEOWNERS`. GitHub enforces it when "Require review from Code Owners" is enabled in branch protection.

### Ownership Principles

1. **Every file must have an owner.** The catch-all rule (`* @your-username`) ensures no file is unowned.
2. **Security-sensitive paths require a dedicated security team entry.** Add explicit entries for:
   ```
   /src/auth/             @your-org/security-team
   /src/utils/security.ts @your-org/security-team
   /supabase/migrations/  @your-org/backend-team @your-org/security-team
   .env*                  @your-org/platform-team @your-org/security-team
   ```
3. **Minimise ownership breadth.** Prefer team accounts (`@org/team`) over individual accounts to avoid single-person bottlenecks.
4. **Review CODEOWNERS quarterly** as part of the governance review cycle.

### Example Security Entries

```gitattributes
# Security-sensitive paths — always require AppSec review
/src/auth/              @your-org/appsec @your-org/backend-lead
/src/utils/security.ts  @your-org/appsec
/supabase/functions/    @your-org/appsec @your-org/backend-team
/supabase/migrations/   @your-org/appsec @your-org/backend-team
.env*                   @your-org/appsec @your-org/platform-team
terraform/              @your-org/appsec @your-org/platform-team
helm/                   @your-org/appsec @your-org/platform-team
```

---

## 4. Merge Requirements

### Merge Strategy

| Branch Type | Allowed Merge Strategy | Rationale |
|---|---|---|
| Feature branches → `main` | **Squash and merge only** | Clean, linear history; one commit per feature |
| Release branches → `main` | **Merge commit** | Preserve release history and tag points |
| Hotfix branches → `main` | **Squash and merge** | Minimal, atomic hotfix commits |
| `main` → release (backport) | **Cherry-pick** (manual) | Surgical backport; no unintended changes |

> Repository settings must be configured with only **"Allow squash merging"** enabled for feature branches. Disable "Allow merge commits" and "Allow rebase merging" for standard repositories.

### Commit Message Format (Squash)

Squashed commits must follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <short description>

[optional body]

[optional footer: Fixes #<issue>, Co-authored-by: ...]
```

**Allowed types:** `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`, `ci`, `build`, `revert`

---

## 5. PR Hygiene Standards

### Size Limits

| Metric | Guideline | Enforcement |
|---|---|---|
| Lines changed | ≤ 800 lines | Automated warning comment posted by `pr-governance` workflow |
| Files changed | ≤ 20 files | Advisory (no automated gate yet) |
| Commits in branch | ≤ 10 (pre-squash) | Advisory |

PRs exceeding 800 lines changed will receive an automated warning comment. Authors **must** either:
- Split the PR into smaller units, **or**
- Provide a written justification in the PR body for why the PR cannot be split.

### Required PR Fields

Every PR must include:

- [ ] **Summary** — One to three sentences describing what the PR does and why.
- [ ] **Type of Change** — At least one type checkbox ticked.
- [ ] **What Changed** — Bullet list of meaningful changes (not a rehash of commit messages).
- [ ] **Testing** — Description of how the change was verified, including test coverage checkboxes.
- [ ] **Security Impact** — Explicit attestation that security implications were considered.
- [ ] **Rollback Plan** — How to revert if the change causes issues in production.

### Prohibited Practices

- **No force-pushes** to `main` or any protected branch.
- **No self-merge** — authors must not merge their own PRs (enforced by requiring at least 1 approving review from another user).
- **No WIP merges** — PRs with `WIP`, `DO NOT MERGE`, or `draft` in the title or in draft state must not be merged.
- **No stripping the `security-review` label** after it has been automatically applied.
- **No bypassing CI** — do not merge while required status checks are failing or pending.

---

## 6. Security Review Process

### Trigger Conditions

The `pr-governance` workflow automatically applies the `security-review` label when a PR modifies any of the following path patterns:

| Path Pattern | Category |
|---|---|
| `src/auth/**` | Authentication & authorisation logic |
| `infra/**` | Infrastructure-as-code |
| `secrets/**` | Secret management |
| `middleware/**` | HTTP middleware |
| `.env`, `.env.*` | Environment variable definitions |
| `terraform/**` | Terraform infrastructure |
| `helm/**` | Helm charts / Kubernetes configuration |

### Review Requirements

Once the `security-review` label is applied:

1. **CI will fail** at the `security-review-gate` job until all conditions are met.
2. A member of the `@security-review` team (or `@your-org/appsec`) must **approve** the PR.
3. The reviewer must verify:
   - No secrets are hard-coded or logged.
   - Input validation and sanitisation are correct.
   - Auth/authz changes do not introduce privilege-escalation paths.
   - RLS policies are in place for any new database objects.
   - CSP, CORS, and header configurations are unchanged or tightened.

### Escalation

If no security reviewer is available within **1 business day**, the PR author must:
1. Post in `#security-reviews` Slack channel with a link to the PR.
2. Tag `@appsec-oncall` for urgent reviews.

---

## 7. Automated Governance (pr-governance workflow)

The `.github/workflows/pr-governance.yml` workflow runs on every PR event (`opened`, `synchronize`, `reopened`, `labeled`, `unlabeled`) and contains three jobs:

| Job | Name | What it does |
|---|---|---|
| `label-security-prs` | Label security-sensitive PRs | Detects changes to sensitive paths; creates and applies the `security-review` label |
| `security-review-gate` | Security review gate | **Fails CI** if sensitive paths are touched but the `security-review` label is absent |
| `pr-size-check` | PR size check | Posts an automated warning comment when a PR exceeds 800 lines changed |

### Permissions Required

The workflow requires the following GitHub token permissions (granted by default via `GITHUB_TOKEN`):

- `pull-requests: write` — to add/edit labels and post comments
- `issues: write` — to manage label metadata
- `contents: read` — to diff file changes

---

## 8. Enforcement & Escalation

| Violation | First Occurrence | Repeat Offence |
|---|---|---|
| Merging without required reviews | PR reverted; author notified | Temporary write-access suspension |
| Bypassing CI status checks | Incident review required | Temporary write-access suspension |
| Stripping `security-review` label | PR blocked; security team notified | Incident review |
| Merging a PR > 800 lines without justification | PR reverted; author notified | Mandatory PR size training |
| Direct push to `main` | Commit reverted; incident filed | Temporary write-access suspension |

Enforcement is the responsibility of the **Platform Engineering** team in coordination with **AppSec**.

---

## 9. Three-Phase Rollout Plan

### Phase 1 — Soft Launch (Weeks 1–2)

**Goal:** Introduce tooling with no enforcement; build awareness.

- [ ] Merge this policy document and `pr-governance.yml` to `main`.
- [ ] Update `PULL_REQUEST_TEMPLATE.md` with new required sections.
- [ ] Enable `pr-governance` workflow in **warn-only** mode (no CI failure).
- [ ] Announce policy to all engineers via `#engineering` Slack channel.
- [ ] Run a 30-minute lunch-and-learn walkthrough of the new PR template.
- [ ] Collect feedback via a short survey.

### Phase 2 — Enforcement Preview (Weeks 3–4)

**Goal:** Enable CI gates; resolve tooling issues before hard enforcement.

- [ ] Enable `security-review-gate` job (CI fails for missing label on security-sensitive PRs).
- [ ] Apply branch protection rules to `main` using the `gh` CLI command in Appendix A.
- [ ] Update `CODEOWNERS` with explicit `@security-team` entries for sensitive paths.
- [ ] Monitor for false positives and adjust path patterns as needed.
- [ ] Document exceptions process for legitimate large PRs.

### Phase 3 — Full Enforcement (Week 5+)

**Goal:** All rules are fully enforced; policy is stable.

- [ ] Confirm all required status checks are reliably passing in CI.
- [ ] Enable "Require branches to be up to date before merging".
- [ ] Enable "Require conversation resolution before merging".
- [ ] Schedule first quarterly policy review (90 days from effective date).
- [ ] Archive Phase 1 & 2 Slack threads as ADR evidence.

---

## 10. Appendix — gh CLI Branch Protection Command

Run the following command **after reviewing it** to apply branch protection rules to the `main` branch of this repository.

```bash
gh api \
  --method PUT \
  -H "Accept: application/vnd.github+json" \
  -H "X-GitHub-Api-Version: 2022-11-28" \
  "/repos/Krosebrook/cortex-second-brain-4589/branches/main/protection" \
  -f "required_status_checks[strict]=true" \
  -f "required_status_checks[checks][][context]=CI / build-test" \
  -f "required_status_checks[checks][][context]=lint" \
  -f "required_status_checks[checks][][context]=Test / unit-tests" \
  -f "required_status_checks[checks][][context]=security-scan" \
  -f "enforce_admins=true" \
  -f "required_pull_request_reviews[dismiss_stale_reviews]=true" \
  -f "required_pull_request_reviews[require_code_owner_reviews]=true" \
  -f "required_pull_request_reviews[required_approving_review_count]=1" \
  -f "required_pull_request_reviews[bypass_pull_request_allowances][users]=[]" \
  -f "required_pull_request_reviews[bypass_pull_request_allowances][teams]=[]" \
  -f "restrictions=null" \
  -f "allow_force_pushes=false" \
  -f "allow_deletions=false" \
  -f "required_conversation_resolution=true"
```

> **What this enforces:**
> - 1 approving review required before merge
> - Stale reviews dismissed when new commits are pushed
> - Code Owners must review changes in their owned paths
> - Admins are not exempt from protection rules
> - Force pushes and branch deletion are disabled
> - All four required status checks (`CI / build-test`, `lint`, `Test / unit-tests`, `security-scan`) must pass before merge
> - All review conversations must be resolved before merge
> - Branch must be up to date with `main` before merge (`strict: true`)

---

*This document is maintained by Platform Engineering & AppSec. For questions or exceptions, open an issue tagged `governance` or post in `#platform-eng`.*
