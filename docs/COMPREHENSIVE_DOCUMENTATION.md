# Cortex AI Platform — Complete Documentation

> **Version:** 0.3.0 | **Last Updated:** January 2026 | **Status:** Production Ready

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3-61DAFB.svg)](https://reactjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Backend-3ECF8E.svg)](https://supabase.com/)

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Audience Guide](#2-audience-guide)
3. [Getting Started](#3-getting-started)
4. [Architecture](#4-architecture)
5. [User Guide](#5-user-guide)
6. [Developer Guide](#6-developer-guide)
7. [API Reference](#7-api-reference)
8. [Configuration Reference](#8-configuration-reference)
9. [Testing & Quality](#9-testing--quality)
10. [Security & Compliance](#10-security--compliance)
11. [Observability & Operations](#11-observability--operations)
12. [Deployment Guide](#12-deployment-guide)
13. [Troubleshooting](#13-troubleshooting)
14. [Examples & Use Cases](#14-examples--use-cases)
15. [Version History](#15-version-history)
16. [Appendices](#16-appendices)

---

## 1. Executive Summary

### 1.1 What is Cortex?

Cortex is an **AI-powered knowledge management platform** (codenamed "Tessa") that enables users to:

- **Organize** knowledge bases with notes, documents, and web content
- **Search** using intelligent filtering and saved presets
- **Interact** via natural language AI conversations
- **Collaborate** with real-time synchronization
- **Work offline** with progressive web app (PWA) support

### 1.2 Key Features

| Feature | Description |
|---------|-------------|
| **AI Chat (Tessa)** | GPT-powered conversational assistant with context awareness |
| **Knowledge Base** | CRUD operations for notes, documents, web clippings |
| **Smart Search** | Full-text search with saved filter presets |
| **Offline Mode** | Service worker caching, background sync |
| **PWA Support** | Installable, works offline, push notifications |
| **Dark Mode** | System-aware theme switching |
| **Keyboard Shortcuts** | Command palette (Ctrl+K), navigation shortcuts |

### 1.3 Technology Stack

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                              │
├─────────────────────────────────────────────────────────────┤
│  React 18.3  │  TypeScript 5  │  Vite  │  Tailwind CSS      │
│  shadcn/ui   │  React Query   │  React Router │  Framer     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                        BACKEND                               │
├─────────────────────────────────────────────────────────────┤
│  Supabase PostgreSQL  │  Supabase Auth  │  Edge Functions   │
│  Row Level Security   │  Realtime       │  Storage          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      INTEGRATIONS                            │
├─────────────────────────────────────────────────────────────┤
│  OpenAI GPT-4  │  IP Geolocation  │  Email (Resend)         │
└─────────────────────────────────────────────────────────────┘
```

### 1.4 Supported Platforms

| Platform | Status | Notes |
|----------|--------|-------|
| Chrome 90+ | ✅ Full Support | Primary target |
| Firefox 88+ | ✅ Full Support | — |
| Safari 14+ | ✅ Full Support | — |
| Edge 90+ | ✅ Full Support | Chromium-based |
| Mobile Chrome | ✅ Full Support | PWA installable |
| Mobile Safari | ✅ Full Support | PWA installable |

### 1.5 Versioning Strategy

This project follows [Semantic Versioning 2.0.0](https://semver.org/):

- **MAJOR** (X.0.0): Breaking changes requiring migration
- **MINOR** (0.X.0): New features, backward compatible
- **PATCH** (0.0.X): Bug fixes, security patches

Releases are automated via [Release Please](https://github.com/google-github-actions/release-please-action) using Conventional Commits.

---

## 2. Audience Guide

### 2.1 End Users

**You should read:**
- [Getting Started](#3-getting-started) — Installation and first steps
- [User Guide](#5-user-guide) — Features and workflows
- [Troubleshooting](#13-troubleshooting) — Common issues

### 2.2 Developers

**You should read:**
- [Architecture](#4-architecture) — System design
- [Developer Guide](#6-developer-guide) — Code walkthrough
- [API Reference](#7-api-reference) — Endpoints and types
- [Testing & Quality](#9-testing--quality) — Test suite

### 2.3 Operators / DevOps

**You should read:**
- [Configuration Reference](#8-configuration-reference) — Environment variables
- [Deployment Guide](#12-deployment-guide) — CI/CD pipelines
- [Observability & Operations](#11-observability--operations) — Monitoring
- [Security & Compliance](#10-security--compliance) — Security controls

---

## 3. Getting Started

### 3.1 Prerequisites

| Requirement | Version | Check Command |
|-------------|---------|---------------|
| Node.js | ≥18.0.0 | `node --version` |
| npm | ≥9.0.0 | `npm --version` |
| Git | ≥2.30 | `git --version` |

**Recommended IDE:** VS Code with extensions:
- ESLint
- Prettier
- Tailwind CSS IntelliSense
- TypeScript and JavaScript Language Features

### 3.2 Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/your-org/cortex.git
cd cortex

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env
# Edit .env with your Supabase credentials

# 4. Start development server
npm run dev

# 5. Open in browser
open http://localhost:5173
```

### 3.3 Environment Setup

Create a `.env` file with the following variables:

```env
# Required
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Optional
VITE_APP_ENV=development
VITE_DEBUG=true
```

### 3.4 First-Run Checklist

- [ ] Environment variables configured
- [ ] Development server starts without errors
- [ ] Can access http://localhost:5173
- [ ] Can create an account and log in
- [ ] Can create a knowledge item
- [ ] Can start a chat with Tessa

### 3.5 Project Structure

```
cortex/
├── docs/                    # Documentation
├── e2e/                     # Playwright E2E tests
├── public/                  # Static assets
├── scripts/                 # Build/utility scripts
├── src/
│   ├── components/          # React components
│   │   ├── admin/           # Admin dashboard components
│   │   ├── error/           # Error boundaries
│   │   ├── feedback/        # Toast, dialogs, notifications
│   │   ├── landing/         # Landing page sections
│   │   ├── layout/          # Page wrappers, nav
│   │   ├── search/          # Chat interface
│   │   ├── settings/        # Settings panels
│   │   └── ui/              # shadcn/ui primitives
│   ├── config/              # App configuration
│   ├── constants/           # Global constants
│   ├── contexts/            # React contexts
│   ├── hooks/               # Custom hooks
│   ├── integrations/        # Third-party integrations
│   ├── lib/                 # Utility libraries
│   ├── pages/               # Route components
│   ├── services/            # API service layer
│   ├── types/               # TypeScript definitions
│   └── utils/               # Helper functions
├── supabase/
│   ├── functions/           # Edge functions
│   └── migrations/          # Database migrations
└── package.json
```

---

## 4. Architecture

### 4.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                           CLIENT BROWSER                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌────────────┐  │
│  │   Pages     │  │ Components  │  │   Hooks     │  │  Services  │  │
│  │             │  │             │  │             │  │            │  │
│  │ - Index     │  │ - ChatInput │  │ - useChat   │  │ - Base     │  │
│  │ - Search    │  │ - ChatMsg   │  │ - useAuth   │  │ - Chat     │  │
│  │ - Manage    │  │ - Navbar    │  │ - useQuery  │  │ - Knowledge│  │
│  │ - Settings  │  │ - Sidebar   │  │ - useToast  │  │ - User     │  │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └─────┬──────┘  │
│         │                │                │               │          │
│         └────────────────┴────────────────┴───────────────┘          │
│                                   │                                   │
│                         ┌─────────▼─────────┐                        │
│                         │   React Query     │                        │
│                         │   Cache Layer     │                        │
│                         └─────────┬─────────┘                        │
│                                   │                                   │
└───────────────────────────────────┼───────────────────────────────────┘
                                    │
                          HTTPS (JWT Auth)
                                    │
┌───────────────────────────────────┼───────────────────────────────────┐
│                           SUPABASE PLATFORM                           │
├───────────────────────────────────┼───────────────────────────────────┤
│                                   │                                    │
│  ┌─────────────────┐    ┌────────▼────────┐    ┌──────────────────┐  │
│  │   PostgreSQL    │◄───│   PostgREST     │    │  Edge Functions  │  │
│  │                 │    │   API Gateway   │    │                  │  │
│  │  - chats        │    └─────────────────┘    │  - chat-tessa    │  │
│  │  - messages     │                           │  - account-lock  │  │
│  │  - knowledge    │    ┌─────────────────┐    │  - ip-geo        │  │
│  │  - profiles     │    │   Supabase Auth │    │  - security-hdr  │  │
│  │  - audit_logs   │    └─────────────────┘    └────────┬─────────┘  │
│  └─────────────────┘                                    │            │
│         │                                               │            │
│         └──────────────── RLS Policies ─────────────────┘            │
│                                                                       │
└───────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
                         ┌──────────────────┐
                         │   OpenAI API     │
                         │   (GPT-4)        │
                         └──────────────────┘
```

### 4.2 Data Flow: Chat Message

```
┌──────┐    ┌─────────┐    ┌─────────────┐    ┌──────────────┐    ┌────────┐
│ User │───▶│ ChatInput│───▶│ useChat Hook│───▶│ Edge Function│───▶│ OpenAI │
└──────┘    └─────────┘    └─────────────┘    └──────────────┘    └────────┘
    ▲                            │                    │                 │
    │                            │                    │                 │
    │                      ┌─────▼─────┐        ┌─────▼─────┐     ┌─────▼─────┐
    │                      │ Optimistic│        │ Rate Limit│     │ Generate  │
    │                      │ Update    │        │ Check     │     │ Response  │
    │                      └───────────┘        └───────────┘     └───────────┘
    │                                                                    │
    └────────────────────────────────────────────────────────────────────┘
                              Stream Response
```

### 4.3 Database Schema

```sql
-- Core Tables
┌─────────────────────────────────────────────────────────────┐
│                        profiles                              │
├─────────────────────────────────────────────────────────────┤
│ id           │ UUID PK (references auth.users)              │
│ username     │ TEXT UNIQUE                                   │
│ full_name    │ TEXT                                          │
│ avatar_url   │ TEXT                                          │
│ created_at   │ TIMESTAMPTZ                                   │
│ updated_at   │ TIMESTAMPTZ                                   │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                         chats                                │
├─────────────────────────────────────────────────────────────┤
│ id           │ UUID PK                                       │
│ user_id      │ UUID FK → profiles                           │
│ title        │ TEXT                                          │
│ created_at   │ TIMESTAMPTZ                                   │
│ updated_at   │ TIMESTAMPTZ                                   │
│ deleted_at   │ TIMESTAMPTZ (soft delete)                    │
│ version      │ INTEGER (optimistic locking)                 │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                     knowledge_base                           │
├─────────────────────────────────────────────────────────────┤
│ id           │ UUID PK                                       │
│ user_id      │ UUID FK → profiles                           │
│ title        │ TEXT                                          │
│ content      │ TEXT                                          │
│ type         │ TEXT (note, document, web)                   │
│ source_url   │ TEXT                                          │
│ tags         │ TEXT[]                                        │
│ created_at   │ TIMESTAMPTZ                                   │
│ updated_at   │ TIMESTAMPTZ                                   │
│ deleted_at   │ TIMESTAMPTZ (soft delete)                    │
└─────────────────────────────────────────────────────────────┘
```

### 4.4 Security Layers

```
┌─────────────────────────────────────────────────────────────────┐
│                     SECURITY ARCHITECTURE                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Layer 1: Transport Security                                     │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ • TLS 1.3 encryption                                     │    │
│  │ • HSTS header enforcement                                │    │
│  │ • Certificate pinning (production)                       │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  Layer 2: Authentication                                         │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ • Supabase Auth (JWT tokens)                             │    │
│  │ • Session management with auto-refresh                   │    │
│  │ • Account lockout after 5 failed attempts                │    │
│  │ • Optional MFA/2FA                                       │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  Layer 3: Authorization                                          │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ • Row Level Security (RLS) on all tables                 │    │
│  │ • Role-based access (user, admin)                        │    │
│  │ • Chat ownership verification                            │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  Layer 4: Input Validation                                       │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ • Zod schema validation                                  │    │
│  │ • DOMPurify XSS sanitization                             │    │
│  │ • Content-Security-Policy headers                        │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  Layer 5: Rate Limiting                                          │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ • Database-backed rate limits                            │    │
│  │ • 20 chat messages per minute per user                   │    │
│  │ • IP-based blocking for abuse                            │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  Layer 6: Data Protection                                        │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ • AES-256-GCM encryption for localStorage                │    │
│  │ • PBKDF2 key derivation                                  │    │
│  │ • Audit logging for sensitive operations                 │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 5. User Guide

### 5.1 Creating an Account

1. Navigate to the application
2. Click "Sign Up" or "Get Started"
3. Enter your email and password
4. Verify your email address
5. Complete your profile

### 5.2 Knowledge Management

#### Creating Knowledge Items

```
┌─────────────────────────────────────────────────────────────┐
│                    Knowledge Item Form                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Title:    [___________________________]                     │
│                                                              │
│  Type:     ○ Note  ○ Document  ○ Web Clipping               │
│                                                              │
│  Content:  ┌─────────────────────────────────────────────┐  │
│            │                                              │  │
│            │  Enter your content here...                  │  │
│            │                                              │  │
│            └─────────────────────────────────────────────┘  │
│                                                              │
│  Tags:     [tag1] [tag2] [+ Add Tag]                        │
│                                                              │
│  Source:   [https://example.com] (optional)                 │
│                                                              │
│            [Cancel]                    [Save Knowledge]      │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

#### Organizing with Tags

- Tags support alphanumeric characters, hyphens, and underscores
- Maximum 50 characters per tag
- Autocomplete suggests existing tags
- Filter by multiple tags simultaneously

### 5.3 AI Chat (Tessa)

#### Starting a Conversation

1. Navigate to the Search page
2. Click "New Chat" or use `Ctrl+N`
3. Type your question in the input field
4. Press Enter or click Send

#### Chat Features

| Feature | Description | Shortcut |
|---------|-------------|----------|
| New Chat | Start fresh conversation | `Ctrl+N` |
| Search Chats | Filter chat history | `Ctrl+/` |
| Copy Response | Copy AI response to clipboard | Click icon |
| Delete Chat | Remove chat permanently | Click trash |

### 5.4 Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+K` | Open command palette |
| `Ctrl+N` | New chat |
| `Ctrl+/` | Focus search |
| `Ctrl+Z` | Undo |
| `Ctrl+Shift+Z` | Redo |
| `?` | Show shortcuts help |
| `Escape` | Close dialog/cancel |

### 5.5 Offline Mode

Cortex works offline with these capabilities:

- **Read** previously cached content
- **Queue** new items for sync when online
- **Automatic** synchronization on reconnection
- **Conflict** resolution for concurrent edits

The offline indicator appears in the navigation bar when disconnected.

### 5.6 Installing as PWA

**Desktop (Chrome):**
1. Click the install icon in the address bar
2. Click "Install" in the popup

**Mobile:**
1. Open in mobile browser
2. Tap "Add to Home Screen"
3. Follow the prompts

---

## 6. Developer Guide

### 6.1 Development Workflow

```bash
# Start development server
npm run dev

# Run linting
npm run lint

# Run type checking
npm run typecheck

# Run all tests
npm run test

# Run E2E tests
npm run test:e2e

# Build for production
npm run build
```

### 6.2 Code Organization

#### Component Structure

```tsx
// src/components/example/ExampleComponent.tsx

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface ExampleComponentProps {
  title: string;
  onAction?: () => void;
}

/**
 * ExampleComponent demonstrates the standard component pattern.
 * 
 * @param title - Display title for the component
 * @param onAction - Optional callback when action is triggered
 */
export function ExampleComponent({ title, onAction }: ExampleComponentProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleClick = useCallback(async () => {
    setIsLoading(true);
    try {
      await onAction?.();
      toast({ title: 'Success', description: 'Action completed' });
    } catch (error) {
      toast({ title: 'Error', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [onAction, toast]);

  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold">{title}</h2>
      <Button onClick={handleClick} disabled={isLoading}>
        {isLoading ? 'Loading...' : 'Click Me'}
      </Button>
    </div>
  );
}
```

#### Hook Structure

```tsx
// src/hooks/useExample.ts

import { useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface UseExampleOptions {
  enabled?: boolean;
}

/**
 * Custom hook for example data management.
 * 
 * @param options - Configuration options
 * @returns Example state and operations
 */
export function useExample(options: UseExampleOptions = {}) {
  const { enabled = true } = options;
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['examples'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('examples')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled,
  });

  const createMutation = useMutation({
    mutationFn: async (newItem: { title: string }) => {
      const { data, error } = await supabase
        .from('examples')
        .insert(newItem)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['examples'] });
    },
  });

  return {
    items: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    create: createMutation.mutate,
    isCreating: createMutation.isPending,
  };
}
```

#### Service Structure

```tsx
// src/services/example.service.ts

import { BaseService } from './base.service';
import type { Example } from '@/types';

/**
 * Service for managing example resources.
 */
export class ExampleService extends BaseService {
  private static instance: ExampleService;

  static getInstance(): ExampleService {
    if (!ExampleService.instance) {
      ExampleService.instance = new ExampleService();
    }
    return ExampleService.instance;
  }

  /**
   * Fetch all examples for the current user.
   */
  async getAll(): Promise<Example[]> {
    return this.executeWithRetry(async () => {
      const { data, error } = await this.supabase
        .from('examples')
        .select('*');
      
      if (error) throw error;
      return data;
    });
  }

  /**
   * Create a new example.
   */
  async create(input: Omit<Example, 'id' | 'created_at'>): Promise<Example> {
    return this.executeWithRetry(async () => {
      const { data, error } = await this.supabase
        .from('examples')
        .insert(input)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    });
  }
}

export const exampleService = ExampleService.getInstance();
```

### 6.3 Design System

#### Color Tokens

All colors use HSL format and are defined in `src/index.css`:

```css
:root {
  /* Background colors */
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  
  /* Component colors */
  --card: 0 0% 100%;
  --card-foreground: 222.2 84% 4.9%;
  
  /* Primary brand color */
  --primary: 222.2 47.4% 11.2%;
  --primary-foreground: 210 40% 98%;
  
  /* Secondary color */
  --secondary: 210 40% 96.1%;
  --secondary-foreground: 222.2 47.4% 11.2%;
  
  /* Muted/subtle color */
  --muted: 210 40% 96.1%;
  --muted-foreground: 215.4 16.3% 46.9%;
  
  /* Accent color */
  --accent: 210 40% 96.1%;
  --accent-foreground: 222.2 47.4% 11.2%;
  
  /* Destructive/error color */
  --destructive: 0 84.2% 60.2%;
  --destructive-foreground: 210 40% 98%;
  
  /* Border and input colors */
  --border: 214.3 31.8% 91.4%;
  --input: 214.3 31.8% 91.4%;
  --ring: 222.2 84% 4.9%;
}
```

#### Using Design Tokens

```tsx
// ✅ CORRECT: Use semantic tokens
<div className="bg-background text-foreground">
  <button className="bg-primary text-primary-foreground">
    Click me
  </button>
</div>

// ❌ WRONG: Hard-coded colors
<div className="bg-white text-black">
  <button className="bg-blue-600 text-white">
    Click me
  </button>
</div>
```

### 6.4 State Management

| State Type | Location | Use Case |
|------------|----------|----------|
| Server State | React Query | API data, caching |
| UI State | Component `useState` | Modals, forms |
| Global State | React Context | Auth, theme, offline |
| Persistent State | localStorage + crypto | User preferences |

### 6.5 Error Handling

```tsx
// Using error boundaries
import { ErrorBoundary } from '@/components/error/ErrorBoundary';

<ErrorBoundary fallback={<ErrorFallback />}>
  <MyComponent />
</ErrorBoundary>

// Using try-catch with toast
try {
  await riskyOperation();
  toast.success('Operation completed');
} catch (error) {
  console.error('Operation failed:', error);
  toast.error('Operation failed', {
    description: error instanceof Error ? error.message : 'Unknown error',
  });
}
```

---

## 7. API Reference

### 7.1 Edge Functions

#### `chat-with-tessa-secure`

The primary AI chat endpoint with rate limiting and security features.

**Endpoint:** `POST /functions/v1/chat-with-tessa-secure`

**Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "message": "What is machine learning?",
  "chatId": "uuid-chat-id"
}
```

**Response:**
```json
{
  "success": true,
  "response": "Machine learning is a subset of artificial intelligence...",
  "messageId": "uuid-message-id"
}
```

**Error Responses:**

| Status | Error | Description |
|--------|-------|-------------|
| 400 | `Message is required` | Empty message body |
| 401 | `Authentication required` | Missing/invalid JWT |
| 403 | `You don't own this chat` | Unauthorized access |
| 429 | `Rate limit exceeded` | Too many requests |
| 500 | `Internal server error` | Server-side error |

#### `account-lockout`

Manages login attempt tracking and account lockout.

**Endpoint:** `POST /functions/v1/account-lockout`

**Actions:**

| Action | Description |
|--------|-------------|
| `check` | Check if account/IP is locked |
| `record` | Record a failed login attempt |
| `clear` | Clear attempts after successful login |
| `unlock` | Admin: unlock an account |

**Example Request:**
```json
{
  "action": "check",
  "email": "user@example.com",
  "ip": "192.168.1.1"
}
```

#### `ip-geolocation`

Provides IP address geolocation with caching.

**Endpoint:** `POST /functions/v1/ip-geolocation`

**Request:**
```json
{
  "ip": "8.8.8.8"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "country": "United States",
    "countryCode": "US",
    "region": "California",
    "city": "Mountain View",
    "lat": 37.4056,
    "lon": -122.0775
  },
  "cached": false
}
```

#### `system-status`

Health check endpoint for monitoring.

**Endpoint:** `GET /functions/v1/system-status`

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2026-01-22T12:00:00Z",
  "services": {
    "database": "healthy",
    "auth": "healthy",
    "storage": "healthy"
  }
}
```

### 7.2 Database Tables

See the auto-generated types in `src/integrations/supabase/types.ts` for complete schema definitions.

### 7.3 RLS Policies Summary

| Table | SELECT | INSERT | UPDATE | DELETE |
|-------|--------|--------|--------|--------|
| profiles | Own only | Own only | Own only | — |
| chats | Own only | Own only | Own only | Own only |
| knowledge_base | Own only | Own only | Own only | Own only |
| filter_presets | Own only | Own only | Own only | Own only |

---

## 8. Configuration Reference

### 8.1 Environment Variables

#### Frontend (`.env`)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `VITE_SUPABASE_URL` | Yes | — | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Yes | — | Supabase anonymous key |
| `VITE_APP_ENV` | No | `development` | Environment name |
| `VITE_DEBUG` | No | `false` | Enable debug logging |

#### Backend (Supabase Secrets)

| Secret | Required | Description |
|--------|----------|-------------|
| `OPENAI_API_KEY` | Yes | OpenAI API key for Tessa |
| `RESEND_API_KEY` | No | Email service API key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Admin access key |

### 8.2 App Configuration

Located in `src/config/app-config.ts`:

```typescript
// API Configuration
export const ApiConfig = {
  maxRetries: 3,
  baseRetryDelay: 1000,    // ms
  maxRetryDelay: 10000,    // ms
  requestTimeout: 30000,   // ms
  backoffMultiplier: 2,
};

// Cache Configuration
export const CacheConfig = {
  defaultTTL: 600000,      // 10 minutes
  maxCacheSize: 1000,
  serviceWorkerEnabled: true,
};

// Rate Limiting
export const RateLimitConfig = {
  defaultMaxRequests: 60,
  defaultWindowMs: 60000,  // 1 minute
};

// UI Configuration
export const UIConfig = {
  defaultPageSize: 50,
  maxPageSize: 200,
  searchDebounceMs: 300,
  toastDurationMs: 5000,
};
```

### 8.3 Feature Flags

Located in `src/constants/index.ts`:

```typescript
export const FEATURES = {
  OFFLINE_MODE: true,
  PWA_INSTALL: true,
  KEYBOARD_SHORTCUTS: true,
  COMMAND_PALETTE: true,
  VIRTUAL_SCROLLING: true,
  UNDO_REDO: true,
};
```

---

## 9. Testing & Quality

### 9.1 Test Strategy

```
┌─────────────────────────────────────────────────────────────────┐
│                      TEST PYRAMID                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│                         ▲                                        │
│                        ╱ ╲                                       │
│                       ╱ E2E ╲        5 tests (critical paths)   │
│                      ╱───────╲                                   │
│                     ╱         ╲                                  │
│                    ╱ Integration╲    3 tests (flows)            │
│                   ╱─────────────╲                                │
│                  ╱               ╲                               │
│                 ╱   Unit Tests    ╲   47+ tests (hooks/services) │
│                ╱───────────────────╲                             │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 9.2 Running Tests

```bash
# Run all unit tests
npm run test

# Run with coverage
npm run test:coverage

# Run specific test file
npm run test -- src/hooks/__tests__/useChat.test.ts

# Run E2E tests
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui

# Run visual regression tests
npm run test:visual
```

### 9.3 Coverage Targets

| Category | Target | Current |
|----------|--------|---------|
| Statements | 60% | ~55% |
| Branches | 55% | ~50% |
| Functions | 60% | ~58% |
| Lines | 60% | ~55% |

### 9.4 Test Examples

#### Unit Test (Hook)

```typescript
// src/hooks/__tests__/useChat.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useChat } from '../useChat';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
  },
});

const wrapper = ({ children }) => (
  <QueryClientProvider client={queryClient}>
    {children}
  </QueryClientProvider>
);

describe('useChat', () => {
  beforeEach(() => {
    queryClient.clear();
  });

  it('should initialize with empty chats', () => {
    const { result } = renderHook(() => useChat(), { wrapper });
    expect(result.current.chats).toEqual([]);
  });

  it('should create a new chat', async () => {
    const { result } = renderHook(() => useChat(), { wrapper });
    
    result.current.createChat('Test Chat');
    
    await waitFor(() => {
      expect(result.current.chats).toHaveLength(1);
    });
  });
});
```

#### E2E Test

```typescript
// e2e/auth.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('should allow user to sign up', async ({ page }) => {
    await page.goto('/auth');
    
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.click('[data-testid="signup-button"]');
    
    await expect(page).toHaveURL('/dashboard');
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/auth');
    
    await page.fill('[data-testid="email-input"]', 'invalid@example.com');
    await page.fill('[data-testid="password-input"]', 'wrong');
    await page.click('[data-testid="login-button"]');
    
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
  });
});
```

### 9.5 CI Integration

Tests run automatically on every PR via GitHub Actions:

```yaml
# .github/workflows/ci.yml
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck
      - run: npm run test:coverage
      - run: npm run build
```

---

## 10. Security & Compliance

### 10.1 Authentication Flow

```
┌──────────┐     ┌─────────────┐     ┌─────────────┐     ┌──────────┐
│  User    │────▶│  Auth Form  │────▶│  Supabase   │────▶│  JWT     │
│          │     │             │     │  Auth       │     │  Token   │
└──────────┘     └─────────────┘     └─────────────┘     └──────────┘
                                            │
                                            ▼
                                     ┌─────────────┐
                                     │  Session    │
                                     │  Storage    │
                                     └─────────────┘
                                            │
                      ┌─────────────────────┼─────────────────────┐
                      ▼                     ▼                     ▼
               ┌─────────────┐       ┌─────────────┐       ┌─────────────┐
               │  Auto       │       │  Token      │       │  Logout     │
               │  Refresh    │       │  Validation │       │  Cleanup    │
               └─────────────┘       └─────────────┘       └─────────────┘
```

### 10.2 OWASP Top 10 Coverage

| Risk | Mitigation | Status |
|------|------------|--------|
| **A01 Broken Access** | RLS policies, JWT validation | ✅ |
| **A02 Crypto Failures** | AES-256-GCM, TLS 1.3 | ✅ |
| **A03 Injection** | Parameterized queries, DOMPurify | ✅ |
| **A04 Insecure Design** | Security-first architecture | ✅ |
| **A05 Misconfiguration** | Strict defaults, CSP headers | ✅ |
| **A06 Vulnerable Components** | Dependabot, npm audit | ✅ |
| **A07 Auth Failures** | Account lockout, rate limiting | ✅ |
| **A08 Data Integrity** | Input validation, checksums | ✅ |
| **A09 Logging Failures** | Audit logging, monitoring | ✅ |
| **A10 SSRF** | URL validation, allowlists | ✅ |

### 10.3 Security Headers

All responses include:

```
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://*.supabase.co https://api.openai.com
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
```

### 10.4 Secrets Management

**DO:**
- Store secrets in Supabase Edge Function secrets
- Use environment variables for non-sensitive config
- Rotate secrets every 90 days

**DON'T:**
- Commit secrets to git
- Log secrets or tokens
- Store secrets in localStorage

### 10.5 Account Lockout Policy

| Parameter | Value |
|-----------|-------|
| Failed attempts before lockout | 5 |
| Lockout duration | 15 minutes |
| Time window for counting | 15 minutes |
| Lockout scope | Per email + Per IP |

### 10.6 Compliance Status

| Regulation | Status | Notes |
|------------|--------|-------|
| **GDPR** | Partial | Data export pending |
| **CCPA** | Partial | Do Not Sell disclosure needed |
| **SOC 2** | Not Started | Required for enterprise |

---

## 11. Observability & Operations

### 11.1 Logging Conventions

```typescript
// Log levels
console.log('Info message');     // General information
console.warn('Warning message'); // Potential issues
console.error('Error message');  // Errors

// Structured logging in edge functions
console.log(JSON.stringify({
  level: 'info',
  message: 'User action',
  userId: user.id,
  action: 'create_chat',
  timestamp: new Date().toISOString(),
}));
```

### 11.2 Metrics

| Metric | Description | Alert Threshold |
|--------|-------------|-----------------|
| `response_time_p50` | 50th percentile response time | > 200ms |
| `response_time_p99` | 99th percentile response time | > 2000ms |
| `error_rate` | % of 5xx responses | > 1% |
| `auth_failures` | Failed login attempts/min | > 10 |
| `rate_limit_hits` | Rate limit exceeded/min | > 50 |

### 11.3 Health Checks

**Endpoint:** `GET /functions/v1/system-status`

**Checks performed:**
- Database connectivity
- Auth service availability
- Storage service availability

### 11.4 Backup & Restore

**Automated Backups:**
- Supabase performs daily backups
- Point-in-time recovery available (Pro plan)

**Manual Backup:**
```bash
# Export database
pg_dump -h db.xxx.supabase.co -U postgres -d postgres > backup.sql

# Restore database
psql -h db.xxx.supabase.co -U postgres -d postgres < backup.sql
```

### 11.5 Audit Logging

The following events are logged:

| Category | Events |
|----------|--------|
| **Authentication** | login, logout, signup, password_reset |
| **Data** | create, update, delete, export |
| **Admin** | role_change, ip_block, rate_limit_update |
| **Security** | failed_login, lockout, suspicious_activity |

---

## 12. Deployment Guide

### 12.1 Deployment Options

| Platform | Complexity | Cost | Best For |
|----------|------------|------|----------|
| **Lovable** | ⭐ | Free | Quick deployments |
| **Vercel** | ⭐⭐ | Free tier | CI/CD integration |
| **Netlify** | ⭐⭐ | Free tier | Form handling |
| **Docker** | ⭐⭐⭐ | Self-hosted | Full control |

### 12.2 Vercel Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Deploy to production
vercel --prod
```

**vercel.json:**
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-Content-Type-Options", "value": "nosniff" }
      ]
    }
  ]
}
```

### 12.3 Docker Deployment

```dockerfile
# Dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

```bash
# Build and run
docker build -t cortex .
docker run -p 80:80 cortex
```

### 12.4 CI/CD Pipeline

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck
      - run: npm run test
      - run: npm run build
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

### 12.5 Rollback Procedure

1. **Identify** the issue in production
2. **Locate** the last known good deployment
3. **Rollback** using platform UI or CLI:
   ```bash
   vercel rollback [deployment-url]
   ```
4. **Verify** the rollback was successful
5. **Investigate** the root cause
6. **Fix** and re-deploy

---

## 13. Troubleshooting

### 13.1 Common Issues

| Issue | Symptoms | Solution |
|-------|----------|----------|
| **Blank page** | White screen, no content | Check console for JS errors; verify env vars |
| **Auth not working** | Can't login/signup | Verify Supabase URL and anon key |
| **Data not loading** | Spinner forever | Check RLS policies; verify user is authenticated |
| **404 on refresh** | Works on first load | Configure SPA rewrites in hosting |
| **CORS errors** | Network tab shows blocked | Check edge function CORS headers |
| **Rate limited** | 429 errors | Wait 1 minute or adjust rate limit config |

### 13.2 Debug Mode

Enable debug logging:

```bash
# In .env
VITE_DEBUG=true
```

Or in browser console:
```javascript
localStorage.setItem('debug', 'true');
location.reload();
```

### 13.3 Checking Logs

**Edge Function Logs:**
1. Go to Supabase Dashboard
2. Navigate to Edge Functions
3. Click on function name
4. View logs tab

**Browser Console:**
1. Open DevTools (F12)
2. Go to Console tab
3. Filter by log level

### 13.4 Database Issues

```sql
-- Check active connections
SELECT * FROM pg_stat_activity WHERE state = 'active';

-- Check for locks
SELECT * FROM pg_locks WHERE granted = false;

-- Check slow queries
SELECT query, mean_time, calls 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;
```

---

## 14. Examples & Use Cases

### 14.1 Creating a Knowledge Item

```typescript
import { useKnowledge } from '@/hooks';

function CreateKnowledgeExample() {
  const { createItem, isCreating } = useKnowledge();

  const handleCreate = async () => {
    await createItem({
      title: 'My First Note',
      content: 'This is the content of my note.',
      type: 'note',
      tags: ['example', 'first-note'],
    });
  };

  return (
    <button onClick={handleCreate} disabled={isCreating}>
      {isCreating ? 'Creating...' : 'Create Note'}
    </button>
  );
}
```

### 14.2 Using the AI Chat

```typescript
import { useChat } from '@/hooks';

function ChatExample() {
  const { sendMessage, messages, isLoading } = useChat();

  const handleSend = async (message: string) => {
    await sendMessage({ content: message });
  };

  return (
    <div>
      {messages.map((msg) => (
        <div key={msg.id}>
          <strong>{msg.role}:</strong> {msg.content}
        </div>
      ))}
      <ChatInput onSend={handleSend} disabled={isLoading} />
    </div>
  );
}
```

### 14.3 Implementing Offline Support

```typescript
import { useNetworkStatus, useBackgroundSync } from '@/hooks';

function OfflineAwareComponent() {
  const { isOnline } = useNetworkStatus();
  const { queueOperation, pendingCount } = useBackgroundSync();

  const handleSave = async (data: SaveData) => {
    if (isOnline) {
      await api.save(data);
    } else {
      queueOperation({
        type: 'save',
        data,
        retryCount: 0,
      });
    }
  };

  return (
    <div>
      {!isOnline && (
        <Banner>
          You're offline. {pendingCount} changes pending sync.
        </Banner>
      )}
      <SaveButton onClick={handleSave} />
    </div>
  );
}
```

### 14.4 Custom Hook Pattern

```typescript
import { useState, useCallback } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks';

export function useCustomFeature() {
  const { toast } = useToast();
  const [localState, setLocalState] = useState<string>('');

  const query = useQuery({
    queryKey: ['custom-feature'],
    queryFn: fetchCustomData,
  });

  const mutation = useMutation({
    mutationFn: updateCustomData,
    onSuccess: () => {
      toast.success('Updated successfully');
    },
    onError: (error) => {
      toast.error('Update failed', { description: error.message });
    },
  });

  const updateData = useCallback((newData: string) => {
    setLocalState(newData);
    mutation.mutate(newData);
  }, [mutation]);

  return {
    data: query.data,
    isLoading: query.isLoading,
    localState,
    updateData,
    isUpdating: mutation.isPending,
  };
}
```

---

## 15. Version History

### v0.3.0 (2024-12-18)

**Added:**
- Comprehensive API documentation
- Contributing guidelines
- Architecture documentation

**Changed:**
- Updated README with detailed setup
- Improved project structure documentation

**Removed:**
- E-commerce functionality (out of scope)

### v0.2.0 (2024-12-15)

**Added:**
- Secure chat endpoint with rate limiting
- Input validation and sanitization
- Offline support with service worker
- PWA manifest and install prompts
- Conflict detection and resolution

**Fixed:**
- Session persistence issues
- Chat scroll behavior

### v0.1.0 (2024-12-01)

**Added:**
- Initial release
- Knowledge base management
- AI chat interface (Tessa)
- Search and filtering
- Authentication

---

## 16. Appendices

### Appendix A: Style Guide

#### Terminology

| Term | Definition |
|------|------------|
| **Cortex** | The application name |
| **Tessa** | The AI assistant |
| **Knowledge Item** | A note, document, or web clipping |
| **Chat** | A conversation with Tessa |
| **Preset** | A saved filter configuration |

#### Code Formatting

```typescript
// Imports: external → internal → types
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import type { User } from '@/types';

// Component naming: PascalCase
export function MyComponent() { }

// Hook naming: camelCase with 'use' prefix
export function useMyHook() { }

// Constant naming: SCREAMING_SNAKE_CASE
const MAX_RETRIES = 3;

// Function naming: camelCase, verb-first
function fetchUserData() { }
function handleSubmit() { }
function validateInput() { }
```

#### File Naming

| Type | Convention | Example |
|------|------------|---------|
| Component | PascalCase | `UserProfile.tsx` |
| Hook | camelCase with 'use' | `useAuth.ts` |
| Service | camelCase with '.service' | `user.service.ts` |
| Type | camelCase | `user.ts` |
| Test | Same name + '.test' | `useAuth.test.ts` |
| Constant | camelCase | `navigation.tsx` |

### Appendix B: Keyboard Shortcuts Reference

| Category | Shortcut | Action |
|----------|----------|--------|
| **Navigation** | `Ctrl+K` | Command palette |
| | `Ctrl+/` | Focus search |
| | `Escape` | Close dialog |
| **Chat** | `Ctrl+N` | New chat |
| | `Enter` | Send message |
| | `Shift+Enter` | New line |
| **Edit** | `Ctrl+Z` | Undo |
| | `Ctrl+Shift+Z` | Redo |
| | `Ctrl+C` | Copy |
| | `Ctrl+V` | Paste |
| **Help** | `?` | Show shortcuts |

### Appendix C: Error Codes

| Code | Message | Cause |
|------|---------|-------|
| `AUTH_001` | Invalid credentials | Wrong email/password |
| `AUTH_002` | Account locked | Too many failed attempts |
| `AUTH_003` | Session expired | JWT token expired |
| `RATE_001` | Rate limit exceeded | Too many requests |
| `DATA_001` | Not found | Resource doesn't exist |
| `DATA_002` | Access denied | RLS policy violation |
| `AI_001` | AI service unavailable | OpenAI API error |
| `AI_002` | Context too long | Message exceeds limit |

### Appendix D: API Response Codes

| Status | Meaning |
|--------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 429 | Rate Limited |
| 500 | Server Error |

### Appendix E: Database Indexes

```sql
-- Recommended indexes for performance
CREATE INDEX idx_chats_user_id ON chats(user_id);
CREATE INDEX idx_chats_created_at ON chats(created_at DESC);
CREATE INDEX idx_knowledge_user_id ON knowledge_base(user_id);
CREATE INDEX idx_knowledge_tags ON knowledge_base USING GIN(tags);
CREATE INDEX idx_knowledge_title ON knowledge_base USING GIN(to_tsvector('english', title));
```

---

## Contributing

See [CONTRIBUTING.md](../CONTRIBUTING.md) for guidelines.

## License

MIT License - see [LICENSE](../LICENSE) for details.

---

**Last Updated:** January 22, 2026  
**Maintainers:** Cortex Team  
**Documentation Version:** 1.0.0
