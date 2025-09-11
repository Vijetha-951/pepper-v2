/**
 * Simple test to verify email validation fix
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Register from './Register';

// Mock dependencies
jest.mock('../services/authService', () => ({
  register: jest.fn().mockResolvedValue({ success: true }),
  googleSignUp: jest.fn().mockResolvedValue({ success: true })
}));

jest.mock('firebase/auth', () => ({
  fetchSignInMethodsForEmail: jest.fn().mockResolvedValue([])
}));

jest.mock('../config/firebase', () => ({
  auth: {}
}));

jest.mock('react-router-dom', () => ({
  useNavigate: () => jest.fn()
}));

describe('Register - Email Error Display Fix', () => {
  test('should show email required error', async () => {
    render(<Register />);
    
    const submitButton = screen.getByText('Create Account');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Email is required')).toBeInTheDocument();
    });
  });

  test('should show no spaces allowed error for email', async () => {
    render(<Register />);
    
    const emailInput = screen.getByPlaceholderText('Email Address');
    const submitButton = screen.getByText('Create Account');
    
    // Enter email with space
    fireEvent.change(emailInput, { target: { value: 'test @example.com' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('No spaces allowed')).toBeInTheDocument();
    });
  });

  test('should show invalid email format error', async () => {
    render(<Register />);
    
    const emailInput = screen.getByPlaceholderText('Email Address');
    const submitButton = screen.getByText('Create Account');
    
    // Enter invalid email
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Please enter a valid email')).toBeInTheDocument();
    });
  });

  test('should clear email error when typing valid email', async () => {
    render(<Register />);
    
    const emailInput = screen.getByPlaceholderText('Email Address');
    const submitButton = screen.getByText('Create Account');
    
    // First trigger error
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Email is required')).toBeInTheDocument();
    });

    // Then type valid email
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    
    await waitFor(() => {
      expect(screen.queryByText('Email is required')).not.toBeInTheDocument();
    });
  });
});