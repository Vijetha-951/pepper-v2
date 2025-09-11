import productService from './productService';
import { getAuth } from 'firebase/auth';

// Mock Firebase Auth
jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(),
}));

// Mock fetch
global.fetch = jest.fn();

describe('ProductService', () => {
  let mockAuth;
  let mockUser;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Mock user and auth
    mockUser = {
      getIdToken: jest.fn().mockResolvedValue('mock-token-123'),
    };
    
    mockAuth = {
      currentUser: mockUser,
    };
    
    getAuth.mockReturnValue(mockAuth);
    
    // Set API URL
    process.env.REACT_APP_API_URL = 'http://localhost:3001';
  });

  afterEach(() => {
    delete process.env.REACT_APP_API_URL;
  });

  describe('searchProducts', () => {
    it('should search products successfully', async () => {
      const mockResponse = {
        products: [
          { _id: '1', name: 'Karimunda', type: 'Climber', price: 120, stock: 50 },
          { _id: '2', name: 'Thekkan 1', type: 'Bush', price: 100, stock: 30 }
        ],
        total: 2
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await productService.searchProducts({ query: 'pepper', type: 'Climber', page: 1, limit: 10 });

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3001/admin/products?query=pepper&type=Climber&page=1&limit=10',
        {
          headers: {
            'Authorization': 'Bearer mock-token-123',
            'Content-Type': 'application/json'
          }
        }
      );
      expect(result).toEqual(mockResponse);
    });

    it('should handle search API error', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      await expect(productService.searchProducts({ query: '', type: '', page: 1, limit: 10 }))
        .rejects.toThrow('HTTP error! status: 500');
    });

    it('should handle network error in search', async () => {
      const networkError = new Error('Network error');
      fetch.mockRejectedValueOnce(networkError);

      await expect(productService.searchProducts({ query: '', type: '', page: 1, limit: 10 }))
        .rejects.toThrow('Network error');
    });
  });

  describe('createProduct', () => {
    it('should create product successfully', async () => {
      const productData = {
        name: 'Test Pepper',
        type: 'Bush',
        description: 'A test pepper variety',
        price: '150',
        stock: '25',
        image: 'http://example.com/image.jpg'
      };

      const mockResponse = {
        _id: 'new-product-id',
        ...productData,
        price: 150,
        stock: 25
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await productService.createProduct(productData);

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3001/admin/products',
        {
          method: 'POST',
          headers: {
            'Authorization': 'Bearer mock-token-123',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            ...productData,
            price: 150,
            stock: 25
          })
        }
      );
      expect(result).toEqual(mockResponse);
    });

    it('should handle create API error', async () => {
      const productData = {
        name: 'Test Pepper',
        price: '150',
        stock: '25'
      };

      fetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
      });

      await expect(productService.createProduct(productData))
        .rejects.toThrow('HTTP error! status: 400');
    });
  });

  describe('updateProduct', () => {
    it('should update product successfully', async () => {
      const productId = 'test-product-id';
      const updateData = {
        name: 'Updated Pepper',
        price: '175',
        stock: '35'
      };

      const mockResponse = {
        _id: productId,
        ...updateData,
        price: 175,
        stock: 35
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await productService.updateProduct(productId, updateData);

      expect(fetch).toHaveBeenCalledWith(
        `http://localhost:3001/admin/products/${productId}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': 'Bearer mock-token-123',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            ...updateData,
            price: 175,
            stock: 35
          })
        }
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('deleteProduct', () => {
    it('should delete product successfully', async () => {
      const productId = 'test-product-id';
      const mockResponse = { message: 'Product deleted successfully' };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await productService.deleteProduct(productId);

      expect(fetch).toHaveBeenCalledWith(
        `http://localhost:3001/admin/products/${productId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': 'Bearer mock-token-123'
          }
        }
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('seedProducts', () => {
    it('should seed products successfully', async () => {
      const mockResponse = {
        message: 'Products seeded successfully',
        seeded: 15,
        existing: 6
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await productService.seedProducts();

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3001/admin/products/seed',
        {
          method: 'POST',
          headers: {
            'Authorization': 'Bearer mock-token-123',
            'Content-Type': 'application/json'
          }
        }
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('Authentication', () => {
    it('should handle missing auth token', async () => {
      // Mock user with no token
      mockUser.getIdToken.mockResolvedValueOnce(null);

      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ products: [] }),
      });

      await productService.searchProducts({ query: '', type: '', page: 1, limit: 10 });

      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer null'
          })
        })
      );
    });

    it('should handle missing current user', async () => {
      mockAuth.currentUser = null;

      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ products: [] }),
      });

      await productService.searchProducts({ query: '', type: '', page: 1, limit: 10 });

      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer undefined'
          })
        })
      );
    });
  });

  describe('Query Parameter Handling', () => {
    it('should handle empty search parameters', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ products: [] }),
      });

      await productService.searchProducts({});

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3001/admin/products?page=1&limit=10',
        expect.any(Object)
      );
    });

    it('should handle all search parameters', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ products: [] }),
      });

      await productService.searchProducts({
        query: 'karimunda',
        type: 'Climber',
        page: 2,
        limit: 20
      });

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3001/admin/products?query=karimunda&type=Climber&page=2&limit=20',
        expect.any(Object)
      );
    });
  });

  describe('Error Handling', () => {
    it('should log and re-throw errors', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const error = new Error('API Error');
      
      fetch.mockRejectedValueOnce(error);

      await expect(productService.searchProducts({ query: '', type: '', page: 1, limit: 10 }))
        .rejects.toThrow('API Error');

      expect(consoleSpy).toHaveBeenCalledWith('Search products error:', error);
      
      consoleSpy.mockRestore();
    });
  });
});