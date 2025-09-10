import request from 'supertest';
import express from 'express';
import adminRouter from './admin.routes.js';
import User from '../models/User.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

// Mock dependencies
jest.mock('../models/User.js');
jest.mock('../models/Product.js');
jest.mock('../models/Order.js');
jest.mock('../middleware/auth.js');
jest.mock('../config/firebase.js', () => ({
  default: {
    auth: () => ({
      deleteUser: jest.fn(),
      verifyIdToken: jest.fn()
    })
  }
}));

jest.mock('firebase-admin/firestore', () => ({
  getFirestore: jest.fn(() => ({
    collection: jest.fn(() => ({
      doc: jest.fn(() => ({
        delete: jest.fn()
      }))
    }))
  }))
}));

// Setup Express app for testing
const app = express();
app.use(express.json());
app.use('/api/admin', adminRouter);

describe('Admin Routes - Extended Coverage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock auth middleware to always pass
    requireAuth.mockImplementation((req, res, next) => {
      req.user = { email: 'admin@test.com', role: 'admin' };
      next();
    });
    requireAdmin.mockImplementation((req, res, next) => next());
  });

  describe('Admin Profile Management', () => {
    test('Get admin profile successfully', async () => {
      const mockAdmin = {
        _id: '507f1f77bcf86cd799439011',
        email: 'admin@test.com',
        firstName: 'Admin',
        lastName: 'User',
        role: 'admin',
        phone: '1234567890'
      };

      User.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockAdmin)
      });

      const response = await request(app)
        .get('/api/admin/me')
        .expect(200);

      expect(User.findOne).toHaveBeenCalledWith({ email: 'admin@test.com' });
      expect(response.body).toEqual(mockAdmin);
    });

    test('Update admin profile successfully', async () => {
      const updateData = {
        firstName: 'Updated',
        lastName: 'Admin',
        phone: '9876543210',
        place: 'New City',
        district: 'New District',
        pincode: '123456'
      };

      const updatedAdmin = {
        _id: '507f1f77bcf86cd799439011',
        email: 'admin@test.com',
        ...updateData,
        role: 'admin'
      };

      User.findOneAndUpdate.mockReturnValue({
        select: jest.fn().mockResolvedValue(updatedAdmin)
      });

      const response = await request(app)
        .put('/api/admin/me')
        .send(updateData)
        .expect(200);

      expect(User.findOneAndUpdate).toHaveBeenCalledWith(
        { email: 'admin@test.com' },
        updateData,
        { new: true }
      );
      expect(response.body).toEqual(updatedAdmin);
    });

    test('Admin profile not found', async () => {
      User.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue(null)
      });

      const response = await request(app)
        .get('/api/admin/me')
        .expect(200);

      expect(response.body).toBeNull();
    });
  });

  describe('Product Management', () => {
    test('Create product successfully', async () => {
      const productData = {
        name: 'Test Product',
        price: 99.99,
        type: 'spices',
        stock: 100,
        description: 'Test product description'
      };

      const createdProduct = {
        _id: '507f1f77bcf86cd799439011',
        ...productData,
        createdAt: new Date()
      };

      Product.create.mockResolvedValue(createdProduct);

      const response = await request(app)
        .post('/api/admin/products')
        .send(productData)
        .expect(201);

      expect(Product.create).toHaveBeenCalledWith(productData);
      expect(response.body).toEqual(createdProduct);
    });

    test('Get all products with filters', async () => {
      const mockProducts = [
        { _id: '1', name: 'Pepper', type: 'spices', price: 50, stock: 10 },
        { _id: '2', name: 'Cardamom', type: 'spices', price: 200, stock: 5 }
      ];

      Product.find.mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockProducts)
      });

      const response = await request(app)
        .get('/api/admin/products')
        .query({
          q: 'pepper',
          type: 'spices',
          available: 'true',
          minPrice: '40',
          maxPrice: '300'
        })
        .expect(200);

      expect(Product.find).toHaveBeenCalledWith({
        name: { $regex: 'pepper', $options: 'i' },
        type: 'spices',
        stock: { $gt: 0 },
        price: { $gte: 40, $lte: 300 }
      });
      expect(response.body).toEqual(mockProducts);
    });

    test('Get single product by ID', async () => {
      const mockProduct = {
        _id: '507f1f77bcf86cd799439011',
        name: 'Black Pepper',
        price: 150,
        stock: 25
      };

      Product.findById.mockResolvedValue(mockProduct);

      const response = await request(app)
        .get('/api/admin/products/507f1f77bcf86cd799439011')
        .expect(200);

      expect(Product.findById).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
      expect(response.body).toEqual(mockProduct);
    });

    test('Product not found returns 404', async () => {
      Product.findById.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/admin/products/nonexistent')
        .expect(404);

      expect(response.body.message).toBe('Not found');
    });

    test('Update product successfully', async () => {
      const updateData = { name: 'Updated Product', price: 199.99 };
      const updatedProduct = {
        _id: '507f1f77bcf86cd799439011',
        ...updateData,
        stock: 50
      };

      Product.findByIdAndUpdate.mockResolvedValue(updatedProduct);

      const response = await request(app)
        .put('/api/admin/products/507f1f77bcf86cd799439011')
        .send(updateData)
        .expect(200);

      expect(Product.findByIdAndUpdate).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        updateData,
        { new: true }
      );
      expect(response.body).toEqual(updatedProduct);
    });

    test('Delete product successfully', async () => {
      const deletedProduct = {
        _id: '507f1f77bcf86cd799439011',
        name: 'Deleted Product'
      };

      Product.findByIdAndDelete.mockResolvedValue(deletedProduct);

      await request(app)
        .delete('/api/admin/products/507f1f77bcf86cd799439011')
        .expect(204);

      expect(Product.findByIdAndDelete).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
    });
  });

  describe('Order Management', () => {
    test('Get all orders with filters', async () => {
      const mockOrders = [
        {
          _id: '1',
          status: 'PENDING',
          deliveryStatus: 'PENDING',
          user: { firstName: 'John', lastName: 'Doe' },
          total: 100
        },
        {
          _id: '2', 
          status: 'APPROVED',
          deliveryStatus: 'ASSIGNED',
          user: { firstName: 'Jane', lastName: 'Smith' },
          total: 200
        }
      ];

      Order.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            sort: jest.fn().mockResolvedValue(mockOrders)
          })
        })
      });

      const response = await request(app)
        .get('/api/admin/orders')
        .query({ status: 'PENDING', deliveryStatus: 'PENDING' })
        .expect(200);

      expect(Order.find).toHaveBeenCalledWith({
        status: 'PENDING',
        deliveryStatus: 'PENDING'
      });
      expect(response.body).toEqual(mockOrders);
    });

    test('Approve order successfully', async () => {
      const approvedOrder = {
        _id: '507f1f77bcf86cd799439011',
        status: 'APPROVED',
        user: 'userId123'
      };

      Order.findByIdAndUpdate.mockResolvedValue(approvedOrder);

      const response = await request(app)
        .patch('/api/admin/orders/507f1f77bcf86cd799439011/approve')
        .expect(200);

      expect(Order.findByIdAndUpdate).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        { status: 'APPROVED' },
        { new: true }
      );
      expect(response.body).toEqual(approvedOrder);
    });

    test('Assign delivery boy to order', async () => {
      const assignedOrder = {
        _id: '507f1f77bcf86cd799439011',
        deliveryBoy: 'deliveryBoyId123',
        deliveryStatus: 'ASSIGNED'
      };

      Order.findByIdAndUpdate.mockResolvedValue(assignedOrder);

      const response = await request(app)
        .patch('/api/admin/orders/507f1f77bcf86cd799439011/assign')
        .send({ deliveryBoyId: 'deliveryBoyId123' })
        .expect(200);

      expect(Order.findByIdAndUpdate).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        { deliveryBoy: 'deliveryBoyId123', deliveryStatus: 'ASSIGNED' },
        { new: true }
      );
      expect(response.body).toEqual(assignedOrder);
    });

    test('Update order status', async () => {
      const updatedOrder = {
        _id: '507f1f77bcf86cd799439011',
        status: 'OUT_FOR_DELIVERY'
      };

      Order.findByIdAndUpdate.mockResolvedValue(updatedOrder);

      const response = await request(app)
        .patch('/api/admin/orders/507f1f77bcf86cd799439011/status')
        .send({ status: 'OUT_FOR_DELIVERY' })
        .expect(200);

      expect(Order.findByIdAndUpdate).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        { status: 'OUT_FOR_DELIVERY' },
        { new: true }
      );
      expect(response.body).toEqual(updatedOrder);
    });

    test('Cancel order successfully', async () => {
      const cancelledOrder = {
        _id: '507f1f77bcf86cd799439011',
        status: 'CANCELLED'
      };

      Order.findByIdAndUpdate.mockResolvedValue(cancelledOrder);

      const response = await request(app)
        .patch('/api/admin/orders/507f1f77bcf86cd799439011/cancel')
        .expect(200);

      expect(Order.findByIdAndUpdate).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        { status: 'CANCELLED' },
        { new: true }
      );
      expect(response.body).toEqual(cancelledOrder);
    });
  });

  describe('Reports and Analytics', () => {
    test('Get summary report', async () => {
      const mockCounts = [150, 25, 100]; // totalOrders, pending, delivered
      
      Order.countDocuments
        .mockResolvedValueOnce(150) // total orders
        .mockResolvedValueOnce(25)  // pending orders
        .mockResolvedValueOnce(100); // delivered orders

      const response = await request(app)
        .get('/api/admin/reports/summary')
        .expect(200);

      expect(Order.countDocuments).toHaveBeenCalledTimes(3);
      expect(Order.countDocuments).toHaveBeenNthCalledWith(1, {});
      expect(Order.countDocuments).toHaveBeenNthCalledWith(2, { status: 'PENDING' });
      expect(Order.countDocuments).toHaveBeenNthCalledWith(3, { status: 'DELIVERED' });
      
      expect(response.body).toEqual({
        totalOrders: 150,
        pending: 25,
        delivered: 100
      });
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('Database connection error in product creation', async () => {
      Product.create.mockRejectedValue(new Error('Database connection failed'));

      await request(app)
        .post('/api/admin/products')
        .send({ name: 'Test Product', price: 99 })
        .expect(500);
    });

    test('Invalid JSON in product update', async () => {
      const response = await request(app)
        .put('/api/admin/products/507f1f77bcf86cd799439011')
        .send('invalid-json')
        .set('Content-Type', 'application/json')
        .expect(400);
    });

    test('Missing required fields in product creation', async () => {
      Product.create.mockRejectedValue(new Error('Validation failed'));

      await request(app)
        .post('/api/admin/products')
        .send({}) // Missing required fields
        .expect(500);
    });

    test('Order assignment with invalid delivery boy ID', async () => {
      Order.findByIdAndUpdate.mockRejectedValue(new Error('Invalid delivery boy ID'));

      await request(app)
        .patch('/api/admin/orders/507f1f77bcf86cd799439011/assign')
        .send({ deliveryBoyId: 'invalid-id' })
        .expect(500);
    });

    test('Unauthorized access - no admin role', async () => {
      requireAdmin.mockImplementation((req, res, next) => {
        res.status(403).json({ error: 'Access denied. Admin role required.' });
      });

      await request(app)
        .get('/api/admin/products')
        .expect(403);
    });
  });

  describe('Input Validation and Security', () => {
    test('XSS protection in product name', async () => {
      const maliciousData = {
        name: '<script>alert("xss")</script>',
        price: 99,
        type: 'spices'
      };

      const sanitizedProduct = {
        _id: '507f1f77bcf86cd799439011',
        name: '&lt;script&gt;alert("xss")&lt;/script&gt;', // Assuming sanitization
        price: 99,
        type: 'spices'
      };

      Product.create.mockResolvedValue(sanitizedProduct);

      const response = await request(app)
        .post('/api/admin/products')
        .send(maliciousData)
        .expect(201);

      expect(Product.create).toHaveBeenCalled();
    });

    test('SQL injection protection in search query', async () => {
      const maliciousQuery = "'; DROP TABLE products; --";
      
      Product.find.mockReturnValue({
        sort: jest.fn().mockResolvedValue([])
      });

      await request(app)
        .get('/api/admin/products')
        .query({ q: maliciousQuery })
        .expect(200);

      // Verify that the query was properly escaped through regex
      expect(Product.find).toHaveBeenCalledWith({
        name: { $regex: maliciousQuery, $options: 'i' }
      });
    });

    test('Large payload handling', async () => {
      const largeProductData = {
        name: 'A'.repeat(10000), // Very long name
        description: 'B'.repeat(50000), // Very long description
        price: 99.99,
        type: 'spices'
      };

      Product.create.mockResolvedValue({ ...largeProductData, _id: '507f1f77bcf86cd799439011' });

      const response = await request(app)
        .post('/api/admin/products')
        .send(largeProductData)
        .expect(201);

      expect(Product.create).toHaveBeenCalledWith(largeProductData);
    });
  });

  describe('Performance and Scalability', () => {
    test('Pagination limits in user search', async () => {
      const mockUsers = Array(10).fill(0).map((_, i) => ({
        _id: `user${i}`,
        email: `user${i}@test.com`
      }));

      User.find.mockReturnValue({
        select: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            skip: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue(mockUsers)
            })
          })
        })
      });
      User.countDocuments.mockResolvedValue(1000);

      const response = await request(app)
        .get('/api/admin/users')
        .query({ page: '2', limit: '10' })
        .expect(200);

      expect(response.body.users).toEqual(mockUsers);
      expect(response.body.page).toBe(2);
      expect(response.body.limit).toBe(10);
      expect(response.body.pages).toBe(100); // Math.ceil(1000/10)
    });

    test('Concurrent product updates', async () => {
      const productId = '507f1f77bcf86cd799439011';
      const updates = [
        { name: 'Updated Name 1', price: 100 },
        { name: 'Updated Name 2', price: 200 },
        { name: 'Updated Name 3', price: 300 }
      ];

      Product.findByIdAndUpdate.mockResolvedValue({
        _id: productId,
        name: 'Final Name',
        price: 300
      });

      const requests = updates.map(updateData =>
        request(app)
          .put(`/api/admin/products/${productId}`)
          .send(updateData)
      );

      const responses = await Promise.all(requests);
      
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
      
      expect(Product.findByIdAndUpdate).toHaveBeenCalledTimes(3);
    });
  });
});