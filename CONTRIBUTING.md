# Contributing to Cortex

Thank you for your interest in contributing to Cortex! This guide will help you get started with the development workflow and coding standards.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Pull Request Process](#pull-request-process)
- [Testing Guidelines](#testing-guidelines)
- [Documentation](#documentation)

---

## Code of Conduct

We are committed to providing a welcoming and inclusive environment. Please be respectful and considerate in all interactions.

---

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Git
- A code editor (VS Code recommended)
- Supabase account (for backend features)

### Setting Up Your Development Environment

1. **Fork the repository** on GitHub

2. **Clone your fork**
   ```bash
   git clone https://github.com/YOUR_USERNAME/cortex.git
   cd cortex
   ```

3. **Add the upstream remote**
   ```bash
   git remote add upstream https://github.com/ORIGINAL_OWNER/cortex.git
   ```

4. **Install dependencies**
   ```bash
   npm install
   ```

5. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your Supabase credentials
   ```

6. **Start the development server**
   ```bash
   npm run dev
   ```

---

## Development Workflow

### Branch Naming Convention

Use descriptive branch names with prefixes:

| Prefix | Purpose | Example |
|--------|---------|---------|
| `feature/` | New features | `feature/knowledge-export` |
| `fix/` | Bug fixes | `fix/chat-scroll-issue` |
| `docs/` | Documentation | `docs/api-examples` |
| `refactor/` | Code refactoring | `refactor/auth-context` |
| `test/` | Test additions | `test/chat-service` |

### Commit Message Format

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**
```bash
feat(chat): add message search functionality
fix(auth): resolve session persistence issue
docs(readme): add installation instructions
refactor(hooks): extract useDebounce from useSearchFilter
```

### Keeping Your Fork Updated

```bash
git fetch upstream
git checkout main
git merge upstream/main
git push origin main
```

---

## Coding Standards

### TypeScript Guidelines

- Use TypeScript for all new code
- Define explicit types for function parameters and return values
- Avoid `any` type; use `unknown` if type is truly unknown
- Use interfaces for object shapes, types for unions/primitives

```typescript
// ✅ Good
interface KnowledgeItem {
  id: string;
  title: string;
  content: string | null;
  tags: string[];
}

function processItem(item: KnowledgeItem): ProcessedItem {
  // ...
}

// ❌ Avoid
function processItem(item: any) {
  // ...
}
```

### React Component Guidelines

1. **Use functional components** with hooks
2. **Keep components focused** - single responsibility
3. **Extract reusable logic** into custom hooks
4. **Use semantic HTML** elements

```typescript
// ✅ Good - Small, focused component
interface ChatMessageProps {
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

export const ChatMessage = ({ content, role, timestamp }: ChatMessageProps) => {
  return (
    <article className="flex gap-3 p-4">
      <Avatar role={role} />
      <div className="flex-1">
        <p className="text-foreground">{content}</p>
        <time className="text-xs text-muted-foreground">
          {formatTime(timestamp)}
        </time>
      </div>
    </article>
  );
};
```

### Styling Guidelines

1. **Use Tailwind CSS** for styling
2. **Use design system tokens** - never use raw colors
3. **All colors must be HSL** format
4. **Use semantic class names** from the design system

```tsx
// ✅ Good - Using design tokens
<div className="bg-background text-foreground border-border">
  <h1 className="text-primary">Title</h1>
  <p className="text-muted-foreground">Description</p>
</div>

// ❌ Avoid - Raw colors
<div className="bg-white text-black border-gray-200">
  <h1 className="text-blue-500">Title</h1>
</div>
```

### File Organization

```
src/
├── components/
│   ├── ui/              # Reusable UI primitives (shadcn)
│   ├── feedback/        # Feedback-related components
│   ├── search/          # Search/chat components
│   └── [feature]/       # Feature-specific components
├── hooks/               # Custom React hooks
├── services/            # API service layers
├── contexts/            # React contexts
├── pages/               # Route pages
├── types/               # TypeScript type definitions
├── lib/                 # Utility functions
└── utils/               # Helper utilities
```

### Naming Conventions

| Item | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `ChatMessage.tsx` |
| Hooks | camelCase with `use` prefix | `useChat.ts` |
| Utilities | camelCase | `formatDate.ts` |
| Types/Interfaces | PascalCase | `ChatMessage` |
| Constants | SCREAMING_SNAKE_CASE | `MAX_MESSAGE_LENGTH` |
| CSS classes | kebab-case | `chat-container` |

---

## Pull Request Process

### Before Submitting

1. **Update your branch** with the latest upstream changes
2. **Run the linter** and fix any issues
   ```bash
   npm run lint
   ```
3. **Run tests** and ensure they pass
   ```bash
   npm run test
   ```
4. **Build the project** to check for errors
   ```bash
   npm run build
   ```

### Creating the Pull Request

1. **Push your branch** to your fork
   ```bash
   git push origin feature/your-feature
   ```

2. **Create a Pull Request** on GitHub with:
   - Clear, descriptive title
   - Description of changes
   - Screenshots for UI changes
   - Link to related issues

### PR Description Template

```markdown
## Description
Brief description of the changes.

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Documentation update
- [ ] Refactoring

## Changes Made
- Change 1
- Change 2

## Screenshots (if applicable)
[Add screenshots here]

## Testing
- [ ] I have tested these changes locally
- [ ] I have added/updated tests as needed

## Related Issues
Closes #123
```

### Review Process

1. **Automated checks** must pass (lint, build, tests)
2. **Code review** by at least one maintainer
3. **Address feedback** with additional commits
4. **Squash and merge** when approved

---

## Testing Guidelines

### Test File Location

- Place tests next to the code they test
- Use `.test.ts` or `.test.tsx` extension

```
src/
├── services/
│   ├── chat.service.ts
│   └── __tests__/
│       └── chat.service.test.ts
```

### Writing Tests

```typescript
import { describe, it, expect, vi } from 'vitest';
import { chatService } from '../chat.service';

describe('ChatService', () => {
  describe('sendMessage', () => {
    it('should send a message and return response', async () => {
      const message = 'Hello, Tessa!';
      const response = await chatService.sendMessage(message, 'chat-123');
      
      expect(response).toBeDefined();
      expect(response.role).toBe('assistant');
    });

    it('should handle errors gracefully', async () => {
      vi.spyOn(supabase.functions, 'invoke').mockRejectedValue(new Error('Network error'));
      
      await expect(chatService.sendMessage('test', 'chat-123'))
        .rejects.toThrow('Network error');
    });
  });
});
```

---

## Documentation

### Code Documentation

- Add JSDoc comments for public functions and components
- Document complex logic with inline comments
- Keep README and docs up to date

```typescript
/**
 * Sends a message to the AI assistant and returns the response.
 * 
 * @param message - The user's message text
 * @param chatId - The ID of the current chat session
 * @returns The assistant's response message
 * @throws {Error} If the API call fails
 * 
 * @example
 * const response = await chatService.sendMessage('Hello!', 'chat-123');
 * console.log(response.content);
 */
async function sendMessage(message: string, chatId: string): Promise<Message> {
  // ...
}
```

### Updating Documentation

When your changes affect:
- **Features**: Update `docs/ROADMAP.md`
- **API**: Update `docs/API.md`
- **Setup**: Update `README.md`

---

## Questions?

If you have questions, feel free to:
- Open a GitHub Discussion
- Check existing issues
- Review the documentation in `/docs`

Thank you for contributing to Cortex! 🚀
