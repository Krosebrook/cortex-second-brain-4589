# ADR 007 — Error Handling: ApplicationError + ErrorCode Enum

**Status**: Accepted  
**Date**: 2025-01-01  
**Deciders**: Core team

---

## Context

A consistent error handling strategy is needed across:
- Service layer database calls
- Edge Function responses
- Network request failures
- Validation errors

We needed errors to be: typed (for `switch` handling), serialisable (for logging), and user-facing (for toast messages).

## Decision

All application errors are represented by the **`ApplicationError`** class, which implements the **`AppError`** interface and carries an **`ErrorCode`** enum value.

```typescript
enum ErrorCode {
  UNKNOWN,
  VALIDATION,
  NOT_FOUND,
  UNAUTHORIZED,
  FORBIDDEN,
  NETWORK_ERROR,
  TIMEOUT,
  DATABASE,
  CONFLICT,
  SERVICE_UNAVAILABLE,
  RATE_LIMITED,
}

class ApplicationError extends Error implements AppError {
  constructor(
    public readonly code: ErrorCode,
    message: string,
    public readonly details?: unknown,
  ) { super(message); }
}
```

Service classes extend `BaseService`, which provides a `handleError(error, operation)` method that wraps Supabase errors in `ApplicationError`.

TanStack Query's retry logic is configured to not retry `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, or `VALIDATION` errors (only network/timeout errors are retried).

## Rationale

| Option | Considered | Reason for/against |
|---|---|---|
| Typed `ApplicationError` | ✅ **Selected** | Type-safe error codes; consistent structure; extends native `Error` |
| String error codes | Considered | No compile-time safety; typo-prone |
| HTTP status codes only | Considered | Not meaningful in a client-side context |
| `Result<T, E>` type | Considered | Would require changing all service signatures; too large a refactor |

## Consequences

- UI components can `switch (error.code)` to show appropriate messages
- Edge Functions return errors in `{ error: { code, message, details } }` shape (matching `ErrorCode` strings)
- `CONFLICT` error code supports optimistic concurrency via `version` column in `knowledge_base`
- `RATE_LIMITED` surfaces as a specific UI state in TESSA chat
- The error boundary components in `src/components/error/` catch uncaught `ApplicationError`s and render fallback UI
