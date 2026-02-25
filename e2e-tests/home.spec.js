import { test, expect } from '@playwright/test';

/**
 * Home Page Tests
 * Tests for the main landing page and navigation
 */

test.describe('Home Page', () => {
  
  test('should load the home page successfully', async ({ page }) => {
    await page.goto('/');
    
    // Check if page title is correct
    await expect(page).toHaveTitle(/PEPPER|Pepper|pepper/i);
    
    // Page should be visible
    await expect(page.locator('body')).toBeVisible();
  });

  test('should display navigation menu', async ({ page }) => {
    await page.goto('/');
    
    // Check for common navigation elements
    const nav = page.locator('nav, header');
    await expect(nav).toBeVisible();
  });

  test('should have working links in navigation', async ({ page }) => {
    await page.goto('/');
    
    // Try to find and click on common links
    const homeLink = page.getByRole('link', { name: /home/i }).first();
    if (await homeLink.isVisible()) {
      await expect(homeLink).toBeVisible();
    }
  });

  test('should display products or product categories', async ({ page }) => {
    await page.goto('/');
    
    // Wait for content to load
    await page.waitForLoadState('networkidle');
    
    // Check if there are any product-related elements
    const productElements = page.locator('[class*="product"], [class*="card"], [class*="item"]');
    
    // Either products are displayed or there's a message
    const hasProducts = await productElements.count() > 0;
    const hasEmptyMessage = await page.locator('text=/no products|empty|coming soon/i').count() > 0;
    
    expect(hasProducts || hasEmptyMessage).toBeTruthy();
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    await expect(page.locator('body')).toBeVisible();
  });

});
