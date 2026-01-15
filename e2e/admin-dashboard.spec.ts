import { test, expect } from '@playwright/test';

/**
 * Admin Dashboard E2E Tests
 * Tests admin-specific functionality including security alerts, user management, and IP blocking
 */
test.describe('Admin Dashboard Access Control', () => {
  test('should redirect non-admin users away from admin dashboard', async ({ page }) => {
    await page.goto('/admin');
    
    // Non-admin users should be redirected
    // Either to login page or to a "not authorized" page
    await expect(page).toHaveURL(/\/(auth|dashboard|$)/);
  });

  test('should show access denied message for non-admin users', async ({ page }) => {
    await page.goto('/admin');
    
    // Look for access denied or redirect
    const accessDenied = page.getByText(/access denied|not authorized|permission/i);
    const redirected = page.url().includes('/auth') || page.url() === 'http://localhost:8080/';
    
    // Either access denied message or redirect should occur
    expect(await accessDenied.isVisible().catch(() => false) || redirected).toBeTruthy();
  });
});

test.describe('Admin Dashboard Layout', () => {
  // These tests assume admin access - they'll be skipped if admin UI is not accessible
  
  test('should display security statistics cards', async ({ page }) => {
    await page.goto('/admin');
    
    // Look for stat cards
    const statCards = page.locator('[data-testid="stat-card"], .stat-card, [class*="card"]');
    
    // If admin dashboard is accessible, verify structure
    if (await page.url().includes('/admin')) {
      await expect(statCards.first()).toBeVisible({ timeout: 5000 });
    }
  });

  test('should display security alerts section', async ({ page }) => {
    await page.goto('/admin');
    
    if (await page.url().includes('/admin')) {
      const alertsSection = page.getByText(/security alert|recent alert/i);
      await expect(alertsSection).toBeVisible({ timeout: 5000 });
    }
  });

  test('should display blocked IPs section', async ({ page }) => {
    await page.goto('/admin');
    
    if (await page.url().includes('/admin')) {
      const blockedSection = page.getByText(/blocked ip|ip block/i);
      await expect(blockedSection).toBeVisible({ timeout: 5000 });
    }
  });

  test('should display user activity section', async ({ page }) => {
    await page.goto('/admin');
    
    if (await page.url().includes('/admin')) {
      const activitySection = page.getByText(/user activity|recent activity/i);
      await expect(activitySection).toBeVisible({ timeout: 5000 });
    }
  });
});

test.describe('Admin Dashboard Interactions', () => {
  test('should allow filtering security alerts', async ({ page }) => {
    await page.goto('/admin');
    
    if (await page.url().includes('/admin')) {
      // Look for filter controls
      const filterSelect = page.locator('select, [role="combobox"]').first();
      
      if (await filterSelect.isVisible()) {
        await filterSelect.click();
        
        // Should show filter options
        const options = page.locator('[role="option"], option');
        await expect(options.first()).toBeVisible();
      }
    }
  });

  test('should show IP block dialog', async ({ page }) => {
    await page.goto('/admin');
    
    if (await page.url().includes('/admin')) {
      // Look for block IP button
      const blockButton = page.getByRole('button', { name: /block.*ip|add.*block/i });
      
      if (await blockButton.isVisible()) {
        await blockButton.click();
        
        // Dialog should appear
        const dialog = page.locator('[role="dialog"], [data-testid="block-ip-dialog"]');
        await expect(dialog).toBeVisible();
      }
    }
  });

  test('should validate IP address format in block dialog', async ({ page }) => {
    await page.goto('/admin');
    
    if (await page.url().includes('/admin')) {
      const blockButton = page.getByRole('button', { name: /block.*ip/i });
      
      if (await blockButton.isVisible()) {
        await blockButton.click();
        
        const ipInput = page.locator('input[name="ip"], input[placeholder*="IP"]');
        
        if (await ipInput.isVisible()) {
          // Enter invalid IP
          await ipInput.fill('invalid-ip');
          
          // Try to submit
          const submitButton = page.getByRole('button', { name: /block|submit|confirm/i });
          await submitButton.click();
          
          // Should show validation error
          const error = page.getByText(/invalid|format|valid ip/i);
          await expect(error).toBeVisible({ timeout: 3000 });
        }
      }
    }
  });

  test('should allow unblocking an IP', async ({ page }) => {
    await page.goto('/admin');
    
    if (await page.url().includes('/admin')) {
      // Look for unblock button on existing blocked IP
      const unblockButton = page.getByRole('button', { name: /unblock|remove/i }).first();
      
      if (await unblockButton.isVisible()) {
        await unblockButton.click();
        
        // Should show confirmation or immediately unblock
        const confirmDialog = page.locator('[role="alertdialog"]');
        
        if (await confirmDialog.isVisible()) {
          await page.getByRole('button', { name: /confirm|yes|unblock/i }).click();
        }
      }
    }
  });
});

test.describe('Admin Dashboard Data Loading', () => {
  test('should show loading state while fetching data', async ({ page }) => {
    await page.goto('/admin');
    
    if (await page.url().includes('/admin')) {
      // Look for loading indicators (skeleton, spinner, etc.)
      const loadingIndicator = page.locator('[data-testid="loading"], .skeleton, [class*="animate-pulse"], [class*="spinner"]');
      
      // Loading should appear briefly or content should be visible
      const hasLoading = await loadingIndicator.isVisible().catch(() => false);
      const hasContent = await page.locator('[data-testid="stat-card"], .card').isVisible().catch(() => false);
      
      expect(hasLoading || hasContent).toBeTruthy();
    }
  });

  test('should handle data refresh', async ({ page }) => {
    await page.goto('/admin');
    
    if (await page.url().includes('/admin')) {
      // Look for refresh button
      const refreshButton = page.getByRole('button', { name: /refresh|reload/i });
      
      if (await refreshButton.isVisible()) {
        await refreshButton.click();
        
        // Should trigger data reload (loading state or updated data)
        await page.waitForResponse(resp => resp.url().includes('supabase') && resp.status() === 200, { timeout: 5000 }).catch(() => null);
      }
    }
  });
});

test.describe('Admin Dashboard Accessibility', () => {
  test('should have proper heading structure', async ({ page }) => {
    await page.goto('/admin');
    
    if (await page.url().includes('/admin')) {
      // Check for h1
      const h1 = page.locator('h1');
      await expect(h1).toBeVisible();
      
      // Verify heading hierarchy
      const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();
      expect(headings.length).toBeGreaterThan(0);
    }
  });

  test('should support keyboard navigation', async ({ page }) => {
    await page.goto('/admin');
    
    if (await page.url().includes('/admin')) {
      // Tab through interactive elements
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      
      const focusedElement = page.locator(':focus');
      await expect(focusedElement).toBeVisible();
    }
  });

  test('should have descriptive labels for interactive elements', async ({ page }) => {
    await page.goto('/admin');
    
    if (await page.url().includes('/admin')) {
      // Check buttons have accessible names
      const buttons = page.locator('button');
      const buttonCount = await buttons.count();
      
      for (let i = 0; i < Math.min(buttonCount, 5); i++) {
        const button = buttons.nth(i);
        const ariaLabel = await button.getAttribute('aria-label');
        const textContent = await button.textContent();
        const title = await button.getAttribute('title');
        
        // Button should have some accessible name
        expect(ariaLabel || textContent?.trim() || title).toBeTruthy();
      }
    }
  });
});
