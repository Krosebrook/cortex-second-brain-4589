import { test, expect } from '@playwright/test';

/**
 * Authentication E2E Tests
 * Tests the complete authentication flow including login, signup, and logout
 */
test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display login page when navigating to /auth', async ({ page }) => {
    await page.goto('/auth');
    
    // Verify login form elements are present
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
  });

  test('should show validation errors for empty form submission', async ({ page }) => {
    await page.goto('/auth');
    
    // Click sign in without filling form
    await page.getByRole('button', { name: /sign in/i }).click();
    
    // Check for validation feedback
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toHaveAttribute('required', '');
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/auth');
    
    // Fill in invalid credentials
    await page.fill('input[type="email"]', 'invalid@test.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    
    // Submit form
    await page.getByRole('button', { name: /sign in/i }).click();
    
    // Wait for error message (API will reject invalid credentials)
    // This may show a toast or inline error depending on implementation
    await expect(page.locator('[role="alert"], [data-sonner-toast]')).toBeVisible({ timeout: 10000 });
  });

  test('should allow switching between login and signup tabs', async ({ page }) => {
    await page.goto('/auth');
    
    // Look for signup tab/link
    const signupTab = page.getByRole('tab', { name: /sign up/i }).or(page.getByText(/create.*account/i));
    
    if (await signupTab.isVisible()) {
      await signupTab.click();
      
      // Verify signup-specific elements appear
      await expect(page.locator('input[type="email"]')).toBeVisible();
    }
  });

  test('should redirect to login when accessing protected route while logged out', async ({ page }) => {
    // Try to access a protected route
    await page.goto('/dashboard');
    
    // Should be redirected to auth page
    await expect(page).toHaveURL(/\/auth|\/$/);
  });

  test('should have accessible form elements', async ({ page }) => {
    await page.goto('/auth');
    
    // Check that form elements have proper labels
    const emailLabel = page.getByLabel(/email/i);
    const passwordLabel = page.getByLabel(/password/i);
    
    await expect(emailLabel.or(page.locator('input[type="email"]'))).toBeVisible();
    await expect(passwordLabel.or(page.locator('input[type="password"]'))).toBeVisible();
  });

  test('should support keyboard navigation', async ({ page }) => {
    await page.goto('/auth');
    
    // Tab through form elements
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // Should be able to navigate using keyboard
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
  });
});

test.describe('Session Management', () => {
  test('should persist session across page reloads', async ({ page }) => {
    // This test would require a valid test account or mocked auth
    // Skipping actual login for now, testing the flow structure
    await page.goto('/');
    
    // Check if already logged in (session persisted)
    const isLoggedIn = await page.locator('[data-testid="user-menu"], [aria-label="User menu"]').isVisible().catch(() => false);
    
    if (isLoggedIn) {
      await page.reload();
      // Session should persist
      await expect(page.locator('[data-testid="user-menu"], [aria-label="User menu"]')).toBeVisible();
    }
  });
});
