# Security Documentation

This document outlines security best practices, authentication flows, Row Level Security (RLS) policies, and data protection measures for the Tessa AI Platform.

## Table of Contents

- [Security Overview](#security-overview)
- [Authentication](#authentication)
- [Authorization & Role-Based Access](#authorization--role-based-access)
- [Row Level Security (RLS)](#row-level-security-rls)
- [Input Validation](#input-validation)
- [Data Protection](#data-protection)
- [API Security](#api-security)
- [Secrets Management](#secrets-management)
- [Security Checklist](#security-checklist)

---

## Security Overview

### Security Principles

1. **Defense in Depth**: Multiple layers of security controls
2. **Least Privilege**: Minimal access rights for users and processes
3. **Secure by Default**: Security enabled out of the box
4. **Zero Trust**: Verify every request, trust nothing implicitly

### Architecture Security Layers

```
┌─────────────────────────────────────────────────────────────┐
│                     Client Layer                             │
│  • Input validation    • XSS prevention    • CSRF protection│
└─────────────────────────────┬───────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     API Layer                                │
│  • Authentication     • Rate limiting      • CORS policies  │
└─────────────────────────────┬───────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     Database Layer                           │
│  • RLS policies       • Encryption         • Access control │
└─────────────────────────────────────────────────────────────┘
```

---

## Authentication

### Supported Authentication Methods

| Method | Use Case | Security Level |
|--------|----------|----------------|
| Email/Password | Standard user accounts | High |
| OAuth (Google) | Social login | High |
| Magic Link | Passwordless auth | Medium-High |

### Implementation Guidelines

#### Session Management

```typescript
// Correct implementation: Store full session, not just user
import { User, Session } from '@supabase/supabase-js';

const [user, setUser] = useState<User | null>(null);
const [session, setSession] = useState<Session | null>(null);

useEffect(() => {
  // Set up auth state listener FIRST
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    (event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
    }
  );

  // THEN check for existing session
  supabase.auth.getSession().then(({ data: { session } }) => {
    setSession(session);
    setUser(session?.user ?? null);
  });

  return () => subscription.unsubscribe();
}, []);
```

#### Sign Up with Email Redirect

```typescript
// CRITICAL: Always set emailRedirectTo
const signUp = async (email: string, password: string) => {
  const redirectUrl = `${window.location.origin}/`;
  
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: redirectUrl
    }
  });
  return { error };
};
```

#### Preventing Auth Deadlocks

```typescript
// CORRECT: Never use async functions as callbacks
supabase.auth.onAuthStateChange((event, session) => {
  // Only synchronous state updates here
  setSession(session);
  setUser(session?.user ?? null);
  
  // Defer Supabase calls with setTimeout
  if (session?.user) {
    setTimeout(() => {
      fetchUserProfile(session.user.id);
    }, 0);
  }
});
```

### Authentication Security Checklist

- ✅ Store complete session object, not just user
- ✅ Set up auth listeners before checking existing sessions
- ✅ Always configure `emailRedirectTo` for sign up
- ✅ Never call Supabase functions inside `onAuthStateChange`
- ✅ Configure Site URL and Redirect URLs in Supabase dashboard
- ✅ Implement proper error handling for auth flows
- ✅ Use schema validation (zod) for email/password inputs

---

## Authorization & Role-Based Access

### Role Management Architecture

**CRITICAL SECURITY WARNING**: Never store roles in the profiles or users table. This leads to privilege escalation attacks.

#### Correct Implementation: Separate Roles Table

```sql
-- 1. Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- 2. Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, role)
);

-- 3. Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
```

#### Security Definer Function for Role Checks

```sql
-- Bypass RLS recursion with security definer
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;
```

### Client-Side Security

**CRITICAL**: Never check admin status using:
- ❌ localStorage or sessionStorage
- ❌ Hardcoded credentials
- ❌ Client-side only checks

**Always use**:
- ✅ Server-side validation
- ✅ Database-stored roles with RLS
- ✅ Security definer functions

---

## Row Level Security (RLS)

### RLS Best Practices

#### 1. Always Enable RLS on User Data Tables

```sql
ALTER TABLE public.your_table ENABLE ROW LEVEL SECURITY;
```

#### 2. Standard Policy Patterns

**Users can view their own data:**
```sql
CREATE POLICY "Users can view own data"
ON public.knowledge_base
FOR SELECT
USING (auth.uid() = user_id);
```

**Users can insert their own data:**
```sql
CREATE POLICY "Users can insert own data"
ON public.knowledge_base
FOR INSERT
WITH CHECK (auth.uid() = user_id);
```

**Users can update their own data:**
```sql
CREATE POLICY "Users can update own data"
ON public.knowledge_base
FOR UPDATE
USING (auth.uid() = user_id);
```

**Users can delete their own data:**
```sql
CREATE POLICY "Users can delete own data"
ON public.knowledge_base
FOR DELETE
USING (auth.uid() = user_id);
```

#### 3. Admin Access Policies

```sql
-- Use the has_role function to avoid recursion
CREATE POLICY "Admins can view all data"
ON public.knowledge_base
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
```

### Avoiding Infinite Recursion

**WRONG**: Policy referencing same table
```sql
-- This causes infinite recursion!
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);
```

**CORRECT**: Use security definer function
```sql
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));
```

### RLS Debugging

```sql
-- Check existing policies
SELECT * FROM pg_policies WHERE tablename = 'your_table';

-- Test policy as specific user
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims = '{"sub": "user-uuid-here"}';
SELECT * FROM your_table;
```

---

## Input Validation

### Client-Side Validation with Zod

```typescript
import { z } from 'zod';

// Define validation schema
const contactSchema = z.object({
  name: z.string()
    .trim()
    .min(1, { message: "Name is required" })
    .max(100, { message: "Name must be less than 100 characters" }),
  email: z.string()
    .trim()
    .email({ message: "Invalid email address" })
    .max(255, { message: "Email must be less than 255 characters" }),
  message: z.string()
    .trim()
    .min(1, { message: "Message is required" })
    .max(1000, { message: "Message must be less than 1000 characters" })
});

// Validate input
const result = contactSchema.safeParse(formData);
if (!result.success) {
  // Handle validation errors
  console.error(result.error.flatten());
}
```

### XSS Prevention

```typescript
import DOMPurify from 'dompurify';

// Sanitize HTML content before rendering
const sanitizedHtml = DOMPurify.sanitize(userContent);

// NEVER do this with unsanitized content:
// ❌ dangerouslySetInnerHTML={{ __html: userContent }}

// ✅ Safe approach:
// dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
```

### URL Parameter Encoding

```typescript
// Always encode user input in URLs
const safeUrl = `https://api.example.com/search?q=${encodeURIComponent(userInput)}`;
```

### Validation Checklist

- ✅ Validate all user inputs on both client and server
- ✅ Use schema validation libraries (zod)
- ✅ Implement length limits and character restrictions
- ✅ Sanitize HTML with DOMPurify
- ✅ Encode URL parameters with encodeURIComponent
- ✅ Never log sensitive data to console in production

---

## Data Protection

### Data Classification

| Level | Examples | Protection |
|-------|----------|------------|
| **Public** | Marketing content, public profiles | Basic access control |
| **Internal** | User preferences, app settings | Authentication required |
| **Confidential** | PII, email addresses, phone numbers | RLS + encryption |
| **Restricted** | Passwords, API keys, tokens | Never stored in plain text |

### Encryption

#### Data at Rest
- Supabase encrypts all data at rest using AES-256
- Database backups are encrypted

#### Data in Transit
- All API calls use HTTPS/TLS 1.3
- WebSocket connections are encrypted

### PII Handling

```sql
-- Tables with PII MUST have RLS enabled
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Restrict PII access to owner only
CREATE POLICY "Users can view own PII"
ON public.user_profiles
FOR SELECT
USING (auth.uid() = id);
```

### Data Retention

- Implement soft deletes for audit trails
- Automatically purge deleted data after retention period
- Log all data access for compliance

---

## API Security

### Edge Function Security

```typescript
// Always validate authentication
const authHeader = req.headers.get('Authorization');
if (!authHeader) {
  return new Response(
    JSON.stringify({ error: 'Missing authorization header' }),
    { status: 401 }
  );
}

// Verify the JWT token
const token = authHeader.replace('Bearer ', '');
const { data: { user }, error } = await supabase.auth.getUser(token);

if (error || !user) {
  return new Response(
    JSON.stringify({ error: 'Invalid token' }),
    { status: 401 }
  );
}
```

### CORS Configuration

```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // Configure for your domains
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

// Handle preflight requests
if (req.method === 'OPTIONS') {
  return new Response(null, { headers: corsHeaders });
}
```

### Rate Limiting

- Implement rate limiting on sensitive endpoints
- Use exponential backoff for failed requests
- Monitor for unusual traffic patterns

---

## Secrets Management

### Secret Storage

**NEVER** store secrets in:
- ❌ Source code
- ❌ Client-side code
- ❌ localStorage/sessionStorage
- ❌ Git repositories

**ALWAYS** store secrets in:
- ✅ Supabase Edge Function secrets
- ✅ Environment variables (server-side only)

### Adding Secrets

1. Navigate to Supabase Dashboard → Settings → Edge Functions
2. Add secrets in the Secrets section
3. Access in Edge Functions:

```typescript
const apiKey = Deno.env.get('OPENAI_API_KEY');
if (!apiKey) {
  throw new Error('API key not configured');
}
```

### Publishable vs Secret Keys

| Type | Example | Storage |
|------|---------|---------|
| **Publishable** | Stripe publishable key, Supabase anon key | Can be in client code |
| **Secret** | API keys, OAuth secrets, database passwords | Edge function secrets only |

---

## Security Checklist

### Development

- [ ] Enable RLS on all tables with user data
- [ ] Implement input validation with zod
- [ ] Sanitize all HTML output with DOMPurify
- [ ] Use security definer functions for role checks
- [ ] Never store roles in profiles table
- [ ] Configure CORS properly for Edge Functions

### Authentication

- [ ] Store complete session objects
- [ ] Configure emailRedirectTo for sign up
- [ ] Set Site URL and Redirect URLs in Supabase
- [ ] Implement proper error handling
- [ ] Use secure password requirements

### Data Protection

- [ ] Classify data by sensitivity level
- [ ] Enable RLS for PII tables
- [ ] Implement soft deletes for audit trails
- [ ] Never log sensitive data

### Deployment

- [ ] All secrets stored in Supabase secrets
- [ ] HTTPS enabled for all endpoints
- [ ] Rate limiting configured
- [ ] Security headers set properly
- [ ] Regular security audits scheduled

---

## Reporting Security Issues

If you discover a security vulnerability, please report it responsibly:

1. **Do not** create a public GitHub issue
2. Email security concerns to the maintainers directly
3. Include detailed reproduction steps
4. Allow time for the issue to be addressed before disclosure

---

## Resources

- [Supabase Security Documentation](https://supabase.com/docs/guides/auth)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [React Security Best Practices](https://reactjs.org/docs/introducing-jsx.html#jsx-prevents-injection-attacks)
- [Deno Security](https://deno.land/manual/getting_started/permissions)
