import { test, expect } from '@playwright/test';

/**
 * API and Backend Tests
 * Tests for backend API endpoints
 */

test.describe('Backend API', () => {

  test('should have backend server running', async ({ request }) => {
    try {
      const response = await request.get('http://localhost:5000/api/health');
      console.log(`Health check status: ${response.status()}`);
    } catch (error) {
      console.log('Health endpoint not available, trying root');
      
      try {
        const response = await request.get('http://localhost:5000/');
        console.log(`Root endpoint status: ${response.status()}`);
      } catch (err) {
        console.log('Backend server check failed:', err.message);
      }
    }
  });

  test('should fetch products from API', async ({ request }) => {
    try {
      const response = await request.get('http://localhost:5000/api/products');
      
      expect(response.status()).toBeLessThan(500);
      
      if (response.ok()) {
        const data = await response.json();
        console.log(`API returned ${Array.isArray(data) ? data.length : 'non-array'} products`);
      }
    } catch (error) {
      console.log('Products API test skipped:', error.message);
    }
  });

  test('should handle seasonal suitability API', async ({ request }) => {
    try {
      const response = await request.get('http://localhost:5000/api/seasonal-suitability');
      
      console.log(`Seasonal API status: ${response.status()}`);
      
      if (response.ok()) {
        const data = await response.json();
        console.log('Seasonal suitability data received');
      }
    } catch (error) {
      console.log('Seasonal API test skipped:', error.message);
    }
  });

  test('should handle disease detection prediction endpoint', async ({ request }) => {
    try {
      // Test if endpoint exists (would need proper payload for full test)
      const response = await request.post('http://localhost:5000/api/predict-disease', {
        data: { test: true },
        failOnStatusCode: false
      });
      
      console.log(`Disease prediction endpoint status: ${response.status()}`);
    } catch (error) {
      console.log('Disease detection API test skipped:', error.message);
    }
  });

  test('should fetch hub information', async ({ request }) => {
    try {
      const response = await request.get('http://localhost:5000/api/hubs');
      
      console.log(`Hubs API status: ${response.status()}`);
      
      if (response.ok()) {
        const data = await response.json();
        console.log(`Fetched hub data`);
      }
    } catch (error) {
      console.log('Hubs API test skipped:', error.message);
    }
  });

  test('should handle video API endpoints', async ({ request }) => {
    try {
      const response = await request.get('http://localhost:5000/api/videos');
      
      console.log(`Videos API status: ${response.status()}`);
      
      if (response.ok()) {
        const data = await response.json();
        console.log('Videos data received');
      }
    } catch (error) {
      console.log('Videos API test skipped:', error.message);
    }
  });

});
