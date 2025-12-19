# Testing Guide

Comprehensive testing documentation for TESSA, covering unit tests, integration tests, and end-to-end testing strategies.

## Table of Contents

- [Overview](#overview)
- [Testing Stack](#testing-stack)
- [Running Tests](#running-tests)
- [Test Structure](#test-structure)
- [Unit Testing](#unit-testing)
- [Integration Testing](#integration-testing)
- [E2E Testing](#e2e-testing)
- [Mocking Strategies](#mocking-strategies)
- [Best Practices](#best-practices)
- [Coverage Requirements](#coverage-requirements)
- [CI/CD Integration](#cicd-integration)
- [Debugging Tests](#debugging-tests)

## Overview

TESSA uses a comprehensive testing strategy to ensure reliability and maintainability:

- **Unit Tests**: Test individual functions and components in isolation
- **Integration Tests**: Test how multiple components work together
- **E2E Tests**: Test complete user flows from start to finish

## Testing Stack

| Tool | Purpose |
|------|---------|
| [Vitest](https://vitest.dev/) | Test runner and assertion library |
| [React Testing Library](https://testing-library.com/react) | Component testing utilities |
| [@testing-library/user-event](https://testing-library.com/docs/user-event/intro) | User interaction simulation |
| [MSW](https://mswjs.io/) | API mocking (optional) |

## Running Tests

```bash
# Run all tests
npm run test

# Run tests in watch mode (recommended during development)
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run tests in UI mode (visual test runner)
npm run test:ui

# Run specific test file
npm run test src/services/__tests__/chat.service.test.ts

# Run tests matching a pattern
npm run test -- --grep="ChatService"
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

### Naming Conventions

- Test files: `*.test.ts` or `*.test.tsx`
- Test directories: `__tests__/`
- Mock files: `*.mock.ts`

## Unit Testing

### Testing Services

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ChatService } from '../chat.service';
import { supabase } from '@/integrations/supabase/client';

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => ({
            data: [{ id: '1', title: 'Test Chat' }],
            error: null
          }))
        }))
      })),
      insert: vi.fn(),
      update: vi.fn(),
      delete: vi.fn()
    })),
    functions: {
      invoke: vi.fn()
    }
  }
}));

describe('ChatService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('loadChats', () => {
    it('should load chats for a user', async () => {
      const userId = 'test-user-id';
      const chats = await ChatService.loadChats(userId);
      
      expect(chats).toBeInstanceOf(Array);
      expect(supabase.from).toHaveBeenCalledWith('chats');
    });

    it('should handle errors gracefully', async () => {
      vi.mocked(supabase.from).mockReturnValueOnce({
        select: () => ({
          eq: () => ({
            order: () => ({
              data: null,
              error: new Error('Database error')
            })
          })
        })
      } as any);

      await expect(ChatService.loadChats('user-id'))
        .rejects.toThrow('Database error');
    });
  });

  describe('createChat', () => {
    it('should create a new chat with default title', async () => {
      const userId = 'test-user-id';
      const result = await ChatService.createChat(userId);
      
      expect(result).toBeDefined();
    });

    it('should create a chat with custom title', async () => {
      const userId = 'test-user-id';
      const title = 'My Custom Chat';
      
      await ChatService.createChat(userId, title);
      
      expect(supabase.from).toHaveBeenCalledWith('chats');
    });
  });
});
```

### Testing React Components

```typescript
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '../ErrorBoundary';

// Test wrapper with providers
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('ErrorBoundary', () => {
  it('should render children when no error occurs', () => {
    render(
      <ErrorBoundary>
        <div>Test Content</div>
      </ErrorBoundary>,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('should render fallback UI when error occurs', () => {
    const ThrowError = () => {
      throw new Error('Test error');
    };

    // Suppress console.error for this test
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    
    consoleSpy.mockRestore();
  });
});
```

### Testing Hooks

```typescript
import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useChat } from '../useChat';

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false }
    }
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('useChat', () => {
  it('should initialize with empty state', () => {
    const { result } = renderHook(() => useChat(), {
      wrapper: createWrapper()
    });

    expect(result.current.chats).toEqual([]);
    expect(result.current.isLoading).toBe(false);
  });

  it('should handle sending a message', async () => {
    const { result } = renderHook(() => useChat(), {
      wrapper: createWrapper()
    });

    await act(async () => {
      await result.current.sendMessage('Hello, TESSA!');
    });

    await waitFor(() => {
      expect(result.current.messages.length).toBeGreaterThan(0);
    });
  });

  it('should update loading state during async operations', async () => {
    const { result } = renderHook(() => useChat(), {
      wrapper: createWrapper()
    });

    expect(result.current.isLoading).toBe(false);

    act(() => {
      result.current.sendMessage('Test message');
    });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
  });
});
```

## Integration Testing

### Testing Component Interactions

```typescript
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';
import { SearchPage } from '@/pages/SearchPage';
import { TestProviders } from '@/__tests__/utils/test-providers';

describe('SearchPage Integration', () => {
  it('should display search results when user types a query', async () => {
    const user = userEvent.setup();
    
    render(<SearchPage />, { wrapper: TestProviders });

    const searchInput = screen.getByPlaceholderText(/ask tessa/i);
    await user.type(searchInput, 'What is TESSA?');
    await user.keyboard('{Enter}');

    await waitFor(() => {
      expect(screen.getByText(/tessa is/i)).toBeInTheDocument();
    });
  });

  it('should handle chat history navigation', async () => {
    const user = userEvent.setup();
    
    render(<SearchPage />, { wrapper: TestProviders });

    // Create a new chat
    const newChatButton = screen.getByRole('button', { name: /new chat/i });
    await user.click(newChatButton);

    // Verify new chat is created
    await waitFor(() => {
      expect(screen.getByText(/new conversation/i)).toBeInTheDocument();
    });
  });
});
```

### Testing Offline Sync

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { offlineStorage } from '@/lib/offline-storage';
import { syncResolver } from '@/lib/sync-resolver';

describe('Offline Sync Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('should queue operations when offline', async () => {
    // Simulate offline mode
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);

    const operation = {
      type: 'create',
      table: 'chats',
      data: { title: 'Offline Chat' }
    };

    await offlineStorage.queueOperation(operation);

    const queue = await offlineStorage.getOperationQueue();
    expect(queue).toContainEqual(expect.objectContaining(operation));
  });

  it('should sync queued operations when back online', async () => {
    // Queue some operations
    await offlineStorage.queueOperation({
      type: 'create',
      table: 'chats',
      data: { title: 'Offline Chat' }
    });

    // Simulate going back online
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true);

    await syncResolver.syncPendingOperations();

    const queue = await offlineStorage.getOperationQueue();
    expect(queue).toHaveLength(0);
  });
});
```

## E2E Testing

### Setting Up Playwright (Optional)

```bash
npm install -D @playwright/test
npx playwright install
```

### Example E2E Test

```typescript
// e2e/chat-flow.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Chat Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should complete a full chat conversation', async ({ page }) => {
    // Navigate to search page
    await page.click('text=Get Started');
    
    // Wait for chat interface to load
    await expect(page.locator('[data-testid="chat-input"]')).toBeVisible();
    
    // Type a message
    await page.fill('[data-testid="chat-input"]', 'Hello, TESSA!');
    await page.keyboard.press('Enter');
    
    // Wait for response
    await expect(page.locator('[data-testid="ai-response"]')).toBeVisible({
      timeout: 10000
    });
    
    // Verify response content
    const response = await page.textContent('[data-testid="ai-response"]');
    expect(response).toBeTruthy();
  });

  test('should persist chat history', async ({ page }) => {
    // Create a chat
    await page.goto('/search');
    await page.fill('[data-testid="chat-input"]', 'Remember this message');
    await page.keyboard.press('Enter');
    
    // Wait for response
    await expect(page.locator('[data-testid="ai-response"]')).toBeVisible();
    
    // Refresh page
    await page.reload();
    
    // Verify chat is still there
    await expect(page.locator('text=Remember this message')).toBeVisible();
  });
});
```

## Mocking Strategies

### Mocking Supabase

All Supabase calls are automatically mocked in `vitest.setup.ts`:

```typescript
// vitest.setup.ts
import { vi } from 'vitest';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [], error: null })
    })),
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      signIn: vi.fn(),
      signOut: vi.fn()
    },
    functions: {
      invoke: vi.fn().mockResolvedValue({ data: {}, error: null })
    }
  }
}));
```

### Creating Custom Mocks

```typescript
// __mocks__/chat.service.ts
import { vi } from 'vitest';

export const ChatService = {
  loadChats: vi.fn().mockResolvedValue([]),
  createChat: vi.fn().mockResolvedValue({ id: 'mock-id', title: 'Mock Chat' }),
  deleteChat: vi.fn().mockResolvedValue(true),
  sendMessage: vi.fn().mockResolvedValue({ response: 'Mock response' })
};
```

### Mocking API Responses

```typescript
import { vi } from 'vitest';

const mockApiResponse = (data: any, error: any = null) => ({
  data,
  error,
  status: error ? 500 : 200
});

// Usage in tests
vi.mocked(supabase.from).mockReturnValue({
  select: () => ({
    eq: () => Promise.resolve(mockApiResponse([{ id: '1', title: 'Test' }]))
  })
} as any);
```

## Best Practices

### 1. Test User Behavior, Not Implementation

```typescript
// ❌ Bad - Testing implementation details
it('should call setState with correct value', () => {
  const setStateSpy = vi.spyOn(React, 'useState');
  // ...
});

// ✅ Good - Testing user behavior
it('should display error message when form is invalid', async () => {
  const user = userEvent.setup();
  render(<LoginForm />);
  
  await user.click(screen.getByRole('button', { name: /submit/i }));
  
  expect(screen.getByText(/email is required/i)).toBeInTheDocument();
});
```

### 2. Use Meaningful Test Descriptions

```typescript
// ❌ Bad
it('works', () => {});
it('test 1', () => {});

// ✅ Good
it('should display loading spinner while fetching data', () => {});
it('should show error toast when API call fails', () => {});
```

### 3. Keep Tests Isolated

```typescript
// ❌ Bad - Tests depend on each other
let sharedState: any;

it('should create item', () => {
  sharedState = createItem();
});

it('should update item', () => {
  updateItem(sharedState.id); // Depends on previous test
});

// ✅ Good - Each test is independent
it('should create item', () => {
  const item = createItem();
  expect(item).toBeDefined();
});

it('should update item', () => {
  const item = createItem(); // Create fresh item
  const updated = updateItem(item.id);
  expect(updated.title).toBe('Updated');
});
```

### 4. Use Data-TestId Sparingly

```typescript
// ❌ Overusing data-testid
<button data-testid="submit-button">Submit</button>
screen.getByTestId('submit-button');

// ✅ Prefer accessible queries
<button type="submit">Submit</button>
screen.getByRole('button', { name: /submit/i });
```

### 5. Test Edge Cases

```typescript
describe('ChatInput', () => {
  it('should handle empty input', async () => {});
  it('should handle very long messages', async () => {});
  it('should handle special characters', async () => {});
  it('should handle network errors', async () => {});
  it('should handle rapid submissions', async () => {});
});
```

## Coverage Requirements

| Category | Minimum Coverage |
|----------|-----------------|
| Services | 80% |
| Critical Hooks | 75% |
| Components | 60% |
| Overall | 70% |

### Generating Coverage Report

```bash
npm run test:coverage
```

Coverage report is generated in `coverage/` directory.

## CI/CD Integration

### GitHub Actions Example

```yaml
# .github/workflows/test.yml
name: Test

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm run test:coverage
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
```

## Debugging Tests

### Using Debug Mode

```typescript
import { screen } from '@testing-library/react';

it('should render correctly', () => {
  render(<MyComponent />);
  
  // Print the current DOM
  screen.debug();
  
  // Print specific element
  screen.debug(screen.getByRole('button'));
});
```

### Using Vitest UI

```bash
npm run test:ui
```

Opens a visual test runner in the browser for easier debugging.

### Common Issues

1. **Test timeouts**: Increase timeout or check for unresolved promises
2. **State bleeding**: Ensure proper cleanup in `beforeEach`/`afterEach`
3. **Mock not working**: Check mock path matches import path exactly
4. **Async issues**: Use `waitFor` and `findBy*` queries for async content

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Library Cheatsheet](https://testing-library.com/docs/react-testing-library/cheatsheet)
