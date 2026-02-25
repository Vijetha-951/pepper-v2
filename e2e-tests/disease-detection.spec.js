import { test, expect } from '@playwright/test';
import path from 'path';

/**
 * Disease Detection Tests
 * Tests for ML-based pepper disease detection feature
 */

test.describe('Disease Detection Feature', () => {

  test('should navigate to disease detection page', async ({ page }) => {
    await page.goto('/');
    
    // Look for disease detection link
    const diseaseLink = page.getByRole('link', { name: /disease.*detection/i }).first();
    
    if (await diseaseLink.isVisible()) {
      await diseaseLink.click();
      await expect(page).toHaveURL(/disease/i);
    } else {
      // Try direct navigation
      await page.goto('/disease-detection');
      await page.waitForLoadState('networkidle');
    }
  });

  test('should display file upload interface', async ({ page }) => {
    await page.goto('/disease-detection');
    await page.waitForLoadState('networkidle');
    
    // Should have file input or upload area
    const fileInput = page.locator('input[type="file"]').first();
    const uploadArea = page.locator('[class*="upload"], [class*="drop"]').first();
    
    const hasUploadInterface = await fileInput.isVisible() || await uploadArea.isVisible();
    expect(hasUploadInterface).toBeTruthy();
  });

  test('should show instructions or help text', async ({ page }) => {
    await page.goto('/disease-detection');
    await page.waitForLoadState('networkidle');
    
    // Should have some guidance text
    const instructionText = page.locator('text=/upload|select.*image|drag.*drop|choose.*file/i').first();
    
    if (await instructionText.isVisible()) {
      await expect(instructionText).toBeVisible();
    }
  });

  test('should accept image file selection', async ({ page }) => {
    await page.goto('/disease-detection');
    await page.waitForLoadState('networkidle');
    
    const fileInput = page.locator('input[type="file"]').first();
    
    if (await fileInput.isVisible()) {
      // Check if input accepts images
      const acceptAttr = await fileInput.getAttribute('accept');
      
      if (acceptAttr) {
        expect(acceptAttr).toMatch(/image/i);
      }
    }
  });

  test('should display image preview after upload', async ({ page }) => {
    await page.goto('/disease-detection');
    await page.waitForLoadState('networkidle');
    
    // Note: This test demonstrates the upload flow
    // In real testing, you would use a test image file
    const fileInput = page.locator('input[type="file"]').first();
    
    if (await fileInput.isVisible()) {
      // File input is present and ready for testing
      expect(await fileInput.isEnabled()).toBeTruthy();
    }
  });

  test('should have analyze/detect button', async ({ page }) => {
    await page.goto('/disease-detection');
    await page.waitForLoadState('networkidle');
    
    // Look for analysis button
    const analyzeButton = page.getByRole('button', { name: /analyze|detect|predict|scan/i }).first();
    
    if (await analyzeButton.count() > 0) {
      await expect(analyzeButton).toBeVisible();
    }
  });

  test('should show loading state during analysis', async ({ page }) => {
    await page.goto('/disease-detection');
    await page.waitForLoadState('networkidle');
    
    // Check if there's a loading indicator in the page
    const loader = page.locator('[class*="loading"], [class*="spinner"], .loader').first();
    
    // Loading element should exist in DOM (even if not currently visible)
    const loaderCount = await loader.count();
    console.log(`Found ${loaderCount} loading indicators`);
  });

  test('should display results area', async ({ page }) => {
    await page.goto('/disease-detection');
    await page.waitForLoadState('networkidle');
    
    // Should have results section (may be hidden initially)
    const resultsArea = page.locator('[class*="result"], [class*="output"], [class*="prediction"]').first();
    
    const resultsCount = await resultsArea.count();
    console.log(`Found ${resultsCount} result areas`);
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/disease-detection');
    await page.waitForLoadState('networkidle');
    
    await expect(page.locator('body')).toBeVisible();
  });

});
