

## Analysis

The project already has a fully implemented authentication page at `/auth` (`src/pages/AuthPage.tsx`) with:
- Sign in and sign up forms with reCAPTCHA
- Account lockout protection
- MFA support
- Forgot password flow
- Connection health checks

The problem is that **ProtectedRoute doesn't redirect unauthenticated users to the auth page**. Instead, it shows the page content with a dismissible WaitlistModal overlay. Once dismissed, unauthenticated users see the protected content freely.

## Plan

### 1. Update ProtectedRoute to redirect to `/auth`

Replace the current WaitlistModal-based approach with a proper redirect to `/auth` using `Navigate` from react-router-dom. Unauthenticated users will be redirected to the login page instead of seeing protected content behind a modal.

- Remove WaitlistModal import and usage
- Add a loading state check (show spinner while auth is loading)
- Return `<Navigate to="/auth" replace />` when not authenticated
- Keep the onboarding flow for authenticated users who haven't completed it

### 2. Add "Sign In" / "Sign Up" button to Navbar

Update `src/components/navigation/Navbar.tsx` to show authentication-related navigation:
- When not authenticated: show a "Sign In" button linking to `/auth`
- When authenticated: show user menu with logout option (if not already present)

This gives users a clear entry point to authentication from any page.

### 3. Add post-login redirect support

Update `AuthPage.tsx` to support a `returnTo` query parameter so users are redirected back to their intended destination after login, rather than always going to `/dashboard`.

Update `ProtectedRoute` to pass the current path as a query parameter when redirecting to `/auth`.

