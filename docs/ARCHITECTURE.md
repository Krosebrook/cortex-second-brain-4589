# Cortex Architecture

This document describes the system architecture, component relationships, and data flow in Cortex.

## Table of Contents

- [Overview](#overview)
- [System Architecture](#system-architecture)
- [Frontend Architecture](#frontend-architecture)
- [Backend Architecture](#backend-architecture)
- [Data Flow](#data-flow)
- [Component Relationships](#component-relationships)
- [Security Architecture](#security-architecture)
- [State Management](#state-management)

---

## Overview

Cortex is a knowledge management platform built with a modern React frontend and Supabase backend. The architecture prioritizes:

- **Simplicity**: Minimal abstractions, clear data flow
- **Security**: Row-level security, input validation, rate limiting
- **Performance**: Optimistic updates, caching, lazy loading
- **Offline Support**: Service workers, local storage fallbacks

```
┌─────────────────────────────────────────────────────────────┐
│                      Client (Browser)                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   React     │  │   PWA       │  │   Service Worker    │  │
│  │   App       │  │   Shell     │  │   (Offline)         │  │
│  └──────┬──────┘  └─────────────┘  └─────────────────────┘  │
└─────────┼───────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────┐
│                    Supabase Platform                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   Auth      │  │   Database  │  │   Edge Functions    │  │
│  │   (JWT)     │  │   (Postgres)│  │   (Deno)            │  │
│  └─────────────┘  └─────────────┘  └──────────┬──────────┘  │
└──────────────────────────────────────────────┼──────────────┘
                                               │
                                               ▼
                                    ┌─────────────────────┐
                                    │   OpenAI API        │
                                    │   (GPT Models)      │
                                    └─────────────────────┘
```

---

## System Architecture

### High-Level Components

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend** | React + Vite | User interface, routing, state |
| **Styling** | Tailwind CSS | Design system, responsive layout |
| **UI Components** | shadcn/ui | Accessible component primitives |
| **Backend** | Supabase | Auth, database, storage, functions |
| **AI** | OpenAI API | Natural language processing |

### Technology Stack

```
Frontend                    Backend                     External
────────                    ───────                     ────────
React 18                    Supabase Auth               OpenAI API
TypeScript                  PostgreSQL                  
Vite                        Edge Functions (Deno)       
Tailwind CSS                Row Level Security          
React Query                 Realtime Subscriptions      
React Router                Storage Buckets             
```

---

## Frontend Architecture

### Directory Structure

```
src/
├── components/           # React components
│   ├── ui/              # Base UI primitives (shadcn)
│   ├── feedback/        # Toasts, dialogs, progress
│   ├── search/          # Chat interface components
│   ├── knowledge/       # Knowledge base components
│   ├── landing/         # Marketing/landing pages
│   ├── layout/          # Page wrappers, navigation
│   └── [feature]/       # Feature-specific components
│
├── pages/               # Route page components
│   ├── Index.tsx        # Landing page
│   ├── Dashboard.tsx    # Main dashboard
│   ├── SearchPage.tsx   # Chat with Tessa
│   └── ...
│
├── hooks/               # Custom React hooks
│   ├── useChat.ts       # Chat state management
│   ├── useKnowledge.ts  # Knowledge CRUD operations
│   └── ...
│
├── services/            # API service layer
│   ├── base.service.ts  # Common service utilities
│   ├── chat.service.ts  # Chat API calls
│   └── knowledge.service.ts
│
├── contexts/            # React context providers
│   ├── AuthContext.tsx  # Authentication state
│   ├── ThemeContext.tsx # Theme preferences
│   └── OfflineContext.tsx
│
├── lib/                 # Utilities and helpers
│   ├── utils.ts         # Common utilities
│   ├── cache-manager.ts # Caching logic
│   └── ...
│
├── types/               # TypeScript definitions
│   ├── chat.ts
│   ├── index.ts
│   └── ...
│
└── integrations/        # External integrations
    └── supabase/
        ├── client.ts    # Supabase client instance
        └── types.ts     # Generated database types
```

### Component Hierarchy

```
App
├── ThemeProvider
│   └── AuthProvider
│       └── OfflineProvider
│           └── QueryClientProvider
│               └── BrowserRouter
│                   └── Routes
│                       ├── Index (Landing)
│                       ├── AuthPage
│                       ├── ProtectedRoute
│                       │   ├── Dashboard
│                       │   ├── SearchPage
│                       │   │   └── ChatContainer
│                       │   │       ├── ChatSidebar
│                       │   │       ├── ChatMessages
│                       │   │       └── ChatInput
│                       │   ├── ManagePage
│                       │   └── Settings
│                       └── NotFound
```

### Design System

The design system is defined in two key files:

**`src/index.css`** - CSS custom properties (tokens)
```css
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --primary: 222.2 47.4% 11.2%;
  --secondary: 210 40% 96.1%;
  --muted: 210 40% 96.1%;
  --accent: 210 40% 96.1%;
  /* ... */
}
```

**`tailwind.config.ts`** - Tailwind theme extension
```typescript
theme: {
  extend: {
    colors: {
      background: "hsl(var(--background))",
      foreground: "hsl(var(--foreground))",
      primary: {
        DEFAULT: "hsl(var(--primary))",
        foreground: "hsl(var(--primary-foreground))",
      },
      // ...
    }
  }
}
```

---

## Backend Architecture

### Supabase Services

```
┌────────────────────────────────────────────────────────────┐
│                    Supabase Project                         │
├────────────────┬───────────────┬───────────────────────────┤
│                │               │                           │
│  ┌──────────┐  │  ┌─────────┐  │  ┌─────────────────────┐  │
│  │   Auth   │  │  │Database │  │  │   Edge Functions    │  │
│  ├──────────┤  │  ├─────────┤  │  ├─────────────────────┤  │
│  │ - JWT    │  │  │ - Tables│  │  │ - chat-with-tessa   │  │
│  │ - Users  │  │  │ - RLS   │  │  │ - chat-with-tessa-  │  │
│  │ - OAuth  │  │  │ - Funcs │  │  │   secure            │  │
│  └──────────┘  │  └─────────┘  │  │ - system-status     │  │
│                │               │  └─────────────────────┘  │
└────────────────┴───────────────┴───────────────────────────┘
```

### Database Schema (Key Tables)

```
┌─────────────────┐     ┌─────────────────┐
│     chats       │     │   messages      │
├─────────────────┤     ├─────────────────┤
│ id (PK)         │────<│ id (PK)         │
│ user_id (FK)    │     │ chat_id (FK)    │
│ title           │     │ content         │
│ created_at      │     │ role            │
│ updated_at      │     │ created_at      │
└─────────────────┘     └─────────────────┘

┌─────────────────┐     ┌─────────────────┐
│  knowledge_base │     │  user_profiles  │
├─────────────────┤     ├─────────────────┤
│ id (PK)         │     │ id (PK)         │
│ user_id (FK)    │     │ email           │
│ title           │     │ full_name       │
│ content         │     │ subscription_   │
│ tags[]          │     │   tier          │
│ type            │     │ created_at      │
│ source_url      │     └─────────────────┘
└─────────────────┘

┌─────────────────┐
│ filter_presets  │
├─────────────────┤
│ id (PK)         │
│ user_id (FK)    │
│ name            │
│ filters (JSON)  │
│ is_default      │
│ sort_order      │
└─────────────────┘
```

### Edge Function Flow

```
                    ┌─────────────────────────────────────┐
                    │         chat-with-tessa-secure      │
                    └─────────────────────────────────────┘
                                      │
        ┌─────────────────────────────┼─────────────────────────────┐
        ▼                             ▼                             ▼
┌───────────────┐           ┌─────────────────┐           ┌─────────────────┐
│ Rate Limiter  │           │ Input Validator │           │ Auth Verifier   │
│ (10 req/min)  │           │ (Sanitize XSS)  │           │ (JWT + Owner)   │
└───────┬───────┘           └────────┬────────┘           └────────┬────────┘
        │                            │                             │
        └────────────────────────────┼─────────────────────────────┘
                                     ▼
                    ┌─────────────────────────────────────┐
                    │        Fetch Knowledge Context      │
                    │     (User's knowledge_base items)   │
                    └─────────────────────────────────────┘
                                     │
                                     ▼
                    ┌─────────────────────────────────────┐
                    │          OpenAI API Call            │
                    │   (System prompt + User context)    │
                    └─────────────────────────────────────┘
                                     │
                                     ▼
                    ┌─────────────────────────────────────┐
                    │        Store Response in DB         │
                    │        Return to Client             │
                    └─────────────────────────────────────┘
```

---

## Data Flow

### Authentication Flow

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│  User    │    │  React   │    │ Supabase │    │  Auth    │
│          │    │   App    │    │  Client  │    │ Service  │
└────┬─────┘    └────┬─────┘    └────┬─────┘    └────┬─────┘
     │               │               │               │
     │  Login Form   │               │               │
     │──────────────>│               │               │
     │               │               │               │
     │               │ signInWithPassword            │
     │               │──────────────>│               │
     │               │               │               │
     │               │               │  Validate     │
     │               │               │──────────────>│
     │               │               │               │
     │               │               │  JWT + User   │
     │               │               │<──────────────│
     │               │               │               │
     │               │  Session      │               │
     │               │<──────────────│               │
     │               │               │               │
     │  Redirect     │               │               │
     │<──────────────│               │               │
```

### Chat Message Flow

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│  User    │    │  Chat    │    │  Edge    │    │ Database │    │  OpenAI  │
│          │    │  Input   │    │ Function │    │          │    │   API    │
└────┬─────┘    └────┬─────┘    └────┬─────┘    └────┬─────┘    └────┬─────┘
     │               │               │               │               │
     │  Type message │               │               │               │
     │──────────────>│               │               │               │
     │               │               │               │               │
     │               │  POST /chat-with-tessa        │               │
     │               │──────────────>│               │               │
     │               │               │               │               │
     │               │               │  Save user msg│               │
     │               │               │──────────────>│               │
     │               │               │               │               │
     │               │               │  Get knowledge│               │
     │               │               │──────────────>│               │
     │               │               │               │               │
     │               │               │  knowledge[]  │               │
     │               │               │<──────────────│               │
     │               │               │               │               │
     │               │               │  Chat completion               │
     │               │               │──────────────────────────────>│
     │               │               │               │               │
     │               │               │  AI response  │               │
     │               │               │<──────────────────────────────│
     │               │               │               │               │
     │               │               │  Save AI msg  │               │
     │               │               │──────────────>│               │
     │               │               │               │               │
     │               │  Response     │               │               │
     │               │<──────────────│               │               │
     │               │               │               │               │
     │  Show message │               │               │               │
     │<──────────────│               │               │               │
```

---

## Component Relationships

### Chat System

```
SearchPage
    │
    └── ChatContainer
            │
            ├── ChatSidebar
            │       │
            │       ├── Chat List
            │       │     └── Chat Item (selectable)
            │       │
            │       └── New Chat Button
            │
            ├── ChatMessages
            │       │
            │       └── Message[]
            │             ├── User Message
            │             └── Assistant Message
            │
            └── ChatInput
                    │
                    ├── Text Input
                    ├── Send Button
                    └── Loading State
```

### Knowledge Management

```
ManagePage
    │
    ├── ViewSwitcher
    │       └── [Table | Grid | Kanban | List]
    │
    ├── SearchFilterBar
    │       ├── Search Input
    │       ├── Filter Controls
    │       └── Filter Presets
    │
    └── View Component
            │
            ├── TableView
            │     └── CortexTable
            │
            ├── GridView
            │     └── Knowledge Cards[]
            │
            ├── KanbanView
            │     └── Columns[]
            │           └── Cards[]
            │
            └── ListView
                  └── List Items[]
```

---

## Security Architecture

### Authentication Layer

```
┌─────────────────────────────────────────────────────────────┐
│                    Security Layers                           │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  1. Frontend Authentication (AuthContext)            │   │
│  │     - Session management                              │   │
│  │     - Protected route guards                          │   │
│  │     - Token refresh                                   │   │
│  └──────────────────────────────────────────────────────┘   │
│                           │                                  │
│                           ▼                                  │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  2. API Authentication (JWT)                         │   │
│  │     - Bearer token in headers                         │   │
│  │     - Token validation in edge functions              │   │
│  └──────────────────────────────────────────────────────┘   │
│                           │                                  │
│                           ▼                                  │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  3. Database Security (RLS)                          │   │
│  │     - Row Level Security policies                     │   │
│  │     - User-scoped data access                         │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Row Level Security Example

```sql
-- Users can only read their own knowledge items
CREATE POLICY "Users can view own knowledge"
ON knowledge_base FOR SELECT
USING (auth.uid() = user_id);

-- Users can only insert their own knowledge items
CREATE POLICY "Users can create own knowledge"
ON knowledge_base FOR INSERT
WITH CHECK (auth.uid() = user_id);
```

---

## State Management

### State Distribution

| State Type | Location | Persistence |
|------------|----------|-------------|
| Auth state | AuthContext | Session storage |
| Theme | ThemeContext | Local storage |
| Server data | React Query cache | Memory (with refetch) |
| Form state | React Hook Form | Component state |
| UI state | Component state | None |
| Offline queue | OfflineContext | IndexedDB |

### React Query Pattern

```typescript
// Query for fetching data
const { data, isLoading, error } = useQuery({
  queryKey: ['knowledge', userId],
  queryFn: () => knowledgeService.list(userId),
});

// Mutation with optimistic updates
const mutation = useMutation({
  mutationFn: knowledgeService.create,
  onMutate: async (newItem) => {
    // Cancel outgoing refetches
    await queryClient.cancelQueries(['knowledge']);
    
    // Snapshot previous value
    const previous = queryClient.getQueryData(['knowledge']);
    
    // Optimistically update
    queryClient.setQueryData(['knowledge'], (old) => [...old, newItem]);
    
    return { previous };
  },
  onError: (err, newItem, context) => {
    // Rollback on error
    queryClient.setQueryData(['knowledge'], context.previous);
  },
  onSettled: () => {
    // Refetch after mutation
    queryClient.invalidateQueries(['knowledge']);
  },
});
```

---

## Performance Considerations

### Optimization Strategies

| Strategy | Implementation |
|----------|----------------|
| Code splitting | React.lazy + Suspense for routes |
| Image optimization | Lazy loading, WebP format |
| Query caching | React Query with stale-while-revalidate |
| Virtual scrolling | @tanstack/react-virtual for large lists |
| Debouncing | useDebounce hook for search inputs |
| Memoization | React.memo, useMemo, useCallback |

### Bundle Size Management

```
Route-based code splitting:
├── / (Landing)           ~50KB
├── /auth                 ~30KB
├── /dashboard            ~80KB
├── /search               ~100KB (includes chat)
└── /manage               ~120KB (includes views)
```

---

## Future Considerations

### Planned Improvements

1. **Real-time Collaboration**
   - Supabase Realtime for live updates
   - Presence indicators
   - Collaborative editing

2. **Enhanced AI**
   - Streaming responses
   - Multi-modal support (images)
   - Custom knowledge embeddings

3. **Mobile App**
   - React Native or Capacitor
   - Offline-first architecture
   - Push notifications

---

## References

- [React Documentation](https://react.dev)
- [Supabase Documentation](https://supabase.com/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [shadcn/ui](https://ui.shadcn.com)
- [React Query](https://tanstack.com/query)
