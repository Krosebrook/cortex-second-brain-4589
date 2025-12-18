# Cortex API Documentation

This document provides comprehensive documentation for the Supabase Edge Functions used in Cortex.

## Table of Contents

- [Overview](#overview)
- [Authentication](#authentication)
- [Edge Functions](#edge-functions)
  - [chat-with-tessa](#chat-with-tessa)
  - [chat-with-tessa-secure](#chat-with-tessa-secure)
  - [system-status](#system-status)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)

---

## Overview

Cortex uses Supabase Edge Functions for serverless backend functionality. All edge functions are deployed automatically and accessible via the Supabase Functions URL.

**Base URL:**
```
https://gcqfqzhgludrzkfajljp.supabase.co/functions/v1
```

---

## Authentication

Most endpoints require authentication via JWT token in the Authorization header.

```bash
Authorization: Bearer <your-jwt-token>
```

### Getting a JWT Token

The JWT token is obtained through Supabase Auth when a user logs in:

```typescript
import { supabase } from '@/integrations/supabase/client';

const { data: { session } } = await supabase.auth.getSession();
const token = session?.access_token;
```

---

## Edge Functions

### chat-with-tessa

Interact with Tessa, the AI assistant. This endpoint processes user messages and returns AI-generated responses using the OpenAI API.

**Endpoint:** `POST /chat-with-tessa`

**Authentication:** Required

#### Request

```typescript
interface ChatRequest {
  message: string;  // The user's message (required)
  chatId: string;   // The chat session ID (required)
}
```

**Headers:**
```bash
Content-Type: application/json
Authorization: Bearer <jwt-token>
```

**Example Request:**
```bash
curl -X POST \
  'https://gcqfqzhgludrzkfajljp.supabase.co/functions/v1/chat-with-tessa' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <jwt-token>' \
  -d '{
    "message": "What documents do I have about project planning?",
    "chatId": "550e8400-e29b-41d4-a716-446655440000"
  }'
```

#### Response

**Success (200 OK):**
```typescript
interface ChatResponse {
  success: boolean;
  message: {
    id: string;
    content: string;
    role: 'assistant';
    created_at: string;
  };
}
```

**Example Response:**
```json
{
  "success": true,
  "message": {
    "id": "msg_abc123",
    "content": "Based on your knowledge base, I found 3 documents related to project planning...",
    "role": "assistant",
    "created_at": "2024-12-18T10:30:00Z"
  }
}
```

**Error Responses:**

| Status | Description |
|--------|-------------|
| 400 | Missing required fields (message or chatId) |
| 401 | Unauthorized - Invalid or missing JWT |
| 500 | Internal server error |

```json
{
  "error": "Missing required field: message"
}
```

#### Usage in Frontend

```typescript
import { supabase } from '@/integrations/supabase/client';

async function sendMessage(message: string, chatId: string) {
  const { data, error } = await supabase.functions.invoke('chat-with-tessa', {
    body: { message, chatId }
  });

  if (error) throw error;
  return data;
}
```

---

### chat-with-tessa-secure

A security-enhanced version of the chat endpoint with rate limiting, input validation, and chat ownership verification.

**Endpoint:** `POST /chat-with-tessa-secure`

**Authentication:** Required

#### Security Features

| Feature | Description |
|---------|-------------|
| Rate Limiting | 10 requests per minute per user |
| Input Validation | Message length limits, XSS prevention |
| Chat Ownership | Verifies user owns the chat session |
| Input Sanitization | Removes script tags and malicious patterns |

#### Request

```typescript
interface SecureChatRequest {
  message: string;  // Max 10,000 characters
  chatId: string;   // Must be owned by authenticated user
}
```

**Example Request:**
```bash
curl -X POST \
  'https://gcqfqzhgludrzkfajljp.supabase.co/functions/v1/chat-with-tessa-secure' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <jwt-token>' \
  -d '{
    "message": "Summarize my recent notes",
    "chatId": "550e8400-e29b-41d4-a716-446655440000"
  }'
```

#### Response

**Success (200 OK):**
```json
{
  "success": true,
  "message": {
    "id": "msg_xyz789",
    "content": "Here's a summary of your recent notes...",
    "role": "assistant",
    "created_at": "2024-12-18T10:35:00Z"
  }
}
```

**Error Responses:**

| Status | Code | Description |
|--------|------|-------------|
| 400 | `INVALID_INPUT` | Message validation failed |
| 401 | `UNAUTHORIZED` | Invalid or missing JWT |
| 403 | `FORBIDDEN` | User doesn't own the chat |
| 429 | `RATE_LIMITED` | Too many requests |
| 500 | `INTERNAL_ERROR` | Server error |

**Rate Limit Error:**
```json
{
  "error": "Rate limit exceeded. Please try again later.",
  "code": "RATE_LIMITED",
  "retryAfter": 60
}
```

**Validation Error:**
```json
{
  "error": "Message exceeds maximum length of 10,000 characters",
  "code": "INVALID_INPUT"
}
```

---

### system-status

Check the health status of Supabase services (Auth, Database). This endpoint is public and doesn't require authentication.

**Endpoint:** `GET /system-status`

**Authentication:** Not required

#### Request

**Basic Health Check:**
```bash
curl -X GET \
  'https://gcqfqzhgludrzkfajljp.supabase.co/functions/v1/system-status'
```

**Ping Check:**
```bash
curl -X POST \
  'https://gcqfqzhgludrzkfajljp.supabase.co/functions/v1/system-status' \
  -H 'Content-Type: application/json' \
  -d '{"type": "ping"}'
```

#### Response

**Health Check Response (200 OK):**
```typescript
interface SystemStatusResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  services: {
    auth: ServiceStatus;
    database: ServiceStatus;
  };
  timestamp: string;
  responseTime: number;  // milliseconds
}

interface ServiceStatus {
  status: 'healthy' | 'unhealthy';
  latency?: number;
  error?: string;
}
```

**Example Response:**
```json
{
  "status": "healthy",
  "services": {
    "auth": {
      "status": "healthy",
      "latency": 45
    },
    "database": {
      "status": "healthy",
      "latency": 23
    }
  },
  "timestamp": "2024-12-18T10:40:00Z",
  "responseTime": 68
}
```

**Ping Response:**
```json
{
  "message": "pong",
  "timestamp": "2024-12-18T10:40:00Z"
}
```

**Degraded Status Example:**
```json
{
  "status": "degraded",
  "services": {
    "auth": {
      "status": "healthy",
      "latency": 52
    },
    "database": {
      "status": "unhealthy",
      "error": "Connection timeout"
    }
  },
  "timestamp": "2024-12-18T10:40:00Z",
  "responseTime": 5023
}
```

#### Usage in Frontend

```typescript
import { supabase } from '@/integrations/supabase/client';

async function checkSystemStatus() {
  const { data, error } = await supabase.functions.invoke('system-status', {
    method: 'GET'
  });

  if (error) throw error;
  return data;
}
```

---

## Error Handling

All endpoints follow a consistent error response format:

```typescript
interface ErrorResponse {
  error: string;           // Human-readable error message
  code?: string;           // Machine-readable error code
  details?: unknown;       // Additional error details
  retryAfter?: number;     // Seconds until retry (for rate limits)
}
```

### Common Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `UNAUTHORIZED` | 401 | Missing or invalid authentication |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `INVALID_INPUT` | 400 | Request validation failed |
| `RATE_LIMITED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Server error |

### Handling Errors in Frontend

```typescript
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

async function callEdgeFunction(name: string, body: unknown) {
  try {
    const { data, error } = await supabase.functions.invoke(name, { body });
    
    if (error) {
      // Handle Supabase function errors
      if (error.message.includes('Rate limit')) {
        toast({
          title: 'Too many requests',
          description: 'Please wait a moment before trying again.',
          variant: 'destructive'
        });
      } else {
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive'
        });
      }
      throw error;
    }
    
    return data;
  } catch (err) {
    console.error(`Edge function ${name} failed:`, err);
    throw err;
  }
}
```

---

## Rate Limiting

The `chat-with-tessa-secure` endpoint implements rate limiting to prevent abuse:

| Limit | Value |
|-------|-------|
| Requests per user | 10 per minute |
| Window duration | 60 seconds |
| Retry header | `retryAfter` in response |

### Handling Rate Limits

```typescript
async function sendMessageWithRetry(message: string, chatId: string, maxRetries = 3) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await supabase.functions.invoke('chat-with-tessa-secure', {
        body: { message, chatId }
      });
    } catch (error: any) {
      if (error.code === 'RATE_LIMITED' && attempt < maxRetries - 1) {
        const retryAfter = error.retryAfter || 60;
        await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
        continue;
      }
      throw error;
    }
  }
}
```

---

## CORS

All edge functions include CORS headers for browser requests:

```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
```

Preflight requests (OPTIONS) are handled automatically.

---

## Environment Variables

Edge functions use the following environment variables:

| Variable | Description | Required |
|----------|-------------|----------|
| `SUPABASE_URL` | Supabase project URL | Yes |
| `SUPABASE_ANON_KEY` | Supabase anonymous key | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (admin) | For admin operations |
| `OPENAI_API_KEY` | OpenAI API key | For chat functions |

---

## Changelog

### December 2024
- Added `chat-with-tessa-secure` with rate limiting and input validation
- Enhanced error responses with consistent format
- Added system status endpoint for health monitoring

---

## Support

For API issues or questions:
- Check the [Edge Function logs](https://supabase.com/dashboard/project/gcqfqzhgludrzkfajljp/functions)
- Review the [Supabase documentation](https://supabase.com/docs)
- Open a GitHub issue
