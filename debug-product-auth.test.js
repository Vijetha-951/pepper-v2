/**
 * Debug Test Suite for Product Management Authentication Issues
 * 
 * This test suite helps diagnose the 401 error when accessing product management.
 * Run this to identify authentication problems and their solutions.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { getAuth } from 'firebase/auth';

// Mock Firebase modules
vi.mock('firebase/auth');

// Import services
import authService from './frontend/src/services/authService.js';
import productService from './frontend/src/services/productService.js';

describe('Product Management Authentication Issues - Debug Tests', () => {
  
  // Test 1: Valid admin authentication
  describe('Valid admin authentication', () => {
    it('should successfully authenticate admin user and fetch products', async () => {
      // Mock Firebase auth with valid admin token
      const mockAuth = {
        currentUser: {
          getIdToken: vi.fn().mockResolvedValue('valid-admin-token'),
          uid: 'admin-uid-123',
          email: 'vj.vijetha01@gmail.com'
        }
      };
      getAuth.mockReturnValue(mockAuth);

      // Mock successful API response
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve([
          { id: '1', name: 'Karimunda', type: 'Climber', price: 120, stock: 50 }
        ])
      });

      const result = await productService.searchProducts({});
      
      expect(result).toBeDefined();
      expect(result.products).toBeDefined();
      expect(Array.isArray(result.products)).toBe(true);
      
      // Verify correct authorization header was sent
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/admin/products'),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer valid-admin-token'
          })
        })
      );
    });
  });

  // Test 2: Invalid token authentication
  describe('Invalid token authentication', () => {
    it('should throw 401 error with invalid token', async () => {
      const mockAuth = {
        currentUser: {
          getIdToken: vi.fn().mockResolvedValue('invalid-token')
        }
      };
      getAuth.mockReturnValue(mockAuth);

      // Mock 401 response
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ error: 'Unauthorized' })
      });

      await expect(productService.searchProducts({}))
        .rejects
        .toThrow('HTTP error! status: 401');
    });
  });

  // Test 3: Missing authorization header
  describe('Missing authorization header', () => {
    it('should throw 401 error when no user is logged in', async () => {
      const mockAuth = {
        currentUser: null
      };
      getAuth.mockReturnValue(mockAuth);

      // Mock 401 response
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ error: 'Missing or invalid Authorization header' })
      });

      await expect(productService.searchProducts({}))
        .rejects
        .toThrow('HTTP error! status: 401');
    });
  });

  // Test 4: Non-admin role access
  describe('Non-admin role access', () => {
    it('should throw 403 error for non-admin users', async () => {
      const mockAuth = {
        currentUser: {
          getIdToken: vi.fn().mockResolvedValue('valid-user-token'),
          uid: 'user-uid-123',
          email: 'user@example.com'
        }
      };
      getAuth.mockReturnValue(mockAuth);

      // Mock 403 response (user role, not admin)
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 403,
        json: () => Promise.resolve({ error: 'Admins only' })
      });

      await expect(productService.searchProducts({}))
        .rejects
        .toThrow('HTTP error! status: 403');
    });
  });

  // Test 5: Expired token handling
  describe('Expired token handling', () => {
    it('should handle expired Firebase tokens gracefully', async () => {
      const mockAuth = {
        currentUser: {
          getIdToken: vi.fn().mockRejectedValue(new Error('Token expired'))
        }
      };
      getAuth.mockReturnValue(mockAuth);

      await expect(productService.searchProducts({}))
        .rejects
        .toThrow('Token expired');
    });
  });

  // Test 6: Backend server connectivity
  describe('Backend server connectivity', () => {
    it('should handle server connection errors', async () => {
      const mockAuth = {
        currentUser: {
          getIdToken: vi.fn().mockResolvedValue('valid-token')
        }
      };
      getAuth.mockReturnValue(mockAuth);

      // Mock network error
      global.fetch = vi.fn().mockRejectedValue(new Error('fetch failed'));

      await expect(productService.searchProducts({}))
        .rejects
        .toThrow('fetch failed');
    });

    it('should verify correct API URL is being used', async () => {
      const mockAuth = {
        currentUser: {
          getIdToken: vi.fn().mockResolvedValue('valid-token')
        }
      };
      getAuth.mockReturnValue(mockAuth);

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve([])
      });

      await productService.searchProducts({});

      // Verify the correct API URL is being called
      const expectedUrl = `${process.env.REACT_APP_API_URL}/admin/products?page=1&limit=10`;
      expect(fetch).toHaveBeenCalledWith(
        expect.stringMatching(/.*\/admin\/products\?/),
        expect.any(Object)
      );
    });
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });
});

/**
 * DEBUGGING GUIDE FOR 401 ERRORS IN PRODUCT MANAGEMENT
 * ====================================================
 * 
 * If you're getting 401 errors, check these items in order:
 * 
 * 1. USER AUTHENTICATION STATUS:
 *    - Is the user logged in? Check authService.getCurrentUser()
 *    - Does the user have a valid Firebase token? Check Firebase Auth Console
 *    - Try logging out and logging back in to refresh the token
 * 
 * 2. USER ROLE VERIFICATION:
 *    - Is the user's role set to 'admin'? Check Firestore users collection
 *    - Is the user's email 'vj.vijetha01@gmail.com' (hardcoded admin)?
 *    - Check the auth middleware on backend for role assignment logic
 * 
 * 3. TOKEN ISSUES:
 *    - Has the Firebase ID token expired? Tokens expire after 1 hour
 *    - Is getIdToken() being called correctly in productService.js?
 *    - Check browser DevTools Network tab for the actual Authorization header
 * 
 * 4. BACKEND CONNECTIVITY:
 *    - Is the backend server running on http://localhost:5000?
 *    - Is REACT_APP_API_URL correctly set in frontend/.env?
 *    - Are there CORS issues? Check browser console for CORS errors
 * 
 * 5. BACKEND AUTHENTICATION MIDDLEWARE:
 *    - Is the requireAuth middleware working correctly?
 *    - Is the requireAdmin middleware properly checking user roles?
 *    - Check backend logs for authentication errors
 * 
 * QUICK FIXES TO TRY:
 * -------------------
 * 1. Refresh the page and try again
 * 2. Log out and log back in
 * 3. Clear browser cache and localStorage
 * 4. Restart the backend server
 * 5. Check if backend server is running: curl http://localhost:5000/api/health
 * 6. Verify user role in Firestore: users/{uid} document should have role: 'admin'
 * 
 * MANUAL DEBUGGING STEPS:
 * ----------------------
 * 1. Open browser DevTools → Network tab
 * 2. Try to access product management page
 * 3. Look for the failed request to /api/admin/products
 * 4. Check the request headers for Authorization: Bearer [token]
 * 5. Check the response for the specific error message
 * 6. If no Authorization header: Token retrieval issue
 * 7. If "Unauthorized" error: Invalid or expired token
 * 8. If "Admins only" error: User role is not 'admin'
 */