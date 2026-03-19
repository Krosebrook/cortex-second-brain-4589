# Best Practices Guide

This document outlines the coding standards and best practices followed in the Cortex codebase.

## Table of Contents

- [TypeScript](#typescript)
- [React](#react)
- [Code Organization](#code-organization)
- [Testing](#testing)
- [Git Workflow](#git-workflow)
- [Performance](#performance)
- [Security](#security)

## TypeScript

### Type Safety

#### Use Explicit Types
```typescript
// ❌ Bad - implicit any
function processData(data) {
  return data.map(item => item.value);
}

// ✅ Good - explicit types
function processData(data: DataItem[]): number[] {
  return data.map(item => item.value);
}
```

#### Avoid `any`
```typescript
// ❌ Bad
const processResponse = (response: any) => {
  return response.data;
};

// ✅ Good
interface ApiResponse {
  data: unknown;
  status: number;
}

const processResponse = (response: ApiResponse) => {
  return response.data;
};
```

#### Use Type Guards
```typescript
// ✅ Good - type narrowing
function isString(value: unknown): value is string {
  return typeof value === 'string';
}

if (isString(data)) {
  // TypeScript knows data is string here
  console.log(data.toUpperCase());
}
```

### Naming Conventions

- **Interfaces/Types**: PascalCase - `UserProfile`, `ChatMessage`
- **Functions/Variables**: camelCase - `getUserData`, `isLoading`
- **Constants**: UPPER_SNAKE_CASE - `MAX_RETRY_COUNT`, `API_BASE_URL`
- **Components**: PascalCase - `ChatMessage`, `UserProfile`
- **Files**: kebab-case for utilities, PascalCase for components
  - Components: `ChatMessage.tsx`
  - Utils: `format-date.ts`

## React

### Component Structure

```typescript
// ✅ Good component structure
interface ChatMessageProps {
  message: string;
  author: string;
  timestamp: Date;
  onReply?: (messageId: string) => void;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  author,
  timestamp,
  onReply
}) => {
  // Hooks at the top
  const [isHovered, setIsHovered] = useState(false);
  const messageRef = useRef<HTMLDivElement>(null);

  // Event handlers
  const handleReply = useCallback(() => {
    onReply?.(message.id);
  }, [message.id, onReply]);

  // Effects
  useEffect(() => {
    // Effect logic
  }, [/* dependencies */]);

  // Render
  return (
    <div ref={messageRef} onMouseEnter={() => setIsHovered(true)}>
      {/* JSX */}
    </div>
  );
};
```

### Hooks Best Practices

#### Dependency Arrays
```typescript
// ❌ Bad - missing dependencies
useEffect(() => {
  fetchData(userId);
}, []);

// ✅ Good - complete dependencies
useEffect(() => {
  fetchData(userId);
}, [userId, fetchData]);
```

#### Custom Hooks
```typescript
// ✅ Good - reusable custom hook
export const useDebounce = <T,>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
};
```

### State Management

```typescript
// ✅ Good - complex state with useReducer
type Action = 
  | { type: 'LOADING' }
  | { type: 'SUCCESS'; payload: Data }
  | { type: 'ERROR'; error: Error };

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case 'LOADING':
      return { ...state, loading: true, error: null };
    case 'SUCCESS':
      return { ...state, loading: false, data: action.payload };
    case 'ERROR':
      return { ...state, loading: false, error: action.error };
    default:
      return state;
  }
};
```

### Performance Optimization

```typescript
// ✅ Use React.memo for expensive components
export const ExpensiveComponent = React.memo(({ data }) => {
  return <div>{/* Render data */}</div>;
}, (prevProps, nextProps) => {
  // Custom comparison
  return prevProps.data.id === nextProps.data.id;
});

// ✅ Use useMemo for expensive calculations
const sortedItems = useMemo(() => {
  return items.sort((a, b) => a.timestamp - b.timestamp);
}, [items]);

// ✅ Use useCallback for stable function references
const handleClick = useCallback(() => {
  console.log('Clicked', item.id);
}, [item.id]);
```

## Code Organization

### File Structure

```
src/
├── components/          # React components
│   ├── ui/             # Reusable UI components
│   ├── features/       # Feature-specific components
│   └── layout/         # Layout components
├── hooks/              # Custom React hooks
├── lib/                # Utility functions and helpers
├── services/           # API services and data fetching
├── types/              # TypeScript type definitions
├── contexts/           # React context providers
├── constants/          # Application constants
└── utils/              # Pure utility functions
```

### Import Order

```typescript
// 1. External libraries
import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

// 2. Internal modules (absolute imports)
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';

// 3. Local imports (relative imports)
import { formatDate } from './utils';
import type { ChatMessage } from './types';

// 4. Styles
import './styles.css';
```

## Testing

### Unit Tests

```typescript
// ✅ Good test structure
describe('ChatService', () => {
  beforeEach(() => {
    // Setup
  });

  afterEach(() => {
    // Cleanup
  });

  it('should load chats successfully', async () => {
    // Arrange
    const userId = 'user-123';
    const mockChats = [{ id: '1', title: 'Test Chat' }];
    vi.spyOn(supabase, 'from').mockReturnValue(mockChats);

    // Act
    const result = await chatService.loadChats(userId);

    // Assert
    expect(result).toEqual(mockChats);
    expect(supabase.from).toHaveBeenCalledWith('chats');
  });
});
```

### Component Tests

```typescript
// ✅ Good component test
import { render, screen, fireEvent } from '@testing-library/react';
import { ChatMessage } from './ChatMessage';

describe('ChatMessage', () => {
  it('should render message content', () => {
    render(
      <ChatMessage 
        message="Hello" 
        author="John" 
        timestamp={new Date()}
      />
    );
    
    expect(screen.getByText('Hello')).toBeInTheDocument();
    expect(screen.getByText('John')).toBeInTheDocument();
  });

  it('should call onReply when reply button is clicked', () => {
    const onReply = vi.fn();
    render(
      <ChatMessage 
        message="Hello" 
        author="John" 
        timestamp={new Date()}
        onReply={onReply}
      />
    );
    
    fireEvent.click(screen.getByRole('button', { name: /reply/i }));
    expect(onReply).toHaveBeenCalledTimes(1);
  });
});
```

## Git Workflow

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```bash
# Format
<type>(<scope>): <subject>

# Examples
feat(chat): add message search functionality
fix(auth): resolve token refresh issue
docs(readme): update installation instructions
refactor(hooks): extract useDebounce from useSearchFilter
test(chat): add integration tests for message flow
chore(deps): update dependencies
```

### Branch Naming

```bash
# Format
<type>/<description>

# Examples
feat/message-search
fix/auth-token-refresh
docs/api-documentation
refactor/chat-service
test/integration-tests
```

## Performance

### Code Splitting

```typescript
// ✅ Good - lazy load heavy components
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));

// Usage
<Suspense fallback={<Loading />}>
  <AdminDashboard />
</Suspense>
```

### Memoization

```typescript
// ✅ Good - memoize expensive calculations
const expensiveValue = useMemo(() => {
  return computeExpensiveValue(data);
}, [data]);

// ✅ Good - memoize callbacks passed as props
const handleUpdate = useCallback((id: string) => {
  updateItem(id);
}, [updateItem]);
```

### Virtual Scrolling

```typescript
// ✅ Good - use virtual scrolling for large lists
import { useVirtual } from '@tanstack/react-virtual';

const rowVirtualizer = useVirtual({
  size: items.length,
  parentRef: scrollRef,
  estimateSize: useCallback(() => 50, []),
});
```

## Security

### Input Sanitization

```typescript
// ✅ Good - sanitize user input
import DOMPurify from 'dompurify';

const sanitizeHtml = (html: string): string => {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br'],
    ALLOWED_ATTR: []
  });
};
```

### Environment Variables

```typescript
// ✅ Good - use environment variables for sensitive data
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// ❌ Bad - never commit secrets
const apiKey = 'sk-1234567890abcdef'; // Never do this!
```

### Authentication

```typescript
// ✅ Good - check authentication status
const { data: { session } } = await supabase.auth.getSession();
if (!session) {
  redirect('/login');
  return;
}

// Use session for authenticated requests
const token = session.access_token;
```

### XSS Prevention

```typescript
// ✅ Good - escape user input in JSX
const UserMessage = ({ content }: { content: string }) => {
  return <div>{content}</div>; // React auto-escapes
};

// ✅ Good - use dangerouslySetInnerHTML only with sanitized content
const RichContent = ({ html }: { html: string }) => {
  return (
    <div dangerouslySetInnerHTML={{ 
      __html: DOMPurify.sanitize(html) 
    }} />
  );
};
```

## Error Handling

### Try-Catch Blocks

```typescript
// ✅ Good - specific error handling
try {
  const data = await fetchData();
  return data;
} catch (error) {
  if (error instanceof NetworkError) {
    console.error('Network error:', error.message);
    throw new AppError('Failed to fetch data', ErrorCode.NETWORK_ERROR);
  }
  throw error;
}
```

### Error Boundaries

```typescript
// ✅ Good - use error boundaries for component errors
class ErrorBoundary extends React.Component<Props, State> {
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logErrorToService(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} />;
    }
    return this.props.children;
  }
}
```

## Documentation

### Code Comments

```typescript
/**
 * Fetches user profile data from the API
 * @param userId - The unique identifier for the user
 * @returns Promise resolving to user profile data
 * @throws {AppError} When user is not found or API fails
 * 
 * @example
 * const profile = await getUserProfile('user-123');
 */
export async function getUserProfile(userId: string): Promise<UserProfile> {
  // Implementation
}
```

### Component Documentation

```typescript
/**
 * ChatMessage component displays a single chat message with author info
 * 
 * @component
 * @example
 * ```tsx
 * <ChatMessage
 *   message="Hello, world!"
 *   author="John Doe"
 *   timestamp={new Date()}
 *   onReply={(id) => console.log('Reply to:', id)}
 * />
 * ```
 */
export const ChatMessage: React.FC<ChatMessageProps> = (props) => {
  // Implementation
};
```

---

## References

- [React TypeScript Cheatsheet](https://react-typescript-cheatsheet.netlify.app/)
- [TypeScript Best Practices](https://www.typescriptlang.org/docs/handbook/declaration-files/do-s-and-don-ts.html)
- [React Best Practices](https://react.dev/learn)
- [ESLint Rules](https://eslint.org/docs/latest/rules/)
- [Conventional Commits](https://www.conventionalcommits.org/)
