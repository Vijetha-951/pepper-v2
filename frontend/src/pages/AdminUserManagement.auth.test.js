import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import AdminUserManagement from './AdminUserManagement';
import authService from '../services/authService';
import userService from '../services/userService';

// Mock the services
jest.mock('../services/authService');
jest.mock('../services/userService');

// Mock window.alert and window.location
global.alert = jest.fn();
Object.defineProperty(window, 'location', {
  value: { href: '' },
  writable: true
});

describe('AdminUserManagement - Authentication Tests', () => {
  const mockValidAdmin = {
    uid: 'admin123',
    role: 'admin',
    email: 'admin@test.com'
  };

  const mockFirebaseUser = {
    uid: 'admin123',
    email: 'admin@test.com'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Clear window.location.href
    window.location.href = '';
    
    // Default mock for userService to prevent additional API calls
    userService.searchUsers.mockResolvedValue({
      users: [],
      total: 0,
      page: 1,
      pageSize: 10
    });
  });

  describe('Happy Path Tests', () => {
    test('Valid admin user access', async () => {
      // Setup: Valid admin user with Firebase user
      authService.getCurrentUser.mockReturnValue(mockValidAdmin);
      authService.getFirebaseUser.mockReturnValue(mockFirebaseUser);

      render(<AdminUserManagement />);

      // Wait for component to render without redirect
      await waitFor(() => {
        expect(screen.getByText('User Management')).toBeInTheDocument();
      });

      // Verify no redirect occurred
      expect(window.location.href).toBe('');
      expect(global.alert).not.toHaveBeenCalled();
    });
  });

  describe('Input Verification Tests', () => {
    test('Missing Firebase user redirects', async () => {
      // Setup: Current user exists but Firebase user is null
      authService.getCurrentUser.mockReturnValue(mockValidAdmin);
      authService.getFirebaseUser.mockReturnValue(null);

      render(<AdminUserManagement />);

      // Wait for redirect to occur
      await waitFor(() => {
        expect(window.location.href).toBe('/login');
      });

      expect(global.alert).toHaveBeenCalledWith('Please log in to access the admin dashboard.');
    });

    test('Missing current user redirects', async () => {
      // Setup: Current user is null but Firebase user exists
      authService.getCurrentUser.mockReturnValue(null);
      authService.getFirebaseUser.mockReturnValue(mockFirebaseUser);

      render(<AdminUserManagement />);

      // Wait for redirect to occur
      await waitFor(() => {
        expect(window.location.href).toBe('/login');
      });

      expect(global.alert).toHaveBeenCalledWith('Please log in to access the admin dashboard.');
    });

    test('Non-admin role redirects', async () => {
      // Setup: Valid user but with non-admin role
      const regularUser = {
        uid: 'user123',
        role: 'user',
        email: 'user@test.com'
      };
      
      authService.getCurrentUser.mockReturnValue(regularUser);
      authService.getFirebaseUser.mockReturnValue(mockFirebaseUser);

      render(<AdminUserManagement />);

      // Wait for redirect to occur
      await waitFor(() => {
        expect(window.location.href).toBe('/login');
      });

      expect(global.alert).toHaveBeenCalledWith('Admin access required. Please contact an administrator.');
    });
  });

  describe('Exception Handling Tests', () => {
    test('Null user values redirect', async () => {
      // Setup: Both users are null
      authService.getCurrentUser.mockReturnValue(null);
      authService.getFirebaseUser.mockReturnValue(null);

      render(<AdminUserManagement />);

      // Wait for redirect to occur
      await waitFor(() => {
        expect(window.location.href).toBe('/login');
      });

      expect(global.alert).toHaveBeenCalledWith('Please log in to access the admin dashboard.');
    });

    test('Undefined role redirect', async () => {
      // Setup: User exists but role is undefined
      const userWithoutRole = {
        uid: 'user123',
        role: undefined,
        email: 'user@test.com'
      };
      
      authService.getCurrentUser.mockReturnValue(userWithoutRole);
      authService.getFirebaseUser.mockReturnValue(mockFirebaseUser);

      render(<AdminUserManagement />);

      // Wait for redirect to occur
      await waitFor(() => {
        expect(window.location.href).toBe('/login');
      });

      expect(global.alert).toHaveBeenCalledWith('Admin access required. Please contact an administrator.');
    });

    test('Firebase auth state inconsistency', async () => {
      // Setup: Current user exists but Firebase user has different UID
      const inconsistentFirebaseUser = {
        uid: 'different-uid',
        email: 'different@test.com'
      };
      
      authService.getCurrentUser.mockReturnValue(mockValidAdmin);
      authService.getFirebaseUser.mockReturnValue(inconsistentFirebaseUser);

      render(<AdminUserManagement />);

      // Even with inconsistent UIDs, if both exist, should allow access
      await waitFor(() => {
        expect(screen.getByText('User Management')).toBeInTheDocument();
      });

      expect(window.location.href).toBe('');
      expect(global.alert).not.toHaveBeenCalled();
    });
  });

  describe('Branching Tests', () => {
    test('Special admin email access', async () => {
      // Setup: User with special admin email but non-admin role
      const specialAdminUser = {
        uid: 'special123',
        role: 'user', // Not admin role
        email: 'vj.vijetha01@gmail.com' // But special admin email
      };
      
      authService.getCurrentUser.mockReturnValue(specialAdminUser);
      authService.getFirebaseUser.mockReturnValue(mockFirebaseUser);

      render(<AdminUserManagement />);

      // Should allow access due to special email
      await waitFor(() => {
        expect(screen.getByText('User Management')).toBeInTheDocument();
      });

      expect(window.location.href).toBe('');
      expect(global.alert).not.toHaveBeenCalled();
    });
  });

  describe('Authentication Error Debugging', () => {
    test('Logs authentication state for debugging', async () => {
      // Setup: Mock console.log to capture debug messages
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
      
      const userWithoutRole = {
        uid: 'user123',
        role: 'user',
        email: 'user@test.com'
      };
      
      authService.getCurrentUser.mockReturnValue(userWithoutRole);
      authService.getFirebaseUser.mockReturnValue(mockFirebaseUser);

      render(<AdminUserManagement />);

      await waitFor(() => {
        expect(window.location.href).toBe('/login');
      });

      // Verify debug logs are created
      expect(consoleLogSpy).toHaveBeenCalledWith('User role:', 'user', 'Email:', 'user@test.com');
      
      consoleLogSpy.mockRestore();
    });

    test('Successful authentication logs', async () => {
      // Setup: Mock console.log to capture debug messages
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
      
      authService.getCurrentUser.mockReturnValue(mockValidAdmin);
      authService.getFirebaseUser.mockReturnValue(mockFirebaseUser);

      render(<AdminUserManagement />);

      await waitFor(() => {
        expect(screen.getByText('User Management')).toBeInTheDocument();
      });

      // Verify success log is created
      expect(consoleLogSpy).toHaveBeenCalledWith('Admin access granted for:', 'admin@test.com', 'Role:', 'admin');
      
      consoleLogSpy.mockRestore();
    });
  });

  describe('Service Error Handling', () => {
    test('Auth service errors are handled gracefully', async () => {
      // Setup: Auth service throws error
      authService.getCurrentUser.mockImplementation(() => {
        throw new Error('Auth service error');
      });
      authService.getFirebaseUser.mockReturnValue(mockFirebaseUser);

      render(<AdminUserManagement />);

      // Should redirect to login even with auth service error
      await waitFor(() => {
        expect(window.location.href).toBe('/login');
      });
    });

    test('Firebase service errors are handled gracefully', async () => {
      // Setup: Firebase service throws error
      authService.getCurrentUser.mockReturnValue(mockValidAdmin);
      authService.getFirebaseUser.mockImplementation(() => {
        throw new Error('Firebase service error');
      });

      render(<AdminUserManagement />);

      // Should redirect to login with Firebase service error
      await waitFor(() => {
        expect(window.location.href).toBe('/login');
      });
    });
  });
});