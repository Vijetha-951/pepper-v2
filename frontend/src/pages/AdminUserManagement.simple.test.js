import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import AdminUserManagement from './AdminUserManagement';
import authService from '../services/authService';
import userService from '../services/userService';

// Mock the services
jest.mock('../services/authService');
jest.mock('../services/userService');

// Mock window.confirm and location
global.confirm = jest.fn(() => true);
Object.defineProperty(window, 'location', {
  value: { href: '' },
  writable: true
});

describe('AdminUserManagement - Core Functionality Tests', () => {
  const mockCurrentUser = {
    role: 'admin',
    email: 'admin@test.com'
  };

  const mockUsers = [
    {
      _id: '1',
      uid: '1',
      id: '1',
      email: 'user1@test.com',
      displayName: 'John Doe',
      firstName: 'John',
      lastName: 'Doe',
      role: 'user',
      status: 'pending',
      isActive: false,
      areas: ['Kochi']
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    authService.getCurrentUser.mockReturnValue(mockCurrentUser);
    userService.searchUsers.mockResolvedValue({
      users: mockUsers,
      total: 1,
      page: 1,
      pageSize: 10
    });
    userService.approveUser.mockResolvedValue({ success: true });
    userService.rejectUser.mockResolvedValue({ success: true });
    userService.updateUserRole.mockResolvedValue({ success: true });
    userService.updateUserAreas.mockResolvedValue({ success: true });
    userService.deleteUser.mockResolvedValue({ success: true });
  });

  test('Component renders and loads users', async () => {
    await act(async () => {
      render(<AdminUserManagement />);
    });

    await waitFor(() => {
      expect(screen.getByText('User Management')).toBeInTheDocument();
    });

    expect(userService.searchUsers).toHaveBeenCalled();
  });

  test('Admin can approve user', async () => {
    userService.searchUsers
      .mockResolvedValueOnce({
        users: mockUsers,
        total: 1,
        page: 1,
        pageSize: 10
      })
      .mockResolvedValueOnce({
        users: [],
        total: 0,
        page: 1,
        pageSize: 10
      });

    await act(async () => {
      render(<AdminUserManagement />);
    });

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    const approveButtons = screen.getAllByRole('button', { name: /approve/i });
    
    await act(async () => {
      fireEvent.click(approveButtons[0]);
    });

    await waitFor(() => {
      expect(userService.approveUser).toHaveBeenCalledWith('1');
    });
  });

  test('Admin can reject user with modal', async () => {
    await act(async () => {
      render(<AdminUserManagement />);
    });

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    // Click reject button
    const rejectButtons = screen.getAllByRole('button', { name: /reject/i });
    
    await act(async () => {
      fireEvent.click(rejectButtons[0]);
    });

    // Modal should appear
    await waitFor(() => {
      expect(screen.getByText('Reject user')).toBeInTheDocument();
    });

    // Enter reason and confirm
    const reasonTextarea = screen.getByPlaceholderText('Reason (optional)');
    await act(async () => {
      fireEvent.change(reasonTextarea, { target: { value: 'Test reason' } });
    });

    const confirmButton = screen.getByRole('button', { name: /reject/i });
    await act(async () => {
      fireEvent.click(confirmButton);
    });

    await waitFor(() => {
      expect(userService.rejectUser).toHaveBeenCalledWith('1', 'Test reason');
    });
  });

  test('Service layer - userService methods work correctly', async () => {
    // Test approve
    await userService.approveUser('user123');
    expect(userService.approveUser).toHaveBeenCalledWith('user123');

    // Test reject  
    await userService.rejectUser('user123', 'Invalid info');
    expect(userService.rejectUser).toHaveBeenCalledWith('user123', 'Invalid info');

    // Test role update
    await userService.updateUserRole('user123', 'admin');
    expect(userService.updateUserRole).toHaveBeenCalledWith('user123', 'admin');

    // Test areas update
    await userService.updateUserAreas('user123', ['Kochi', '682001']);
    expect(userService.updateUserAreas).toHaveBeenCalledWith('user123', ['Kochi', '682001']);
  });

  test('Error handling works', async () => {
    userService.searchUsers.mockRejectedValue(new Error('Network error'));

    await act(async () => {
      render(<AdminUserManagement />);
    });

    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });
  });

  test('Non-admin access redirects', () => {
    const nonAdminUser = { ...mockCurrentUser, role: 'user' };
    authService.getCurrentUser.mockReturnValue(nonAdminUser);

    render(<AdminUserManagement />);

    expect(window.location.href).toBe('/login');
  });
});