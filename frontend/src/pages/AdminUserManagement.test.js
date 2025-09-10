import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import AdminUserManagement from './AdminUserManagement';
import authService from '../services/authService';
import userService from '../services/userService';

// Mock the services
jest.mock('../services/authService');
jest.mock('../services/userService');

// Mock window.confirm
global.confirm = jest.fn();

describe('AdminUserManagement', () => {
  const mockCurrentUser = {
    role: 'admin',
    email: 'admin@test.com'
  };

  const mockUsers = [
    {
      _id: '1',
      firebaseUid: 'firebase-uid-1',
      email: 'user1@test.com',
      firstName: 'John',
      lastName: 'Doe',
      role: 'user',
      status: 'pending',
      isActive: false,
      areas: ['Kochi']
    },
    {
      _id: '2',
      firebaseUid: 'firebase-uid-2',
      email: 'user2@test.com',
      firstName: 'Jane',
      lastName: 'Smith',
      role: 'deliveryboy',
      status: 'approved',
      isActive: true,
      areas: ['Thrissur']
    }
  ];

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock authService
    authService.getCurrentUser.mockReturnValue(mockCurrentUser);
    
    // Mock userService default responses
    userService.searchUsers.mockResolvedValue({
      users: mockUsers,
      total: 2,
      page: 1,
      pageSize: 10
    });
    userService.approveUser.mockResolvedValue({ success: true });
    userService.rejectUser.mockResolvedValue({ success: true });
    userService.updateUserRole.mockResolvedValue({ success: true });
    userService.updateUserAreas.mockResolvedValue({ success: true });
    userService.deleteUser.mockResolvedValue({ success: true });
  });

  describe('Happy Path Tests', () => {
    test('Admin approves pending user', async () => {
      await act(async () => {
        render(<AdminUserManagement />);
      });
      
      // Wait for users to load
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      // Find and click the approve button for the first user
      const approveButtons = screen.getAllByText(/Approve/);
      
      await act(async () => {
        fireEvent.click(approveButtons[0]);
      });

      // Verify the approve API was called with correct user ID
      await waitFor(() => {
        expect(userService.approveUser).toHaveBeenCalledWith('1');
      });

      // Verify users are refetched after approval
      expect(userService.searchUsers).toHaveBeenCalledTimes(2);
    });

    test('Admin rejects user with reason', async () => {
      render(<AdminUserManagement />);
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      // Find and click the reject button
      const rejectButtons = screen.getAllByText(/Reject/);
      fireEvent.click(rejectButtons[0]);

      // Modal should appear
      await waitFor(() => {
        expect(screen.getByText('Reject user')).toBeInTheDocument();
      });

      // Enter rejection reason
      const reasonTextarea = screen.getByPlaceholderText('Reason (optional)');
      fireEvent.change(reasonTextarea, { target: { value: 'Invalid information provided' } });

      // Click reject button in modal
      const modalRejectButton = screen.getByText('Reject');
      fireEvent.click(modalRejectButton);

      // Verify reject API was called
      await waitFor(() => {
        expect(userService.rejectUser).toHaveBeenCalledWith('1', 'Invalid information provided');
      });
    });

    test('Admin changes user role', async () => {
      render(<AdminUserManagement />);
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      // Find and click the Change button for role
      const changeRoleButtons = screen.getAllByText(/Change/);
      fireEvent.click(changeRoleButtons[0]);

      // Modal should appear
      await waitFor(() => {
        expect(screen.getByText('Change role')).toBeInTheDocument();
      });

      // Change role to admin
      const roleSelect = screen.getByDisplayValue('user');
      fireEvent.change(roleSelect, { target: { value: 'admin' } });

      // Click update button
      const updateButton = screen.getByText('Update');
      fireEvent.click(updateButton);

      // Verify role update API was called
      await waitFor(() => {
        expect(userService.updateUserRole).toHaveBeenCalledWith('1', 'admin');
      });
    });

    test('Admin updates delivery areas', async () => {
      render(<AdminUserManagement />);
      
      await waitFor(() => {
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      });

      // Find and click the Edit areas button
      const editAreasButtons = screen.getAllByText(/Edit areas/);
      fireEvent.click(editAreasButtons[1]); // Second user

      // Modal should appear
      await waitFor(() => {
        expect(screen.getByText('Edit areas')).toBeInTheDocument();
      });

      // Update areas
      const areasTextarea = screen.getByPlaceholderText('Enter comma-separated areas (e.g., Kochi, Thrissur)');
      fireEvent.change(areasTextarea, { target: { value: 'Kochi, Ernakulam, 682001' } });

      // Click save button
      const saveButton = screen.getByText('Save');
      fireEvent.click(saveButton);

      // Verify areas update API was called
      await waitFor(() => {
        expect(userService.updateUserAreas).toHaveBeenCalledWith('2', ['Kochi', 'Ernakulam', '682001']);
      });
    });
  });

  describe('Input Verification Tests', () => {
    test('Invalid user ID handling', async () => {
      // Mock API to return 404 error
      userService.approveUser.mockRejectedValue(new Error('User not found'));
      
      render(<AdminUserManagement />);
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      // Click approve button
      const approveButtons = screen.getAllByText(/Approve/);
      fireEvent.click(approveButtons[0]);

      // Wait for error message to appear
      await waitFor(() => {
        expect(screen.getByText('User not found')).toBeInTheDocument();
      });
    });

    test('Empty role change request', async () => {
      render(<AdminUserManagement />);
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      // Find and click the Change button for role
      const changeRoleButtons = screen.getAllByText(/Change/);
      fireEvent.click(changeRoleButtons[0]);

      // Modal should appear
      await waitFor(() => {
        expect(screen.getByText('Change role')).toBeInTheDocument();
      });

      // Don't change role, just click update
      const updateButton = screen.getByText('Update');
      fireEvent.click(updateButton);

      // Should still call with current role
      await waitFor(() => {
        expect(userService.updateUserRole).toHaveBeenCalledWith('1', 'user');
      });
    });
  });

  describe('Exception Handling Tests', () => {
    test('Non-admin user access blocked', () => {
      // Mock non-admin user
      const nonAdminUser = { ...mockCurrentUser, role: 'user' };
      authService.getCurrentUser.mockReturnValue(nonAdminUser);

      // Mock window.location.href
      delete window.location;
      window.location = { href: jest.fn() };

      render(<AdminUserManagement />);

      // Should redirect to login
      expect(window.location.href).toBe('/login');
    });

    test('Network error during operations', async () => {
      // Mock network error
      userService.searchUsers.mockRejectedValue(new Error('Network error'));
      
      render(<AdminUserManagement />);

      // Wait for error message
      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument();
      });
    });
  });

  describe('Loading States', () => {
    test('Shows loading spinner during user fetch', () => {
      // Mock pending promise
      userService.searchUsers.mockImplementation(() => new Promise(() => {}));
      
      render(<AdminUserManagement />);
      
      expect(screen.getByText('Loading users...')).toBeInTheDocument();
    });

    test('Shows loading state during approve action', async () => {
      // Mock slow approval
      userService.approveUser.mockImplementation(() => new Promise(() => {}));
      
      render(<AdminUserManagement />);
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      // Click approve
      const approveButtons = screen.getAllByText(/Approve/);
      fireEvent.click(approveButtons[0]);

      // Should show loading state (disabled button or spinner)
      await waitFor(() => {
        expect(approveButtons[0]).toBeDisabled();
      });
    });
  });

  describe('User Interface Tests', () => {
    test('Displays user information correctly', async () => {
      render(<AdminUserManagement />);
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('user1@test.com')).toBeInTheDocument();
        expect(screen.getByText('user')).toBeInTheDocument();
        expect(screen.getByText('pending')).toBeInTheDocument();
      });
    });

    test('Filter functionality works', async () => {
      render(<AdminUserManagement />);
      
      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      // Test role filter
      const roleFilter = screen.getByDisplayValue('All Roles');
      fireEvent.change(roleFilter, { target: { value: 'user' } });

      // Click search
      const searchButton = screen.getByText('Search');
      fireEvent.click(searchButton);

      // Verify API was called with filter
      expect(userService.searchUsers).toHaveBeenCalledWith({
        query: '',
        role: 'user',
        status: '',
        page: 1,
        limit: 10
      });
    });

    test('Search functionality works', async () => {
      render(<AdminUserManagement />);
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      // Enter search query
      const searchInput = screen.getByPlaceholderText('Search name, email, phone');
      fireEvent.change(searchInput, { target: { value: 'John' } });

      // Submit search
      const searchButton = screen.getByText('Search');
      fireEvent.click(searchButton);

      // Verify API was called with search query
      expect(userService.searchUsers).toHaveBeenCalledWith({
        query: 'John',
        role: '',
        status: '',
        page: 1,
        limit: 10
      });
    });
  });
});