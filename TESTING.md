# Testing Guide

## Overview

This project uses Vitest and React Testing Library for comprehensive testing coverage.

## Running Tests

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run tests in UI mode
npm run test:ui
```

## Test Structure

```
src/
├── services/
│   └── __tests__/
│       ├── chat.service.test.ts
│       └── knowledge.service.test.ts
├── hooks/
│   └── __tests__/
│       ├── useChat.test.ts
│       └── useKnowledge.test.ts
├── components/
│   └── error/
│       └── __tests__/
│           └── ErrorBoundary.test.tsx
└── __tests__/
    └── integration/
        ├── offline-sync.test.ts
        └── chat-flow.test.ts
```

## Writing Tests

### Service Tests

```typescript
import { describe, it, expect, vi } from 'vitest';
import { ChatService } from '../chat.service';

describe('ChatService', () => {
  it('should load chats for a user', async () => {
    const userId = 'test-user-id';
    const chats = await ChatService.loadChats(userId);
    expect(chats).toBeInstanceOf(Array);
  });
});
```

### Component Tests

```typescript
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ErrorBoundary } from '../ErrorBoundary';

describe('ErrorBoundary', () => {
  it('should render children when no error', () => {
    render(
      <ErrorBoundary>
        <div>Test Content</div>
      </ErrorBoundary>
    );
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });
});
```

### Hook Tests

```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useChat } from '../useChat';

describe('useChat', () => {
  it('should initialize with empty chats', () => {
    const { result } = renderHook(() => useChat());
    expect(result.current.chats).toEqual([]);
  });
});
```

## Coverage Requirements

- **Minimum coverage**: 70%
- **Services**: 80%+
- **Critical hooks**: 75%+
- **Components**: 60%+

## Best Practices

1. **Test user behavior, not implementation**
2. **Use meaningful test descriptions**
3. **Mock external dependencies**
4. **Test edge cases and error scenarios**
5. **Keep tests isolated and independent**
6. **Use data-testid sparingly**

## CI/CD Integration

Tests run automatically on:
- Pull requests
- Pushes to main branch
- Pre-commit hooks (optional)

## Debugging Tests

```bash
# Run specific test file
npm run test src/services/__tests__/chat.service.test.ts

# Run tests matching pattern
npm run test -- --grep="ChatService"

# Debug in browser
npm run test:ui
```

## Mocking

### Supabase
All Supabase calls are automatically mocked in `vitest.setup.ts`

### Custom Mocks
```typescript
vi.mock('@/lib/custom-module', () => ({
  customFunction: vi.fn(() => 'mocked value'),
}));
```

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
