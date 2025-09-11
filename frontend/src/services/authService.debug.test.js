import authService from './authService';
import firebaseAuthService from './firebaseAuthService';

// Mock Firebase Auth Service
jest.mock('./firebaseAuthService');

describe('AuthService - Authentication State Debugging', () => {
  const mockFirebaseUser = {
    uid: 'firebase123',
    email: 'admin@test.com',
    getIdToken: jest.fn().mockResolvedValue('mock-token')
  };

  const mockStoredUser = {
    uid: 'firebase123',
    email: 'admin@test.com',
    role: 'admin',
    displayName: 'Admin User'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getCurrentUser Method Tests', () => {
    test('Returns user when Firebase user exists and stored data available', () => {
      // Setup: Firebase user exists and stored data is available
      firebaseAuthService.getCurrentUser.mockReturnValue(mockFirebaseUser);
      firebaseAuthService.getStoredUserData.mockReturnValue(mockStoredUser);
      
      // Create fresh authService instance
      const freshAuthService = new authService.constructor();
      
      const result = freshAuthService.getCurrentUser();
      
      expect(result).toEqual(mockStoredUser);
      expect(firebaseAuthService.getCurrentUser).toHaveBeenCalled();
    });

    test('Returns null when Firebase user does not exist', () => {
      // Setup: No Firebase user
      firebaseAuthService.getCurrentUser.mockReturnValue(null);
      firebaseAuthService.getStoredUserData.mockReturnValue(mockStoredUser);
      
      const result = authService.getCurrentUser();
      
      expect(result).toBeNull();
      expect(firebaseAuthService.getCurrentUser).toHaveBeenCalled();
    });

    test('Returns stored data when Firebase user exists but no cached user', () => {
      // Setup: Firebase user exists but no cached user in authService
      firebaseAuthService.getCurrentUser.mockReturnValue(mockFirebaseUser);
      firebaseAuthService.getStoredUserData.mockReturnValue(mockStoredUser);
      
      // Clear cached user
      authService.user = null;
      
      const result = authService.getCurrentUser();
      
      expect(result).toEqual(mockStoredUser);
    });

    test('Returns null when both Firebase user and stored data are null', () => {
      // Setup: No Firebase user and no stored data
      firebaseAuthService.getCurrentUser.mockReturnValue(null);
      firebaseAuthService.getStoredUserData.mockReturnValue(null);
      
      const result = authService.getCurrentUser();
      
      expect(result).toBeNull();
    });
  });

  describe('getFirebaseUser Method Tests', () => {
    test('Returns Firebase user when available', () => {
      firebaseAuthService.getCurrentUser.mockReturnValue(mockFirebaseUser);
      
      const result = authService.getFirebaseUser();
      
      expect(result).toEqual(mockFirebaseUser);
      expect(firebaseAuthService.getCurrentUser).toHaveBeenCalled();
    });

    test('Returns null when Firebase user not available', () => {
      firebaseAuthService.getCurrentUser.mockReturnValue(null);
      
      const result = authService.getFirebaseUser();
      
      expect(result).toBeNull();
    });
  });

  describe('Authentication State Scenarios', () => {
    test('Scenario 1: Fresh login - both users available', () => {
      // Fresh login scenario where both Firebase and stored user data exist
      firebaseAuthService.getCurrentUser.mockReturnValue(mockFirebaseUser);
      firebaseAuthService.getStoredUserData.mockReturnValue(mockStoredUser);
      firebaseAuthService.isAuthenticated.mockReturnValue(true);
      
      authService.user = mockStoredUser; // Simulate successful login
      
      const currentUser = authService.getCurrentUser();
      const firebaseUser = authService.getFirebaseUser();
      const isAuth = authService.isAuthenticated();
      
      expect(currentUser).toEqual(mockStoredUser);
      expect(firebaseUser).toEqual(mockFirebaseUser);
      expect(isAuth).toBe(true);
    });

    test('Scenario 2: Session expired - Firebase user exists but no stored data', () => {
      // Session expired scenario where Firebase user exists but stored data is lost
      firebaseAuthService.getCurrentUser.mockReturnValue(mockFirebaseUser);
      firebaseAuthService.getStoredUserData.mockReturnValue(null);
      firebaseAuthService.isAuthenticated.mockReturnValue(true);
      
      authService.user = null; // Simulate lost session
      
      const currentUser = authService.getCurrentUser();
      const firebaseUser = authService.getFirebaseUser();
      const isAuth = authService.isAuthenticated();
      
      expect(currentUser).toBeNull();
      expect(firebaseUser).toEqual(mockFirebaseUser);
      expect(isAuth).toBe(false); // Should be false due to no stored user
    });

    test('Scenario 3: Complete logout - no Firebase user, no stored data', () => {
      // Complete logout scenario
      firebaseAuthService.getCurrentUser.mockReturnValue(null);
      firebaseAuthService.getStoredUserData.mockReturnValue(null);
      firebaseAuthService.isAuthenticated.mockReturnValue(false);
      
      authService.user = null;
      
      const currentUser = authService.getCurrentUser();
      const firebaseUser = authService.getFirebaseUser();
      const isAuth = authService.isAuthenticated();
      
      expect(currentUser).toBeNull();
      expect(firebaseUser).toBeNull();
      expect(isAuth).toBe(false);
    });

    test('Scenario 4: Corrupted state - stored user without Firebase user', () => {
      // Corrupted state where stored user exists but Firebase user is gone
      firebaseAuthService.getCurrentUser.mockReturnValue(null);
      firebaseAuthService.getStoredUserData.mockReturnValue(mockStoredUser);
      firebaseAuthService.isAuthenticated.mockReturnValue(false);
      
      authService.user = mockStoredUser; // Simulate corrupted state
      
      const currentUser = authService.getCurrentUser();
      const firebaseUser = authService.getFirebaseUser();
      const isAuth = authService.isAuthenticated();
      
      expect(currentUser).toBeNull(); // Should clear and return null
      expect(firebaseUser).toBeNull();
      expect(isAuth).toBe(false);
    });
  });

  describe('Admin Authentication Edge Cases', () => {
    test('User with admin role but undefined email', () => {
      const userWithoutEmail = {
        uid: 'firebase123',
        role: 'admin',
        email: undefined
      };
      
      firebaseAuthService.getCurrentUser.mockReturnValue(mockFirebaseUser);
      firebaseAuthService.getStoredUserData.mockReturnValue(userWithoutEmail);
      
      const result = authService.getCurrentUser();
      
      expect(result).toEqual(userWithoutEmail);
      expect(result.role).toBe('admin');
      expect(result.email).toBeUndefined();
    });

    test('User with special admin email but no role', () => {
      const specialEmailUser = {
        uid: 'firebase123',
        email: 'vj.vijetha01@gmail.com',
        role: undefined
      };
      
      firebaseAuthService.getCurrentUser.mockReturnValue(mockFirebaseUser);
      firebaseAuthService.getStoredUserData.mockReturnValue(specialEmailUser);
      
      const result = authService.getCurrentUser();
      
      expect(result).toEqual(specialEmailUser);
      expect(result.email).toBe('vj.vijetha01@gmail.com');
      expect(result.role).toBeUndefined();
    });

    test('User with null role property', () => {
      const userWithNullRole = {
        uid: 'firebase123',
        email: 'user@test.com',
        role: null
      };
      
      firebaseAuthService.getCurrentUser.mockReturnValue(mockFirebaseUser);
      firebaseAuthService.getStoredUserData.mockReturnValue(userWithNullRole);
      
      const result = authService.getCurrentUser();
      
      expect(result).toEqual(userWithNullRole);
      expect(result.role).toBeNull();
    });
  });

  describe('State Debugging Utilities', () => {
    test('Auth state consistency check', () => {
      // Test utility to check if auth state is consistent
      const checkAuthState = () => {
        const currentUser = authService.getCurrentUser();
        const firebaseUser = authService.getFirebaseUser();
        const isAuth = authService.isAuthenticated();
        
        return {
          hasCurrentUser: !!currentUser,
          hasFirebaseUser: !!firebaseUser,
          isAuthenticated: isAuth,
          userRole: currentUser?.role,
          userEmail: currentUser?.email,
          firebaseUid: firebaseUser?.uid
        };
      };
      
      // Test consistent state
      firebaseAuthService.getCurrentUser.mockReturnValue(mockFirebaseUser);
      firebaseAuthService.getStoredUserData.mockReturnValue(mockStoredUser);
      firebaseAuthService.isAuthenticated.mockReturnValue(true);
      authService.user = mockStoredUser;
      
      const state = checkAuthState();
      
      expect(state).toEqual({
        hasCurrentUser: true,
        hasFirebaseUser: true,
        isAuthenticated: true,
        userRole: 'admin',
        userEmail: 'admin@test.com',
        firebaseUid: 'firebase123'
      });
    });

    test('Detect authentication inconsistency', () => {
      // Setup inconsistent state
      firebaseAuthService.getCurrentUser.mockReturnValue(null);
      firebaseAuthService.getStoredUserData.mockReturnValue(mockStoredUser);
      firebaseAuthService.isAuthenticated.mockReturnValue(false);
      authService.user = mockStoredUser;
      
      const state = {
        currentUser: authService.getCurrentUser(),
        firebaseUser: authService.getFirebaseUser(),
        isAuth: authService.isAuthenticated()
      };
      
      // This represents the problematic state you might be experiencing
      expect(state.currentUser).toBeNull(); // No current user due to no Firebase user
      expect(state.firebaseUser).toBeNull(); // No Firebase user
      expect(state.isAuth).toBe(false); // Not authenticated
    });
  });
});