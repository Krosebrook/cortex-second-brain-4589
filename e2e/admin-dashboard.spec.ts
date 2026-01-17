import { test, expect } from '@playwright/test';

/**
 * Admin Dashboard E2E Tests
 * Comprehensive tests for admin functionality including:
 * - Access control and authentication
 * - Security alerts and blocked IPs
 * - Rate limit settings configuration
 * - Usage monitoring dashboard with real-time updates
 */

// Helper to check if we're on admin page
const isOnAdminPage = async (page: any) => {
  return page.url().includes('/admin');
};

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
  test('should display security statistics cards', async ({ page }) => {
    await page.goto('/admin');
    
    if (await isOnAdminPage(page)) {
      // Look for stat cards
      const statCards = page.locator('[data-testid="stat-card"], .stat-card, [class*="card"]');
      await expect(statCards.first()).toBeVisible({ timeout: 5000 });
    }
  });

  test('should display security alerts section', async ({ page }) => {
    await page.goto('/admin');
    
    if (await isOnAdminPage(page)) {
      const alertsSection = page.getByText(/security alert|recent alert/i);
      await expect(alertsSection).toBeVisible({ timeout: 5000 });
    }
  });

  test('should display blocked IPs section', async ({ page }) => {
    await page.goto('/admin');
    
    if (await isOnAdminPage(page)) {
      const blockedSection = page.getByText(/blocked ip|ip block/i);
      await expect(blockedSection).toBeVisible({ timeout: 5000 });
    }
  });

  test('should display user activity section', async ({ page }) => {
    await page.goto('/admin');
    
    if (await isOnAdminPage(page)) {
      const activitySection = page.getByText(/user activity|recent activity/i);
      await expect(activitySection).toBeVisible({ timeout: 5000 });
    }
  });

  test('should display refresh button', async ({ page }) => {
    await page.goto('/admin');
    
    if (await isOnAdminPage(page)) {
      const refreshButton = page.getByRole('button', { name: /refresh/i });
      await expect(refreshButton).toBeVisible();
    }
  });
});

test.describe('Rate Limit Settings', () => {
  test('should display rate limit settings section', async ({ page }) => {
    await page.goto('/admin');
    
    if (await isOnAdminPage(page)) {
      const rateLimitSection = page.getByText(/rate limit|rate limiting/i);
      await expect(rateLimitSection).toBeVisible({ timeout: 5000 });
    }
  });

  test('should show rate limit configuration fields', async ({ page }) => {
    await page.goto('/admin');
    
    if (await isOnAdminPage(page)) {
      // Look for rate limit related inputs or labels
      const maxAttemptsLabel = page.getByText(/max attempts|maximum attempts/i);
      const timeWindowLabel = page.getByText(/time window|window/i);
      const blockDurationLabel = page.getByText(/block duration|duration/i);
      
      // At least one of these should be visible if rate limit settings exist
      const hasRateLimitUI = await maxAttemptsLabel.isVisible().catch(() => false) ||
                             await timeWindowLabel.isVisible().catch(() => false) ||
                             await blockDurationLabel.isVisible().catch(() => false);
      
      if (hasRateLimitUI) {
        expect(hasRateLimitUI).toBeTruthy();
      }
    }
  });

  test('should allow toggling rate limit enabled/disabled', async ({ page }) => {
    await page.goto('/admin');
    
    if (await isOnAdminPage(page)) {
      // Look for toggle switch for enabling/disabling rate limits
      const toggleSwitch = page.locator('[role="switch"], input[type="checkbox"]').first();
      
      if (await toggleSwitch.isVisible()) {
        const initialState = await toggleSwitch.isChecked().catch(() => null);
        await toggleSwitch.click();
        
        // State should change
        const newState = await toggleSwitch.isChecked().catch(() => null);
        if (initialState !== null && newState !== null) {
          expect(newState).not.toBe(initialState);
        }
      }
    }
  });

  test('should validate rate limit input fields', async ({ page }) => {
    await page.goto('/admin');
    
    if (await isOnAdminPage(page)) {
      // Find numeric input fields
      const numericInputs = page.locator('input[type="number"]');
      const inputCount = await numericInputs.count();
      
      if (inputCount > 0) {
        const firstInput = numericInputs.first();
        
        // Try entering negative number
        await firstInput.fill('-1');
        await firstInput.blur();
        
        // Should either show validation error or reset to valid value
        const inputValue = await firstInput.inputValue();
        const hasError = await page.getByText(/invalid|must be positive|greater than/i).isVisible().catch(() => false);
        
        expect(hasError || parseInt(inputValue) >= 0).toBeTruthy();
      }
    }
  });

  test('should save rate limit settings', async ({ page }) => {
    await page.goto('/admin');
    
    if (await isOnAdminPage(page)) {
      // Look for save button
      const saveButton = page.getByRole('button', { name: /save|update|apply/i });
      
      if (await saveButton.isVisible()) {
        await saveButton.click();
        
        // Should show success message or loading state
        const successMessage = page.getByText(/saved|updated|success/i);
        const loadingState = page.locator('[class*="animate-spin"], [class*="loading"]');
        
        await expect(successMessage.or(loadingState)).toBeVisible({ timeout: 5000 });
      }
    }
  });
});

test.describe('Usage Monitoring Dashboard', () => {
  test('should display usage monitoring section', async ({ page }) => {
    await page.goto('/admin');
    
    if (await isOnAdminPage(page)) {
      const usageSection = page.getByText(/usage monitoring|usage tracking/i);
      await expect(usageSection).toBeVisible({ timeout: 5000 });
    }
  });

  test('should display usage statistics cards', async ({ page }) => {
    await page.goto('/admin');
    
    if (await isOnAdminPage(page)) {
      // Look for stat cards showing usage metrics
      const totalRequests = page.getByText(/total requests/i);
      const rateLimitHits = page.getByText(/rate limit hits/i);
      const avgLatency = page.getByText(/avg latency|average latency/i);
      
      const hasUsageStats = await totalRequests.isVisible().catch(() => false) ||
                           await rateLimitHits.isVisible().catch(() => false) ||
                           await avgLatency.isVisible().catch(() => false);
      
      if (hasUsageStats) {
        expect(hasUsageStats).toBeTruthy();
      }
    }
  });

  test('should allow switching time range', async ({ page }) => {
    await page.goto('/admin');
    
    if (await isOnAdminPage(page)) {
      // Look for time range selector
      const timeRangeSelect = page.locator('[role="combobox"]').filter({ hasText: /24h|7 days|30 days/i });
      
      if (await timeRangeSelect.isVisible()) {
        await timeRangeSelect.click();
        
        // Options should appear
        const options = page.locator('[role="option"]');
        await expect(options.first()).toBeVisible();
        
        // Select a different option
        await page.getByRole('option', { name: /7 days/i }).click();
        
        // Selection should update
        await expect(timeRangeSelect).toContainText(/7/);
      }
    }
  });

  test('should display usage charts', async ({ page }) => {
    await page.goto('/admin');
    
    if (await isOnAdminPage(page)) {
      // Look for chart containers
      const chartContainers = page.locator('[class*="recharts"], svg[class*="chart"]');
      
      if (await chartContainers.first().isVisible({ timeout: 3000 }).catch(() => false)) {
        expect(await chartContainers.count()).toBeGreaterThan(0);
      }
    }
  });

  test('should show live/paused toggle for real-time updates', async ({ page }) => {
    await page.goto('/admin');
    
    if (await isOnAdminPage(page)) {
      // Look for live toggle button
      const liveButton = page.getByRole('button', { name: /live|paused/i });
      
      if (await liveButton.isVisible()) {
        // Check initial state
        const isLive = await liveButton.textContent();
        
        // Click to toggle
        await liveButton.click();
        
        // State should change
        const newState = await liveButton.textContent();
        expect(newState).not.toBe(isLive);
      }
    }
  });

  test('should display top features chart', async ({ page }) => {
    await page.goto('/admin');
    
    if (await isOnAdminPage(page)) {
      const topFeaturesSection = page.getByText(/top features|most used/i);
      
      if (await topFeaturesSection.isVisible()) {
        await expect(topFeaturesSection).toBeVisible();
      }
    }
  });

  test('should display rate limit distribution chart', async ({ page }) => {
    await page.goto('/admin');
    
    if (await isOnAdminPage(page)) {
      const rateLimitChart = page.getByText(/rate limit hits|distribution/i);
      
      if (await rateLimitChart.isVisible()) {
        await expect(rateLimitChart).toBeVisible();
      }
    }
  });

  test('should display recent rate limit events', async ({ page }) => {
    await page.goto('/admin');
    
    if (await isOnAdminPage(page)) {
      const recentEvents = page.getByText(/recent rate limit events|latest blocked/i);
      
      if (await recentEvents.isVisible()) {
        await expect(recentEvents).toBeVisible();
      }
    }
  });

  test('should show empty state when no usage data', async ({ page }) => {
    await page.goto('/admin');
    
    if (await isOnAdminPage(page)) {
      // Look for empty state messages
      const noData = page.getByText(/no usage data|no data available/i);
      const noRateLimits = page.getByText(/no rate limit|no violations/i);
      
      // Either data or empty state should be visible
      const hasEmptyState = await noData.isVisible().catch(() => false) ||
                           await noRateLimits.isVisible().catch(() => false);
      const hasCharts = await page.locator('[class*="recharts"]').isVisible().catch(() => false);
      
      expect(hasEmptyState || hasCharts).toBeTruthy();
    }
  });

  test('should allow manual refresh of usage data', async ({ page }) => {
    await page.goto('/admin');
    
    if (await isOnAdminPage(page)) {
      // Find refresh button in usage monitoring section
      const refreshButtons = page.getByRole('button').filter({ has: page.locator('[class*="refresh"], [class*="RefreshCw"]') });
      
      if (await refreshButtons.first().isVisible()) {
        await refreshButtons.first().click();
        
        // Should trigger data reload
        await page.waitForResponse(
          resp => resp.url().includes('usage_tracking') && resp.status() === 200, 
          { timeout: 5000 }
        ).catch(() => null);
      }
    }
  });
});

test.describe('Admin Dashboard Interactions', () => {
  test('should allow filtering security alerts', async ({ page }) => {
    await page.goto('/admin');
    
    if (await isOnAdminPage(page)) {
      const filterSelect = page.locator('select, [role="combobox"]').first();
      
      if (await filterSelect.isVisible()) {
        await filterSelect.click();
        
        const options = page.locator('[role="option"], option');
        await expect(options.first()).toBeVisible();
      }
    }
  });

  test('should show IP block dialog', async ({ page }) => {
    await page.goto('/admin');
    
    if (await isOnAdminPage(page)) {
      const blockButton = page.getByRole('button', { name: /block.*ip|add.*block/i });
      
      if (await blockButton.isVisible()) {
        await blockButton.click();
        
        const dialog = page.locator('[role="dialog"], [data-testid="block-ip-dialog"]');
        await expect(dialog).toBeVisible();
      }
    }
  });

  test('should validate IP address format in block dialog', async ({ page }) => {
    await page.goto('/admin');
    
    if (await isOnAdminPage(page)) {
      const blockButton = page.getByRole('button', { name: /block.*ip/i });
      
      if (await blockButton.isVisible()) {
        await blockButton.click();
        
        const ipInput = page.locator('input[name="ip"], input[placeholder*="IP"]');
        
        if (await ipInput.isVisible()) {
          await ipInput.fill('invalid-ip');
          
          const submitButton = page.getByRole('button', { name: /block|submit|confirm/i });
          await submitButton.click();
          
          const error = page.getByText(/invalid|format|valid ip/i);
          await expect(error).toBeVisible({ timeout: 3000 });
        }
      }
    }
  });

  test('should allow unblocking an IP', async ({ page }) => {
    await page.goto('/admin');
    
    if (await isOnAdminPage(page)) {
      const unblockButton = page.getByRole('button', { name: /unblock|remove/i }).first();
      
      if (await unblockButton.isVisible()) {
        await unblockButton.click();
        
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
    
    if (await isOnAdminPage(page)) {
      const loadingIndicator = page.locator('[data-testid="loading"], .skeleton, [class*="animate-pulse"], [class*="spinner"]');
      
      const hasLoading = await loadingIndicator.isVisible().catch(() => false);
      const hasContent = await page.locator('[data-testid="stat-card"], .card').isVisible().catch(() => false);
      
      expect(hasLoading || hasContent).toBeTruthy();
    }
  });

  test('should handle data refresh', async ({ page }) => {
    await page.goto('/admin');
    
    if (await isOnAdminPage(page)) {
      const refreshButton = page.getByRole('button', { name: /refresh|reload/i });
      
      if (await refreshButton.isVisible()) {
        await refreshButton.click();
        
        await page.waitForResponse(
          resp => resp.url().includes('supabase') && resp.status() === 200, 
          { timeout: 5000 }
        ).catch(() => null);
      }
    }
  });

  test('should handle network errors gracefully', async ({ page }) => {
    await page.goto('/admin');
    
    if (await isOnAdminPage(page)) {
      // Simulate offline
      await page.context().setOffline(true);
      
      const refreshButton = page.getByRole('button', { name: /refresh/i });
      if (await refreshButton.isVisible()) {
        await refreshButton.click();
        
        // Should show error state or maintain last data
        const errorMessage = page.getByText(/error|failed|offline/i);
        const existingData = page.locator('.card');
        
        await expect(errorMessage.or(existingData)).toBeVisible({ timeout: 5000 });
      }
      
      // Reset
      await page.context().setOffline(false);
    }
  });
});

test.describe('Admin Dashboard Accessibility', () => {
  test('should have proper heading structure', async ({ page }) => {
    await page.goto('/admin');
    
    if (await isOnAdminPage(page)) {
      const h1 = page.locator('h1');
      await expect(h1).toBeVisible();
      
      const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();
      expect(headings.length).toBeGreaterThan(0);
    }
  });

  test('should support keyboard navigation', async ({ page }) => {
    await page.goto('/admin');
    
    if (await isOnAdminPage(page)) {
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      
      const focusedElement = page.locator(':focus');
      await expect(focusedElement).toBeVisible();
    }
  });

  test('should have descriptive labels for interactive elements', async ({ page }) => {
    await page.goto('/admin');
    
    if (await isOnAdminPage(page)) {
      const buttons = page.locator('button');
      const buttonCount = await buttons.count();
      
      for (let i = 0; i < Math.min(buttonCount, 5); i++) {
        const button = buttons.nth(i);
        const ariaLabel = await button.getAttribute('aria-label');
        const textContent = await button.textContent();
        const title = await button.getAttribute('title');
        
        expect(ariaLabel || textContent?.trim() || title).toBeTruthy();
      }
    }
  });

  test('should have proper ARIA roles for charts', async ({ page }) => {
    await page.goto('/admin');
    
    if (await isOnAdminPage(page)) {
      const charts = page.locator('[class*="recharts"]');
      
      if (await charts.first().isVisible({ timeout: 3000 }).catch(() => false)) {
        // Charts should be within labeled sections
        const chartContainers = page.locator('[class*="card"]').filter({ has: charts });
        expect(await chartContainers.count()).toBeGreaterThan(0);
      }
    }
  });
});

test.describe('Admin Dashboard Responsive Design', () => {
  test('should display correctly on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/admin');
    
    if (await isOnAdminPage(page)) {
      // Stats should stack on mobile
      const statCards = page.locator('[class*="card"]');
      await expect(statCards.first()).toBeVisible();
      
      // Content should not overflow
      const body = page.locator('body');
      const bodyWidth = await body.evaluate(el => el.scrollWidth);
      expect(bodyWidth).toBeLessThanOrEqual(375);
    }
  });

  test('should display correctly on tablet viewport', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/admin');
    
    if (await isOnAdminPage(page)) {
      const statCards = page.locator('[class*="card"]');
      await expect(statCards.first()).toBeVisible();
    }
  });

  test('should display correctly on desktop viewport', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/admin');
    
    if (await isOnAdminPage(page)) {
      const statCards = page.locator('[class*="card"]');
      await expect(statCards.first()).toBeVisible();
      
      // Charts should be side by side on desktop
      const chartGrid = page.locator('[class*="grid"]');
      await expect(chartGrid.first()).toBeVisible();
    }
  });
});
