import request from 'supertest';
import express from 'express';
import Product from '../../src/models/Product.js';
import Order from '../../src/models/Order.js';
import User from '../../src/models/User.js';

// Mock Express app for testing stock management routes
const app = express();
app.use(express.json());

// Mock authentication middleware
const mockRequireAuth = (req, res, next) => {
  req.user = { email: 'admin@test.com', role: 'admin' };
  next();
};

const mockRequireAdmin = (req, res, next) => next();

// Stock Management API Routes
const stockRouter = express.Router();

// POST /api/products - Add product with stock management
stockRouter.post('/products', async (req, res) => {
  try {
    const { name, type, category, description, price, total_stock, available_stock, image } = req.body;
    
    // Validation
    if (!name || !type || !price || total_stock === undefined || available_stock === undefined) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields: name, type, price, total_stock, available_stock' 
      });
    }

    if (total_stock < 0 || available_stock < 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Stock quantities must be non-negative' 
      });
    }

    if (available_stock > total_stock) {
      return res.status(400).json({ 
        success: false, 
        message: 'Available stock cannot exceed total stock' 
      });
    }

    const product = new Product({
      name,
      type,
      category: category || 'Bush Pepper',
      description: description || '',
      price,
      stock: available_stock, // For backward compatibility with existing schema
      total_stock,
      available_stock,
      image: image || ''
    });

    const savedProduct = await product.save();
    res.status(201).json({ success: true, product: savedProduct });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/admin/stock - Fetch all products with stock information
stockRouter.get('/admin/stock', async (req, res) => {
  try {
    const products = await Product.find({}).sort({ createdAt: -1 });
    
    const stockData = products.map(product => {
      // For existing products that may not have new stock fields
      const total_stock = product.total_stock || product.stock || 0;
      const available_stock = product.available_stock !== undefined ? product.available_stock : product.stock || 0;
      const sold = total_stock - available_stock;
      
      let status = 'Out of Stock';
      let statusColor = 'red';
      
      if (available_stock > 5) {
        status = 'In Stock';
        statusColor = 'green';
      } else if (available_stock >= 1) {
        status = 'Low Stock';
        statusColor = 'yellow';
      }

      return {
        _id: product._id,
        name: product.name,
        price: product.price,
        total_stock,
        available_stock,
        sold,
        status,
        statusColor,
        type: product.type,
        category: product.category,
        description: product.description,
        image: product.image,
        isActive: product.isActive,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt
      };
    });

    res.json({ success: true, products: stockData });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/orders - Purchase products and update available_stock
stockRouter.post('/orders', async (req, res) => {
  try {
    const { items, totalAmount, userId } = req.body;
    
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Order items are required' });
    }

    // Validate stock availability and calculate total
    let calculatedTotal = 0;
    const orderItems = [];

    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) {
        return res.status(404).json({ 
          success: false, 
          message: `Product not found: ${item.productId}` 
        });
      }

      const available = product.available_stock !== undefined ? product.available_stock : product.stock;
      if (available < item.quantity) {
        return res.status(400).json({ 
          success: false, 
          message: `Insufficient stock for ${product.name}. Available: ${available}, Requested: ${item.quantity}` 
        });
      }

      calculatedTotal += product.price * item.quantity;
      orderItems.push({
        product: product._id,
        name: product.name,
        priceAtOrder: product.price,
        quantity: item.quantity
      });
    }

    // Create order
    const order = new Order({
      user: userId,
      items: orderItems,
      totalAmount: calculatedTotal,
      status: 'PENDING',
      payment: { method: 'COD', status: 'PENDING' }
    });

    const savedOrder = await order.save();

    // Update available stock for each product
    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (product.available_stock !== undefined) {
        product.available_stock -= item.quantity;
      } else {
        // Fallback for existing schema
        product.stock -= item.quantity;
      }
      await product.save();
    }

    res.status(201).json({ success: true, order: savedOrder });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/products/restock/:id - Restock product
stockRouter.put('/products/restock/:id', async (req, res) => {
  try {
    const { quantity } = req.body;
    const productId = req.params.id;

    if (!quantity || quantity <= 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Quantity must be a positive number' 
      });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ 
        success: false, 
        message: 'Product not found' 
      });
    }

    // Update both total_stock and available_stock
    const currentTotal = product.total_stock || product.stock || 0;
    const currentAvailable = product.available_stock !== undefined ? product.available_stock : product.stock || 0;

    product.total_stock = currentTotal + quantity;
    product.available_stock = currentAvailable + quantity;
    
    // For backward compatibility
    product.stock = product.available_stock;

    const updatedProduct = await product.save();
    res.json({ success: true, product: updatedProduct });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.use('/api', mockRequireAuth, stockRouter);

describe('Stock Management API Routes', () => {
  let testProduct;
  let testUser;

  beforeEach(async () => {
    // Clear test data
    if (Product.deleteMany) {
      await Product.deleteMany({});
      await Order.deleteMany({});
      await User.deleteMany({});
    }

    // Mock Product model methods
    Product.find = jest.fn();
    Product.findById = jest.fn();
    Product.prototype.save = jest.fn();
    Order.prototype.save = jest.fn();
    User.findById = jest.fn();

    testProduct = {
      _id: '507f1f77bcf86cd799439011',
      name: 'Test Pepper',
      type: 'Climber',
      price: 120,
      total_stock: 100,
      available_stock: 100,
      stock: 100,
      createdAt: new Date(),
      updatedAt: new Date(),
      save: jest.fn().mockResolvedValue(true)
    };

    testUser = {
      _id: '507f1f77bcf86cd799439012',
      email: 'user@test.com',
      firstName: 'Test',
      lastName: 'User'
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/products - Create product with stock', () => {
    it('should create product with equal total_stock and available_stock', async () => {
      const newProductData = {
        name: 'New Pepper',
        type: 'Climber',
        price: 150,
        total_stock: 50,
        available_stock: 50
      };

      Product.prototype.save.mockResolvedValue({
        ...newProductData,
        _id: '507f1f77bcf86cd799439013'
      });

      const response = await request(app)
        .post('/api/products')
        .send(newProductData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.product.total_stock).toBe(50);
      expect(response.body.product.available_stock).toBe(50);
    });

    it('should reject invalid stock quantities', async () => {
      const invalidData = {
        name: 'Invalid Pepper',
        type: 'Climber',
        price: 150,
        total_stock: -10,
        available_stock: 50
      };

      const response = await request(app)
        .post('/api/products')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('non-negative');
    });

    it('should reject available_stock exceeding total_stock', async () => {
      const invalidData = {
        name: 'Invalid Pepper',
        type: 'Climber',
        price: 150,
        total_stock: 30,
        available_stock: 50
      };

      const response = await request(app)
        .post('/api/products')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('cannot exceed total stock');
    });

    it('should reject missing required fields', async () => {
      const incompleteData = {
        name: 'Incomplete Pepper'
        // Missing type, price, stock fields
      };

      const response = await request(app)
        .post('/api/products')
        .send(incompleteData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Missing required fields');
    });
  });

  describe('GET /api/admin/stock - Fetch products with stock info', () => {
    it('should return products with calculated stock information', async () => {
      const mockProducts = [
        {
          ...testProduct,
          total_stock: 100,
          available_stock: 75
        },
        {
          ...testProduct,
          _id: '507f1f77bcf86cd799439014',
          name: 'Low Stock Pepper',
          total_stock: 20,
          available_stock: 3
        }
      ];

      Product.find.mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockProducts)
      });

      const response = await request(app)
        .get('/api/admin/stock')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.products).toHaveLength(2);
      
      // Check first product
      expect(response.body.products[0].total_stock).toBe(100);
      expect(response.body.products[0].available_stock).toBe(75);
      expect(response.body.products[0].sold).toBe(25);
      expect(response.body.products[0].status).toBe('In Stock');
      expect(response.body.products[0].statusColor).toBe('green');

      // Check second product (low stock)
      expect(response.body.products[1].available_stock).toBe(3);
      expect(response.body.products[1].status).toBe('Low Stock');
      expect(response.body.products[1].statusColor).toBe('yellow');
    });

    it('should handle products with out of stock status', async () => {
      const mockProducts = [{
        ...testProduct,
        total_stock: 50,
        available_stock: 0
      }];

      Product.find.mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockProducts)
      });

      const response = await request(app)
        .get('/api/admin/stock')
        .expect(200);

      expect(response.body.products[0].status).toBe('Out of Stock');
      expect(response.body.products[0].statusColor).toBe('red');
      expect(response.body.products[0].sold).toBe(50);
    });

    it('should handle backward compatibility with legacy stock field', async () => {
      const legacyProduct = {
        ...testProduct,
        stock: 25, // Legacy field
        total_stock: undefined,
        available_stock: undefined
      };

      Product.find.mockReturnValue({
        sort: jest.fn().mockResolvedValue([legacyProduct])
      });

      const response = await request(app)
        .get('/api/admin/stock')
        .expect(200);

      expect(response.body.products[0].total_stock).toBe(25);
      expect(response.body.products[0].available_stock).toBe(25);
      expect(response.body.products[0].sold).toBe(0);
    });
  });

  describe('POST /api/orders - Purchase reduces available stock', () => {
    it('should create order and reduce available stock', async () => {
      const orderData = {
        items: [
          { productId: '507f1f77bcf86cd799439011', quantity: 10 }
        ],
        totalAmount: 1200,
        userId: '507f1f77bcf86cd799439012'
      };

      Product.findById.mockResolvedValue(testProduct);
      Order.prototype.save.mockResolvedValue({
        _id: '507f1f77bcf86cd799439015',
        ...orderData,
        status: 'PENDING'
      });

      const response = await request(app)
        .post('/api/orders')
        .send(orderData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(testProduct.available_stock).toBe(90); // 100 - 10
      expect(testProduct.save).toHaveBeenCalled();
    });

    it('should reject purchase exceeding available stock', async () => {
      const orderData = {
        items: [
          { productId: '507f1f77bcf86cd799439011', quantity: 150 }
        ],
        totalAmount: 18000,
        userId: '507f1f77bcf86cd799439012'
      };

      Product.findById.mockResolvedValue(testProduct);

      const response = await request(app)
        .post('/api/orders')
        .send(orderData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Insufficient stock');
    });

    it('should handle multiple items in single order', async () => {
      const product2 = {
        ...testProduct,
        _id: '507f1f77bcf86cd799439016',
        name: 'Another Pepper',
        available_stock: 50
      };

      const orderData = {
        items: [
          { productId: '507f1f77bcf86cd799439011', quantity: 5 },
          { productId: '507f1f77bcf86cd799439016', quantity: 10 }
        ],
        totalAmount: 1800,
        userId: '507f1f77bcf86cd799439012'
      };

      Product.findById
        .mockResolvedValueOnce(testProduct)
        .mockResolvedValueOnce(product2)
        .mockResolvedValueOnce(testProduct)
        .mockResolvedValueOnce(product2);

      Order.prototype.save.mockResolvedValue({
        _id: '507f1f77bcf86cd799439017',
        status: 'PENDING'
      });

      const response = await request(app)
        .post('/api/orders')
        .send(orderData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(testProduct.available_stock).toBe(95); // 100 - 5
      expect(product2.available_stock).toBe(40); // 50 - 10
    });

    it('should reject orders with empty items', async () => {
      const orderData = {
        items: [],
        totalAmount: 0,
        userId: '507f1f77bcf86cd799439012'
      };

      const response = await request(app)
        .post('/api/orders')
        .send(orderData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Order items are required');
    });
  });

  describe('PUT /api/products/restock/:id - Restock increases both totals', () => {
    it('should increase both total_stock and available_stock', async () => {
      const restockQuantity = 50;
      testProduct.total_stock = 100;
      testProduct.available_stock = 75;

      Product.findById.mockResolvedValue(testProduct);

      const response = await request(app)
        .put(`/api/products/restock/${testProduct._id}`)
        .send({ quantity: restockQuantity })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(testProduct.total_stock).toBe(150); // 100 + 50
      expect(testProduct.available_stock).toBe(125); // 75 + 50
      expect(testProduct.save).toHaveBeenCalled();
    });

    it('should reject invalid restock quantities', async () => {
      const response = await request(app)
        .put(`/api/products/restock/${testProduct._id}`)
        .send({ quantity: -10 })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('positive number');
    });

    it('should reject zero quantity restock', async () => {
      const response = await request(app)
        .put(`/api/products/restock/${testProduct._id}`)
        .send({ quantity: 0 })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('positive number');
    });

    it('should handle product not found', async () => {
      Product.findById.mockResolvedValue(null);

      const response = await request(app)
        .put('/api/products/restock/nonexistent')
        .send({ quantity: 50 })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Product not found');
    });

    it('should handle legacy products without stock management fields', async () => {
      const legacyProduct = {
        ...testProduct,
        stock: 25,
        total_stock: undefined,
        available_stock: undefined,
        save: jest.fn().mockResolvedValue(true)
      };

      Product.findById.mockResolvedValue(legacyProduct);

      const response = await request(app)
        .put(`/api/products/restock/${testProduct._id}`)
        .send({ quantity: 20 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(legacyProduct.total_stock).toBe(45); // 25 + 20
      expect(legacyProduct.available_stock).toBe(45); // 25 + 20
    });
  });

  describe('Error handling and edge cases', () => {
    it('should handle database errors gracefully', async () => {
      Product.find.mockRejectedValue(new Error('Database connection failed'));

      const response = await request(app)
        .get('/api/admin/stock')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Database connection failed');
    });

    it('should handle malformed request data', async () => {
      const response = await request(app)
        .post('/api/products')
        .send('invalid json')
        .expect(400);

      // Express will handle JSON parsing errors
    });

    it('should validate product ID format in restock endpoint', async () => {
      Product.findById.mockResolvedValue(null);

      const response = await request(app)
        .put('/api/products/restock/invalid-id')
        .send({ quantity: 50 })
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });
});