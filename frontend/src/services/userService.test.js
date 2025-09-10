import userService from './userService';
import { apiFetch } from './api';

// Mock the apiFetch function
jest.mock('./api', () => ({
  apiFetch: jest.fn()
}));

describe('userService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Happy Path Tests', () => {
    test('Admin approves pending user', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ success: true, user: { id: '1', isActive: true } })
      };
      apiFetch.mockResolvedValue(mockResponse);

      const result = await userService.approveUser('user123');

      expect(apiFetch).toHaveBeenCalledWith(
        'http://localhost:5000/api/admin/users/user123/approve',
        { method: 'PATCH' }
      );
      expect(result).toEqual({ success: true, user: { id: '1', isActive: true } });
    });

    test('Admin rejects user with reason', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ success: true, user: { id: '1', isActive: false } })
      };
      apiFetch.mockResolvedValue(mockResponse);

      const result = await userService.rejectUser('user123', 'Invalid information');

      expect(apiFetch).toHaveBeenCalledWith(
        'http://localhost:5000/api/admin/users/user123/reject',
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reason: 'Invalid information' })
        }
      );
      expect(result).toEqual({ success: true, user: { id: '1', isActive: false } });
    });

    test('Admin changes user role', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ success: true, user: { id: '1', role: 'admin' } })
      };
      apiFetch.mockResolvedValue(mockResponse);

      const result = await userService.updateUserRole('user123', 'admin');

      expect(apiFetch).toHaveBeenCalledWith(
        'http://localhost:5000/api/admin/users/user123/role',
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ role: 'admin' })
        }
      );
      expect(result).toEqual({ success: true, user: { id: '1', role: 'admin' } });
    });

    test('Admin updates delivery areas', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ 
          success: true, 
          user: { id: '1', assignedAreas: { pincodes: ['682001'], districts: ['Kochi'] } }
        })
      };
      apiFetch.mockResolvedValue(mockResponse);

      const result = await userService.updateUserAreas('user123', ['Kochi', '682001']);

      expect(apiFetch).toHaveBeenCalledWith(
        'http://localhost:5000/api/admin/delivery-boys/user123/areas',
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            pincodes: ['682001'], 
            districts: ['Kochi'] 
          })
        }
      );
      expect(result).toEqual({ 
        success: true, 
        user: { id: '1', assignedAreas: { pincodes: ['682001'], districts: ['Kochi'] } }
      });
    });
  });

  describe('Input Verification Tests', () => {
    test('Invalid user ID handling', async () => {
      const mockResponse = {
        ok: false,
        status: 404,
        json: jest.fn().mockResolvedValue({ error: 'User not found' })
      };
      apiFetch.mockResolvedValue(mockResponse);

      await expect(userService.approveUser('invalid-id')).rejects.toThrow('User not found');
    });

    test('Empty role change request', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ success: true })
      };
      apiFetch.mockResolvedValue(mockResponse);

      await userService.updateUserRole('user123', '');

      expect(apiFetch).toHaveBeenCalledWith(
        'http://localhost:5000/api/admin/users/user123/role',
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ role: '' })
        }
      );
    });

    test('Handles areas with mixed pincodes and districts', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ success: true })
      };
      apiFetch.mockResolvedValue(mockResponse);

      await userService.updateUserAreas('user123', ['Kochi', '682001', 'Thrissur', '680301']);

      expect(apiFetch).toHaveBeenCalledWith(
        'http://localhost:5000/api/admin/delivery-boys/user123/areas',
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            pincodes: ['682001', '680301'], 
            districts: ['Kochi', 'Thrissur'] 
          })
        }
      );
    });

    test('Handles empty areas array', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ success: true })
      };
      apiFetch.mockResolvedValue(mockResponse);

      await userService.updateUserAreas('user123', []);

      expect(apiFetch).toHaveBeenCalledWith(
        'http://localhost:5000/api/admin/delivery-boys/user123/areas',
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            pincodes: [], 
            districts: [] 
          })
        }
      );
    });
  });

  describe('Exception Handling Tests', () => {
    test('Network error during operations', async () => {
      apiFetch.mockRejectedValue(new Error('Network error'));

      await expect(userService.approveUser('user123')).rejects.toThrow('Network error');
    });

    test('Server error response', async () => {
      const mockResponse = {
        ok: false,
        status: 500,
        json: jest.fn().mockResolvedValue({ message: 'Internal server error' })
      };
      apiFetch.mockResolvedValue(mockResponse);

      await expect(userService.updateUserRole('user123', 'admin')).rejects.toThrow('Internal server error');
    });

    test('Invalid JSON response', async () => {
      const mockResponse = {
        ok: false,
        status: 400,
        json: jest.fn().mockRejectedValue(new Error('Invalid JSON'))
      };
      apiFetch.mockResolvedValue(mockResponse);

      await expect(userService.rejectUser('user123', 'reason')).rejects.toThrow('Request failed with 400');
    });

    test('Malformed response data', async () => {
      const mockResponse = {
        ok: false,
        status: 400,
        json: jest.fn().mockResolvedValue(null)
      };
      apiFetch.mockResolvedValue(mockResponse);

      await expect(userService.deleteUser('user123')).rejects.toThrow('Request failed with 400');
    });
  });

  describe('searchUsers method', () => {
    test('Search with all parameters', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          users: [{ id: '1', name: 'John' }],
          total: 1,
          page: 1,
          limit: 10
        })
      };
      apiFetch.mockResolvedValue(mockResponse);

      const result = await userService.searchUsers({
        query: 'John',
        role: 'user',
        status: 'approved',
        page: 2,
        limit: 20
      });

      expect(apiFetch).toHaveBeenCalledWith(
        'http://localhost:5000/api/admin/users?q=John&role=user&active=true&page=2&limit=20',
        { method: 'GET' }
      );

      expect(result).toEqual({
        users: [{ id: '1', name: 'John' }],
        total: 1,
        page: 1,
        pageSize: 10
      });
    });

    test('Search with minimal parameters', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          users: [],
          total: 0
        })
      };
      apiFetch.mockResolvedValue(mockResponse);

      const result = await userService.searchUsers();

      expect(apiFetch).toHaveBeenCalledWith(
        'http://localhost:5000/api/admin/users?page=1&limit=10',
        { method: 'GET' }
      );

      expect(result).toEqual({
        users: [],
        total: 0,
        page: 1,
        pageSize: 10
      });
    });

    test('Handles different response shapes', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          items: [{ id: '1' }],
          count: 5,
          pageSize: 15
        })
      };
      apiFetch.mockResolvedValue(mockResponse);

      const result = await userService.searchUsers({ page: 1, limit: 10 });

      expect(result).toEqual({
        users: [{ id: '1' }],
        total: 5,
        page: 1,
        pageSize: 15
      });
    });
  });

  describe('deleteUser method', () => {
    test('Successfully deletes user', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ success: true, message: 'User deleted' })
      };
      apiFetch.mockResolvedValue(mockResponse);

      const result = await userService.deleteUser('user123');

      expect(apiFetch).toHaveBeenCalledWith(
        'http://localhost:5000/api/admin/users/user123',
        { method: 'DELETE' }
      );
      expect(result).toEqual({ success: true, message: 'User deleted' });
    });
  });
});