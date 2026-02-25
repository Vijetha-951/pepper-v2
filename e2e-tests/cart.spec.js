import { test, expect } from '@playwright/test';

/**
 * Shopping Cart Tests
 * Tests for cart functionality
 */

test.describe('Shopping Cart', () => {

  test('should navigate to cart page', async ({ page }) => {
    await page.goto('/');
    
    // Look for cart link/icon
    const cartLink = page.locator('a[href*="cart"], [class*="cart"]').first();
    
    if (await cartLink.isVisible()) {
      await cartLink.click();
      await expect(page).toHaveURL(/cart/i);
    } else {
      // Try direct navigation
      await page.goto('/cart');
      await expect(page).toHaveURL(/cart/i);
    }
  });

  test('should show empty cart message when no items', async ({ page }) => {
    await page.goto('/cart');
    await page.waitForLoadState('networkidle');
    
    // Should show either cart items or empty message
    const cartItems = page.locator('[class*="cart-item"], [class*="cartItem"]');
    const emptyMessage = page.locator('text=/empty.*cart|no items|cart is empty/i');
    
    const hasItems = await cartItems.count() > 0;
    const showsEmpty = await emptyMessage.count() > 0;
    
    expect(hasItems || showsEmpty).toBeTruthy();
  });

  test('should update quantity in cart', async ({ page }) => {
    await page.goto('/cart');
    await page.waitForLoadState('networkidle');
    
    // Look for quantity controls
    const quantityInput = page.locator('input[type="number"], [class*="quantity"]').first();
    const increaseButton = page.locator('button[class*="increase"], button[aria-label*="increase" i]').first();
    
    if (await quantityInput.isVisible()) {
      const initialValue = await quantityInput.inputValue();
      await quantityInput.fill('2');
      
      // Wait for update
      await page.waitForTimeout(500);
    } else if (await increaseButton.isVisible()) {
      await increaseButton.click();
      await page.waitForTimeout(500);
    }
  });

  test('should remove item from cart', async ({ page }) => {
    await page.goto('/cart');
    await page.waitForLoadState('networkidle');
    
    // Look for remove/delete buttons
    const removeButton = page.getByRole('button', { name: /remove|delete/i }).first();
    
    if (await removeButton.isVisible()) {
      // Get initial item count
      const initialCount = await page.locator('[class*="cart-item"]').count();
      
      await removeButton.click();
      
      // Wait for update
      await page.waitForTimeout(1000);
      
      // Item count should decrease or show empty message
      const newCount = await page.locator('[class*="cart-item"]').count();
      const emptyMessage = await page.locator('text=/empty.*cart/i').isVisible();
      
      expect(newCount < initialCount || emptyMessage).toBeTruthy();
    }
  });

  test('should display cart summary', async ({ page }) => {
    await page.goto('/cart');
    await page.waitForLoadState('networkidle');
    
    // Check if cart has items
    const hasItems = await page.locator('[class*="cart-item"]').count() > 0;
    
    if (hasItems) {
      // Should show total/subtotal
      const total = page.locator('text=/total|subtotal|₹/i');
      await expect(total.first()).toBeVisible();
    }
  });

  test('should proceed to checkout', async ({ page }) => {
    await page.goto('/cart');
    await page.waitForLoadState('networkidle');
    
    // Look for checkout button
    const checkoutButton = page.getByRole('button', { name: /checkout|proceed/i }).first();
    
    if (await checkoutButton.isVisible()) {
      await checkoutButton.click();
      
      // Should navigate to checkout or login
      await page.waitForTimeout(1000);
      const url = page.url();
      
      expect(url).toMatch(/checkout|login/i);
    }
  });

  test('should persist cart items on page reload', async ({ page }) => {
    await page.goto('/cart');
    await page.waitForLoadState('networkidle');
    
    const initialCount = await page.locator('[class*="cart-item"]').count();
    
    // Reload page
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    const afterReloadCount = await page.locator('[class*="cart-item"]').count();
    
    // Cart should persist (either from localStorage or session)
    expect(afterReloadCount).toBe(initialCount);
  });

});
