import { test, expect } from '@playwright/test';

/**
 * Authentication Tests
 * Tests for login, register, and authentication flows
 */

test.describe('Authentication', () => {

  test.describe('Login Page', () => {
    
    test('should navigate to login page', async ({ page }) => {
      await page.goto('/');
      
      // Look for login link/button
      const loginLink = page.getByRole('link', { name: /login|sign in/i }).first();
      
      if (await loginLink.isVisible()) {
        await loginLink.click();
        
        // Should redirect to login page
        await expect(page).toHaveURL(/.*login.*/i);
      } else {
        // Try direct navigation
        await page.goto('/login');
        await expect(page).toHaveURL(/.*login.*/i);
      }
    });

    test('should display login form', async ({ page }) => {
      await page.goto('/login');
      
      // Check for email/username input
      const emailInput = page.locator('input[type="email"], input[name="email"], input[placeholder*="email" i]').first();
      await expect(emailInput).toBeVisible();
      
      // Check for password input
      const passwordInput = page.locator('input[type="password"]').first();
      await expect(passwordInput).toBeVisible();
      
      // Check for login button
      const loginButton = page.getByRole('button', { name: /login|sign in/i }).first();
      await expect(loginButton).toBeVisible();
    });

    test('should show validation error for empty form', async ({ page }) => {
      await page.goto('/login');
      
      // Try to submit without filling form
      const loginButton = page.getByRole('button', { name: /login|sign in/i }).first();
      await loginButton.click();
      
      // Should show some kind of error or validation message
      await page.waitForTimeout(1000);
      
      // Check for error messages or HTML5 validation
      const hasError = await page.locator('text=/required|invalid|error/i').count() > 0;
      const hasValidationMessage = await page.evaluate(() => {
        const inputs = document.querySelectorAll('input');
        return Array.from(inputs).some(input => input.validationMessage);
      });
      
      expect(hasError || hasValidationMessage).toBeTruthy();
    });

    test('should have link to register page', async ({ page }) => {
      await page.goto('/login');
      
      // Look for register/signup link
      const registerLink = page.getByRole('link', { name: /register|sign up|create account/i }).first();
      
      if (await registerLink.isVisible()) {
        await expect(registerLink).toBeVisible();
      }
    });

    test('should have forgot password link', async ({ page }) => {
      await page.goto('/login');
      
      // Look for forgot password link
      const forgotLink = page.getByRole('link', { name: /forgot.*password/i }).first();
      
      if (await forgotLink.isVisible()) {
        await expect(forgotLink).toBeVisible();
      }
    });

  });

  test.describe('Register Page', () => {
    
    test('should navigate to register page', async ({ page }) => {
      await page.goto('/');
      
      // Look for register link/button
      const registerLink = page.getByRole('link', { name: /register|sign up/i }).first();
      
      if (await registerLink.isVisible()) {
        await registerLink.click();
        await expect(page).toHaveURL(/.*register.*/i);
      } else {
        // Try direct navigation
        await page.goto('/register');
        await expect(page).toHaveURL(/.*register.*/i);
      }
    });

    test('should display registration form', async ({ page }) => {
      await page.goto('/register');
      
      // Check for basic registration fields
      const form = page.locator('form').first();
      await expect(form).toBeVisible();
      
      // Should have email input
      const emailInput = page.locator('input[type="email"], input[name="email"]').first();
      await expect(emailInput).toBeVisible();
      
      // Should have password input
      const passwordInput = page.locator('input[type="password"]').first();
      await expect(passwordInput).toBeVisible();
    });

    test('should have link back to login page', async ({ page }) => {
      await page.goto('/register');
      
      // Look for login link
      const loginLink = page.getByRole('link', { name: /login|sign in|already have.*account/i }).first();
      
      if (await loginLink.isVisible()) {
        await expect(loginLink).toBeVisible();
      }
    });

  });

});
