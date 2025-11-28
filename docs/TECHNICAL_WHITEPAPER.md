# Cortex: Your Second Brain
## Technical Whitepaper v1.0

---

## Executive Summary

Cortex is an AI-powered knowledge management platform designed to serve as a "second brain" for knowledge workers. Built as a Progressive Web Application (PWA), it enables users to capture, organize, search, and leverage their personal knowledge base with the assistance of an AI agent named "Tessa."

This whitepaper provides a comprehensive technical overview of Cortex's architecture, design decisions, security model, and implementation details.

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Architecture Overview](#2-architecture-overview)
3. [Technology Stack](#3-technology-stack)
4. [Core Features](#4-core-features)
5. [Data Architecture](#5-data-architecture)
6. [Security Model](#6-security-model)
7. [Offline-First Architecture](#7-offline-first-architecture)
8. [AI Integration](#8-ai-integration)
9. [User Experience Design](#9-user-experience-design)
10. [Performance Optimization](#10-performance-optimization)
11. [Testing Strategy](#11-testing-strategy)
12. [Deployment Architecture](#12-deployment-architecture)
13. [Appendices](#13-appendices)

---

## 1. Introduction

### 1.1 Problem Statement

Modern knowledge workers face information overload. Critical insights are scattered across emails, documents, bookmarks, notes, and various applications. Existing solutions either:
- Lack intelligent search and retrieval capabilities
- Require constant internet connectivity
- Don't provide AI-assisted knowledge synthesis
- Have poor mobile experiences

### 1.2 Solution Overview

Cortex addresses these challenges through:
- **Unified Knowledge Repository**: Single source of truth for all personal knowledge
- **AI-Powered Assistant (Tessa)**: Natural language interface for knowledge retrieval and synthesis
- **Offline-First Design**: Full functionality without internet connectivity
- **Progressive Web App**: Native-like experience across all devices
- **Multi-Format Import**: Support for documents, URLs, APIs, and direct text input

### 1.3 Target Users

- Knowledge workers and researchers
- Students and academics
- Content creators and writers
- Technical professionals
- Anyone managing large volumes of information

---

## 2. Architecture Overview

### 2.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │   React     │  │   Service   │  │   IndexedDB │              │
│  │   Frontend  │──│   Worker    │──│   (Offline) │              │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTPS
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       SUPABASE PLATFORM                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │   Auth      │  │   Edge      │  │  PostgreSQL │              │
│  │   Service   │  │   Functions │  │   Database  │              │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
│                          │                                       │
│                          ▼                                       │
│                   ┌─────────────┐                                │
│                   │   AI/LLM    │                                │
│                   │   Provider  │                                │
│                   └─────────────┘                                │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Component Architecture

The application follows a layered component architecture:

```
App.tsx (Root)
├── Providers Layer
│   ├── QueryClientProvider (React Query)
│   ├── ThemeProvider (Dark/Light modes)
│   ├── ErrorBoundary (Error handling)
│   ├── AuthProvider (Authentication state)
│   ├── OfflineProvider (Sync management)
│   ├── TooltipProvider (UI tooltips)
│   └── ConfirmationProvider (Dialogs)
│
├── Global Components
│   ├── Navbar (Navigation)
│   ├── OfflineBanner (Connectivity status)
│   ├── ReconnectionBanner (Sync status)
│   ├── SyncStatus (Pending operations)
│   ├── InstallPromptBanner (PWA install)
│   ├── ShortcutsHelpDialog (Keyboard help)
│   └── Toaster (Notifications)
│
└── Route-Based Pages (Lazy-loaded)
    ├── Public: Index, Why, How, Auth, Status, Install, Offline
    └── Protected: Dashboard, Manage, Search, Import, Profile, Settings
```

### 2.3 Data Flow Architecture

```
User Action
    │
    ▼
Component Event Handler
    │
    ▼
Custom Hook (useChat, useKnowledge, etc.)
    │
    ├──► Optimistic UI Update (immediate feedback)
    │
    ▼
Service Layer (ChatService, KnowledgeService)
    │
    ├──► Online: Supabase API call
    │         │
    │         └──► Success: Update cache, confirm UI
    │         └──► Failure: Rollback, show error
    │
    └──► Offline: Add to sync queue (IndexedDB)
              │
              └──► When online: Process queue, sync changes
```

---

## 3. Technology Stack

### 3.1 Frontend Technologies

| Category | Technology | Version | Purpose |
|----------|------------|---------|---------|
| Framework | React | 18.3.1 | UI component library |
| Language | TypeScript | 5.5.3 | Type-safe JavaScript |
| Build Tool | Vite | 5.4.1 | Fast bundling & HMR |
| Routing | React Router | 6.26.2 | Client-side navigation |
| State Management | React Query | 5.56.2 | Server state caching |
| Forms | React Hook Form | 7.53.0 | Form state management |
| Validation | Zod | 3.23.8 | Schema validation |
| UI Components | shadcn/ui + Radix | Various | Accessible UI primitives |
| Styling | Tailwind CSS | 3.4.11 | Utility-first CSS |
| Charts | Recharts | 2.12.7 | Data visualization |
| Notifications | Sonner | 1.5.0 | Toast notifications |
| Icons | Lucide React | 0.462.0 | SVG icon library |
| PDF Export | jsPDF | 3.0.3 | PDF generation |
| Sanitization | DOMPurify | 3.2.6 | XSS protection |

### 3.2 Backend Technologies

| Category | Technology | Purpose |
|----------|------------|---------|
| Platform | Supabase | Backend-as-a-Service |
| Database | PostgreSQL | Relational data storage |
| Authentication | Supabase Auth | JWT-based auth |
| Edge Functions | Deno Runtime | Serverless functions |
| Real-time | Supabase Realtime | Live data subscriptions |

### 3.3 PWA Technologies

| Technology | Purpose |
|------------|---------|
| vite-plugin-pwa | PWA configuration |
| Workbox | Service worker management |
| IndexedDB | Offline data storage |
| Web App Manifest | PWA metadata |

### 3.4 Development Tools

| Tool | Purpose |
|------|---------|
| Vitest | Unit & integration testing |
| React Testing Library | Component testing |
| ESLint | Code linting |
| PostCSS | CSS processing |

---

## 4. Core Features

### 4.1 Knowledge Management

#### 4.1.1 Knowledge Types
- **Notes**: Quick text-based knowledge entries
- **Documents**: Imported file content (PDF, DOCX, TXT, MD)
- **Web Pages**: Content extracted from URLs
- **Files**: Binary file references

#### 4.1.2 Organization System
- **Cortexes**: Containers for grouping related knowledge
  - Shared: Collaborative cortexes
  - Team Space: Organization-level cortexes
  - Private: Personal cortexes
- **Tags**: Cross-cutting categorization with validation
- **Custom Ordering**: Drag-and-drop reordering

#### 4.1.3 View Modes
- Table View: Spreadsheet-like data display
- Grid View: Card-based visual layout
- List View: Compact linear display
- Kanban View: Stage-based organization

### 4.2 AI Chat Interface (Tessa)

#### 4.2.1 Conversation Management
- Multi-turn conversation support
- Persistent chat history
- Auto-generated titles from first message
- Soft-delete with restoration capability
- Custom ordering of chat list

#### 4.2.2 AI Capabilities
- Natural language understanding
- Knowledge base integration
- Context-aware responses
- Rate-limited API access (20 req/min)

### 4.3 Import System

| Source | Method | Processing |
|--------|--------|------------|
| CSV Files | Drag-and-drop upload | Parsed and structured |
| API Endpoints | Configurable connection | Real-time sync |
| Web URLs | URL input | Text extraction |
| Documents | File upload | Content parsing |
| Direct Text | Form input | Immediate storage |

### 4.4 Search & Filtering

- Full-text search across titles and content
- Type-based filtering (notes, documents, web pages, files)
- Tag-based filtering with multi-select
- Date range filtering
- Saved filter presets with usage analytics
- Command palette (Ctrl+K) for quick navigation

### 4.5 Collaboration Features

- Shared cortexes for team collaboration
- Filter preset sharing between users
- Scope-based visibility (private/shared)

---

## 5. Data Architecture

### 5.1 Database Schema

#### Core Tables

```sql
-- User Profiles (auto-created on signup)
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES auth.users(id),
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Chat Conversations
CREATE TABLE chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  title TEXT,
  order_index INTEGER,
  version INTEGER DEFAULT 1,
  deleted_at TIMESTAMPTZ,  -- Soft delete
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Chat Messages
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID REFERENCES chats(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  role TEXT NOT NULL,  -- 'user' | 'assistant'
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Knowledge Base Items
CREATE TABLE knowledge_base (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  title TEXT NOT NULL,
  content TEXT,
  type TEXT NOT NULL,  -- 'note' | 'document' | 'web_page' | 'file'
  source_url TEXT,
  tags TEXT[],
  order_index INTEGER,
  version INTEGER DEFAULT 1,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Filter Presets
CREATE TABLE filter_presets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  name TEXT NOT NULL,
  filters JSONB NOT NULL,
  scope TEXT DEFAULT 'private',  -- 'private' | 'shared'
  sort_order INTEGER,
  usage_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### AI Management Tables

```sql
-- AI Agents Configuration
CREATE TABLE ai_agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  project_id UUID,
  status agent_status DEFAULT 'active',
  configuration JSONB,
  total_runs INTEGER DEFAULT 0,
  last_run_at TIMESTAMPTZ
);

-- AI Usage Tracking
CREATE TABLE ai_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  project_id UUID,
  provider TEXT,
  model TEXT,
  total_tokens INTEGER,
  cost_usd DECIMAL(10,6),
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### 5.2 Row-Level Security (RLS)

All tables implement RLS policies ensuring users can only access their own data:

```sql
-- Example: Chats table RLS
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own chats"
  ON chats FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own chats"
  ON chats FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own chats"
  ON chats FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own chats"
  ON chats FOR DELETE
  USING (auth.uid() = user_id);
```

### 5.3 Offline Storage Schema

```typescript
// IndexedDB Database: tessa_offline_db
interface OfflineDatabase {
  version: 1;
  stores: {
    chats: {
      keyPath: 'id';
      data: Chat[];
    };
    knowledge: {
      keyPath: 'id';
      data: KnowledgeItem[];
    };
    sync_queue: {
      keyPath: 'id';
      indexes: ['timestamp'];
      data: SyncOperation[];
    };
  };
}

interface SyncOperation {
  id: string;           // Timestamp-based unique ID
  type: 'chat' | 'knowledge';
  operation: 'create' | 'update' | 'delete';
  data: any;            // Operation payload
  timestamp: number;
  retries: number;      // Max 3 retries
}
```

### 5.4 Caching Strategy

```typescript
// Multi-layer cache configuration
const CachePolicies = {
  chats: {
    ttl: 3600000,      // 1 hour
    maxSize: 50,
    strategy: 'lru'
  },
  messages: {
    ttl: 1800000,      // 30 minutes
    maxSize: 100,
    strategy: 'lru'
  },
  knowledge: {
    ttl: 7200000,      // 2 hours
    maxSize: 100,
    strategy: 'lru'
  },
  profile: {
    ttl: 300000,       // 5 minutes
    maxSize: 10,
    strategy: 'lru'
  }
};
```

---

## 6. Security Model

### 6.1 Authentication

- **Provider**: Supabase Auth with JWT tokens
- **Session Management**: Auto-refresh tokens with secure storage
- **Email Verification**: Required for new account activation
- **Password Requirements**: Minimum 8 characters

### 6.2 Input Validation & Sanitization

```typescript
// Content validation rules
const ValidationRules = {
  message: {
    maxLength: 4000,
    required: true
  },
  content: {
    maxLength: 10000,
    sanitize: true
  },
  tags: {
    maxLength: 50,
    pattern: /^[a-zA-Z0-9-_]+$/,
    maxCount: 20
  },
  title: {
    maxLength: 200,
    required: true
  }
};

// XSS Protection via DOMPurify
function sanitizeContent(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br'],
    ALLOWED_ATTR: ['href', 'target']
  });
}
```

### 6.3 Rate Limiting

```typescript
class RateLimiter {
  private windowMs: number = 60000;  // 1 minute window
  private maxRequests: number = 20;   // 20 requests per window
  private requests: Map<string, number[]>;

  canMakeRequest(userId: string): boolean {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    const userRequests = this.requests.get(userId) || [];
    const recentRequests = userRequests.filter(ts => ts > windowStart);
    return recentRequests.length < this.maxRequests;
  }
}
```

### 6.4 Secure Edge Functions

```typescript
// Edge Function security measures
export async function handleChatRequest(req: Request) {
  // 1. Validate JWT token
  const token = req.headers.get('Authorization');
  const user = await verifyJWT(token);

  // 2. Rate limit check
  if (!rateLimiter.canMakeRequest(user.id)) {
    return new Response('Rate limit exceeded', { status: 429 });
  }

  // 3. Input validation
  const { message, chatId } = await req.json();
  if (!message || message.length > 4000) {
    return new Response('Invalid input', { status: 400 });
  }

  // 4. Sanitize input
  const sanitizedMessage = sanitizeContent(message);

  // 5. Process request
  return await processChat(sanitizedMessage, chatId, user.id);
}
```

### 6.5 Data Protection

- **Encryption**: TLS 1.3 for data in transit
- **RLS Policies**: Database-level access control
- **Soft Deletes**: Data preservation for recovery
- **Optimistic Locking**: Version-based conflict detection

---

## 7. Offline-First Architecture

### 7.1 Design Principles

1. **Local-First**: UI updates immediately, syncs in background
2. **Conflict Resolution**: Server-wins strategy with version checking
3. **Graceful Degradation**: Read-only mode when offline
4. **Transparent Sync**: Users notified of sync status

### 7.2 Network Detection

```typescript
function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (!isOnline) setWasOffline(true);
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [isOnline]);

  return { isOnline, wasOffline };
}
```

### 7.3 Sync Queue Management

```
┌─────────────────────────────────────────────────────────────┐
│                     SYNC FLOW DIAGRAM                        │
└─────────────────────────────────────────────────────────────┘

User Action (while offline)
        │
        ▼
┌───────────────┐
│ Check Network │
│    Status     │
└───────────────┘
        │
        ├─── Online ──► Execute immediately
        │                     │
        │                     └──► Update UI
        │
        └─── Offline ──► Add to Sync Queue
                               │
                               ▼
                        ┌─────────────┐
                        │  IndexedDB  │
                        │ sync_queue  │
                        └─────────────┘
                               │
        ┌──────────────────────┼──────────────────────┐
        │                      │                      │
   Connection             Manual Sync            Periodic
   Restored               Button Click           Check (10s)
        │                      │                      │
        └──────────────────────┼──────────────────────┘
                               │
                               ▼
                     ┌─────────────────┐
                     │ Process Queue   │
                     │ (FIFO order)    │
                     └─────────────────┘
                               │
                               ▼
                     For each operation:
                     ┌─────────────────┐
                     │ Execute API     │
                     │ Call            │
                     └─────────────────┘
                               │
               ┌───────────────┴───────────────┐
               │                               │
           Success                          Failure
               │                               │
               ▼                               ▼
      Remove from queue              Increment retries
               │                               │
               │                    ┌──────────┴──────────┐
               │                    │                     │
               │              Retries < 3           Retries >= 3
               │                    │                     │
               │                    ▼                     ▼
               │              Keep in queue        Remove & notify
               │                                   user of failure
               │
               └──────────────────────────────────────────┐
                                                          │
                                                          ▼
                                                  ┌───────────────┐
                                                  │ Update UI &   │
                                                  │ Show Toast    │
                                                  └───────────────┘
```

### 7.4 PWA Service Worker Configuration

```typescript
// vite.config.ts PWA configuration
VitePWA({
  registerType: 'autoUpdate',

  manifest: {
    name: 'Cortex - Your Second Brain',
    short_name: 'Cortex',
    description: 'AI-powered knowledge management',
    theme_color: '#0f172a',
    background_color: '#0f172a',
    display: 'standalone',
    orientation: 'portrait',
    start_url: '/',
    icons: [
      { src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
      { src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }
    ]
  },

  workbox: {
    maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
    globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
    navigateFallback: '/offline',
    navigateFallbackDenylist: [/^\/api/, /^\/auth/],

    runtimeCaching: [
      {
        urlPattern: /^https:\/\/fonts\.googleapis\.com/,
        handler: 'CacheFirst',
        options: {
          cacheName: 'google-fonts-cache',
          expiration: { maxEntries: 10, maxAgeSeconds: 31536000 }
        }
      }
    ]
  }
})
```

### 7.5 Offline Capabilities Matrix

| Feature | Online | Offline |
|---------|--------|---------|
| View cached chats | ✓ | ✓ |
| View cached knowledge | ✓ | ✓ |
| Search cached data | ✓ | ✓ |
| Create new chats | ✓ | Queued |
| Send messages | ✓ | Queued |
| Import knowledge | ✓ | ✗ |
| Edit items | ✓ | Queued |
| Delete items | ✓ | Queued |
| AI responses | ✓ | ✗ |

---

## 8. AI Integration

### 8.1 Tessa AI Agent Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      CLIENT SIDE                             │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐      │
│  │ ChatInput   │───►│ useChat     │───►│ ChatService │      │
│  │ Component   │    │ Hook        │    │             │      │
│  └─────────────┘    └─────────────┘    └─────────────┘      │
└─────────────────────────────────────────────────────────────┘
                              │
                    supabase.functions.invoke()
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   EDGE FUNCTION                              │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐      │
│  │ Validate &  │───►│ Rate Limit  │───►│ Process     │      │
│  │ Sanitize    │    │ Check       │    │ Request     │      │
│  └─────────────┘    └─────────────┘    └─────────────┘      │
│                                              │               │
│                                              ▼               │
│                                        ┌─────────────┐      │
│                                        │ AI Provider │      │
│                                        │ API Call    │      │
│                                        └─────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

### 8.2 Message Flow

1. User enters message in ChatInput
2. useChat hook validates and rate-limits
3. ChatService invokes edge function
4. Edge function validates, sanitizes, rate-limits server-side
5. AI provider processes request
6. Response streamed back to client
7. Message stored in database
8. UI updated with assistant response

### 8.3 AI Configuration

```typescript
// AI Agent configuration
interface AIAgentConfig {
  name: string;
  type: 'assistant' | 'analyzer' | 'summarizer';
  model: string;
  maxTokens: number;
  temperature: number;
  systemPrompt: string;
}

// Rate limiting configuration
const AIRateLimits = {
  requestsPerMinute: 20,
  tokensPerMinute: 10000,
  maxResponseLength: 4000
};
```

### 8.4 Usage Tracking

```sql
-- Track AI usage for cost management
INSERT INTO ai_usage_logs (
  user_id,
  provider,
  model,
  total_tokens,
  cost_usd
) VALUES (
  auth.uid(),
  'anthropic',
  'claude-3-sonnet',
  1500,
  0.0225
);
```

---

## 9. User Experience Design

### 9.1 Design System

#### Color Palette (HSL-based CSS Variables)

```css
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 47.4% 11.2%;
  --primary: 222.2 47.4% 11.2%;
  --secondary: 210 40% 96.1%;
  --muted: 210 40% 96.1%;
  --accent: 210 40% 96.1%;
  --destructive: 0 84.2% 60.2%;
}

.dark {
  --background: 224 71% 4%;
  --foreground: 213 31% 91%;
  --primary: 210 40% 98%;
  --secondary: 222.2 47.4% 11.2%;
}
```

#### Typography

- Font Family: System fonts (Inter, SF Pro, etc.)
- Monospace rendering for code
- Responsive font sizes

#### Component Library (shadcn/ui)

30+ accessible components including:
- Button, Card, Dialog, Form
- Tabs, Tooltip, Command
- Table, Input, Textarea
- Alert, Badge, Skeleton

### 9.2 Responsive Design

| Breakpoint | Width | Target |
|------------|-------|--------|
| sm | 640px | Mobile landscape |
| md | 768px | Tablets |
| lg | 1024px | Laptops |
| xl | 1280px | Desktops |
| 2xl | 1536px | Large screens |

### 9.3 Animation System

```typescript
// Custom Tailwind animations
const animations = {
  'fade-in': 'fadeIn 0.5s ease-out',
  'slide-up': 'slideUp 0.5s ease-out',
  'slide-down': 'slideDown 0.5s ease-out',
  'scale-in': 'scaleIn 0.3s ease-out',
  'ripple': 'ripple 0.6s linear',
  'spin-slow': 'spin 3s linear infinite',
  'accordion-down': 'accordion-down 0.2s ease-out',
  'accordion-up': 'accordion-up 0.2s ease-out'
};
```

### 9.4 Keyboard Navigation

| Shortcut | Action |
|----------|--------|
| Ctrl+K | Open command palette |
| ? or Ctrl+/ | Show keyboard shortcuts |
| Enter | Submit forms, save edits |
| Escape | Cancel, close dialogs |
| Tab | Navigate form fields |
| Arrow keys | Navigate lists |

### 9.5 Notification System

- Toast notifications for actions
- Success/Error/Warning/Info variants
- Auto-dismiss with configurable duration
- Action buttons for undo

---

## 10. Performance Optimization

### 10.1 Code Splitting

```typescript
// Lazy-loaded page components
const Dashboard = lazy(() => import('./pages/Dashboard'));
const ManagePage = lazy(() => import('./pages/ManagePage'));
const SearchPage = lazy(() => import('./pages/SearchPage'));

// Route-based splitting
<Suspense fallback={<LoadingScreen />}>
  <Routes>
    <Route path="/dashboard" element={<Dashboard />} />
    <Route path="/manage" element={<ManagePage />} />
  </Routes>
</Suspense>
```

### 10.2 Bundle Optimization

```typescript
// vite.config.ts manual chunks
build: {
  rollupOptions: {
    output: {
      manualChunks: {
        'react-vendor': ['react', 'react-dom', 'react-router-dom'],
        'ui-vendor': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
        'supabase': ['@supabase/supabase-js'],
        'query': ['@tanstack/react-query'],
        'charts': ['recharts']
      }
    }
  }
}
```

### 10.3 Caching Strategies

| Resource Type | Strategy | TTL |
|---------------|----------|-----|
| Static assets | CacheFirst | Forever |
| Fonts (CDN) | CacheFirst | 1 year |
| API responses | StaleWhileRevalidate | Varies |
| User data | NetworkFirst | Session |

### 10.4 Performance Metrics Targets

| Metric | Target |
|--------|--------|
| First Contentful Paint | < 1.5s |
| Largest Contentful Paint | < 2.5s |
| Time to Interactive | < 3.0s |
| Cumulative Layout Shift | < 0.1 |
| First Input Delay | < 100ms |

### 10.5 Optimization Techniques

- **Memoization**: useMemo, useCallback, React.memo
- **Debouncing**: Search and filter operations
- **Virtual Scrolling**: Large list rendering
- **Prefetching**: Route prefetch on hover
- **Image Optimization**: Responsive images, WebP

---

## 11. Testing Strategy

### 11.1 Test Framework

- **Unit Tests**: Vitest
- **Component Tests**: React Testing Library
- **Integration Tests**: Vitest + MSW
- **E2E Tests**: Planned (Playwright)

### 11.2 Coverage Requirements

| Category | Target |
|----------|--------|
| Overall | 70% |
| Critical paths | 90% |
| Components | 80% |
| Hooks | 85% |
| Services | 90% |

### 11.3 Test Structure

```
src/
├── __tests__/
│   └── integration/
│       └── *.test.ts
├── components/
│   └── __tests__/
│       └── *.test.tsx
├── hooks/
│   └── __tests__/
│       └── *.test.ts
└── services/
    └── __tests__/
        └── *.test.ts
```

### 11.4 Mock Configuration

```typescript
// vitest.setup.ts
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      signUp: vi.fn(),
      signIn: vi.fn(),
      signOut: vi.fn()
    },
    from: vi.fn(() => ({
      select: vi.fn(),
      insert: vi.fn(),
      update: vi.fn(),
      delete: vi.fn()
    })),
    functions: {
      invoke: vi.fn()
    }
  }
}));
```

---

## 12. Deployment Architecture

### 12.1 Infrastructure

```
┌─────────────────────────────────────────────────────────────┐
│                     CDN / EDGE NETWORK                       │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              Static Asset Distribution               │    │
│  │         (JS, CSS, HTML, Images, Fonts)               │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      SUPABASE CLOUD                          │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐    │
│  │ Auth Service  │  │ Edge Functions│  │  PostgreSQL   │    │
│  │   (JWT)       │  │   (Deno)      │  │   (RLS)       │    │
│  └───────────────┘  └───────────────┘  └───────────────┘    │
│                              │                               │
│                              ▼                               │
│                     ┌───────────────┐                       │
│                     │  AI Provider  │                       │
│                     │  (External)   │                       │
│                     └───────────────┘                       │
└─────────────────────────────────────────────────────────────┘
```

### 12.2 Environment Configuration

| Environment | Purpose |
|-------------|---------|
| Development | Local development with hot reload |
| Staging | Pre-production testing |
| Production | Live user-facing environment |

### 12.3 CI/CD Pipeline

1. Code push triggers build
2. Run linting and type checks
3. Execute test suite
4. Build production bundle
5. Deploy to CDN
6. Deploy edge functions
7. Run smoke tests
8. Notify team

---

## 13. Appendices

### 13.1 Glossary

| Term | Definition |
|------|------------|
| Cortex | A container for organizing related knowledge items |
| Tessa | The AI assistant integrated into Cortex |
| Knowledge Base | Collection of user's stored information |
| PWA | Progressive Web Application |
| RLS | Row-Level Security (PostgreSQL feature) |
| Edge Function | Serverless function running at the edge |

### 13.2 API Reference

See separate API documentation for:
- Supabase client methods
- Edge function endpoints
- Database procedures

### 13.3 Configuration Files

| File | Purpose |
|------|---------|
| vite.config.ts | Build and PWA configuration |
| tailwind.config.ts | Styling configuration |
| tsconfig.json | TypeScript configuration |
| components.json | shadcn/ui configuration |
| supabase/config.toml | Supabase local dev config |

### 13.4 Database Migrations

| Migration | Description |
|-----------|-------------|
| 20250821103518 | Initial schema (profiles, chats, messages, knowledge) |
| 20251115142244 | Add soft deletes, order_index |
| 20251116152154 | Add deleted_at columns |
| 20251117... | Version tracking & filter presets |
| 20251118... | Security fixes (SECURITY DEFINER) |

---

## Document Information

| Attribute | Value |
|-----------|-------|
| Version | 1.0 |
| Last Updated | November 2025 |
| Authors | Technical Team |
| Classification | Internal |

---

*This document is subject to updates as the platform evolves.*
