import request from 'supertest';
import express from 'express';
import authRoutes from './auth.routes.js';
import { jest } from '@jest/globals';

// Mock dependencies
jest.unstable_mockModule('../config/firebase.js', () => ({
  default: {
    auth: () => ({
      verifyIdToken: jest.fn(),
      setCustomUserClaims: jest.fn(),
      updateUser: jest.fn()
    })
  }
}));

jest.unstable_mockModule('firebase-admin/firestore', () => ({
  getFirestore: () => ({
    collection: () => ({
      doc: () => ({
        set: jest.fn(),
        get: jest.fn()
      }),
      where: () => ({
        limit: () => ({
          get: jest.fn()
        })
      })
    })
  })
}));

jest.unstable_mockModule('../models/User.js', () => ({
  default: {
    findOne: jest.fn(),
    findOneAndUpdate: jest.fn(),
    create: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    find: jest.fn(),
    countDocuments: jest.fn()
  }
}));

jest.unstable_mockModule('../middleware/auth.js', () => ({
  requireAuth: (req, res, next) => {
    req.firebaseUid = 'test-uid';
    req.user = { email: req.body.email || 'test@example.com' };
    req.userRole = 'user';
    next();
  }
}));

const app = express();
app.use(express.json());
app.use('/auth', authRoutes);

describe('Auth Routes - Email Validation', () => {
  describe('POST /auth/sync-profile', () => {
    const baseProfileData = {
      profile: {
        firstName: 'John',
        lastName: 'Doe',
        phone: '1234567890',
        place: 'Test City',
        district: 'TestDistrict',
        pincode: '123456'
      }
    };

    test('should accept valid meaningful email', async () => {
      const response = await request(app)
        .post('/auth/sync-profile')
        .send({
          ...baseProfileData,
          email: 'john.doe@gmail.com'
        });

      // The request should proceed to the main handler
      // (it may fail due to mocked dependencies, but email validation should pass)
      expect(response.status).not.toBe(400);
    });

    test('should reject purely numeric email', async () => {
      const response = await request(app)
        .post('/auth/sync-profile')
        .send({
          ...baseProfileData,
          email: '123@gmail.com'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('meaningless');
      expect(response.body.field).toBe('email');
    });

    test('should reject test email patterns', async () => {
      const testEmails = [
        'test@example.com',
        'test123@gmail.com',
        'temp@yahoo.com',
        'dummy@hotmail.com',
        'fake@test.org'
      ];

      for (const email of testEmails) {
        const response = await request(app)
          .post('/auth/sync-profile')
          .send({
            ...baseProfileData,
            email
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('meaningless');
        expect(response.body.field).toBe('email');
      }
    });

    test('should reject admin/system email patterns', async () => {
      const systemEmails = [
        'admin@example.com',
        'root@test.com',
        'user@domain.com',
        'noreply@site.org'
      ];

      for (const email of systemEmails) {
        const response = await request(app)
          .post('/auth/sync-profile')
          .send({
            ...baseProfileData,
            email
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('meaningless');
        expect(response.body.field).toBe('email');
      }
    });

    test('should reject keyboard patterns', async () => {
      const keyboardEmails = [
        'qwerty@gmail.com',
        'asdf@yahoo.com',
        'qwerty123@test.com'
      ];

      for (const email of keyboardEmails) {
        const response = await request(app)
          .post('/auth/sync-profile')
          .send({
            ...baseProfileData,
            email
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('meaningless');
        expect(response.body.field).toBe('email');
      }
    });

    test('should reject repeated character patterns', async () => {
      const repetitiveEmails = [
        'aaa@example.com',
        'bbb@test.com',
        'aaaa@domain.org'
      ];

      for (const email of repetitiveEmails) {
        const response = await request(app)
          .post('/auth/sync-profile')
          .send({
            ...baseProfileData,
            email
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('meaningless');
        expect(response.body.field).toBe('email');
      }
    });

    test('should reject suspicious domains', async () => {
      const suspiciousDomainEmails = [
        'user@123',
        'test@a',
        'email@fake',
        'person@test'
      ];

      for (const email of suspiciousDomainEmails) {
        const response = await request(app)
          .post('/auth/sync-profile')
          .send({
            ...baseProfileData,
            email
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('domain');
        expect(response.body.field).toBe('email');
      }
    });

    test('should reject disposable email providers', async () => {
      const disposableEmails = [
        'user@10minutemail.com',
        'test@guerrillamail.com',
        'temp@mailinator.com',
        'fake@yopmail.com'
      ];

      for (const email of disposableEmails) {
        const response = await request(app)
          .post('/auth/sync-profile')
          .send({
            ...baseProfileData,
            email
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('disposable');
        expect(response.body.field).toBe('email');
      }
    });

    test('should reject very short numeric patterns', async () => {
      const shortNumericEmails = [
        '1@example.com',
        '12@test.com'
      ];

      for (const email of shortNumericEmails) {
        const response = await request(app)
          .post('/auth/sync-profile')
          .send({
            ...baseProfileData,
            email
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('too simple');
        expect(response.body.field).toBe('email');
      }
    });

    test('should handle case insensitivity', async () => {
      const response = await request(app)
        .post('/auth/sync-profile')
        .send({
          ...baseProfileData,
          email: 'TEST@EXAMPLE.COM'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('meaningless');
      expect(response.body.field).toBe('email');
    });

    test('should allow profile update without email field', async () => {
      const response = await request(app)
        .post('/auth/sync-profile')
        .send(baseProfileData);

      // Should proceed to main handler since email validation middleware
      // only runs when email is present
      expect(response.status).not.toBe(400);
    });

    test('should accept legitimate business emails', async () => {
      const businessEmails = [
        'contact@company.co.uk',
        'john.smith@business.org',
        'info@legitimate-business.com',
        'support@real-company.net'
      ];

      for (const email of businessEmails) {
        const response = await request(app)
          .post('/auth/sync-profile')
          .send({
            ...baseProfileData,
            email
          });

        // Should not be blocked by email validation
        expect(response.status).not.toBe(400);
      }
    });

    test('should accept emails with numbers in meaningful context', async () => {
      const meaningfulEmails = [
        'user2024@gmail.com',
        'john.doe2@company.com',
        'client123@business.org'
      ];

      for (const email of meaningfulEmails) {
        const response = await request(app)
          .post('/auth/sync-profile')
          .send({
            ...baseProfileData,
            email
          });

        // Should not be blocked by email validation
        expect(response.status).not.toBe(400);
      }
    });
  });
});