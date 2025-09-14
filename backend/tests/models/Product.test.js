import mongoose from 'mongoose';
import Product from '../../src/models/Product.js';

describe('Enhanced Product Model - Stock Management', () => {
  let productData;

  beforeEach(async () => {
    // Clear products collection before each test
    if (mongoose.connection.readyState === 1) {
      await Product.deleteMany({});
    }

    productData = {
      name: 'Karimunda Pepper',
      type: 'Climber',
      category: 'Bush Pepper',
      description: 'Popular pepper variety',
      price: 120,
      total_stock: 100,
      available_stock: 100,
      image: 'pepper.jpg'
    };
  });

  afterEach(async () => {
    // Clean up after each test
    if (mongoose.connection.readyState === 1) {
      await Product.deleteMany({});
    }
  });

  describe('Create product with stock', () => {
    it('should create product with equal total_stock and available_stock', async () => {
      const product = new Product(productData);
      expect(product.total_stock).toBe(100);
      expect(product.available_stock).toBe(100);
      expect(product.getSoldQuantity()).toBe(0);
      expect(product.isValid()).toBe(true);
    });

    it('should initialize stock fields correctly when admin adds product', async () => {
      const product = new Product({
        ...productData,
        total_stock: 50,
        available_stock: 50
      });
      
      expect(product.total_stock).toBe(50);
      expect(product.available_stock).toBe(50);
      expect(product.getSoldQuantity()).toBe(0);
    });

    it('should validate required stock fields', async () => {
      const invalidProduct = new Product({
        ...productData,
        total_stock: undefined,
        available_stock: undefined
      });

      const validationError = invalidProduct.validateSync();
      expect(validationError).toBeDefined();
      expect(validationError.errors.total_stock).toBeDefined();
      expect(validationError.errors.available_stock).toBeDefined();
    });
  });

  describe('Calculate sold dynamically', () => {
    it('should calculate sold quantity correctly', async () => {
      const product = new Product({
        ...productData,
        total_stock: 100,
        available_stock: 75
      });

      expect(product.getSoldQuantity()).toBe(25);
    });

    it('should return 0 sold when no sales occurred', async () => {
      const product = new Product(productData);
      expect(product.getSoldQuantity()).toBe(0);
    });

    it('should handle edge case where available_stock equals total_stock', async () => {
      const product = new Product({
        ...productData,
        total_stock: 50,
        available_stock: 50
      });

      expect(product.getSoldQuantity()).toBe(0);
    });
  });

  describe('Stock status determination', () => {
    it('should return "In Stock" status for stock > 5', async () => {
      const product = new Product({
        ...productData,
        available_stock: 10
      });

      expect(product.getStockStatus()).toBe('In Stock');
      expect(product.getStockStatusColor()).toBe('green');
    });

    it('should return "Low Stock" status for stock 1-5', async () => {
      const product = new Product({
        ...productData,
        available_stock: 3
      });

      expect(product.getStockStatus()).toBe('Low Stock');
      expect(product.getStockStatusColor()).toBe('yellow');
    });

    it('should return "Out of Stock" status for stock = 0', async () => {
      const product = new Product({
        ...productData,
        available_stock: 0
      });

      expect(product.getStockStatus()).toBe('Out of Stock');
      expect(product.getStockStatusColor()).toBe('red');
    });

    it('should handle boundary values correctly', async () => {
      // Test exactly 5 items (should be Low Stock)
      const product5 = new Product({
        ...productData,
        available_stock: 5
      });
      expect(product5.getStockStatus()).toBe('Low Stock');

      // Test exactly 6 items (should be In Stock)
      const product6 = new Product({
        ...productData,
        available_stock: 6
      });
      expect(product6.getStockStatus()).toBe('In Stock');

      // Test exactly 1 item (should be Low Stock)
      const product1 = new Product({
        ...productData,
        available_stock: 1
      });
      expect(product1.getStockStatus()).toBe('Low Stock');
    });
  });

  describe('Invalid stock quantities', () => {
    it('should reject negative total_stock', async () => {
      const product = new Product({
        ...productData,
        total_stock: -10
      });

      const validationError = product.validateSync();
      expect(validationError).toBeDefined();
      expect(validationError.errors.total_stock).toBeDefined();
    });

    it('should reject negative available_stock', async () => {
      const product = new Product({
        ...productData,
        available_stock: -5
      });

      const validationError = product.validateSync();
      expect(validationError).toBeDefined();
      expect(validationError.errors.available_stock).toBeDefined();
    });

    it('should reject available_stock greater than total_stock', async () => {
      const product = new Product({
        ...productData,
        total_stock: 50,
        available_stock: 75
      });

      const validationError = product.validateSync();
      expect(validationError).toBeDefined();
      expect(validationError.errors.available_stock).toBeDefined();
      expect(validationError.errors.available_stock.message).toContain('cannot exceed total_stock');
    });

    it('should reject non-numeric stock values', async () => {
      const product = new Product({
        ...productData,
        total_stock: 'invalid',
        available_stock: 'invalid'
      });

      const validationError = product.validateSync();
      expect(validationError).toBeDefined();
      expect(validationError.errors.total_stock).toBeDefined();
      expect(validationError.errors.available_stock).toBeDefined();
    });
  });

  describe('Stock management operations', () => {
    it('should update available_stock when making a purchase', async () => {
      const product = new Product(productData);
      
      // Simulate purchase
      product.makePurchase(25);
      
      expect(product.available_stock).toBe(75);
      expect(product.total_stock).toBe(100); // Should not change
      expect(product.getSoldQuantity()).toBe(25);
    });

    it('should handle restocking correctly', async () => {
      const product = new Product({
        ...productData,
        total_stock: 100,
        available_stock: 75
      });
      
      // Simulate restock
      product.restock(50);
      
      expect(product.total_stock).toBe(150);
      expect(product.available_stock).toBe(125);
      expect(product.getSoldQuantity()).toBe(25);
    });

    it('should prevent purchases that exceed available stock', async () => {
      const product = new Product({
        ...productData,
        available_stock: 10
      });

      expect(() => {
        product.makePurchase(15);
      }).toThrow('Purchase quantity (15) exceeds available stock (10)');
      
      // Stock should remain unchanged
      expect(product.available_stock).toBe(10);
      expect(product.total_stock).toBe(100);
    });

    it('should handle zero quantity purchases and restocks', async () => {
      const product = new Product(productData);
      
      product.makePurchase(0);
      expect(product.available_stock).toBe(100);
      
      product.restock(0);
      expect(product.total_stock).toBe(100);
      expect(product.available_stock).toBe(100);
    });
  });

  describe('Product information aggregation', () => {
    it('should return complete stock information', async () => {
      const product = new Product({
        ...productData,
        total_stock: 100,
        available_stock: 60
      });

      const stockInfo = product.getStockInfo();
      
      expect(stockInfo).toEqual({
        total_stock: 100,
        available_stock: 60,
        sold: 40,
        status: 'In Stock',
        statusColor: 'green'
      });
    });

    it('should format product for admin dashboard correctly', async () => {
      const product = new Product({
        ...productData,
        total_stock: 50,
        available_stock: 5
      });

      const dashboardData = product.toDashboardJSON();
      
      expect(dashboardData).toMatchObject({
        _id: expect.any(mongoose.Types.ObjectId),
        name: 'Karimunda Pepper',
        price: 120,
        total_stock: 50,
        available_stock: 5,
        sold: 45,
        status: 'Low Stock',
        statusColor: 'yellow'
      });
    });
  });
});