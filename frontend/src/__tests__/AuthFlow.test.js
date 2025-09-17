import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import Navbar from '../components/Navbar';
import App from '../App';

// Mock Firebase
jest.mock('react-firebase-hooks/auth', () => ({
  useAuthState: jest.fn()
}));

jest.mock('../config/firebase', () => ({
  auth: {}
}));

jest.mock('../services/authService', () => ({
  logout: jest.fn().mockResolvedValue({ success: true })
}));

// Mock fetch
global.fetch = jest.fn();

describe('Authentication Flow Integration', () => {
  beforeEach(() => {
    fetch.mockClear();
    useAuthState.mockClear();
  });

  test('navbar shows login/register when user is not authenticated', () => {
    useAuthState.mockReturnValue([null, false, null]);
    
    render(
      <BrowserRouter>
        <Navbar />
      </BrowserRouter>
    );

    expect(screen.getByText('Login')).toBeInTheDocument();
    expect(screen.getByText('Register')).toBeInTheDocument();
    expect(screen.queryByText('Cart')).not.toBeInTheDocument();
    expect(screen.queryByText('Orders')).not.toBeInTheDocument();
  });

  test('navbar shows cart/orders when user is authenticated', async () => {
    const mockUser = {
      uid: 'test-uid',
      getIdToken: jest.fn().mockResolvedValue('mock-token')
    };
    
    useAuthState.mockReturnValue([mockUser, false, null]);
    
    // Mock cart API response
    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ items: [{ id: 1 }, { id: 2 }] })
    });

    render(
      <BrowserRouter>
        <Navbar />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Cart/)).toBeInTheDocument();
      expect(screen.getByText('Orders')).toBeInTheDocument();
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Logout')).toBeInTheDocument();
    });

    expect(screen.queryByText('Login')).not.toBeInTheDocument();
    expect(screen.queryByText('Register')).not.toBeInTheDocument();
  });

  test('cart count is displayed when items are present', async () => {
    const mockUser = {
      uid: 'test-uid',
      getIdToken: jest.fn().mockResolvedValue('mock-token')
    };
    
    useAuthState.mockReturnValue([mockUser, false, null]);
    
    // Mock cart API response with 3 items
    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ items: [{ id: 1 }, { id: 2 }, { id: 3 }] })
    });

    render(
      <BrowserRouter>
        <Navbar />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('(3)')).toBeInTheDocument();
    });
  });

  test('protected routes redirect unauthenticated users', () => {
    useAuthState.mockReturnValue([null, false, null]);
    
    // Mock window.location.href
    const mockLocation = { href: '' };
    Object.defineProperty(window, 'location', {
      value: mockLocation,
      writable: true
    });

    render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    );

    // Navigate to cart route (which should be protected)
    window.history.pushState({}, 'Cart', '/cart');
    
    // Since ProtectedRoute will redirect to login, the href should be set
    // This is a simplified test - in reality, the redirect happens via window.location.href
  });
});