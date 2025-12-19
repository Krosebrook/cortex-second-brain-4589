# Troubleshooting Guide

This guide covers common issues, debugging tips, and solutions for development and production environments.

## Table of Contents

- [Development Issues](#development-issues)
- [Build & Deployment Issues](#build--deployment-issues)
- [Supabase & Database Issues](#supabase--database-issues)
- [Authentication Issues](#authentication-issues)
- [Performance Issues](#performance-issues)
- [UI/UX Issues](#uiux-issues)
- [Edge Function Issues](#edge-function-issues)
- [Debugging Tools & Techniques](#debugging-tools--techniques)

---

## Development Issues

### Application Won't Start

**Symptoms:**
- `npm run dev` fails
- Port already in use errors
- Module not found errors

**Solutions:**

```bash
# Clear node_modules and reinstall
rm -rf node_modules
rm package-lock.json
npm install

# Kill process on port 5173 (or 8080)
lsof -ti:5173 | xargs kill -9

# Clear Vite cache
rm -rf node_modules/.vite
npm run dev
```

### TypeScript Errors

**Symptoms:**
- Type mismatches
- Missing type definitions
- Generic type errors

**Solutions:**

```typescript
// Check Supabase types are up to date
// Types are auto-generated from database schema

// For optional properties, use proper null checks
const value = data?.property ?? defaultValue;

// For union types, use type guards
function isUser(obj: unknown): obj is User {
  return typeof obj === 'object' && obj !== null && 'id' in obj;
}
```

### Hot Module Replacement (HMR) Not Working

**Symptoms:**
- Changes not reflecting in browser
- Full page reloads instead of HMR

**Solutions:**

```bash
# Clear browser cache and hard reload
# Chrome: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)

# Check vite.config.ts for proper HMR configuration
# Ensure no syntax errors in edited files

# Restart dev server
npm run dev
```

---

## Build & Deployment Issues

### Build Failures

**Symptoms:**
- `npm run build` fails
- ESLint errors blocking build
- TypeScript compilation errors

**Solutions:**

```bash
# Check for linting errors
npm run lint

# Fix auto-fixable issues
npm run lint -- --fix

# Build with verbose output
npm run build -- --debug

# Check for circular dependencies
npx madge --circular src/
```

### Environment Variables Not Loading

**Symptoms:**
- `undefined` values for environment variables
- Features not working in production

**Solutions:**

```typescript
// Vite requires VITE_ prefix for client-side variables
// DON'T use VITE_ variables in Lovable projects

// For Supabase, use the client directly
import { supabase } from "@/integrations/supabase/client";

// Check .env file format (no quotes needed)
// CORRECT:
SUPABASE_URL=https://your-project.supabase.co

// INCORRECT:
SUPABASE_URL="https://your-project.supabase.co"
```

### Deployment Preview Issues

**Symptoms:**
- Preview works but production doesn't
- Assets not loading in production

**Solutions:**

```bash
# Ensure all assets use correct paths
# Use absolute paths from public folder
<img src="/images/logo.png" />

# Or import from src/assets
import logo from "@/assets/logo.png";

# Check base URL in vite.config.ts
export default defineConfig({
  base: '/', // Ensure this is correct
});
```

---

## Supabase & Database Issues

### Row Level Security (RLS) Blocking Queries

**Symptoms:**
- Empty results when data exists
- "new row violates row-level security policy" errors

**Solutions:**

```sql
-- Check existing RLS policies
SELECT * FROM pg_policies WHERE tablename = 'your_table';

-- Ensure user_id column is NOT NULL if used in RLS
ALTER TABLE your_table ALTER COLUMN user_id SET NOT NULL;

-- Example: Allow users to see their own data
CREATE POLICY "Users can view own data"
ON your_table FOR SELECT
USING (auth.uid() = user_id);

-- Example: Allow authenticated users to insert
CREATE POLICY "Users can insert own data"
ON your_table FOR INSERT
WITH CHECK (auth.uid() = user_id);
```

### Data Not Showing

**Symptoms:**
- Query returns empty array
- Data visible in Supabase dashboard but not in app

**Solutions:**

```typescript
// Check if hitting default 1000 row limit
const { data, error } = await supabase
  .from('table')
  .select('*')
  .range(0, 9999); // Adjust range as needed

// Check for soft deletes
const { data } = await supabase
  .from('table')
  .select('*')
  .is('deleted_at', null);

// Verify user is authenticated
const { data: { user } } = await supabase.auth.getUser();
console.log('Current user:', user?.id);
```

### Foreign Key Constraint Errors

**Symptoms:**
- Insert/update operations failing
- "violates foreign key constraint" errors

**Solutions:**

```sql
-- Check referenced data exists
SELECT * FROM referenced_table WHERE id = 'your-id';

-- For optional relationships, allow NULL
ALTER TABLE your_table 
ALTER COLUMN foreign_id DROP NOT NULL;

-- Or use ON DELETE CASCADE for automatic cleanup
ALTER TABLE your_table
ADD CONSTRAINT fk_name
FOREIGN KEY (foreign_id) REFERENCES other_table(id)
ON DELETE CASCADE;
```

---

## Authentication Issues

### Login Not Working

**Symptoms:**
- "requested path is invalid" error
- Redirect to localhost after login
- Session not persisting

**Solutions:**

1. **Configure Supabase URL Settings:**
   - Go to Supabase Dashboard → Authentication → URL Configuration
   - Set Site URL to your app URL (preview or production)
   - Add redirect URLs for both preview and production domains

2. **Check Auth Configuration:**

```typescript
// Ensure proper redirect handling
const { error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: `${window.location.origin}/auth/callback`,
  },
});
```

### Session Expiring Unexpectedly

**Symptoms:**
- Users logged out frequently
- Token refresh failures

**Solutions:**

```typescript
// Set up auth state listener
useEffect(() => {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    (event, session) => {
      if (event === 'TOKEN_REFRESHED') {
        console.log('Token refreshed successfully');
      }
      if (event === 'SIGNED_OUT') {
        // Handle logout
      }
    }
  );

  return () => subscription.unsubscribe();
}, []);
```

---

## Performance Issues

### Slow Initial Load

**Symptoms:**
- Long time to first contentful paint
- Large bundle size warnings

**Solutions:**

```typescript
// Use lazy loading for routes
const Dashboard = lazy(() => import('./pages/Dashboard'));

// Split large components
const HeavyComponent = lazy(() => import('./components/HeavyComponent'));

// Optimize images
<img 
  src={image} 
  loading="lazy" 
  decoding="async"
/>
```

### Memory Leaks

**Symptoms:**
- Browser tab slowing down over time
- Increasing memory usage

**Solutions:**

```typescript
// Clean up subscriptions and listeners
useEffect(() => {
  const subscription = someObservable.subscribe();
  
  return () => {
    subscription.unsubscribe();
  };
}, []);

// Cancel pending requests
useEffect(() => {
  const controller = new AbortController();
  
  fetch(url, { signal: controller.signal });
  
  return () => controller.abort();
}, [url]);
```

### Excessive Re-renders

**Symptoms:**
- UI feels sluggish
- High CPU usage during interactions

**Solutions:**

```typescript
// Use React.memo for expensive components
const ExpensiveComponent = React.memo(({ data }) => {
  // Component logic
});

// Use useMemo for expensive calculations
const processedData = useMemo(() => {
  return expensiveCalculation(data);
}, [data]);

// Use useCallback for event handlers
const handleClick = useCallback(() => {
  // Handler logic
}, [dependency]);
```

---

## UI/UX Issues

### Styles Not Applying

**Symptoms:**
- Tailwind classes not working
- Inconsistent styling

**Solutions:**

```typescript
// Ensure using design system tokens
// ✓ Correct
<div className="bg-background text-foreground">

// ✗ Incorrect
<div className="bg-white text-black">

// Check Tailwind config includes all paths
// tailwind.config.ts
content: [
  "./index.html",
  "./src/**/*.{js,ts,jsx,tsx}",
],
```

### Dark Mode Issues

**Symptoms:**
- White text on white background
- Colors not changing with theme

**Solutions:**

```typescript
// Use semantic color tokens
<div className="bg-background text-foreground">
  <p className="text-muted-foreground">Muted text</p>
</div>

// For conditional dark mode styling
<div className="bg-white dark:bg-gray-900">
```

### Responsive Layout Breaking

**Symptoms:**
- Layout issues on mobile
- Elements overflowing

**Solutions:**

```typescript
// Use responsive breakpoints properly
<div className="flex flex-col md:flex-row">
  <div className="w-full md:w-1/2">
    {/* Content */}
  </div>
</div>

// Hide/show elements responsively
<nav className="hidden md:flex">
  {/* Desktop navigation */}
</nav>
<nav className="flex md:hidden">
  {/* Mobile navigation */}
</nav>
```

---

## Edge Function Issues

### Function Not Responding

**Symptoms:**
- Timeout errors
- 500 Internal Server Error

**Solutions:**

```typescript
// Check function logs in Supabase Dashboard
// Functions → Select function → Logs

// Add proper error handling
Deno.serve(async (req) => {
  try {
    // Function logic
    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Function error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
```

### CORS Errors

**Symptoms:**
- "Access-Control-Allow-Origin" errors
- Requests blocked by browser

**Solutions:**

```typescript
// Add CORS headers to edge functions
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Include CORS headers in all responses
  return new Response(JSON.stringify(data), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
```

### Secrets Not Available

**Symptoms:**
- `undefined` when accessing secrets
- API calls failing with auth errors

**Solutions:**

```typescript
// Access secrets using Deno.env
const apiKey = Deno.env.get('OPENAI_API_KEY');

if (!apiKey) {
  throw new Error('OPENAI_API_KEY is not configured');
}

// Check secrets are set in Supabase Dashboard
// Settings → Edge Functions → Secrets
```

---

## Debugging Tools & Techniques

### Browser DevTools

```javascript
// Console logging with context
console.log('[Component]', { props, state });

// Performance timing
console.time('operation');
// ... operation
console.timeEnd('operation');

// Conditional breakpoints
// In DevTools Sources, right-click line number → Add conditional breakpoint
```

### React DevTools

- **Components tab:** Inspect component hierarchy and props
- **Profiler tab:** Identify performance bottlenecks
- **Highlight updates:** See which components re-render

### Network Debugging

```typescript
// Log all Supabase requests
const { data, error } = await supabase
  .from('table')
  .select('*');

console.log('Query result:', { data, error });

// Check network tab for:
// - Request/response headers
// - Response status codes
// - Response body
```

### Production Debugging

```typescript
// Add structured logging
const log = (level: string, message: string, data?: object) => {
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    message,
    ...data,
  }));
};

// Error boundary for catching render errors
class ErrorBoundary extends React.Component {
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    log('error', 'React error boundary caught error', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    });
  }
}
```

---

## Quick Reference

### Common Error Messages

| Error | Cause | Solution |
|-------|-------|----------|
| `PGRST301` | Row not found | Check RLS policies |
| `JWT expired` | Token needs refresh | Re-authenticate user |
| `CORS error` | Missing headers | Add CORS headers to edge function |
| `Type 'X' is not assignable` | TypeScript mismatch | Check type definitions |
| `Cannot read property of undefined` | Null reference | Add null checks |

### Useful Commands

```bash
# Development
npm run dev          # Start dev server
npm run build        # Build for production
npm run preview      # Preview production build

# Testing
npm run test         # Run tests
npm run test:watch   # Watch mode

# Linting
npm run lint         # Check for issues
npm run lint -- --fix # Auto-fix issues

# Type checking
npx tsc --noEmit     # Check types without building
```

### Getting Help

1. Check this troubleshooting guide
2. Search [Lovable Documentation](https://docs.lovable.dev/)
3. Review [Supabase Documentation](https://supabase.com/docs)
4. Ask in [Lovable Discord](https://discord.com/channels/1119885301872070706/1280461670979993613)
5. Check GitHub issues for similar problems
