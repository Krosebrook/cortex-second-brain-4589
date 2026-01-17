import { test, expect } from '@playwright/test';

/**
 * Admin Dashboard Visual Regression Tests
 * Captures screenshots of UI components and charts for visual comparison
 */

// Helper to check if we're on admin page
const isOnAdminPage = async (page: any) => {
  return page.url().includes('/admin');
};

// Wait for charts to fully render
const waitForChartsToLoad = async (page: any) => {
  await page.waitForTimeout(1000); // Allow charts to animate
  await page.waitForLoadState('networkidle');
};

test.describe('Admin Dashboard Visual Regression', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
  });

  test('full page screenshot - desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    
    if (await isOnAdminPage(page)) {
      await waitForChartsToLoad(page);
      
      await expect(page).toHaveScreenshot('admin-dashboard-full-desktop.png', {
        fullPage: true,
        animations: 'disabled',
        maxDiffPixelRatio: 0.1,
      });
    }
  });

  test('full page screenshot - tablet', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    
    if (await isOnAdminPage(page)) {
      await waitForChartsToLoad(page);
      
      await expect(page).toHaveScreenshot('admin-dashboard-full-tablet.png', {
        fullPage: true,
        animations: 'disabled',
        maxDiffPixelRatio: 0.1,
      });
    }
  });

  test('full page screenshot - mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    if (await isOnAdminPage(page)) {
      await waitForChartsToLoad(page);
      
      await expect(page).toHaveScreenshot('admin-dashboard-full-mobile.png', {
        fullPage: true,
        animations: 'disabled',
        maxDiffPixelRatio: 0.1,
      });
    }
  });
});

test.describe('Stats Cards Visual Regression', () => {
  test('stats cards grid screenshot', async ({ page }) => {
    await page.goto('/admin');
    
    if (await isOnAdminPage(page)) {
      await page.waitForLoadState('networkidle');
      
      // Find stats grid container
      const statsGrid = page.locator('[class*="grid"]').filter({ 
        has: page.locator('[class*="card"]') 
      }).first();
      
      if (await statsGrid.isVisible()) {
        await expect(statsGrid).toHaveScreenshot('stats-cards-grid.png', {
          animations: 'disabled',
          maxDiffPixelRatio: 0.1,
        });
      }
    }
  });

  test('individual stat card screenshot', async ({ page }) => {
    await page.goto('/admin');
    
    if (await isOnAdminPage(page)) {
      await page.waitForLoadState('networkidle');
      
      const statCards = page.locator('[class*="card"]').filter({
        hasText: /Total Alerts|Critical Alerts|Blocked IPs|Activity/i
      });
      
      const cardCount = await statCards.count();
      
      for (let i = 0; i < Math.min(cardCount, 4); i++) {
        const card = statCards.nth(i);
        if (await card.isVisible()) {
          await expect(card).toHaveScreenshot(`stat-card-${i}.png`, {
            animations: 'disabled',
            maxDiffPixelRatio: 0.1,
          });
        }
      }
    }
  });
});

test.describe('Rate Limit Settings Visual Regression', () => {
  test('rate limit settings section screenshot', async ({ page }) => {
    await page.goto('/admin');
    
    if (await isOnAdminPage(page)) {
      await page.waitForLoadState('networkidle');
      
      // Find rate limit settings card
      const rateLimitCard = page.locator('[class*="card"]').filter({
        hasText: /rate limit/i
      }).first();
      
      if (await rateLimitCard.isVisible()) {
        await expect(rateLimitCard).toHaveScreenshot('rate-limit-settings.png', {
          animations: 'disabled',
          maxDiffPixelRatio: 0.1,
        });
      }
    }
  });

  test('rate limit toggle states', async ({ page }) => {
    await page.goto('/admin');
    
    if (await isOnAdminPage(page)) {
      await page.waitForLoadState('networkidle');
      
      const toggleSwitch = page.locator('[role="switch"]').first();
      
      if (await toggleSwitch.isVisible()) {
        // Screenshot enabled state
        await expect(toggleSwitch).toHaveScreenshot('rate-limit-toggle-enabled.png', {
          animations: 'disabled',
        });
        
        // Toggle and screenshot disabled state
        await toggleSwitch.click();
        await page.waitForTimeout(300);
        
        await expect(toggleSwitch).toHaveScreenshot('rate-limit-toggle-disabled.png', {
          animations: 'disabled',
        });
      }
    }
  });
});

test.describe('Usage Monitoring Dashboard Visual Regression', () => {
  test('usage monitoring section screenshot', async ({ page }) => {
    await page.goto('/admin');
    
    if (await isOnAdminPage(page)) {
      await waitForChartsToLoad(page);
      
      // Find usage monitoring section
      const usageSection = page.locator('[class*="card"]').filter({
        hasText: /usage monitoring|usage tracking/i
      });
      
      if (await usageSection.first().isVisible()) {
        // Scroll to usage section
        await usageSection.first().scrollIntoViewIfNeeded();
        await page.waitForTimeout(500);
        
        await expect(usageSection.first()).toHaveScreenshot('usage-monitoring-section.png', {
          animations: 'disabled',
          maxDiffPixelRatio: 0.15, // Charts may have slight rendering differences
        });
      }
    }
  });

  test('usage stats cards screenshot', async ({ page }) => {
    await page.goto('/admin');
    
    if (await isOnAdminPage(page)) {
      await page.waitForLoadState('networkidle');
      
      // Find usage stat cards
      const usageStatCards = page.locator('[class*="card"]').filter({
        hasText: /total requests|rate limit hits|avg latency|active features/i
      });
      
      if (await usageStatCards.first().isVisible()) {
        await expect(usageStatCards.first()).toHaveScreenshot('usage-stats-card.png', {
          animations: 'disabled',
          maxDiffPixelRatio: 0.1,
        });
      }
    }
  });

  test('time range selector screenshot', async ({ page }) => {
    await page.goto('/admin');
    
    if (await isOnAdminPage(page)) {
      await page.waitForLoadState('networkidle');
      
      // Find time range selector
      const timeRangeSelect = page.locator('[role="combobox"]').filter({
        hasText: /24h|7 days|30 days/i
      });
      
      if (await timeRangeSelect.isVisible()) {
        // Screenshot closed state
        await expect(timeRangeSelect).toHaveScreenshot('time-range-closed.png', {
          animations: 'disabled',
        });
        
        // Open and screenshot
        await timeRangeSelect.click();
        await page.waitForTimeout(300);
        
        const dropdown = page.locator('[role="listbox"]');
        if (await dropdown.isVisible()) {
          await expect(dropdown).toHaveScreenshot('time-range-open.png', {
            animations: 'disabled',
          });
        }
      }
    }
  });

  test('live toggle button states', async ({ page }) => {
    await page.goto('/admin');
    
    if (await isOnAdminPage(page)) {
      await page.waitForLoadState('networkidle');
      
      const liveButton = page.getByRole('button', { name: /live|paused/i });
      
      if (await liveButton.isVisible()) {
        // Screenshot live state
        await expect(liveButton).toHaveScreenshot('live-toggle-active.png', {
          animations: 'disabled',
        });
        
        // Toggle and screenshot paused state
        await liveButton.click();
        await page.waitForTimeout(300);
        
        await expect(liveButton).toHaveScreenshot('live-toggle-paused.png', {
          animations: 'disabled',
        });
      }
    }
  });
});

test.describe('Charts Visual Regression', () => {
  test('usage over time line chart screenshot', async ({ page }) => {
    await page.goto('/admin');
    
    if (await isOnAdminPage(page)) {
      await waitForChartsToLoad(page);
      
      const lineChartCard = page.locator('[class*="card"]').filter({
        hasText: /usage over time/i
      });
      
      if (await lineChartCard.isVisible()) {
        await lineChartCard.scrollIntoViewIfNeeded();
        await page.waitForTimeout(500);
        
        await expect(lineChartCard).toHaveScreenshot('line-chart-usage-over-time.png', {
          animations: 'disabled',
          maxDiffPixelRatio: 0.15,
        });
      }
    }
  });

  test('top features bar chart screenshot', async ({ page }) => {
    await page.goto('/admin');
    
    if (await isOnAdminPage(page)) {
      await waitForChartsToLoad(page);
      
      const barChartCard = page.locator('[class*="card"]').filter({
        hasText: /top features/i
      });
      
      if (await barChartCard.isVisible()) {
        await barChartCard.scrollIntoViewIfNeeded();
        await page.waitForTimeout(500);
        
        await expect(barChartCard).toHaveScreenshot('bar-chart-top-features.png', {
          animations: 'disabled',
          maxDiffPixelRatio: 0.15,
        });
      }
    }
  });

  test('rate limit distribution pie chart screenshot', async ({ page }) => {
    await page.goto('/admin');
    
    if (await isOnAdminPage(page)) {
      await waitForChartsToLoad(page);
      
      const pieChartCard = page.locator('[class*="card"]').filter({
        hasText: /rate limit hits|distribution/i
      });
      
      if (await pieChartCard.isVisible()) {
        await pieChartCard.scrollIntoViewIfNeeded();
        await page.waitForTimeout(500);
        
        await expect(pieChartCard).toHaveScreenshot('pie-chart-rate-limit-distribution.png', {
          animations: 'disabled',
          maxDiffPixelRatio: 0.15,
        });
      }
    }
  });

  test('empty chart state screenshot', async ({ page }) => {
    await page.goto('/admin');
    
    if (await isOnAdminPage(page)) {
      await page.waitForLoadState('networkidle');
      
      // Find empty state message
      const emptyState = page.getByText(/no usage data|no data available|no rate limit/i);
      
      if (await emptyState.first().isVisible()) {
        const emptyContainer = emptyState.first().locator('xpath=ancestor::div[contains(@class, "card")]');
        
        if (await emptyContainer.isVisible()) {
          await expect(emptyContainer).toHaveScreenshot('chart-empty-state.png', {
            animations: 'disabled',
            maxDiffPixelRatio: 0.1,
          });
        }
      }
    }
  });
});

test.describe('Security Sections Visual Regression', () => {
  test('security alerts section screenshot', async ({ page }) => {
    await page.goto('/admin');
    
    if (await isOnAdminPage(page)) {
      await page.waitForLoadState('networkidle');
      
      const alertsCard = page.locator('[class*="card"]').filter({
        hasText: /security alert|recent alert/i
      });
      
      if (await alertsCard.isVisible()) {
        await alertsCard.scrollIntoViewIfNeeded();
        
        await expect(alertsCard).toHaveScreenshot('security-alerts-section.png', {
          animations: 'disabled',
          maxDiffPixelRatio: 0.1,
        });
      }
    }
  });

  test('blocked IPs section screenshot', async ({ page }) => {
    await page.goto('/admin');
    
    if (await isOnAdminPage(page)) {
      await page.waitForLoadState('networkidle');
      
      const blockedIPsCard = page.locator('[class*="card"]').filter({
        hasText: /blocked ip/i
      });
      
      if (await blockedIPsCard.isVisible()) {
        await blockedIPsCard.scrollIntoViewIfNeeded();
        
        await expect(blockedIPsCard).toHaveScreenshot('blocked-ips-section.png', {
          animations: 'disabled',
          maxDiffPixelRatio: 0.1,
        });
      }
    }
  });

  test('threat responses section screenshot', async ({ page }) => {
    await page.goto('/admin');
    
    if (await isOnAdminPage(page)) {
      await page.waitForLoadState('networkidle');
      
      const threatCard = page.locator('[class*="card"]').filter({
        hasText: /threat response/i
      });
      
      if (await threatCard.isVisible()) {
        await threatCard.scrollIntoViewIfNeeded();
        
        await expect(threatCard).toHaveScreenshot('threat-responses-section.png', {
          animations: 'disabled',
          maxDiffPixelRatio: 0.1,
        });
      }
    }
  });

  test('user activity section screenshot', async ({ page }) => {
    await page.goto('/admin');
    
    if (await isOnAdminPage(page)) {
      await page.waitForLoadState('networkidle');
      
      const activityCard = page.locator('[class*="card"]').filter({
        hasText: /user activity|recent activity/i
      });
      
      if (await activityCard.isVisible()) {
        await activityCard.scrollIntoViewIfNeeded();
        
        await expect(activityCard).toHaveScreenshot('user-activity-section.png', {
          animations: 'disabled',
          maxDiffPixelRatio: 0.1,
        });
      }
    }
  });

  test('failed login attempts section screenshot', async ({ page }) => {
    await page.goto('/admin');
    
    if (await isOnAdminPage(page)) {
      await page.waitForLoadState('networkidle');
      
      const failedLoginsCard = page.locator('[class*="card"]').filter({
        hasText: /failed login|login attempt/i
      });
      
      if (await failedLoginsCard.isVisible()) {
        await failedLoginsCard.scrollIntoViewIfNeeded();
        
        await expect(failedLoginsCard).toHaveScreenshot('failed-logins-section.png', {
          animations: 'disabled',
          maxDiffPixelRatio: 0.1,
        });
      }
    }
  });
});

test.describe('Loading States Visual Regression', () => {
  test('loading skeleton screenshot', async ({ page }) => {
    // Slow down network to capture loading state
    await page.route('**/rest/v1/**', async route => {
      await new Promise(resolve => setTimeout(resolve, 2000));
      await route.continue();
    });
    
    await page.goto('/admin');
    
    if (await isOnAdminPage(page)) {
      const skeletons = page.locator('[class*="skeleton"], [class*="animate-pulse"]');
      
      if (await skeletons.first().isVisible({ timeout: 1000 }).catch(() => false)) {
        await expect(page).toHaveScreenshot('loading-skeletons.png', {
          animations: 'disabled',
          maxDiffPixelRatio: 0.2,
        });
      }
    }
  });
});

test.describe('Interactive States Visual Regression', () => {
  test('button hover states', async ({ page }) => {
    await page.goto('/admin');
    
    if (await isOnAdminPage(page)) {
      await page.waitForLoadState('networkidle');
      
      const refreshButton = page.getByRole('button', { name: /refresh/i }).first();
      
      if (await refreshButton.isVisible()) {
        // Screenshot normal state
        await expect(refreshButton).toHaveScreenshot('button-normal.png', {
          animations: 'disabled',
        });
        
        // Hover and screenshot
        await refreshButton.hover();
        await page.waitForTimeout(200);
        
        await expect(refreshButton).toHaveScreenshot('button-hover.png', {
          animations: 'disabled',
        });
      }
    }
  });

  test('card hover effects', async ({ page }) => {
    await page.goto('/admin');
    
    if (await isOnAdminPage(page)) {
      await page.waitForLoadState('networkidle');
      
      const card = page.locator('[class*="card"]').first();
      
      if (await card.isVisible()) {
        // Normal state
        await expect(card).toHaveScreenshot('card-normal.png', {
          animations: 'disabled',
        });
        
        // Hover state
        await card.hover();
        await page.waitForTimeout(200);
        
        await expect(card).toHaveScreenshot('card-hover.png', {
          animations: 'disabled',
        });
      }
    }
  });

  test('badge variants screenshot', async ({ page }) => {
    await page.goto('/admin');
    
    if (await isOnAdminPage(page)) {
      await page.waitForLoadState('networkidle');
      
      const badges = page.locator('[class*="badge"]');
      
      if (await badges.first().isVisible()) {
        const badgeCount = await badges.count();
        
        for (let i = 0; i < Math.min(badgeCount, 5); i++) {
          const badge = badges.nth(i);
          if (await badge.isVisible()) {
            await expect(badge).toHaveScreenshot(`badge-variant-${i}.png`, {
              animations: 'disabled',
            });
          }
        }
      }
    }
  });
});

test.describe('Dark Mode Visual Regression', () => {
  test('admin dashboard in dark mode', async ({ page }) => {
    await page.goto('/admin');
    
    if (await isOnAdminPage(page)) {
      // Set dark mode
      await page.emulateMedia({ colorScheme: 'dark' });
      await page.waitForTimeout(500);
      await waitForChartsToLoad(page);
      
      await expect(page).toHaveScreenshot('admin-dashboard-dark-mode.png', {
        fullPage: true,
        animations: 'disabled',
        maxDiffPixelRatio: 0.15,
      });
    }
  });

  test('charts in dark mode', async ({ page }) => {
    await page.goto('/admin');
    
    if (await isOnAdminPage(page)) {
      await page.emulateMedia({ colorScheme: 'dark' });
      await waitForChartsToLoad(page);
      
      const chartCard = page.locator('[class*="card"]').filter({
        has: page.locator('[class*="recharts"]')
      }).first();
      
      if (await chartCard.isVisible()) {
        await chartCard.scrollIntoViewIfNeeded();
        
        await expect(chartCard).toHaveScreenshot('chart-dark-mode.png', {
          animations: 'disabled',
          maxDiffPixelRatio: 0.15,
        });
      }
    }
  });
});
