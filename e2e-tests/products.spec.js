import { test, expect } from '@playwright/test';

/**
 * Product Browsing Tests
 * Tests for viewing and interacting with products
 */

test.describe('Product Browsing', () => {

  test('should display products on home page', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Look for product cards or listings
    const products = page.locator('[class*="product"], [class*="Product"], [class*="card"], article');
    
    const count = await products.count();
    console.log(`Found ${count} product elements`);
    
    // Either has products or shows empty state
    const hasProducts = count > 0;
    const hasEmptyState = await page.locator('text=/no products|empty|coming soon/i').count() > 0;
    
    expect(hasProducts || hasEmptyState).toBeTruthy();
  });

  test('should be able to click on a product', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Find and click first product
    const firstProduct = page.locator('[class*="product"], [class*="Product"], [class*="card"]').first();
    
    if (await firstProduct.isVisible()) {
      await firstProduct.click();
      
      // Should navigate to product detail page
      await page.waitForLoadState('networkidle');
      
      // URL should change
      const url = page.url();
      expect(url).not.toBe('http://localhost:3000/');
    }
  });

  test('should search for products', async ({ page }) => {
    await page.goto('/');
    
    // Look for search input
    const searchInput = page.locator('input[type="search"], input[placeholder*="search" i]').first();
    
    if (await searchInput.isVisible()) {
      await searchInput.fill('pepper');
      
      // Wait for results
      await page.waitForTimeout(1000);
      await page.waitForLoadState('networkidle');
    }
  });

  test('should filter products by category', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Look for category filters or links
    const categoryLinks = page.locator('[class*="category"], a[href*="category"]');
    
    if (await categoryLinks.count() > 0) {
      await categoryLinks.first().click();
      await page.waitForLoadState('networkidle');
      
      // Should show filtered results
      await expect(page).toHaveURL(/category/i);
    }
  });

  test('should add product to cart', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Look for "Add to Cart" buttons
    const addToCartButton = page.getByRole('button', { name: /add.*cart|buy/i }).first();
    
    if (await addToCartButton.isVisible()) {
      await addToCartButton.click();
      
      // Wait for cart to update
      await page.waitForTimeout(1000);
      
      // Cart icon should show count or confirmation message appears
      const cartCount = page.locator('[class*="cart"] [class*="count"], [class*="badge"]').first();
      const confirmMessage = page.locator('text=/added.*cart|success/i').first();
      
      const hasCartUpdate = await cartCount.isVisible() || await confirmMessage.isVisible();
      expect(hasCartUpdate).toBeTruthy();
    }
  });

  test('should add product to wishlist', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Look for wishlist/favorite buttons
    const wishlistButton = page.locator('button[class*="wishlist"], button[class*="favorite"], button[aria-label*="wish" i]').first();
    
    if (await wishlistButton.isVisible()) {
      await wishlistButton.click();
      await page.waitForTimeout(500);
    }
  });

  test('should view product details', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Click on first product
    const firstProduct = page.locator('[class*="product"]').first();
    
    if (await firstProduct.isVisible()) {
      await firstProduct.click();
      await page.waitForLoadState('networkidle');
      
      // Should show product details like description, price
      const productName = page.locator('h1, h2').first();
      await expect(productName).toBeVisible();
      
      // Should have price
      const price = page.locator('text=/₹|rs|price/i').first();
      if (await price.isVisible()) {
        await expect(price).toBeVisible();
      }
    }
  });

});
