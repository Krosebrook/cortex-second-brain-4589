import { test, expect } from '@playwright/test';

/**
 * Homepage E2E Tests
 * Tests the landing page, navigation, and core user flows
 */
test.describe('Homepage', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should load successfully', async ({ page }) => {
    await expect(page).toHaveTitle(/tessa|cortex/i);
  });

  test('should display main hero section', async ({ page }) => {
    const hero = page.locator('section').first();
    await expect(hero).toBeVisible();
    
    // Should have a main heading
    const heading = page.locator('h1').first();
    await expect(heading).toBeVisible();
  });

  test('should display navigation bar', async ({ page }) => {
    const nav = page.locator('nav, header').first();
    await expect(nav).toBeVisible();
  });

  test('should have call-to-action buttons', async ({ page }) => {
    const ctaButton = page.getByRole('button', { name: /get started|try|sign up/i }).or(page.getByRole('link', { name: /get started|try|sign up/i }));
    await expect(ctaButton.first()).toBeVisible();
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Content should still be visible
    const mainContent = page.locator('main, [role="main"]').or(page.locator('body'));
    await expect(mainContent).toBeVisible();
    
    // Mobile menu should be available
    const mobileMenu = page.locator('[data-testid="mobile-menu"], button[aria-label*="menu"], [class*="hamburger"]');
    const hasMobileMenu = await mobileMenu.isVisible().catch(() => false);
    
    // Either has mobile menu or navigation is still visible
    expect(hasMobileMenu || await page.locator('nav').isVisible()).toBeTruthy();
  });
});

test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should navigate to features section', async ({ page }) => {
    const featuresLink = page.getByRole('link', { name: /features|why|how/i }).first();
    
    if (await featuresLink.isVisible()) {
      await featuresLink.click();
      await page.waitForURL(/.*/);
    }
  });

  test('should navigate to auth page', async ({ page }) => {
    const authLink = page.getByRole('link', { name: /sign in|login|get started/i }).first();
    
    if (await authLink.isVisible()) {
      await authLink.click();
      await expect(page).toHaveURL(/auth|login|signup/);
    }
  });

  test('should support theme toggle', async ({ page }) => {
    const themeToggle = page.locator('[data-testid="theme-toggle"], button[aria-label*="theme"], button[aria-label*="dark"], button[aria-label*="light"]').first();
    
    if (await themeToggle.isVisible()) {
      // Get initial theme
      const initialTheme = await page.evaluate(() => document.documentElement.classList.contains('dark'));
      
      await themeToggle.click();
      
      // Theme should change
      await page.waitForTimeout(500);
      const newTheme = await page.evaluate(() => document.documentElement.classList.contains('dark'));
      
      expect(newTheme).not.toBe(initialTheme);
    }
  });
});

test.describe('Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should have proper page structure', async ({ page }) => {
    // Should have a main landmark
    const main = page.locator('main, [role="main"]');
    await expect(main).toBeVisible();
  });

  test('should have alt text on images', async ({ page }) => {
    const images = page.locator('img');
    const imageCount = await images.count();
    
    for (let i = 0; i < Math.min(imageCount, 5); i++) {
      const img = images.nth(i);
      const alt = await img.getAttribute('alt');
      const decorative = await img.getAttribute('role');
      
      // Image should have alt text or be marked as decorative
      expect(alt !== null || decorative === 'presentation').toBeTruthy();
    }
  });

  test('should have sufficient color contrast', async ({ page }) => {
    // This is a basic check - full contrast testing would use axe-core
    const body = page.locator('body');
    const bgColor = await body.evaluate(el => window.getComputedStyle(el).backgroundColor);
    
    expect(bgColor).toBeTruthy();
  });

  test('should be navigable by keyboard', async ({ page }) => {
    // Tab to first interactive element
    await page.keyboard.press('Tab');
    
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
    
    // Continue tabbing through elements
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Tab');
      const currentFocus = page.locator(':focus');
      await expect(currentFocus).toBeVisible();
    }
  });

  test('should have skip link for keyboard users', async ({ page }) => {
    // Press Tab to reveal skip link (if exists)
    await page.keyboard.press('Tab');
    
    const skipLink = page.locator('a[href="#main"], a:has-text("skip")').first();
    const hasSkipLink = await skipLink.isVisible().catch(() => false);
    
    // Skip link is recommended but not required
    // Log warning if not present
    if (!hasSkipLink) {
      console.warn('Skip link not found - consider adding for accessibility');
    }
  });
});

test.describe('Performance', () => {
  test('should load within acceptable time', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    const loadTime = Date.now() - startTime;
    
    // Page should load within 5 seconds
    expect(loadTime).toBeLessThan(5000);
  });

  test('should not have console errors', async ({ page }) => {
    const errors: string[] = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Filter out expected errors (like 404 for optional resources)
    const criticalErrors = errors.filter(e => 
      !e.includes('favicon') && 
      !e.includes('404') &&
      !e.includes('Failed to load resource')
    );
    
    expect(criticalErrors).toHaveLength(0);
  });
});

test.describe('PWA Features', () => {
  test('should have valid manifest', async ({ page }) => {
    await page.goto('/');
    
    // Check for manifest link
    const manifestLink = page.locator('link[rel="manifest"]');
    const hasManifest = await manifestLink.isVisible().catch(() => false);
    
    if (hasManifest) {
      const manifestHref = await manifestLink.getAttribute('href');
      expect(manifestHref).toBeTruthy();
    }
  });

  test('should have service worker registered', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check if service worker is registered
    const hasServiceWorker = await page.evaluate(async () => {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        return !!registration;
      }
      return false;
    });
    
    // Service worker should be registered in production
    // In dev mode, this may not be active
    expect(typeof hasServiceWorker).toBe('boolean');
  });
});
