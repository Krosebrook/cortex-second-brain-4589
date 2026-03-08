# Error Handling Guide

**Version**: 1.0.0 · **Last Updated**: 2026-03-08 · **Owner**: Engineering Lead

This guide establishes consistent error handling patterns across the Tessa AI Platform — frontend, backend edge functions, and database layer.

---

## Table of Contents

1. [Error Classification System](#1-error-classification-system)
2. [Error Code Taxonomy](#2-error-code-taxonomy)
3. [Client-Side Error Handling Patterns](#3-client-side-error-handling-patterns)
4. [Edge Function Error Handling Patterns](#4-edge-function-error-handling-patterns)
5. [Database Error Handling](#5-database-error-handling)
6. [User-Facing Error Messages](#6-user-facing-error-messages)
7. [Error Logging and Reporting](#7-error-logging-and-reporting)
8. [Error Recovery Strategies](#8-error-recovery-strategies)
9. [Anti-Patterns to Avoid](#9-anti-patterns-to-avoid)
10. [Error Handling Checklist](#10-error-handling-checklist)

---

## 1. Error Classification System

| Category | HTTP Range | Description | Example |
|---|---|---|---|
| **Validation** | 400 | Input fails schema / business-rule check | Empty required field |
| **Authentication** | 401 | No valid session | JWT expired |
| **Authorization** | 403 | Authenticated but lacking permission | Accessing another user's data |
| **Not Found** | 404 | Resource does not exist | Knowledge item deleted |
| **Conflict** | 409 | Optimistic-lock version mismatch | Concurrent edit |
| **Rate Limit** | 429 | Request frequency exceeded | > 20 chat messages / min |
| **Server Error** | 500 | Unexpected server-side failure | DB connection dropped |
| **Service Unavailable** | 503 | Dependency unavailable | OpenAI down |
| **Network** | N/A | Client cannot reach server | User offline |

---

## 2. Error Code Taxonomy

### Format: `<DOMAIN>-<NUMBER>`

| Code | Domain | Meaning |
|---|---|---|
| `AUTH-001` | Authentication | Supabase Auth unavailable |
| `AUTH-002` | Authentication | Token refresh failed |
| `AUTH-003` | Authentication | Account locked out |
| `AUTH-004` | Authentication | OAuth provider unavailable |
| `CHAT-001` | AI Chat | AI provider unavailable |
| `CHAT-002` | AI Chat | Rate limit exceeded |
| `CHAT-003` | AI Chat | Response timeout |
| `CHAT-004` | AI Chat | Token limit exceeded |
| `CHAT-005` | AI Chat | Content policy violation |
| `KB-001` | Knowledge Base | Concurrent edit conflict |
| `KB-002` | Knowledge Base | Partial import failure |
| `KB-003` | Knowledge Base | Item too large |
| `KB-004` | Knowledge Base | Search index not ready |
| `SYNC-001` | Sync | Network unavailable |
| `SYNC-002` | Sync | Storage quota exceeded |
| `SYNC-003` | Sync | Real-time subscription dropped |
| `DB-001` | Database | RLS policy denial |
| `DB-002` | Database | Migration failure |
| `DB-003` | Database | Connection pool exhausted |
| `EDGE-001` | Edge Function | Cold start timeout |
| `EDGE-002` | Edge Function | Missing/invalid secret |
| `EDGE-003` | Edge Function | Memory limit exceeded |
| `STORE-001` | Storage | File too large |
| `STORE-002` | Storage | Storage service unavailable |
| `VAL-001` | Validation | Required field missing |
| `VAL-002` | Validation | Input exceeds max length |
| `VAL-003` | Validation | Invalid format (email, URL, etc.) |

---

## 3. Client-Side Error Handling Patterns

### 3.1 Standard Service Call with Error Handling

```typescript
// src/services/knowledgeService.ts
import { supabase } from '@/integrations/supabase/client';
import { AppError } from '@/utils/errors';

export async function createKnowledgeItem(
  payload: CreateKnowledgePayload
): Promise<KnowledgeItem> {
  const { data, error } = await supabase
    .from('knowledge_base')
    .insert(payload)
    .select()
    .single();

  if (error) {
    // Map Supabase error to domain error
    if (error.code === '23514') {
      throw new AppError('VAL-001', 'Validation failed', 400, error);
    }
    if (error.code === '42501') {
      throw new AppError('AUTH-003', 'Permission denied', 403, error);
    }
    throw new AppError('DB-001', 'Database operation failed', 500, error);
  }

  return data;
}
```

### 3.2 AppError Class

```typescript
// src/utils/errors.ts
export class AppError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly httpStatus: number = 500,
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function isAppError(err: unknown): err is AppError {
  return err instanceof AppError;
}
```

### 3.3 React Query Error Handling

```typescript
// In a hook using TanStack Query
const { data, error, isError } = useQuery({
  queryKey: ['knowledge', itemId],
  queryFn: () => fetchKnowledgeItem(itemId),
  retry: (failureCount, error) => {
    // Do not retry auth errors or not-found
    if (isAppError(error) && [401, 403, 404].includes(error.httpStatus)) {
      return false;
    }
    return failureCount < 2;
  },
});

if (isError) {
  // Display user-friendly message based on error code
  return <ErrorDisplay error={error} />;
}
```

### 3.4 Global Error Boundary

```typescript
// src/components/error/ErrorBoundary.tsx
import { Component, ReactNode } from 'react';

interface Props { children: ReactNode; fallback?: ReactNode; }
interface State { hasError: boolean; error?: Error; }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Log to observability service
    console.error(JSON.stringify({
      event: 'react_error_boundary',
      message: error.message,
      componentStack: info.componentStack,
    }));
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div role="alert">
          <p>Something went wrong. Please refresh the page.</p>
        </div>
      );
    }
    return this.props.children;
  }
}
```

### 3.5 Toast Notifications for Errors

```typescript
// Use Sonner toast for user-facing errors
import { toast } from 'sonner';

function handleError(error: unknown) {
  if (isAppError(error)) {
    if (error.httpStatus === 429) {
      toast.error('Rate limit reached', {
        description: 'Please wait a moment before trying again.',
        duration: 5000,
      });
      return;
    }
    if (error.httpStatus >= 500) {
      toast.error('Something went wrong', {
        description: 'Our team has been notified. Please try again shortly.',
        duration: 8000,
      });
      return;
    }
  }
  toast.error('An error occurred', { description: 'Please try again.' });
}
```

---

## 4. Edge Function Error Handling Patterns

### 4.1 Standard Edge Function Error Response

```typescript
// supabase/functions/_shared/errorResponse.ts
export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    request_id: string;
  };
}

export function errorResponse(
  code: string,
  message: string,
  httpStatus: number,
  requestId: string
): Response {
  const body: ErrorResponse = {
    error: { code, message, request_id: requestId },
  };

  // Log structured error
  console.error(JSON.stringify({
    event: 'edge_function_error',
    error_code: code,
    message,
    http_status: httpStatus,
    request_id: requestId,
    timestamp: new Date().toISOString(),
  }));

  return new Response(JSON.stringify(body), {
    status: httpStatus,
    headers: { 'Content-Type': 'application/json' },
  });
}
```

### 4.2 Input Validation Pattern

```typescript
// Validate request before processing
if (!body.message || body.message.trim().length === 0) {
  return errorResponse('VAL-001', 'Message is required', 400, requestId);
}

const MAX_LENGTH = parseInt(Deno.env.get('MAX_MESSAGE_LENGTH') ?? '10000');
if (body.message.length > MAX_LENGTH) {
  return errorResponse('VAL-002', `Message exceeds ${MAX_LENGTH} character limit`, 400, requestId);
}
```

### 4.3 External API Call Pattern

```typescript
let aiResponse: Response;
try {
  aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(25_000), // 25 s timeout
  });
} catch (err) {
  if (err instanceof DOMException && err.name === 'TimeoutError') {
    return errorResponse('CHAT-003', 'AI response timed out', 504, requestId);
  }
  return errorResponse('CHAT-001', 'AI service unavailable', 503, requestId);
}

if (!aiResponse.ok) {
  if (aiResponse.status === 429) {
    return errorResponse('CHAT-002', 'AI rate limit exceeded', 429, requestId);
  }
  return errorResponse('CHAT-001', `AI service error: ${aiResponse.status}`, 503, requestId);
}
```

---

## 5. Database Error Handling

### 5.1 Supabase Error Code Mapping

| Supabase / PostgreSQL Code | Meaning | AppError Code |
|---|---|---|
| `23502` | NOT NULL violation | `VAL-001` |
| `23505` | Unique constraint violation | `KB-001` |
| `23514` | CHECK constraint violation | `VAL-001` |
| `42501` | Insufficient privilege (RLS) | `AUTH-003` / `DB-001` |
| `PGRST116` | Row not found (PostgREST) | 404 |
| `PGRST301` | JWT expired | `AUTH-002` |

### 5.2 RLS Error Detection

```typescript
function isRLSError(error: PostgrestError): boolean {
  return error.code === '42501' || error.message.includes('row-level security');
}
```

---

## 6. User-Facing Error Messages

### Principles

1. **Never expose internal error details** (stack traces, DB errors, API keys) to users.
2. **Be specific but not technical** — explain what happened and what to do.
3. **Provide a path forward** — link to retry, support, or password reset where applicable.
4. **Match the tone** of the app (friendly, professional).

### Message Catalogue

| Code | User Message |
|---|---|
| `AUTH-001` | "Sign-in is temporarily unavailable. Please try again in a few minutes." |
| `AUTH-002` | "Your session has expired. Please sign in again." |
| `AUTH-003` | "Too many failed attempts. Please wait 30 minutes or reset your password." |
| `CHAT-001` | "The AI assistant is temporarily unavailable. Please try again shortly." |
| `CHAT-002` | "You've reached the message limit. Please wait a moment before sending more." |
| `CHAT-003` | "The response took too long. Please try a shorter message." |
| `CHAT-004` | "This conversation is too long for context. Start a new chat or summarise earlier messages." |
| `KB-001` | "This item was updated in another tab. Please reload to see the latest version." |
| `KB-003` | "File is too large (max 10 MB). Please split into smaller sections." |
| `SYNC-001` | "You're offline. Changes will sync when you reconnect." |
| `SYNC-002` | "Device storage is almost full. Some features may be limited." |
| `VAL-001` | "Please fill in all required fields." |
| `VAL-002` | "Input is too long. Please shorten your text." |
| Generic 500 | "Something went wrong on our end. Our team has been notified." |
| Generic 503 | "The service is temporarily unavailable. Please try again in a few minutes." |

---

## 7. Error Logging and Reporting

### What to Always Log on Error

```typescript
{
  event: 'error',
  error_code: string,           // Domain error code
  message: string,              // Technical description (NOT user-facing)
  http_status: number,
  request_id: string,           // Correlation ID
  user_id_hash: string,         // SHA-256 of user_id — never raw UUID in external store
  timestamp: string,            // ISO 8601
  service: string,              // 'frontend' | edge function name
  metadata: Record<string, unknown>,  // Context-specific; no PII
}
```

### What NOT to Log

- ❌ Passwords or password hashes
- ❌ API keys or secrets
- ❌ Raw user IDs in external log aggregators
- ❌ Full request/response bodies (log only relevant fields)
- ❌ Personal data (email, name, phone) in external stores
- ❌ Stack traces in user-facing responses

---

## 8. Error Recovery Strategies

| Strategy | When to Use | Implementation |
|---|---|---|
| **Silent retry** | Transient network errors, DB timeouts | Up to 2 retries with exponential back-off |
| **User-prompted retry** | AI errors, sync failures | Retry button in UI |
| **Fallback data** | Search unavailable | Return cached results with stale indicator |
| **Graceful degradation** | AI provider down | Hide chat; show knowledge base only |
| **Redirect** | Auth expired | Redirect to login with `?return=<current_path>` |
| **Circuit breaker** | Repeated external failures | Stop calling for 60 s, show static error |

---

## 9. Anti-Patterns to Avoid

| Anti-Pattern | Problem | Correct Approach |
|---|---|---|
| `catch (e) {}` | Silently swallows errors | Always log; re-throw or handle |
| Exposing `error.message` from DB to user | Leaks internal details | Map to user-safe message |
| Infinite retry loop | Amplifies load during outage | Max 2–3 retries with back-off |
| Generic "Something went wrong" for every error | Confuses users | Use specific messages from catalogue |
| `console.log` in production | Unstructured; noisy | Use structured JSON logger |
| Not setting error boundaries | Single component crash takes down app | Wrap route-level components in `<ErrorBoundary>` |
| Throwing in render | React state corruption | Use event handlers and useEffect for async |

---

## 10. Error Handling Checklist

### For Each New Feature

- [ ] Define the error codes for all failure scenarios.
- [ ] Map Supabase/HTTP error codes to `AppError` codes.
- [ ] Provide user-facing messages for each error code.
- [ ] Implement retry logic for transient errors.
- [ ] Log all errors with structured format including `request_id`.
- [ ] Add `<ErrorBoundary>` around new route-level components.
- [ ] Write tests for at least the top 3 error scenarios.
- [ ] No `console.log` or raw error exposure in production paths.

---

## Related Documentation

- [Failure Modes & Edge Cases](FAILURE_MODES.md)
- [Observability & Monitoring](OBSERVABILITY.md)
- [Security Documentation](SECURITY.md)
- [Testing Guide](TESTING.md)

```typescript
enum ErrorCode {
  // Authentication (1xxx)
  AUTH_INVALID_CREDENTIALS = 1001,
  AUTH_SESSION_EXPIRED = 1002,
  AUTH_TOKEN_INVALID = 1003,
  AUTH_ACCOUNT_LOCKED = 1004,
  AUTH_RATE_LIMIT_EXCEEDED = 1005,
  
  // Authorization (2xxx)
  AUTHZ_PERMISSION_DENIED = 2001,
  AUTHZ_RESOURCE_NOT_FOUND = 2002,
  AUTHZ_INVALID_OWNERSHIP = 2003,
  
  // Validation (3xxx)
  VALIDATION_REQUIRED_FIELD = 3001,
  VALIDATION_INVALID_FORMAT = 3002,
  VALIDATION_LENGTH_EXCEEDED = 3003,
  VALIDATION_INVALID_TYPE = 3004,
  
  // AI Chat (4xxx)
  CHAT_AI_SERVICE_UNAVAILABLE = 4001,
  CHAT_RATE_LIMIT_EXCEEDED = 4002,
  CHAT_CONTEXT_TOO_LARGE = 4003,
  CHAT_INVALID_MESSAGE = 4004,
  CHAT_SESSION_NOT_FOUND = 4005,
  
  // Knowledge Base (5xxx)
  KNOWLEDGE_ITEM_NOT_FOUND = 5001,
  KNOWLEDGE_SIZE_EXCEEDED = 5002,
  KNOWLEDGE_DUPLICATE = 5003,
  KNOWLEDGE_INVALID_CONTENT = 5004,
  
  // Search (6xxx)
  SEARCH_QUERY_TIMEOUT = 6001,
  SEARCH_INVALID_SYNTAX = 6002,
  SEARCH_INDEX_UNAVAILABLE = 6003,
  
  // Sync (7xxx)
  SYNC_CONFLICT = 7001,
  SYNC_QUEUE_FULL = 7002,
  SYNC_STORAGE_FULL = 7003,
  
  // Database (8xxx)
  DB_CONNECTION_FAILED = 8001,
  DB_QUERY_TIMEOUT = 8002,
  DB_CONSTRAINT_VIOLATION = 8003,
  
  // System (9xxx)
  SYSTEM_INTERNAL_ERROR = 9001,
  SYSTEM_SERVICE_UNAVAILABLE = 9002,
  SYSTEM_TIMEOUT = 9003,
}
```

### 3. Error Response Format

**Standard Error Response**:
```typescript
interface ErrorResponse {
  error: {
    code: ErrorCode;
    message: string;          // User-facing message
    details?: string;         // Technical details (optional)
    timestamp: string;        // ISO8601 timestamp
    requestId: string;        // For tracking
    retryable: boolean;       // Can user retry?
    retryAfter?: number;      // Seconds to wait before retry
    documentation?: string;   // Link to docs
    context?: {               // Additional context
      field?: string;         // Field that caused error
      constraint?: string;    // Constraint violated
      [key: string]: any;
    };
  };
}
```

**Example Error Responses**:

```json
{
  "error": {
    "code": 1002,
    "message": "Your session has expired. Please log in again.",
    "timestamp": "2026-01-21T20:00:00Z",
    "requestId": "req_abc123",
    "retryable": false,
    "documentation": "https://docs.example.com/errors/1002"
  }
}
```

```json
{
  "error": {
    "code": 4002,
    "message": "You've reached the message rate limit. Please wait before sending more messages.",
    "timestamp": "2026-01-21T20:00:00Z",
    "requestId": "req_abc124",
    "retryable": true,
    "retryAfter": 60,
    "documentation": "https://docs.example.com/errors/4002"
  }
}
```

### 4. Client-Side Error Handling Patterns

**Error Boundary Pattern**:
```typescript
// TBD: Document ErrorBoundary usage
// TBD: Document fallback UI patterns
// TBD: Document error recovery strategies
```

**API Error Handling**:
```typescript
// TBD: Document API client error handling
// TBD: Document retry logic
// TBD: Document error toast patterns
```

**Validation Error Handling**:
```typescript
// TBD: Document form validation errors
// TBD: Document field-level errors
// TBD: Document error message display
```

### 5. Server-Side Error Handling Patterns

**Edge Function Error Handling**:
```typescript
// TBD: Document try-catch patterns
// TBD: Document error logging
// TBD: Document error response creation
```

**Database Error Handling**:
```typescript
// TBD: Document database error mapping
// TBD: Document constraint violation handling
// TBD: Document transaction rollback
```

### 6. Error Recovery Strategies

**Retry Logic**:
- [ ] **Exponential Backoff** - For transient failures
- [ ] **Circuit Breaker** - For repeated failures
- [ ] **Fallback** - Alternative behavior when primary fails
- [ ] **Timeout** - Give up after reasonable time

**Recovery Patterns by Error Type**:

| Error Type | Recovery Strategy |
|------------|-------------------|
| Network Timeout | Retry with exponential backoff (max 3 attempts) |
| Rate Limit | Wait and retry after `retryAfter` seconds |
| Auth Expired | Refresh token, retry original request |
| Validation Error | Display error to user, no retry |
| Server Error (5xx) | Retry once, then fallback or error |
| Not Found (404) | No retry, display error |

### 7. User-Facing Error Messages

**Principles**:
- [ ] **Clear** - Explain what went wrong
- [ ] **Actionable** - Tell user what to do next
- [ ] **Non-Technical** - Avoid jargon
- [ ] **Empathetic** - Acknowledge frustration
- [ ] **Helpful** - Provide next steps or links

**Message Templates**:

```typescript
const ERROR_MESSAGES = {
  [ErrorCode.AUTH_INVALID_CREDENTIALS]: {
    title: "Login Failed",
    message: "The email or password you entered is incorrect. Please try again.",
    action: "Try Again"
  },
  [ErrorCode.CHAT_RATE_LIMIT_EXCEEDED]: {
    title: "Slow Down",
    message: "You're sending messages too quickly. Please wait a moment before trying again.",
    action: "Wait {seconds} seconds"
  },
  [ErrorCode.SYSTEM_INTERNAL_ERROR]: {
    title: "Something Went Wrong",
    message: "We encountered an unexpected error. Our team has been notified and is working on it.",
    action: "Try Again"
  },
  // TBD: Add all error codes
};
```

### 8. Error Logging Strategy

**What to Log**:
```typescript
interface ErrorLog {
  timestamp: string;
  level: "ERROR" | "WARN";
  errorCode: ErrorCode;
  message: string;
  stack?: string;
  context: {
    userId?: string;
    requestId: string;
    service: string;
    feature: string;
    action: string;
    metadata?: Record<string, any>;
  };
}
```

**When to Log**:
- [ ] All 5xx errors (server errors)
- [ ] Authentication failures
- [ ] Authorization failures
- [ ] Validation failures (aggregated)
- [ ] Rate limit hits (aggregated)
- [ ] Unexpected errors

**What NOT to Log**:
- [ ] ❌ User passwords or credentials
- [ ] ❌ API keys or secrets
- [ ] ❌ PII (unless necessary and encrypted)
- [ ] ❌ Full user messages (privacy concern)

### 9. Error Monitoring & Alerting

**Alert on**:
- [ ] Error rate >5% (5min window) - **CRITICAL**
- [ ] Specific error rate spike (10x baseline) - **WARNING**
- [ ] Auth failure rate >20% - **CRITICAL**
- [ ] AI chat failure rate >10% - **CRITICAL**

**Metrics to Track**:
- [ ] Total error count
- [ ] Error rate (errors per request)
- [ ] Error breakdown by code
- [ ] Error breakdown by service
- [ ] Time to resolution

### 10. Testing Error Scenarios

**Test Coverage Required**:
- [ ] Unit tests for error handlers
- [ ] Integration tests for error flows
- [ ] E2E tests for user-facing errors
- [ ] Chaos engineering tests (inject failures)

---

## Next Steps

1. **Define All Error Codes**: Complete error code taxonomy
2. **Implement Error Responses**: Standardize API error responses
3. **Create Error UI Components**: Build reusable error UI
4. **Add Error Logging**: Instrument all error paths
5. **Set Up Monitoring**: Configure error alerts
6. **Write Tests**: Test all error scenarios
7. **Document Examples**: Add real-world examples

---

## Related Documentation

- [API Documentation](API.md) - Incomplete
- [Failure Modes](FAILURE_MODES.md) - Not Started
- [Observability](OBSERVABILITY.md) - Not Started
- [Runbook](RUNBOOK.md) - Not Started

---

**⚠️ PRODUCTION BLOCKER**: Consistent error handling must be implemented before production deployment.
