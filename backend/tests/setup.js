import mongoose from 'mongoose';

// Mock Firebase Admin SDK
jest.mock('../src/config/firebase.js', () => ({
  default: {
    auth: () => ({
      deleteUser: jest.fn(),
      verifyIdToken: jest.fn()
    })
  }
}));

// Mock Firestore
jest.mock('firebase-admin/firestore', () => ({
  getFirestore: jest.fn(() => ({
    collection: jest.fn(() => ({
      doc: jest.fn(() => ({
        delete: jest.fn()
      }))
    }))
  }))
}));

// Setup test database connection
beforeAll(async () => {
  // Connect to test database or mock database connection
  if (mongoose.connection.readyState === 0) {
    // Only connect if not already connected
    try {
      await mongoose.connect('mongodb://localhost:27017/pepper_test', {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
    } catch (error) {
      // If connection fails, mock mongoose methods
      console.warn('MongoDB connection failed, mocking database operations');
    }
  }
});

// Clean up after tests
afterAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
  }
});

// Clear all mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
});