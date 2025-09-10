import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import adminRouter from './admin.routes.js';
import User from '../models/User.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

// Mock dependencies
jest.mock('../models/User.js');
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

describe('Admin Routes - User Management', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock auth middleware to always pass
    requireAuth.mockImplementation((req, res, next) => {
      req.user = { email: 'admin@test.com', role: 'admin' };
      next();
    });
    requireAdmin.mockImplementation((req, res, next) => next());
  });

  describe('Happy Path Tests', () => {
    test('Admin approves pending user by MongoDB ID', async () => {
      const mockUser = {
        _id: '507f1f77bcf86cd799439011',
        email: 'user@test.com',
        firstName: 'John',
        lastName: 'Doe',
        isActive: true,
        role: 'user'
      };

      User.findByIdAndUpdate.mockResolvedValue(mockUser);

      const response = await request(app)
        .patch('/api/admin/users/507f1f77bcf86cd799439011/approve')
        .expect(200);

      expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        { isActive: true },
        { new: true }
      );
      expect(response.body).toEqual(mockUser);
    });

    test('Admin approves pending user by Firebase UID', async () => {
      const mockUser = {
        _id: '507f1f77bcf86cd799439012',
        firebaseUid: 'firebase-uid-123',
        email: 'user@test.com',
        firstName: 'John',
        lastName: 'Doe',
        isActive: true,
        role: 'user'
      };

      // First call (by ID) fails, second call (by firebaseUid) succeeds
      User.findByIdAndUpdate.mockRejectedValue(new Error('Invalid ID'));
      User.findOneAndUpdate.mockResolvedValue(mockUser);

      const response = await request(app)
        .patch('/api/admin/users/firebase-uid-123/approve')
        .expect(200);

      expect(User.findByIdAndUpdate).toHaveBeenCalled();
      expect(User.findOneAndUpdate).toHaveBeenCalledWith(
        { firebaseUid: 'firebase-uid-123' },
        { isActive: true },
        { new: true }
      );
      expect(response.body).toEqual(mockUser);
    });

    test('Admin rejects user with reason', async () => {
      const mockUser = {
        _id: '507f1f77bcf86cd799439011',
        email: 'user@test.com',
        isActive: false
      };

      User.findByIdAndUpdate.mockResolvedValue(mockUser);

      const response = await request(app)
        .patch('/api/admin/users/507f1f77bcf86cd799439011/reject')
        .send({ reason: 'Invalid information provided' })
        .expect(200);

      expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        { isActive: false },
        { new: true }
      );
      expect(response.body).toEqual(mockUser);
    });

    test('Admin changes user role', async () => {
      const mockUser = {
        _id: '507f1f77bcf86cd799439011',
        email: 'user@test.com',
        role: 'admin'
      };

      User.findByIdAndUpdate.mockResolvedValue(mockUser);

      const response = await request(app)
        .patch('/api/admin/users/507f1f77bcf86cd799439011/role')
        .send({ role: 'admin' })
        .expect(200);

      expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        { role: 'admin' },
        { new: true }
      );
      expect(response.body).toEqual(mockUser);
    });

    test('Admin updates delivery areas', async () => {
      const mockUser = {
        _id: '507f1f77bcf86cd799439011',
        role: 'deliveryboy',
        assignedAreas: {
          pincodes: ['682001'],
          districts: ['Kochi']
        }
      };

      User.findByIdAndUpdate.mockResolvedValue(mockUser);

      const response = await request(app)
        .patch('/api/admin/delivery-boys/507f1f77bcf86cd799439011/areas')
        .send({
          pincodes: ['682001'],
          districts: ['Kochi']
        })
        .expect(200);

      expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        {
          assignedAreas: { pincodes: ['682001'], districts: ['Kochi'] },
          role: 'deliveryboy'
        },
        { new: true }
      );
      expect(response.body).toEqual(mockUser);
    });
  });

  describe('Input Verification Tests', () => {
    test('Invalid user ID handling - returns 404', async () => {
      User.findByIdAndUpdate.mockRejectedValue(new Error('Invalid ID'));
      User.findOneAndUpdate.mockResolvedValue(null);

      const response = await request(app)
        .patch('/api/admin/users/invalid-id/approve')
        .expect(404);

      expect(response.body).toEqual({
        success: false,
        error: 'User not found'
      });
    });

    test('Empty role change request', async () => {
      const mockUser = {
        _id: '507f1f77bcf86cd799439011',
        role: ''
      };

      User.findByIdAndUpdate.mockResolvedValue(mockUser);

      const response = await request(app)
        .patch('/api/admin/users/507f1f77bcf86cd799439011/role')
        .send({ role: '' })
        .expect(200);

      expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        { role: '' },
        { new: true }
      );
      expect(response.body).toEqual(mockUser);
    });

    test('Missing request body for role update', async () => {
      const response = await request(app)
        .patch('/api/admin/users/507f1f77bcf86cd799439011/role')
        .send({})
        .expect(200);

      expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        { role: undefined },
        { new: true }
      );
    });

    test('Empty areas array', async () => {
      const mockUser = {
        _id: '507f1f77bcf86cd799439011',
        role: 'deliveryboy',
        assignedAreas: {
          pincodes: [],
          districts: []
        }
      };

      User.findByIdAndUpdate.mockResolvedValue(mockUser);

      const response = await request(app)
        .patch('/api/admin/delivery-boys/507f1f77bcf86cd799439011/areas')
        .send({
          pincodes: [],
          districts: []
        })
        .expect(200);

      expect(response.body).toEqual(mockUser);
    });
  });

  describe('Exception Handling Tests', () => {
    test('Non-admin user access blocked', async () => {
      // Override the mock to simulate non-admin user
      requireAdmin.mockImplementation((req, res, next) => {
        res.status(403).json({ error: 'Access denied. Admin role required.' });
      });

      await request(app)
        .patch('/api/admin/users/507f1f77bcf86cd799439011/approve')
        .expect(403);
    });

    test('Database error during user approval', async () => {
      User.findByIdAndUpdate.mockRejectedValue(new Error('Database connection failed'));
      User.findOneAndUpdate.mockRejectedValue(new Error('Database connection failed'));

      const response = await request(app)
        .patch('/api/admin/users/507f1f77bcf86cd799439011/approve')
        .expect(500);

      // Since we're using asyncHandler, it should handle the error
      expect(response.text).toContain('Error');
    });

    test('Concurrent modification handling', async () => {
      User.findByIdAndUpdate.mockResolvedValue(null); // User was deleted/modified by another process
      User.findOneAndUpdate.mockResolvedValue(null);

      const response = await request(app)
        .patch('/api/admin/users/507f1f77bcf86cd799439011/role')
        .send({ role: 'admin' })
        .expect(404);

      expect(response.body).toEqual({
        success: false,
        error: 'User not found'
      });
    });
  });

  describe('User Search Functionality', () => {
    test('Search users with filters', async () => {
      const mockUsers = [
        { _id: '1', email: 'user1@test.com', role: 'user', isActive: true },
        { _id: '2', email: 'user2@test.com', role: 'user', isActive: true }
      ];

      User.find.mockReturnValue({
        select: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            skip: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue(mockUsers)
            })
          })
        })
      });
      User.countDocuments.mockResolvedValue(2);

      const response = await request(app)
        .get('/api/admin/users')
        .query({
          q: 'user',
          role: 'user',
          active: 'true',
          page: '1',
          limit: '10'
        })
        .expect(200);

      expect(response.body).toEqual({
        users: mockUsers,
        total: 2,
        page: 1,
        limit: 10,
        pages: 1
      });
    });

    test('Search users with pagination', async () => {
      User.find.mockReturnValue({
        select: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            skip: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([])
            })
          })
        })
      });
      User.countDocuments.mockResolvedValue(100);

      const response = await request(app)
        .get('/api/admin/users')
        .query({ page: '3', limit: '20' })
        .expect(200);

      expect(response.body.page).toBe(3);
      expect(response.body.limit).toBe(20);
      expect(response.body.pages).toBe(5); // Math.ceil(100/20)
    });

    test('Invalid pagination parameters', async () => {
      User.find.mockReturnValue({
        select: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            skip: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([])
            })
          })
        })
      });
      User.countDocuments.mockResolvedValue(0);

      const response = await request(app)
        .get('/api/admin/users')
        .query({ page: '-1', limit: '1000' })
        .expect(200);

      // Should sanitize parameters
      expect(response.body.page).toBe(1); // Minimum 1
      expect(response.body.limit).toBe(100); // Maximum 100
    });
  });

  describe('User Deletion Functionality', () => {
    test('Successfully deletes user from all systems', async () => {
      const mockUser = {
        _id: '507f1f77bcf86cd799439011',
        firebaseUid: 'firebase-uid-123',
        email: 'user@test.com'
      };

      User.findById.mockResolvedValue(mockUser);
      User.deleteOne.mockResolvedValue({ deletedCount: 1 });

      // Mock Firebase admin methods
      const mockAuth = {
        deleteUser: jest.fn().mockResolvedValue()
      };
      const mockFirestore = {
        collection: jest.fn(() => ({
          doc: jest.fn(() => ({
            delete: jest.fn().mockResolvedValue()
          }))
        }))
      };

      const response = await request(app)
        .delete('/api/admin/users/507f1f77bcf86cd799439011')
        .expect(200);

      expect(User.findById).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
      expect(User.deleteOne).toHaveBeenCalledWith({ _id: mockUser._id });
      expect(response.body).toEqual({
        success: true,
        message: 'User deleted from Firebase (if present), Firestore, and MongoDB'
      });
    });

    test('Delete user by Firebase UID', async () => {
      const mockUser = {
        _id: '507f1f77bcf86cd799439011',
        firebaseUid: 'firebase-uid-123',
        email: 'user@test.com'
      };

      User.findById.mockResolvedValue(null);
      User.findOne.mockResolvedValue(mockUser);
      User.deleteOne.mockResolvedValue({ deletedCount: 1 });

      const response = await request(app)
        .delete('/api/admin/users/firebase-uid-123')
        .expect(200);

      expect(User.findById).toHaveBeenCalledWith('firebase-uid-123');
      expect(User.findOne).toHaveBeenCalledWith({ firebaseUid: 'firebase-uid-123' });
      expect(response.body.success).toBe(true);
    });

    test('Delete non-existent user returns 404', async () => {
      User.findById.mockResolvedValue(null);
      User.findOne.mockResolvedValue(null);

      const response = await request(app)
        .delete('/api/admin/users/non-existent-id')
        .expect(404);

      expect(response.body).toEqual({
        success: false,
        error: 'User not found'
      });
    });
  });

  describe('Edge Cases and Error Conditions', () => {
    test('Malformed MongoDB ID handling', async () => {
      User.findByIdAndUpdate.mockRejectedValue(new Error('Cast to ObjectId failed'));
      User.findOneAndUpdate.mockResolvedValue(null);

      const response = await request(app)
        .patch('/api/admin/users/not-a-valid-mongodb-id/approve')
        .expect(404);

      expect(response.body.error).toBe('User not found');
    });

    test('Special characters in user ID', async () => {
      const specialId = 'user@#$%^&*()id';
      User.findByIdAndUpdate.mockRejectedValue(new Error('Invalid ID'));
      User.findOneAndUpdate.mockResolvedValue(null);

      await request(app)
        .patch(`/api/admin/users/${encodeURIComponent(specialId)}/approve`)
        .expect(404);
    });

    test('Large payload handling for areas update', async () => {
      const largePayload = {
        pincodes: Array(1000).fill(0).map((_, i) => `${682000 + i}`),
        districts: Array(100).fill(0).map((_, i) => `District${i}`)
      };

      const mockUser = {
        _id: '507f1f77bcf86cd799439011',
        role: 'deliveryboy',
        assignedAreas: largePayload
      };

      User.findByIdAndUpdate.mockResolvedValue(mockUser);

      const response = await request(app)
        .patch('/api/admin/delivery-boys/507f1f77bcf86cd799439011/areas')
        .send(largePayload)
        .expect(200);

      expect(response.body.assignedAreas).toEqual(largePayload);
    });

    test('Simultaneous operations on same user', async () => {
      // This is a race condition test - in real scenarios, multiple admins might try to update the same user
      const mockUser = {
        _id: '507f1f77bcf86cd799439011',
        role: 'user',
        isActive: true
      };

      User.findByIdAndUpdate.mockResolvedValue(mockUser);

      // Simulate concurrent requests
      const requests = [
        request(app).patch('/api/admin/users/507f1f77bcf86cd799439011/approve'),
        request(app).patch('/api/admin/users/507f1f77bcf86cd799439011/role').send({ role: 'admin' }),
        request(app).patch('/api/admin/users/507f1f77bcf86cd799439011/reject').send({ reason: 'test' })
      ];

      const responses = await Promise.all(requests);
      
      // All should succeed (in this mock scenario)
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
    });
  });
});