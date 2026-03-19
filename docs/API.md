# API Reference — Cortex Second Brain

All Edge Functions are deployed to Supabase and are accessible at:

```
https://<project-ref>.supabase.co/functions/v1/<function-name>
```

Unless otherwise noted, authenticated endpoints require a valid Supabase JWT in the `Authorization: Bearer <token>` header.

---

## Table of Contents

1. [chat-with-tessa-secure](#1-chat-with-tessa-secure)
2. [parse-pdf](#2-parse-pdf)
3. [send-backup-email](#3-send-backup-email)
4. [account-lockout](#4-account-lockout)
5. [google-drive-oauth](#5-google-drive-oauth)
6. [ip-geolocation](#6-ip-geolocation)
7. [security-headers](#7-security-headers)
8. [system-status](#8-system-status)
9. [Error Responses](#9-error-responses)

---

## 1. `chat-with-tessa-secure`

AI chat endpoint. Sends a message to OpenAI and persists the assistant response. Rate-limited via `usage_tracking` table.

**Auth**: Required

### POST `/functions/v1/chat-with-tessa-secure`

**Request Body**

```json
{
  "message": "What notes do I have about machine learning?",
  "chatId": "uuid-of-existing-chat"
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `message` | `string` | ✅ | The user's message |
| `chatId` | `string` (UUID) | ✅ | Existing chat session ID |

**Success Response** `200 OK`

```json
{
  "response": "You have 3 notes related to machine learning...",
  "chatId": "uuid",
  "messageId": "uuid",
  "usage": {
    "promptTokens": 120,
    "completionTokens": 85,
    "totalTokens": 205
  }
}
```

**Error Responses**

| Status | Condition |
|---|---|
| `401` | Missing or invalid JWT |
| `429` | Rate limit exceeded |
| `503` | OpenAI unavailable |

---

## 2. `parse-pdf`

Extracts plain text from a PDF file. No external dependencies — pure Deno parser.

**Auth**: Not required

### POST `/functions/v1/parse-pdf`

**Request**: `multipart/form-data` with a field named `file` containing the PDF binary.

```bash
curl -X POST \
  https://<ref>.supabase.co/functions/v1/parse-pdf \
  -F "file=@document.pdf"
```

**Success Response** `200 OK`

```json
{
  "text": "Extracted text content from the PDF...",
  "pageCount": 5,
  "characterCount": 3420
}
```

**Error Responses**

| Status | Condition |
|---|---|
| `400` | No file provided or invalid format |
| `413` | File too large |
| `422` | Could not parse PDF |

---

## 3. `send-backup-email`

Emails a data backup (chats, messages, knowledge) to the authenticated user. Uses Resend API.

**Auth**: Required

### POST `/functions/v1/send-backup-email`

**Request Body**

```json
{
  "email": "user@example.com",
  "backupData": {
    "chats": [...],
    "messages": [...],
    "knowledge": [...]
  },
  "format": "json"
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `email` | `string` | ✅ | Recipient email address |
| `backupData.chats` | `array` | ✅ | Array of chat objects |
| `backupData.messages` | `array` | ✅ | Array of message objects |
| `backupData.knowledge` | `array` | ✅ | Array of knowledge base items |
| `format` | `"json"` \| `"summary"` | ✅ | Export format |

**Success Response** `200 OK`

```json
{
  "success": true,
  "messageId": "resend-message-id"
}
```

**Error Responses**

| Status | Condition |
|---|---|
| `400` | Missing required fields |
| `401` | Missing or invalid JWT |
| `503` | Resend API unavailable |

---

## 4. `account-lockout`

Tracks failed login attempts and locks accounts after threshold. Uses service role key — **not callable from the frontend directly**.

**Auth**: Service role (`SUPABASE_SERVICE_ROLE_KEY`)

### GET `/functions/v1/account-lockout`

Query parameters:

| Param | Values | Description |
|---|---|---|
| `action` | `check` \| `unlock` \| `config` | Operation to perform |
| `userId` | UUID | Required for `check` and `unlock` |

**Response for `action=check`** `200 OK`

```json
{
  "isLocked": true,
  "failedAttempts": 5,
  "lockoutUntil": "2024-01-15T10:30:00Z",
  "remainingSeconds": 1800
}
```

**Response for `action=config`** `200 OK`

```json
{
  "maxAttempts": 5,
  "lockoutDurationSeconds": 1800,
  "windowSeconds": 900
}
```

### POST `/functions/v1/account-lockout`

Query parameter: `?action=record-attempt`

**Request Body**

```json
{
  "userId": "uuid",
  "success": false,
  "ipAddress": "1.2.3.4"
}
```

---

## 5. `google-drive-oauth`

Handles the full Google Drive OAuth 2.0 flow.

**Auth**: Required

### GET `/functions/v1/google-drive-oauth`

Query parameters:

| `action` | Description | Additional Params |
|---|---|---|
| `get-auth-url` | Returns Google OAuth consent screen URL | — |
| `exchange-code` | Exchanges auth code for tokens | `code`, `redirectUri` |
| `refresh-token` | Refreshes an expired access token | `refreshToken` |
| `list-files` | Lists files from Google Drive | `accessToken`, optional `pageToken`, `query` |

**Response for `action=get-auth-url`** `200 OK`

```json
{
  "authUrl": "https://accounts.google.com/o/oauth2/v2/auth?..."
}
```

**Response for `action=list-files`** `200 OK`

```json
{
  "files": [
    {
      "id": "gdrive-file-id",
      "name": "My Document.pdf",
      "mimeType": "application/pdf",
      "size": 102400,
      "modifiedTime": "2024-01-10T12:00:00Z"
    }
  ],
  "nextPageToken": "..."
}
```

---

## 6. `ip-geolocation`

Returns geolocation data for the calling IP address via ip-api.com.

**Auth**: Required

### POST `/functions/v1/ip-geolocation`

**Request Body** (optional)

```json
{
  "ip": "1.2.3.4"
}
```

If `ip` is omitted, the caller's IP is used.

**Success Response** `200 OK`

```json
{
  "country": "United States",
  "countryCode": "US",
  "region": "CA",
  "regionName": "California",
  "city": "San Francisco",
  "lat": 37.7749,
  "lon": -122.4194,
  "timezone": "America/Los_Angeles",
  "isp": "Cloudflare, Inc.",
  "query": "1.2.3.4"
}
```

---

## 7. `security-headers`

Returns the recommended HTTP security headers for the application. Used during deployment configuration.

**Auth**: Not required

### GET `/functions/v1/security-headers`

**Success Response** `200 OK`

```json
{
  "headers": {
    "Content-Security-Policy": "default-src 'self'; ...",
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",
    "X-Frame-Options": "DENY",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()"
  }
}
```

---

## 8. `system-status`

Health check endpoint. Public users get a summary; admin users get detailed component status.

**Auth**: Optional (admin role unlocks detailed view)

### POST `/functions/v1/system-status`

**Request Body** (optional)

```json
{
  "ping": true
}
```

**Public Response** `200 OK`

```json
{
  "status": "operational",
  "timestamp": "2024-01-15T10:00:00Z"
}
```

**Admin Response** `200 OK`

```json
{
  "status": "operational",
  "timestamp": "2024-01-15T10:00:00Z",
  "components": {
    "auth": { "status": "operational", "latencyMs": 12 },
    "database": { "status": "operational", "latencyMs": 8 },
    "storage": { "status": "operational" }
  },
  "uptime": 99.98
}
```

---

## 9. Error Responses

All functions return errors in this shape:

```json
{
  "error": {
    "code": "RATE_LIMITED",
    "message": "Too many requests. Try again in 60 seconds.",
    "details": {}
  }
}
```

### Error Codes

| Code | HTTP Status | Description |
|---|---|---|
| `UNKNOWN` | 500 | Unexpected server error |
| `VALIDATION` | 400 | Invalid request body or params |
| `NOT_FOUND` | 404 | Resource not found |
| `UNAUTHORIZED` | 401 | Missing or invalid JWT |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NETWORK_ERROR` | 502 | Upstream service unreachable |
| `TIMEOUT` | 504 | Upstream service timed out |
| `DATABASE` | 500 | Database operation failed |
| `CONFLICT` | 409 | Optimistic concurrency conflict |
| `SERVICE_UNAVAILABLE` | 503 | Service temporarily unavailable |
| `RATE_LIMITED` | 429 | Rate limit exceeded |
