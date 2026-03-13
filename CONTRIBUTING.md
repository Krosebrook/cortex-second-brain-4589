# Contributing to TESSA

Thank you for your interest in contributing to TESSA! 🎉 This comprehensive guide will help you get started with the development workflow, coding standards, and contribution process.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Branch Management](#branch-management)
- [Coding Standards](#coding-standards)
- [Pull Request Process](#pull-request-process)
- [Testing Guidelines](#testing-guidelines)
- [Documentation](#documentation)
- [Community](#community)

---

## Code of Conduct

This project and everyone participating in it is governed by our [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code. Please report unacceptable behavior to the project maintainers.

We are committed to providing a welcoming and inclusive environment. Please be respectful and considerate in all interactions.

---

## Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:

| Tool | Version | Download |
|------|---------|----------|
| Node.js | 18.0.0+ | [nodejs.org](https://nodejs.org/) |
| npm | 9.0.0+ | Included with Node.js |
| Git | 2.30.0+ | [git-scm.com](https://git-scm.com/) |
| Code Editor | - | [VS Code](https://code.visualstudio.com/) (recommended) |

### Recommended VS Code Extensions

Create `.vscode/extensions.json` for team consistency:

```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "formulahendry.auto-rename-tag",
    "dsznajder.es7-react-js-snippets",
    "usernamehw.errorlens",
    "christian-kohler.path-intellisense",
    "streetsidesoftware.code-spell-checker"
  ]
}
```

### Setting Up Your Development Environment

#### 1. Fork the Repository

Click the "Fork" button at the top right of the [TESSA repository](https://github.com/tessa/tessa).

#### 2. Clone Your Fork

```bash
git clone https://github.com/YOUR_USERNAME/tessa.git
cd tessa
```

#### 3. Add the Upstream Remote

```bash
git remote add upstream https://github.com/tessa/tessa.git
```

#### 4. Install Dependencies

```bash
npm install
```

#### 5. Set Up Environment Variables

```bash
cp .env.example .env.local
# Edit .env.local with your configuration
```

#### 6. Start the Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:8080`.

#### 7. Verify Your Setup

```bash
# Run linting
npm run lint

# Fix linting issues automatically
npm run lint:fix

# Run type checking
npm run type-check

# Run tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

---

## Development Workflow

### Commit Message Format

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

#### Types

| Type | Description | Triggers Release |
|------|-------------|------------------|
| `feat` | New feature | Minor ↑ |
| `fix` | Bug fix | Patch ↑ |
| `docs` | Documentation changes | - |
| `style` | Code style changes (formatting) | - |
| `refactor` | Code refactoring | - |
| `perf` | Performance improvements | Patch ↑ |
| `test` | Adding or updating tests | - |
| `build` | Build system changes | - |
| `ci` | CI/CD changes | - |
| `chore` | Maintenance tasks | - |

#### Breaking Changes

Add `!` after type or include `BREAKING CHANGE:` in footer:

```bash
feat(api)!: change response format for user endpoint

BREAKING CHANGE: The user endpoint now returns `userId` instead of `id`
```

#### Examples

```bash
# Feature with scope
feat(chat): add message search functionality

# Bug fix
fix(auth): resolve session persistence issue

# Documentation
docs(readme): add installation instructions

# Refactoring
refactor(hooks): extract useDebounce from useSearchFilter

# Multi-line with body
fix(chat): prevent message duplication

Messages were being duplicated when the user sent rapidly.
Added debounce to the send function to prevent this.

Closes #123
```

### Keeping Your Fork Updated

```bash
# Fetch upstream changes
git fetch upstream

# Switch to main branch
git checkout main

# Merge upstream changes
git merge upstream/main

# Push to your fork
git push origin main

# Rebase your feature branch (if working on one)
git checkout feature/your-feature
git rebase main
```

---

## Branch Management

Effective branch management is crucial for maintaining a clean, organized repository and enabling smooth collaboration. This section outlines our branch management practices and guidelines.

### Branch Naming Convention

Use descriptive branch names with the following prefixes:

| Prefix | Purpose | Example | When to Use |
|--------|---------|---------|-------------|
| `feature/` | New features | `feature/knowledge-export` | Adding new functionality |
| `fix/` | Bug fixes | `fix/chat-scroll-issue` | Fixing bugs |
| `bugfix/` | Alternative to fix/ | `bugfix/login-error` | Alternative bug fix prefix |
| `hotfix/` | Production hotfixes | `hotfix/security-patch` | Urgent production fixes |
| `docs/` | Documentation updates | `docs/api-examples` | Documentation changes |
| `refactor/` | Code refactoring | `refactor/auth-context` | Code restructuring |
| `test/` | Testing additions | `test/chat-service` | Adding or updating tests |
| `perf/` | Performance improvements | `perf/virtualized-list` | Performance optimizations |
| `style/` | Code style/formatting | `style/consistent-formatting` | Style and formatting changes |
| `chore/` | Maintenance tasks | `chore/update-deps` | Maintenance and tooling |

**Best Practices:**
- Be descriptive: `feature/user-authentication` not `feature/new-stuff`
- Use kebab-case: `feature/real-time-notifications`
- Keep it concise: Aim for 2-4 words after the prefix
- Reference issues when applicable: `fix/123-memory-leak`

### Branch Lifecycle

#### Creating Branches

Always create branches from an up-to-date `main`:

```bash
# Update main
git checkout main
git pull origin main

# Create new branch
git checkout -b feature/your-feature-name
```

#### Keeping Branches Up to Date

Regularly sync your branch with `main`:

```bash
# Using rebase (recommended for clean history)
git fetch origin
git rebase origin/main
git push --force-with-lease origin feature/your-feature-name

# Using merge (simpler, creates merge commits)
git fetch origin
git merge origin/main
git push origin feature/your-feature-name
```

#### Deleting After Merge

Clean up branches after they've been merged:

```bash
# Delete local branch
git branch -d feature/your-feature-name

# Delete remote branch
git push origin --delete feature/your-feature-name

# Prune remote tracking branches
git fetch --prune origin
```

### Local and Remote Cleanup Commands

#### Clean Up Merged Branches

```bash
# Delete all local merged branches
git branch --merged main | grep -v "main" | xargs -r git branch -d

# Prune remote tracking branches
git fetch --prune origin
```

#### Check for Stale Branches

```bash
# List branches with last commit date
git for-each-ref --sort=-committerdate refs/heads/ \
  --format='%(committerdate:short) %(refname:short)'
```

### Protection Rules

#### Main Branch Protection

The `main` branch has the following protection rules:

- ✅ **Required pull request reviews** (1 approval minimum)
- ✅ **Required status checks** (linting, tests, build)
- ✅ **Require conversation resolution** before merging
- ✅ **Require linear history** (optional)

#### Auto-Delete Merged Branches

The repository is configured to automatically delete head branches after PR merge. This reduces manual cleanup work and keeps the branch list manageable.

### Stale Branch Detection

#### When to Delete Branches

Delete branches when:
- ✅ PR has been merged to main
- ✅ PR has been closed without merging
- ✅ Branch is a temporary artifact
- ✅ No commits in the last 90 days
- ✅ All stakeholders confirm it's no longer needed

#### When to Preserve Branches

Preserve branches when:
- ⚠️ Contains experimental work that may be revisited
- ⚠️ Long-term feature development in progress
- ⚠️ Release or maintenance branch
- ⚠️ Purpose is uncertain — verify first

#### Communication Before Deletion

Before deleting stale branches:

1. **Check the branch author:**
   ```bash
   git log -1 --format='%an <%ae>' origin/branch-name
   ```

2. **Review branch contents:**
   ```bash
   git log main..branch-name --oneline
   git diff main...branch-name
   ```

3. **Announce bulk deletions** with 3–7 day notice
4. **Document the deletion** with reason and date

### Best Practices Summary

1. ✅ Always create branches from up-to-date main
2. ✅ Use meaningful, consistent branch names
3. ✅ Keep branches short-lived (days to weeks, not months)
4. ✅ Sync regularly with main to avoid conflicts
5. ✅ Delete branches immediately after merge
6. ✅ Use pull requests for all changes to main
7. ✅ Perform regular branch audits (monthly or quarterly)
8. ✅ Communicate before bulk deletions

---

## Coding Standards

### TypeScript Guidelines

#### Do's and Don'ts

```typescript
// ✅ Good: Use explicit types
interface KnowledgeItem {
  id: string;
  title: string;
  content: string | null;
  tags: string[];
  createdAt: Date;
}

function processItem(item: KnowledgeItem): ProcessedItem {
  // Implementation
}

// ✅ Good: Use const assertions for constants
const ROLES = ['admin', 'user', 'guest'] as const;
type Role = typeof ROLES[number];

// ✅ Good: Prefer interfaces for object shapes
interface ApiResponse<T> {
  data: T;
  status: number;
  message: string;
}

// ❌ Avoid: any type
function processItem(item: any) {
  // ...
}

// ✅ Good: Use unknown and type guards
function processData(data: unknown) {
  if (isValidData(data)) {
    // data is now typed
  }
}

// ✅ Good: Use generics for reusability
function createService<T extends BaseEntity>(config: ServiceConfig<T>): Service<T> {
  // Implementation
}
```

### React Component Guidelines

#### Component Structure

```typescript
// ✅ Good - Well-structured component
import { FC, useState, useCallback, memo } from 'react';
import { cn } from '@/lib/utils';

interface ChatMessageProps {
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  onEdit?: (content: string) => void;
}

export const ChatMessage: FC<ChatMessageProps> = memo(({
  content,
  role,
  timestamp,
  onEdit,
}) => {
  const [isEditing, setIsEditing] = useState(false);

  const handleEdit = useCallback((newContent: string) => {
    onEdit?.(newContent);
    setIsEditing(false);
  }, [onEdit]);

  return (
    <article 
      className={cn(
        'flex gap-3 p-4 rounded-lg',
        role === 'user' && 'bg-muted',
        role === 'assistant' && 'bg-background'
      )}
    >
      <Avatar role={role} />
      <div className="flex-1">
        <p className="text-foreground">{content}</p>
        <time className="text-xs text-muted-foreground">
          {formatTime(timestamp)}
        </time>
      </div>
    </article>
  );
});

ChatMessage.displayName = 'ChatMessage';
```

#### Component Best Practices

1. **Use functional components** with hooks
2. **Keep components focused** - single responsibility
3. **Extract reusable logic** into custom hooks
4. **Use semantic HTML** elements
5. **Memoize expensive components** with `memo()`
6. **Use `useCallback`** for handler functions passed as props

### Styling Guidelines

#### Design System Tokens

```tsx
// ✅ Good - Using design tokens
<div className="bg-background text-foreground border-border">
  <h1 className="text-primary font-heading">Title</h1>
  <p className="text-muted-foreground">Description</p>
  <button className="bg-primary text-primary-foreground hover:bg-primary/90">
    Action
  </button>
</div>

// ❌ Avoid - Raw colors
<div className="bg-white text-black border-gray-200">
  <h1 className="text-blue-500">Title</h1>
</div>

// ✅ Good - Conditional classes with cn()
<div className={cn(
  'base-class rounded-lg p-4',
  isActive && 'ring-2 ring-primary',
  variant === 'large' && 'p-6 text-lg',
  className
)} />
```

#### Color Requirements

- All colors **MUST be HSL** format
- Use semantic tokens from `index.css`
- Never use hardcoded colors in components

### File Organization

```
src/
├── components/
│   ├── ui/              # Reusable UI primitives (shadcn)
│   ├── feedback/        # Feedback-related components
│   ├── search/          # Search/chat components
│   ├── landing/         # Landing page components
│   └── [feature]/       # Feature-specific components
├── hooks/               # Custom React hooks
├── services/            # API service layers
├── contexts/            # React contexts
├── pages/               # Route pages
├── types/               # TypeScript type definitions
├── lib/                 # Utility functions
├── utils/               # Helper utilities
└── constants/           # Application constants
```

### Naming Conventions

| Item | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `ChatMessage.tsx` |
| Hooks | camelCase with `use` prefix | `useChat.ts` |
| Services | camelCase with `.service` suffix | `chat.service.ts` |
| Utilities | camelCase | `formatDate.ts` |
| Types/Interfaces | PascalCase | `ChatMessage` |
| Constants | SCREAMING_SNAKE_CASE | `MAX_MESSAGE_LENGTH` |
| CSS classes | kebab-case | `chat-container` |
| Event handlers | handle + Event | `handleClick`, `handleSubmit` |

---

## Pull Request Process

### Before Submitting

- [ ] Fork the repository and create your branch from `main`
- [ ] Update your branch with the latest upstream changes
- [ ] Run `npm run lint` and fix any errors
- [ ] Run `npm run typecheck` and fix any errors
- [ ] Run `npm run test` and ensure all tests pass
- [ ] Run `npm run build` to check for build errors
- [ ] Add tests for new functionality
- [ ] Update documentation if needed
- [ ] Ensure your commits follow our commit guidelines

### Creating the Pull Request

1. **Push your branch** to your fork:
   ```bash
   git push origin feature/your-feature
   ```

2. **Create a Pull Request** on GitHub with:
   - Clear, descriptive title following conventional commits
   - Description of changes
   - Screenshots for UI changes
   - Link to related issues

### PR Title Format

Follow the same format as commit messages:

```
feat(scope): add new feature
fix(scope): resolve bug
docs: update documentation
```

### PR Description Template

```markdown
## Description
Brief description of the changes.

## Type of Change
- [ ] 🐛 Bug fix (non-breaking change that fixes an issue)
- [ ] ✨ New feature (non-breaking change that adds functionality)
- [ ] 💥 Breaking change (fix or feature that would cause existing functionality to change)
- [ ] 📚 Documentation update
- [ ] 🔧 Refactoring (no functional changes)
- [ ] ⚡ Performance improvement
- [ ] 🧪 Test addition or update

## Changes Made
- Change 1
- Change 2

## Screenshots (if applicable)
| Before | After |
|--------|-------|
| [screenshot] | [screenshot] |

## Testing
- [ ] I have tested these changes locally
- [ ] I have added/updated tests as needed
- [ ] All existing tests pass

## Checklist
- [ ] My code follows the project's coding standards
- [ ] I have performed a self-review
- [ ] I have commented my code where necessary
- [ ] I have updated the documentation
- [ ] My changes don't introduce new warnings

## Related Issues
Closes #123
```

### Review Process

1. **Automated checks** must pass (lint, build, tests, security)
2. **Code review** by at least one maintainer
3. **Address feedback** with additional commits or discussions
4. **Approval** from required reviewers
5. **Squash and merge** when approved

### After Merge

- Delete your feature branch
- Update your local main branch:
  ```bash
  git checkout main
  git pull upstream main
  git push origin main
  ```

---

## Testing Guidelines

### Test File Location

Place tests next to the code they test using `__tests__` directories:

```
src/
├── services/
│   ├── chat.service.ts
│   └── __tests__/
│       └── chat.service.test.ts
├── components/
│   └── search/
│       ├── ChatMessage.tsx
│       └── __tests__/
│           └── ChatMessage.test.tsx
```

### Test Naming

```typescript
describe('ComponentName or FunctionName', () => {
  describe('methodName or scenario', () => {
    it('should [expected behavior] when [condition]', () => {
      // Test implementation
    });
  });
});
```

### Writing Tests

#### Unit Tests

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { chatService } from '../chat.service';

describe('ChatService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('sendMessage', () => {
    it('should send a message and return response', async () => {
      const message = 'Hello, Tessa!';
      const response = await chatService.sendMessage(message, 'chat-123');
      
      expect(response).toBeDefined();
      expect(response.role).toBe('assistant');
    });

    it('should handle errors gracefully', async () => {
      vi.spyOn(supabase.functions, 'invoke').mockRejectedValue(
        new Error('Network error')
      );
      
      await expect(chatService.sendMessage('test', 'chat-123'))
        .rejects.toThrow('Network error');
    });
  });
});
```

#### Component Tests

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChatMessage } from '../ChatMessage';

describe('ChatMessage', () => {
  const defaultProps = {
    content: 'Hello world',
    role: 'user' as const,
    timestamp: new Date(),
  };

  it('renders message content', () => {
    render(<ChatMessage {...defaultProps} />);
    expect(screen.getByText('Hello world')).toBeInTheDocument();
  });

  it('applies correct styling for user role', () => {
    render(<ChatMessage {...defaultProps} />);
    expect(screen.getByRole('article')).toHaveClass('bg-muted');
  });

  it('calls onEdit when edit is triggered', async () => {
    const handleEdit = vi.fn();
    render(<ChatMessage {...defaultProps} onEdit={handleEdit} />);
    
    await userEvent.click(screen.getByRole('button', { name: /edit/i }));
    // ... complete edit flow
    
    expect(handleEdit).toHaveBeenCalledWith('new content');
  });
});
```

### Test Coverage

Aim for meaningful coverage:
- **Statements:** 80%+
- **Branches:** 75%+
- **Functions:** 80%+
- **Lines:** 80%+

Run coverage report:
```bash
npm run test:coverage
```

---

## Documentation

### Code Documentation

Add JSDoc comments for public functions and components:

```typescript
/**
 * Sends a message to the AI assistant and returns the response.
 * 
 * @param message - The user's message text
 * @param chatId - The ID of the current chat session
 * @param options - Optional configuration for the request
 * @returns The assistant's response message
 * @throws {NetworkError} If the API call fails
 * @throws {ValidationError} If the message is invalid
 * 
 * @example
 * ```typescript
 * const response = await chatService.sendMessage('Hello!', 'chat-123');
 * console.log(response.content);
 * ```
 */
async function sendMessage(
  message: string,
  chatId: string,
  options?: SendMessageOptions
): Promise<Message> {
  // Implementation
}
```

### Updating Documentation

When your changes affect:

| Change Type | Update Location |
|-------------|-----------------|
| Features | `docs/ROADMAP.md`, `README.md` |
| API | `docs/API.md` |
| Setup/Installation | `README.md`, `docs/DEPLOYMENT.md` |
| Security | `docs/SECURITY.md`, `.github/SECURITY.md` |
| Architecture | `docs/ARCHITECTURE.md` |

---

## Community

### Getting Help

- 📖 [Documentation](./docs/README.md)
- 💬 [GitHub Discussions](https://github.com/tessa/tessa/discussions)
- 🐛 [Issue Tracker](https://github.com/tessa/tessa/issues)
- 💼 [Discord Community](https://discord.gg/tessa)

### Finding Issues to Work On

1. Check the [Issues](https://github.com/tessa/tessa/issues) page
2. Look for issues labeled:
   - `good first issue` - Great for newcomers
   - `help wanted` - We need your help!
   - `up-for-grabs` - Anyone can work on these
3. Comment on the issue to claim it

### Recognition

We value all contributions! Contributors are recognized in:
- Release notes
- [CONTRIBUTORS.md](CONTRIBUTORS.md) (if exists)
- Our website's contributors page

---

## Quick Reference

### Common Commands

```bash
# Development
npm run dev           # Start dev server
npm run build         # Build for production
npm run preview       # Preview production build

# Quality
npm run lint          # Run ESLint
npm run lint:fix      # Fix ESLint errors
npm run typecheck     # Run TypeScript check
npm run format        # Format with Prettier

# Testing
npm run test          # Run tests
npm run test:watch    # Run tests in watch mode
npm run test:coverage # Run tests with coverage
```

### Useful Links

- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Supabase Documentation](https://supabase.com/docs)
- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/docs/)

---

Thank you for contributing to TESSA! 💜

Your contributions help make this project better for everyone. We appreciate your time and effort in helping us build something amazing.
