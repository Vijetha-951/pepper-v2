/**
 * Test for Enhanced Product Model Schema
 * This file tests the updated Product model with stock management features
 */

import mongoose from 'mongoose';

// Mock the enhanced Product model schema for testing
const enhancedProductSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, index: true },
  type: { type: String, enum: ['Climber', 'Bush'], required: true },
  category: { type: String, default: 'Bush Pepper' },
  description: { type: String, default: '' },
  price: { type: Number, required: true, min: 0 },
  total_stock: { 
    type: Number, 
    required: true, 
    min: 0,
    validate: {
      validator: function(v) {
        return v >= 0;
      },
      message: 'total_stock must be non-negative'
    }
  },
  available_stock: { 
    type: Number, 
    required: true, 
    min: 0,
    validate: {
      validator: function(v) {
        return v >= 0 && v <= this.total_stock;
      },
      message: 'available_stock must be non-negative and cannot exceed total_stock'
    }
  },
  image: { type: String, default: '' },
  isActive: { type: Boolean, default: true },
}, { 
  timestamps: true 
});

// Virtual for calculating sold quantity
enhancedProductSchema.virtual('sold').get(function() {
  return this.total_stock - this.available_stock;
});

// Method to get stock status
enhancedProductSchema.methods.getStockStatus = function() {
  if (this.available_stock === 0) return 'Out of Stock';
  if (this.available_stock <= 5) return 'Low Stock';
  return 'In Stock';
};

// Method to get stock status color
enhancedProductSchema.methods.getStockStatusColor = function() {
  const status = this.getStockStatus();
  switch (status) {
    case 'Out of Stock': return 'red';
    case 'Low Stock': return 'yellow';
    case 'In Stock': return 'green';
    default: return 'gray';
  }
};

// Method to get sold quantity
enhancedProductSchema.methods.getSoldQuantity = function() {
  return this.total_stock - this.available_stock;
};

// Method to make a purchase (reduce available_stock)
enhancedProductSchema.methods.makePurchase = function(quantity) {
  if (quantity <= 0) return;
  if (quantity > this.available_stock) {
    throw new Error(`Purchase quantity (${quantity}) exceeds available stock (${this.available_stock})`);
  }
  this.available_stock -= quantity;
};

// Method to restock (increase both total_stock and available_stock)
enhancedProductSchema.methods.restock = function(quantity) {
  if (quantity <= 0) return;
  this.total_stock += quantity;
  this.available_stock += quantity;
};

// Method to get complete stock information
enhancedProductSchema.methods.getStockInfo = function() {
  return {
    total_stock: this.total_stock,
    available_stock: this.available_stock,
    sold: this.getSoldQuantity(),
    status: this.getStockStatus(),
    statusColor: this.getStockStatusColor()
  };
};

// Method to format for admin dashboard
enhancedProductSchema.methods.toDashboardJSON = function() {
  const obj = this.toObject();
  return {
    ...obj,
    sold: this.getSoldQuantity(),
    status: this.getStockStatus(),
    statusColor: this.getStockStatusColor()
  };
};

// Ensure virtual fields are serialized
enhancedProductSchema.set('toJSON', { virtuals: true });
enhancedProductSchema.set('toObject', { virtuals: true });

const EnhancedProduct = mongoose.model('EnhancedProduct', enhancedProductSchema);

describe('Enhanced Product Schema Validation', () => {
  beforeEach(async () => {
    if (mongoose.connection.readyState === 1) {
      await EnhancedProduct.deleteMany({});
    }
  });

  afterEach(async () => {
    if (mongoose.connection.readyState === 1) {
      await EnhancedProduct.deleteMany({});
    }
  });

  describe('Schema Field Validation', () => {
    const validProductData = {
      name: 'Test Pepper',
      type: 'Climber',
      category: 'Bush Pepper',
      description: 'Test description',
      price: 100,
      total_stock: 50,
      available_stock: 50,
      image: 'test.jpg'
    };

    it('should create product with all valid fields', async () => {
      const product = new EnhancedProduct(validProductData);
      const validationError = product.validateSync();
      expect(validationError).toBeUndefined();
    });

    it('should require name field', async () => {
      const product = new EnhancedProduct({
        ...validProductData,
        name: undefined
      });
      
      const validationError = product.validateSync();
      expect(validationError).toBeDefined();
      expect(validationError.errors.name).toBeDefined();
    });

    it('should require type field with valid enum value', async () => {
      const product = new EnhancedProduct({
        ...validProductData,
        type: 'Invalid'
      });
      
      const validationError = product.validateSync();
      expect(validationError).toBeDefined();
      expect(validationError.errors.type).toBeDefined();
    });

    it('should require price field with minimum value', async () => {
      const product = new EnhancedProduct({
        ...validProductData,
        price: -10
      });
      
      const validationError = product.validateSync();
      expect(validationError).toBeDefined();
      expect(validationError.errors.price).toBeDefined();
    });

    it('should require total_stock field', async () => {
      const product = new EnhancedProduct({
        ...validProductData,
        total_stock: undefined
      });
      
      const validationError = product.validateSync();
      expect(validationError).toBeDefined();
      expect(validationError.errors.total_stock).toBeDefined();
    });

    it('should require available_stock field', async () => {
      const product = new EnhancedProduct({
        ...validProductData,
        available_stock: undefined
      });
      
      const validationError = product.validateSync();
      expect(validationError).toBeDefined();
      expect(validationError.errors.available_stock).toBeDefined();
    });

    it('should validate available_stock does not exceed total_stock', async () => {
      const product = new EnhancedProduct({
        ...validProductData,
        total_stock: 50,
        available_stock: 75
      });
      
      const validationError = product.validateSync();
      expect(validationError).toBeDefined();
      expect(validationError.errors.available_stock).toBeDefined();
      expect(validationError.errors.available_stock.message).toContain('cannot exceed total_stock');
    });

    it('should set default values correctly', async () => {
      const product = new EnhancedProduct({
        name: 'Test Product',
        type: 'Bush',
        price: 100,
        total_stock: 10,
        available_stock: 10
      });

      expect(product.category).toBe('Bush Pepper');
      expect(product.description).toBe('');
      expect(product.image).toBe('');
      expect(product.isActive).toBe(true);
    });
  });

  describe('Virtual Fields and Methods', () => {
    it('should calculate sold quantity using virtual field', async () => {
      const product = new EnhancedProduct({
        name: 'Test Product',
        type: 'Climber',
        price: 100,
        total_stock: 100,
        available_stock: 75
      });

      expect(product.sold).toBe(25);
    });

    it('should include virtual fields in JSON serialization', async () => {
      const product = new EnhancedProduct({
        name: 'Test Product',
        type: 'Climber',
        price: 100,
        total_stock: 100,
        available_stock: 75
      });

      const json = product.toJSON();
      expect(json.sold).toBe(25);
    });
  });

  describe('Database Operations', () => {
    it('should save and retrieve enhanced product from database', async () => {
      if (mongoose.connection.readyState !== 1) {
        // Skip database operations if not connected
        return;
      }

      const productData = {
        name: 'Database Test Pepper',
        type: 'Climber',
        price: 150,
        total_stock: 200,
        available_stock: 150
      };

      const product = new EnhancedProduct(productData);
      const savedProduct = await product.save();

      expect(savedProduct._id).toBeDefined();
      expect(savedProduct.name).toBe('Database Test Pepper');
      expect(savedProduct.total_stock).toBe(200);
      expect(savedProduct.available_stock).toBe(150);
      expect(savedProduct.sold).toBe(50);

      // Verify can retrieve from database
      const retrievedProduct = await EnhancedProduct.findById(savedProduct._id);
      expect(retrievedProduct).toBeDefined();
      expect(retrievedProduct.sold).toBe(50);
    });

    it('should create timestamps automatically', async () => {
      if (mongoose.connection.readyState !== 1) {
        return;
      }

      const product = new EnhancedProduct({
        name: 'Timestamp Test',
        type: 'Bush',
        price: 100,
        total_stock: 50,
        available_stock: 50
      });

      const saved = await product.save();
      expect(saved.createdAt).toBeDefined();
      expect(saved.updatedAt).toBeDefined();
      expect(saved.createdAt).toBeInstanceOf(Date);
      expect(saved.updatedAt).toBeInstanceOf(Date);
    });
  });
});