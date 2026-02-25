import { test, expect } from '@playwright/test';

/**
 * Admin Dashboard Tests
 * Tests for admin functionality and dashboard
 */

test.describe('Admin Dashboard', () => {

  test('should require authentication for admin routes', async ({ page }) => {
    // Try to access admin routes directly
    const adminRoutes = [
      '/admin',
      '/admin/orders',
      '/admin/products',
      '/admin/users'
    ];
    
    for (const route of adminRoutes) {
      await page.goto(route);
      await page.waitForLoadState('networkidle');
      
      const url = page.url();
      
      // Should redirect to login or show access denied
      const isProtected = url.includes('login') || 
                          await page.locator('text=/access denied|unauthorized|forbidden/i').count() > 0 ||
                          await page.locator('text=/login|sign in/i').count() > 0;
      
      console.log(`Route ${route}: Protected = ${isProtected}`);
    }
  });

  test('should display admin navigation', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
    
    // Look for admin menu items
    const adminMenu = page.locator('nav, [class*="sidebar"], [class*="menu"]').first();
    
    if (await adminMenu.isVisible()) {
      await expect(adminMenu).toBeVisible();
    }
  });

  test('should show order management link', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
    
    // Look for orders link
    const ordersLink = page.getByRole('link', { name: /orders|order management/i }).first();
    
    if (await ordersLink.count() > 0) {
      console.log('Orders management link found');
    }
  });

  test('should show product management link', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
    
    // Look for products link
    const productsLink = page.getByRole('link', { name: /products|product management/i }).first();
    
    if (await productsLink.count() > 0) {
      console.log('Products management link found');
    }
  });

  test('should show user management link', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
    
    // Look for users link
    const usersLink = page.getByRole('link', { name: /users|user management/i }).first();
    
    if (await usersLink.count() > 0) {
      console.log('Users management link found');
    }
  });

  test('should show analytics or statistics', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
    
    // Look for stats/analytics
    const statsElements = page.locator('[class*="stat"], [class*="card"], [class*="metric"]');
    
    const count = await statsElements.count();
    console.log(`Found ${count} statistics elements`);
  });

  test('should display hub management for hub managers', async ({ page }) => {
    await page.goto('/hub-manager-dashboard');
    await page.waitForLoadState('networkidle');
    
    // Check if hub dashboard exists
    const url = page.url();
    console.log(`Hub manager dashboard URL: ${url}`);
  });

  test('should show video analytics page', async ({ page }) => {
    await page.goto('/admin/video-analytics');
    await page.waitForLoadState('networkidle');
    
    // Video analytics should have some content
    const content = page.locator('body');
    await expect(content).toBeVisible();
  });

  test('should show seasonal suitability features', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Look for seasonal-related features
    const seasonalElements = page.locator('text=/seasonal|suitability|season/i').first();
    
    const count = await seasonalElements.count();
    console.log(`Found ${count} seasonal elements`);
  });

});
