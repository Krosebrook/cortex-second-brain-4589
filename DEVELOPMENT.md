# Development Guide

Complete guide for contributing to Cortex Second Brain.

## Table of Contents

- [Quick Start](#quick-start)
- [Code Quality](#code-quality)
- [Pre-commit Hooks](#pre-commit-hooks)
- [IDE Setup](#ide-setup)
- [CI/CD Pipeline](#cicd-pipeline)
- [Releases](#releases)
- [Branch Protection](#branch-protection)

---

## Quick Start

### Prerequisites

- Node.js ≥ 18.x
- npm ≥ 9.x
- Git ≥ 2.x

### Setup

```bash
git clone <repository-url>
cd cortex-second-brain
npm install
npx husky install
npm run dev
```

---

## Code Quality

### ESLint

Strict TypeScript rules with React hooks validation.

```bash
npm run lint              # Check for issues
npm run lint -- --fix     # Auto-fix issues
```

Key rules:
- `@typescript-eslint/no-unused-vars` → error
- `@typescript-eslint/no-explicit-any` → warn
- `react-hooks/rules-of-hooks` → error

### Prettier

Automatic code formatting.

```bash
npx prettier --check "src/**/*.{ts,tsx}"   # Check
npx prettier --write "src/**/*.{ts,tsx}"   # Fix
```

Config (`.prettierrc`):
```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100
}
```

### TypeScript

Strict type checking.

```bash
npx tsc --noEmit           # Type check
npx tsc --noEmit --watch   # Watch mode
```

---

## Pre-commit Hooks

Husky + lint-staged runs automatically on `git commit`:

1. ESLint with `--fix` on staged `.ts/.tsx` files
2. Prettier formats staged files
3. Commit blocked if errors remain

Config (`.lintstagedrc.json`):
```json
{
  "*.{ts,tsx}": ["eslint --fix --max-warnings=0", "prettier --write"],
  "*.{css,scss}": ["prettier --write"]
}
```

**Bypass (emergency only):**
```bash
git commit --no-verify -m "emergency fix"
```

---

## IDE Setup

### VS Code (Recommended)

Install extensions from `.vscode/extensions.json`:
- ESLint
- Prettier
- Tailwind CSS IntelliSense
- Error Lens

Settings are pre-configured in `.vscode/settings.json`.

### Other IDEs

Enable:
1. ESLint with auto-fix on save
2. Prettier as default formatter
3. Format on save

---

## CI/CD Pipeline

GitHub Actions runs on every PR:

| Job | Description | Required |
|-----|-------------|----------|
| Code Quality | ESLint, TypeScript, Prettier | ✅ |
| Test | Unit tests with coverage | ✅ |
| Build | Production bundle | ✅ |
| E2E | Playwright tests | ✅ |
| Security | npm audit | ⚠️ Warning |

PRs blocked until all required checks pass.

---

## Releases

Automated semantic versioning via [Conventional Commits](https://www.conventionalcommits.org/).

### Commit Format

```
<type>[scope][!]: <description>

[body]

[footer]
```

### Version Bumps

| Commit | Version Change |
|--------|----------------|
| `feat:` | Minor (1.0.0 → 1.1.0) |
| `fix:` | Patch (1.0.0 → 1.0.1) |
| `feat!:` or `BREAKING CHANGE` | Major (1.0.0 → 2.0.0) |

### Examples

```bash
# Feature → minor bump
git commit -m "feat: add dark mode toggle"
git commit -m "feat(auth): implement OAuth2 login"

# Fix → patch bump
git commit -m "fix: resolve null pointer error"
git commit -m "fix(api): handle timeout gracefully"

# Breaking → major bump
git commit -m "feat!: redesign authentication API"
git commit -m "refactor: update API format

BREAKING CHANGE: responses now use camelCase"
```

### Release Workflows

| Workflow | File | Behavior |
|----------|------|----------|
| Release Please | `release-please.yml` | Creates Release PR (recommended) |
| Custom Release | `release.yml` | Immediate release on push |

**Release Please flow:**
1. Push to main → Creates/updates Release PR
2. Merge Release PR → Creates GitHub Release

**Manual trigger:** Actions → Release → Run workflow

---

## Branch Protection

Configure in **Settings → Branches → Add rule**:

### Required Status Checks

Enable "Require status checks to pass":
- ✅ Code Quality
- ✅ Test
- ✅ Build
- ✅ E2E Tests

### Pull Request Rules

| Setting | Value |
|---------|-------|
| Require PR before merging | ✅ |
| Required approvals | 1-2 |
| Dismiss stale approvals | ✅ |
| Require Code Owner review | ✅ |

### CODEOWNERS

```
# .github/CODEOWNERS
* @team-lead
/src/components/ @frontend-team
/supabase/ @backend-team
/.github/ @devops-team
```

### Branch Cleanup

Automated branch cleanup is configured via GitHub Actions to maintain repository hygiene.

#### Automatic Cleanup

**When:** After PR merge  
**Action:** Branch is automatically deleted

**Workflow:** `.github/workflows/branch-cleanup.yml`

#### Manual Cleanup

For cleanup of stale merged branches:

1. Navigate to **Actions → Branch Cleanup**
2. Click **Run workflow**
3. Enable **dry-run** to preview deletions
4. Run without dry-run to execute cleanup

**Stale Criteria:**
- Merged into default branch
- Last commit > 7 days old
- Not a protected branch (main/master/develop)

#### CLI Commands

```bash
# List merged branches
git branch --merged main

# Delete local branch
git branch -d feature-branch

# Delete remote branch
git push origin --delete feature-branch

# Cleanup local references to deleted remote branches
git fetch --prune

# List all remote branches
git branch -r

# Find branches older than 30 days
git for-each-ref --sort=-committerdate refs/remotes/ --format='%(refname:short) %(committerdate:relative)'
```

#### Protected Branches

The following branches are **never deleted** automatically:
- `main`
- `master`
- `develop`

---

## Scripts Reference

| Script | Description |
|--------|-------------|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run lint` | ESLint check |
| `npm run test` | Unit tests |
| `npm run test:coverage` | Tests with coverage |

---

## Troubleshooting

### ESLint cache issues
```bash
rm -rf node_modules/.cache/eslint
```

### TypeScript server out of sync
```
Cmd/Ctrl + Shift + P → "TypeScript: Restart TS Server"
```

### Pre-commit hooks not running
```bash
npx husky install
chmod +x .husky/pre-commit
```

---

## Contributing

1. Create branch: `git checkout -b feat/my-feature`
2. Make changes following code style
3. Commit: `git commit -m "feat: description"`
4. Push and create PR
5. Ensure CI passes

See [CONTRIBUTING.md](./CONTRIBUTING.md) for details.
