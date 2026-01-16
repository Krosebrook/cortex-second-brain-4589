# Development Guide

This guide covers the development setup, code quality tools, and contribution workflow for Cortex Second Brain.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Code Quality Tools](#code-quality-tools)
  - [ESLint](#eslint)
  - [Prettier](#prettier)
  - [TypeScript](#typescript)
- [Pre-commit Hooks](#pre-commit-hooks)
- [IDE Setup](#ide-setup)
- [Scripts Reference](#scripts-reference)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

- **Node.js** >= 18.x
- **npm** >= 9.x (or compatible package manager)
- **Git** >= 2.x

## Getting Started

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd cortex-second-brain
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Initialize Husky** (for pre-commit hooks)
   ```bash
   npx husky install
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

---

## Code Quality Tools

We use a comprehensive suite of tools to maintain code quality and consistency.

### ESLint

ESLint is configured with strict TypeScript rules to catch issues early in development.

#### Configuration

Our ESLint setup (`eslint.config.js`) includes:

- **TypeScript strict mode rules**:
  - `@typescript-eslint/no-unused-vars` (error) - Flags unused imports/variables
  - `@typescript-eslint/no-explicit-any` (warn) - Discourages `any` type usage
  - `@typescript-eslint/no-floating-promises` (warn) - Ensures promises are handled
  - `@typescript-eslint/await-thenable` (error) - Prevents invalid await usage
  - `@typescript-eslint/no-unsafe-*` (warn) - Type safety rules

- **React-specific rules**:
  - `react-hooks/rules-of-hooks` (error)
  - `react-hooks/exhaustive-deps` (warn)
  - `react-refresh/only-export-components` (warn)

- **Import optimization**:
  - `@typescript-eslint/consistent-type-imports` - Enforces `type` imports
  - `@typescript-eslint/no-import-type-side-effects` (error)

#### Running ESLint

```bash
# Check for issues
npm run lint

# Auto-fix issues where possible
npm run lint -- --fix

# Check specific files
npx eslint src/components/MyComponent.tsx
```

#### Ignoring Rules

Use sparingly and document why:

```typescript
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Legacy API returns unknown shape
const data: any = legacyApiCall();
```

### Prettier

Prettier handles all code formatting to ensure consistency across the codebase.

#### Configuration

`.prettierrc`:
```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100,
  "bracketSpacing": true,
  "arrowParens": "always",
  "endOfLine": "lf"
}
```

#### Running Prettier

```bash
# Check formatting
npx prettier --check "src/**/*.{ts,tsx}"

# Fix formatting
npx prettier --write "src/**/*.{ts,tsx}"

# Format entire codebase
npx prettier --write "src/**/*.{ts,tsx,css}"
```

### TypeScript

TypeScript is configured for strict type checking.

#### Type Checking

```bash
# Run type checker
npx tsc --noEmit

# Watch mode
npx tsc --noEmit --watch
```

---

## Pre-commit Hooks

We use **Husky** and **lint-staged** to run quality checks before commits.

### How It Works

When you run `git commit`, the following happens automatically:

1. **lint-staged** selects only staged files
2. **ESLint** runs with `--fix` on `.ts` and `.tsx` files
3. **Prettier** formats the files
4. If any errors remain, the commit is **blocked**

### Configuration

`.lintstagedrc.json`:
```json
{
  "*.{ts,tsx}": [
    "eslint --fix --max-warnings=0",
    "prettier --write"
  ],
  "*.{js,mjs,cjs}": [
    "eslint --fix",
    "prettier --write"
  ],
  "*.{css,scss}": [
    "prettier --write"
  ]
}
```

### Bypassing Hooks (Emergency Only)

```bash
# Skip pre-commit hooks (use sparingly!)
git commit --no-verify -m "emergency fix"
```

**⚠️ Warning**: CI will still fail if code doesn't pass checks.

### Troubleshooting Hooks

If hooks aren't running:

```bash
# Reinstall Husky
npx husky install

# Verify hook exists
cat .husky/pre-commit

# Check permissions (Unix)
chmod +x .husky/pre-commit
```

---

## IDE Setup

### VS Code (Recommended)

Install these extensions:
- **ESLint** (`dbaeumer.vscode-eslint`)
- **Prettier** (`esbenp.prettier-vscode`)
- **TypeScript Vue Plugin** (for better TS support)

Recommended `.vscode/settings.json`:
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  },
  "typescript.preferences.importModuleSpecifier": "relative",
  "eslint.validate": [
    "javascript",
    "javascriptreact",
    "typescript",
    "typescriptreact"
  ]
}
```

### WebStorm / IntelliJ

1. Go to **Preferences > Languages & Frameworks > JavaScript > Code Quality Tools > ESLint**
2. Enable **Automatic ESLint configuration**
3. Go to **Preferences > Languages & Frameworks > JavaScript > Prettier**
4. Enable **On save** and **On Reformat Code**

---

## Scripts Reference

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run lint` | Run ESLint |
| `npm run test` | Run unit tests |
| `npm run test:coverage` | Run tests with coverage |
| `npx tsc --noEmit` | Type check without emitting |
| `npx prettier --write "src/**/*"` | Format all source files |

---

## Troubleshooting

### ESLint Not Finding Config

```bash
# Clear ESLint cache
rm -rf node_modules/.cache/eslint

# Reinstall dependencies
rm -rf node_modules && npm install
```

### Prettier Conflicts with ESLint

We use `eslint-config-prettier` to disable conflicting rules. If you see conflicts:

1. Ensure `eslint-config-prettier` is the **last** item in ESLint extends
2. Run `npx eslint-config-prettier src/SomeFile.tsx` to check for conflicts

### Type Errors in Editor but Not CI

```bash
# Restart TypeScript server in VS Code
Cmd/Ctrl + Shift + P → "TypeScript: Restart TS Server"

# Clear TypeScript build cache
rm -rf node_modules/.cache
```

### Pre-commit Hook Not Running

```bash
# Verify Husky is installed
ls -la .husky/

# Reinstall hooks
npx husky install

# On Windows, ensure Git Bash or WSL is used
```

---

## CI/CD Pipeline

Our GitHub Actions workflow (`.github/workflows/ci.yml`) runs on every PR:

| Job | Description | Blocking |
|-----|-------------|----------|
| **Code Quality** | ESLint + TypeScript + Prettier | ✅ Yes |
| **Test** | Unit tests with coverage | ✅ Yes |
| **Build** | Production build verification | ✅ Yes |
| **E2E** | Playwright browser tests | ✅ Yes |
| **Security** | npm audit | ⚠️ Warning only |

### Required Checks

PRs cannot be merged unless:
- ESLint passes with no errors
- TypeScript type checking passes
- All tests pass
- Build completes successfully

---

## Branch Protection Rules

To enforce code quality standards, configure branch protection rules in GitHub:

### Setting Up Branch Protection

1. Navigate to your repository on GitHub
2. Go to **Settings** → **Branches**
3. Click **Add branch protection rule**
4. Set **Branch name pattern** to `main` (or your default branch)

### Recommended Protection Settings

#### Required Status Checks

Enable **"Require status checks to pass before merging"** and select:

| Status Check | Description |
|--------------|-------------|
| `Code Quality` | ESLint, TypeScript, Prettier checks |
| `Test` | Unit tests with coverage thresholds |
| `Build` | Production build verification |
| `E2E Tests` | Playwright browser tests |

✅ Enable **"Require branches to be up to date before merging"**

#### Pull Request Requirements

| Setting | Recommended Value |
|---------|-------------------|
| **Require a pull request before merging** | ✅ Enabled |
| **Require approvals** | 1-2 (depending on team size) |
| **Dismiss stale pull request approvals** | ✅ Enabled |
| **Require review from Code Owners** | ✅ Enabled (if using CODEOWNERS) |
| **Require approval of most recent push** | ✅ Enabled |

#### Additional Protections

| Setting | Recommended Value |
|---------|-------------------|
| **Require conversation resolution** | ✅ Enabled |
| **Require signed commits** | Optional (for security-critical projects) |
| **Require linear history** | Optional (prevents merge commits) |
| **Do not allow bypassing** | ✅ Enabled (even for admins) |
| **Restrict who can push** | Optional (limit to specific teams) |

### Example Configuration

```yaml
# Branch protection for 'main' branch
Branch name pattern: main

✅ Require a pull request before merging
  ├── Required approvals: 1
  ├── ✅ Dismiss stale approvals when new commits are pushed
  ├── ✅ Require review from Code Owners
  └── ✅ Require approval of the most recent push

✅ Require status checks to pass before merging
  ├── ✅ Require branches to be up to date before merging
  └── Status checks:
      ├── Code Quality
      ├── Test
      ├── Build
      └── E2E Tests

✅ Require conversation resolution before merging

✅ Do not allow bypassing the above settings
```

### CODEOWNERS File

Create a `CODEOWNERS` file to automatically request reviews:

```
# .github/CODEOWNERS

# Default owners for everything
* @team-lead @senior-dev

# Frontend components
/src/components/ @frontend-team

# Backend/Edge functions
/supabase/ @backend-team

# CI/CD configuration
/.github/ @devops-team

# Documentation
*.md @docs-team
```

### Enforcement Tips

1. **Start gradually**: Begin with required status checks only, then add review requirements
2. **Use branch rulesets** (newer GitHub feature) for more granular control
3. **Create environment protection rules** for production deployments
4. **Enable required status checks for all branches** using wildcard patterns (e.g., `feature/*`)

### Troubleshooting Branch Protection

**"This branch has no upstream branch"**
```bash
git push -u origin feature/my-feature
```

**"Required status check is failing"**
1. Check the Actions tab for failed workflow runs
2. Fix the issues locally and push again
3. Ensure your branch is up to date with main:
   ```bash
   git fetch origin
   git rebase origin/main
   ```

**"Waiting for status checks"**
- Some checks only run on PRs, not pushes
- Ensure the workflow is triggered for your PR type

---

## Contributing

1. Create a feature branch: `git checkout -b feat/my-feature`
2. Make your changes following the code style
3. Commit with conventional commits: `git commit -m "feat: add new feature"`
4. Push and create a PR
5. Ensure all CI checks pass

See [CONTRIBUTING.md](./CONTRIBUTING.md) for detailed guidelines.
