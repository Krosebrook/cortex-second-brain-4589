# Release & Versioning Policy

**Version**: 1.0.0 · **Last Updated**: 2026-03-08 · **Owner**: Tech Lead / Product Owner

This document defines the semantic versioning rules, branching strategy, release process, and change management policy for the Tessa AI Platform.

---

## Table of Contents

1. [Semantic Versioning Rules](#1-semantic-versioning-rules)
2. [Branching Strategy](#2-branching-strategy)
3. [Commit Message Convention](#3-commit-message-convention)
4. [Release Process](#4-release-process)
5. [Hotfix Process](#5-hotfix-process)
6. [Pre-release Versions](#6-pre-release-versions)
7. [Database Migration Versioning](#7-database-migration-versioning)
8. [Deprecation Policy](#8-deprecation-policy)
9. [Changelog Maintenance](#9-changelog-maintenance)

---

## 1. Semantic Versioning Rules

The project follows [Semantic Versioning 2.0.0](https://semver.org/): `MAJOR.MINOR.PATCH`.

| Version Segment | When to Bump | Examples |
|---|---|---|
| **MAJOR** (`X.0.0`) | Breaking changes to public APIs, data models, or user-facing behaviour | Removing an edge function endpoint; non-backward-compatible DB schema change; renaming a required env variable |
| **MINOR** (`0.X.0`) | New backward-compatible features | New AI model support; new knowledge category; new edge function |
| **PATCH** (`0.0.X`) | Bug fixes, performance improvements, docs, refactors | Fix chat timeout; update dependency; add test |

### Current Version

The authoritative version is in `package.json` (`version` field) and `.release-please-manifest.json`. Do **not** manually edit these — Release Please manages them.

---

## 2. Branching Strategy

```
main           ← Production; always deployable; protected
  └─ develop   ← Integration; tested but not yet released
       ├─ feature/<ticket-id>-short-description
       ├─ fix/<ticket-id>-short-description
       ├─ chore/<description>
       └─ docs/<description>
```

### Branch Rules

| Branch | Created from | Merges into | Protection |
|---|---|---|---|
| `main` | — | — | Fully protected (PRs + CI required) |
| `develop` | `main` | `main` | PRs required |
| `feature/*` | `develop` | `develop` | No direct protection |
| `fix/*` | `develop` (or `main` for hotfix) | `develop` (or `main`) | No direct protection |
| `hotfix/*` | `main` | `main` AND `develop` | No direct protection |

### Branch Naming Convention

```
feature/KB-42-add-tag-filter
fix/CHAT-31-timeout-handling
chore/upgrade-tanstack-query-v5
docs/update-api-reference
hotfix/AUTH-99-lockout-bug
```

---

## 3. Commit Message Convention

The project uses **Conventional Commits** to drive automated versioning via Release Please.

### Format

```
<type>(<optional scope>): <short description>

[optional body]

[optional footer(s)]
```

### Types

| Type | Version Bump | Description |
|---|---|---|
| `feat` | minor | New feature |
| `fix` | patch | Bug fix |
| `docs` | patch | Documentation only |
| `style` | patch | Formatting, no logic change |
| `refactor` | patch | Refactor without feature/fix |
| `perf` | patch | Performance improvement |
| `test` | patch | Adding or updating tests |
| `chore` | patch | Build process, dependency updates |
| `ci` | patch | CI configuration |
| `feat!` / `BREAKING CHANGE:` | **major** | Breaking change |

### Examples

```
feat(chat): add streaming response support
fix(auth): handle token refresh failure gracefully
docs(api): update chat endpoint request schema
chore(deps): upgrade jspdf to 4.2.0
feat!: remove legacy knowledge_items table

BREAKING CHANGE: knowledge_items has been replaced by knowledge_base.
Migrate by running migration 20260308_*.sql
```

---

## 4. Release Process

Release automation is handled by **Release Please** (`.github/workflows/release-please.yml`).

### Automated Steps

1. Developer merges feature/fix PR into `main`.
2. Release Please detects Conventional Commit types since last release.
3. Release Please creates or updates a **Release PR** with:
   - Updated `package.json` `version` field.
   - Updated `CHANGELOG.md` with grouped entries.
4. Tech Lead reviews and merges the Release PR.
5. Release Please creates a **GitHub Release** and a `vX.Y.Z` tag.
6. The `release.yml` workflow triggers and calls `deploy.yml`.
7. Production deployment runs automatically.

### Manual Release Checklist

Use this if automated release fails:

- [ ] All CI checks green on `main`.
- [ ] `npm run test:coverage` passes with ≥ 70% threshold.
- [ ] E2E tests pass in staging.
- [ ] All database migrations tested in staging.
- [ ] `CHANGELOG.md` entry written.
- [ ] `package.json` version bumped (use `npm version <major|minor|patch>`).
- [ ] Git tag created: `git tag -a vX.Y.Z -m "Release vX.Y.Z"`.
- [ ] Tag pushed: `git push origin vX.Y.Z`.
- [ ] GitHub Release created with release notes.
- [ ] Production deployment confirmed.
- [ ] Post-deploy smoke test passed.

---

## 5. Hotfix Process

A hotfix addresses a critical production bug that cannot wait for the normal release cycle.

### Steps

```bash
# 1. Create hotfix branch from main
git checkout main
git pull origin main
git checkout -b hotfix/AUTH-99-lockout-bug

# 2. Apply fix with a fix: commit
git commit -m "fix(auth): resolve account lockout not applying for IPv6"

# 3. Open PR directly to main (NOT develop)
# PR title must include "hotfix" label for tracking

# 4. After merge to main, also merge back to develop
git checkout develop
git merge main
git push origin develop

# 5. Release Please will pick up the fix: commit and include in next release PR
```

**Rule**: Hotfixes bypass `develop`. They merge to `main` directly after CI passes, then back-merge to `develop`.

---

## 6. Pre-release Versions

For major features that need extended testing before production release:

| Pre-release Type | Suffix | Example | Use Case |
|---|---|---|---|
| Alpha | `-alpha.N` | `1.0.0-alpha.1` | Internal team only; unstable |
| Beta | `-beta.N` | `1.0.0-beta.1` | Limited external users; feature-complete |
| Release Candidate | `-rc.N` | `1.0.0-rc.1` | Final testing before production |

Pre-release tags are created manually:
```bash
git tag -a v1.0.0-rc.1 -m "Release Candidate 1"
git push origin v1.0.0-rc.1
```

---

## 7. Database Migration Versioning

Supabase migrations are timestamped and immutable. They are part of the release but versioned independently.

### Rules

1. Migrations are **always** forward-only. Never delete or edit a committed migration.
2. Each PR that includes a migration must document the migration in the PR description.
3. Breaking migrations (column rename, type change) require a deprecation window.
4. Zero-downtime patterns must be used for schema changes to tables in active use.

### Tagging Migrations

For significant schema changes, note the app version in the migration comment:
```sql
-- Migration for v2.0.0: rename knowledge_items → knowledge_base
```

---

## 8. Deprecation Policy

Before removing any public-facing feature, API endpoint, or configuration variable:

| Stage | Duration | Action |
|---|---|---|
| **Deprecation notice** | ≥ 1 minor version | Add `@deprecated` comment in code; log warning on use; update docs |
| **Soft removal** | ≥ 1 minor version | Feature hidden but still functional; show "deprecated" indicator to users |
| **Hard removal** | Next major version | Feature removed; migration guide published |

### Example Deprecation Commit

```
feat(knowledge): deprecate type=web_page in favour of type=url

DEPRECATED: The `web_page` type for knowledge items is deprecated.
Use `url` instead. `web_page` will be removed in v3.0.0.
Migration: update all `type='web_page'` records to `type='url'`.
```

---

## 9. Changelog Maintenance

`CHANGELOG.md` is auto-maintained by Release Please. Manual additions should follow the **Keep a Changelog** format.

### Format

```markdown
## [Unreleased]

## [X.Y.Z] - YYYY-MM-DD

### Added
- New feature description (#PR_NUMBER)

### Changed
- Changed behaviour description (#PR_NUMBER)

### Deprecated
- Deprecated feature description (#PR_NUMBER)

### Removed
- Removed feature description (#PR_NUMBER)

### Fixed
- Bug fix description (#PR_NUMBER)

### Security
- Security fix description (CVE-YYYY-XXXXX if applicable)
```

### Rules

- One entry per user-facing change.
- Internal refactors, test additions, and CI changes do not need changelog entries.
- Security fixes always get a changelog entry.
- Breaking changes include an upgrade note.

---

## Related Documentation

- [CI/CD Pipeline](CICD.md)
- [Deployment Guide](DEPLOYMENT.md)
- [Contributing Guide](../CONTRIBUTING.md)
- [Changelog](../CHANGELOG.md)
