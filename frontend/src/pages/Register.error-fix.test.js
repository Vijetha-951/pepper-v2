/**
 * Tests for Register component error message display fixes
 * Covers the issues:
 * 1. Email validation message consistency 
 * 2. First name error display after email validation
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

describe('Register - Error Message Display Fixes', () => {
  
  test('should show consistent email error messages', async () => {
    render(<Register />);
    
    const emailInput = screen.getByPlaceholderText('Email Address');
    const submitButton = screen.getByText('Create Account');
    
    // Test empty email shows custom error message
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Email is required')).toBeInTheDocument();
    });
    
    // Test invalid email shows custom error message
    fireEvent.change(emailInput, { target: { value: '123' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Please enter a valid email')).toBeInTheDocument();
    });
  });
  
  test('should show first name error after invalid email is entered', async () => {
    render(<Register />);
    
    const emailInput = screen.getByPlaceholderText('Email Address');
    const firstNameInput = screen.getByPlaceholderText('First Name');
    const submitButton = screen.getByText('Create Account');
    
    // Step 1: Type invalid email
    fireEvent.change(emailInput, { target: { value: '123' } });
    
    // Step 2: Type numbers in first name
    fireEvent.change(firstNameInput, { target: { value: '123' } });
    
    // Step 3: Submit form
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      // Both errors should be visible
      expect(screen.getByText('Please enter a valid email')).toBeInTheDocument();
      expect(screen.getByText('Only letters allowed')).toBeInTheDocument();
    });
  });
  
  test('should clear individual field errors when typing', async () => {
    render(<Register />);
    
    const emailInput = screen.getByPlaceholderText('Email Address');
    const firstNameInput = screen.getByPlaceholderText('First Name');
    const submitButton = screen.getByText('Create Account');
    
    // Submit to show all errors
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Email is required')).toBeInTheDocument();
      expect(screen.getByText('First name is required')).toBeInTheDocument();
    });
    
    // Type in email field - should clear only email error
    fireEvent.change(emailInput, { target: { value: 'a' } });
    
    await waitFor(() => {
      expect(screen.queryByText('Email is required')).not.toBeInTheDocument();
      expect(screen.getByText('First name is required')).toBeInTheDocument();
    });
    
    // Type in first name field - should clear only first name error
    fireEvent.change(firstNameInput, { target: { value: 'a' } });
    
    await waitFor(() => {
      expect(screen.queryByText('First name is required')).not.toBeInTheDocument();
    });
  });
  
  test('should not clear other field errors when typing in one field', async () => {
    render(<Register />);
    
    const emailInput = screen.getByPlaceholderText('Email Address');
    const firstNameInput = screen.getByPlaceholderText('First Name');
    const submitButton = screen.getByText('Create Account');
    
    // Enter invalid data in both fields
    fireEvent.change(emailInput, { target: { value: '123' } });
    fireEvent.change(firstNameInput, { target: { value: '456' } });
    
    // Submit to trigger validation
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Please enter a valid email')).toBeInTheDocument();
      expect(screen.getByText('Only letters allowed')).toBeInTheDocument();
    });
    
    // Type in first name - should not clear email error
    fireEvent.change(firstNameInput, { target: { value: 'John' } });
    
    await waitFor(() => {
      // Email error should still be there
      expect(screen.getByText('Please enter a valid email')).toBeInTheDocument();
      // First name error should be cleared
      expect(screen.queryByText('Only letters allowed')).not.toBeInTheDocument();
    });
  });
  
  test('should prevent browser default validation and show custom messages', async () => {
    render(<Register />);
    
    const emailInput = screen.getByPlaceholderText('Email Address');
    
    // Check that email input has required attribute removed to prevent browser validation
    expect(emailInput).not.toHaveAttribute('required');
    
    // Check that form has noValidate to prevent browser validation
    const form = emailInput.closest('form');
    expect(form).toHaveAttribute('noValidate');
  });
  
  test('should handle sequential field validation correctly', async () => {
    render(<Register />);
    
    const emailInput = screen.getByPlaceholderText('Email Address');
    const firstNameInput = screen.getByPlaceholderText('First Name');
    const lastNameInput = screen.getByPlaceholderText('Last Name');
    
    // Enter invalid data in sequence
    fireEvent.change(emailInput, { target: { value: 'invalid' } });
    fireEvent.change(firstNameInput, { target: { value: '123' } });
    fireEvent.change(lastNameInput, { target: { value: '456' } });
    
    // Submit to trigger all validations
    const submitButton = screen.getByText('Create Account');
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Please enter a valid email')).toBeInTheDocument();
      expect(screen.getByText('Only letters allowed')).toBeInTheDocument();
      // Should find the second occurrence of "Only letters allowed" for lastName
      expect(screen.getAllByText('Only letters allowed')).toHaveLength(2);
    });
    
    // Fix first name
    fireEvent.change(firstNameInput, { target: { value: 'John' } });
    
    await waitFor(() => {
      // Email and last name errors should remain
      expect(screen.getByText('Please enter a valid email')).toBeInTheDocument();
      expect(screen.getByText('Only letters allowed')).toBeInTheDocument(); // lastName error
      // First name error should be gone
      expect(screen.getAllByText('Only letters allowed')).toHaveLength(1);
    });
  });
});