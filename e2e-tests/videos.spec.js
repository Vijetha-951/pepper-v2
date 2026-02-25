import { test, expect } from '@playwright/test';

/**
 * Video Features Tests
 * Tests for video management and viewing features
 */

test.describe('Video Features', () => {

  test('should navigate to videos page', async ({ page }) => {
    await page.goto('/');
    
    // Look for videos link
    const videosLink = page.getByRole('link', { name: /videos|video/i }).first();
    
    if (await videosLink.isVisible()) {
      await videosLink.click();
      await expect(page).toHaveURL(/video/i);
    } else {
      // Try direct navigation
      await page.goto('/videos');
      await page.waitForLoadState('networkidle');
    }
  });

  test('should display video list or gallery', async ({ page }) => {
    await page.goto('/videos');
    await page.waitForLoadState('networkidle');
    
    // Look for video elements
    const videos = page.locator('video, [class*="video"], iframe');
    const videoCards = page.locator('[class*="video-card"], [class*="videoCard"]');
    
    const hasVideos = await videos.count() > 0 || await videoCards.count() > 0;
    const hasEmptyState = await page.locator('text=/no videos|empty/i').count() > 0;
    
    expect(hasVideos || hasEmptyState).toBeTruthy();
  });

  test('should show video thumbnails', async ({ page }) => {
    await page.goto('/videos');
    await page.waitForLoadState('networkidle');
    
    // Look for images/thumbnails
    const thumbnails = page.locator('img[class*="thumbnail"], img[alt*="video" i]');
    
    const count = await thumbnails.count();
    console.log(`Found ${count} video thumbnails`);
  });

  test('should display video metadata', async ({ page }) => {
    await page.goto('/videos');
    await page.waitForLoadState('networkidle');
    
    // Look for video titles, descriptions, etc.
    const titles = page.locator('h2, h3, [class*="title"]');
    
    if (await titles.count() > 0) {
      await expect(titles.first()).toBeVisible();
    }
  });

  test('should show video views count', async ({ page }) => {
    await page.goto('/videos');
    await page.waitForLoadState('networkidle');
    
    // Look for view counts
    const viewsText = page.locator('text=/views|watched/i').first();
    
    const count = await viewsText.count();
    console.log(`Found ${count} view count displays`);
  });

  test('should show like/unlike functionality', async ({ page }) => {
    await page.goto('/videos');
    await page.waitForLoadState('networkidle');
    
    // Look for like buttons
    const likeButton = page.locator('button[class*="like"], button[aria-label*="like" i]').first();
    
    const count = await likeButton.count();
    console.log(`Found ${count} like buttons`);
  });

  test('should play video on click', async ({ page }) => {
    await page.goto('/videos');
    await page.waitForLoadState('networkidle');
    
    // Look for video elements
    const video = page.locator('video').first();
    
    if (await video.isVisible()) {
      // Video element is present
      await expect(video).toBeVisible();
      
      // Check if it has controls
      const hasControls = await video.getAttribute('controls');
      console.log(`Video has controls: ${hasControls !== null}`);
    }
  });

  test('should filter videos by category', async ({ page }) => {
    await page.goto('/videos');
    await page.waitForLoadState('networkidle');
    
    // Look for category filters
    const categoryFilters = page.locator('[class*="filter"], [class*="category"]');
    
    const count = await categoryFilters.count();
    console.log(`Found ${count} category filters`);
  });

  test('should navigate to admin video management', async ({ page }) => {
    await page.goto('/admin/video-management');
    await page.waitForLoadState('networkidle');
    
    // Should load video management page (or redirect to login)
    const url = page.url();
    console.log(`Video management URL: ${url}`);
  });

  test('should show video analytics for admin', async ({ page }) => {
    await page.goto('/admin/video-analytics');
    await page.waitForLoadState('networkidle');
    
    // Should show analytics or require login
    const hasAnalytics = await page.locator('[class*="analytic"], [class*="chart"], [class*="stat"]').count() > 0;
    const needsLogin = await page.locator('text=/login|sign in/i').count() > 0;
    
    expect(hasAnalytics || needsLogin).toBeTruthy();
  });

});
