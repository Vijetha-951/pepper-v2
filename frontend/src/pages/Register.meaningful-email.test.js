import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Register from './Register';
import authService from '../services/authService';
import { fetchSignInMethodsForEmail } from 'firebase/auth';

// Mock dependencies
jest.mock('../services/authService');
jest.mock('firebase/auth');
jest.mock('../config/firebase', () => ({
  auth: {}
}));

const MockedRegister = () => (
  <BrowserRouter>
    <Register />
  </BrowserRouter>
);

describe('Register Component - Meaningful Email Validation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    fetchSignInMethodsForEmail.mockResolvedValue([]);
  });

  const fillValidForm = (emailOverride = 'john.doe@gmail.com') => {
    fireEvent.change(screen.getByPlaceholderText(/first name/i), {
      target: { value: 'John' }
    });
    fireEvent.change(screen.getByPlaceholderText(/last name/i), {
      target: { value: 'Doe' }
    });
    fireEvent.change(screen.getByPlaceholderText(/email/i), {
      target: { value: emailOverride }
    });
    fireEvent.change(screen.getByPlaceholderText(/password/i), {
      target: { value: 'Password123!' }
    });
    fireEvent.change(screen.getByPlaceholderText(/phone/i), {
      target: { value: '1234567890' }
    });
    fireEvent.change(screen.getByPlaceholderText(/place/i), {
      target: { value: 'Test City' }
    });
    fireEvent.change(screen.getByPlaceholderText(/district/i), {
      target: { value: 'TestDistrict' }
    });
    fireEvent.change(screen.getByPlaceholderText(/pincode/i), {
      target: { value: '123456' }
    });
  };

  describe('Valid meaningful email acceptance', () => {
    test('should accept legitimate personal email', async () => {
      render(<MockedRegister />);
      
      fillValidForm('john.doe@gmail.com');
      
      const submitButton = screen.getByRole('button', { name: /create account/i });
      fireEvent.click(submitButton);

      // Should not show email validation error
      expect(screen.queryByText(/meaningless/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/disposable/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/too simple/i)).not.toBeInTheDocument();
    });

    test('should accept business email', async () => {
      render(<MockedRegister />);
      
      fillValidForm('contact@company.co.uk');
      
      const submitButton = screen.getByRole('button', { name: /create account/i });
      fireEvent.click(submitButton);

      expect(screen.queryByText(/meaningless/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/domain/i)).not.toBeInTheDocument();
    });

    test('should accept email with meaningful numbers', async () => {
      render(<MockedRegister />);
      
      fillValidForm('user2024@example.com');
      
      const submitButton = screen.getByRole('button', { name: /create account/i });
      fireEvent.click(submitButton);

      expect(screen.queryByText(/meaningless/i)).not.toBeInTheDocument();
    });
  });

  describe('Meaningless email rejection', () => {
    test('should reject purely numeric email (123@gmail.com)', async () => {
      render(<MockedRegister />);
      
      fillValidForm('123@gmail.com');
      
      const submitButton = screen.getByRole('button', { name: /create account/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/meaningless/i)).toBeInTheDocument();
      });
    });

    test('should reject 123@123', async () => {
      render(<MockedRegister />);
      
      fillValidForm('123@123');
      
      const submitButton = screen.getByRole('button', { name: /create account/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/domain/i)).toBeInTheDocument();
      });
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
        render(<MockedRegister />);
        
        fillValidForm(email);
        
        const submitButton = screen.getByRole('button', { name: /create account/i });
        fireEvent.click(submitButton);

        await waitFor(() => {
          expect(screen.getByText(/meaningless/i)).toBeInTheDocument();
        });

        // Clean up for next iteration
        screen.unmount();
      }
    });

    test('should reject admin/system patterns', async () => {
      const systemEmails = [
        'admin@example.com',
        'root@test.com',
        'user@domain.com',
        'noreply@site.org'
      ];

      for (const email of systemEmails) {
        render(<MockedRegister />);
        
        fillValidForm(email);
        
        const submitButton = screen.getByRole('button', { name: /create account/i });
        fireEvent.click(submitButton);

        await waitFor(() => {
          expect(screen.getByText(/meaningless/i)).toBeInTheDocument();
        });

        screen.unmount();
      }
    });

    test('should reject keyboard patterns', async () => {
      const keyboardEmails = [
        'qwerty@gmail.com',
        'asdf@yahoo.com'
      ];

      for (const email of keyboardEmails) {
        render(<MockedRegister />);
        
        fillValidForm(email);
        
        const submitButton = screen.getByRole('button', { name: /create account/i });
        fireEvent.click(submitButton);

        await waitFor(() => {
          expect(screen.getByText(/meaningless/i)).toBeInTheDocument();
        });

        screen.unmount();
      }
    });

    test('should reject repetitive patterns', async () => {
      const repetitiveEmails = [
        'aaa@example.com',
        'bbb@test.com',
        'aaaa@domain.org'
      ];

      for (const email of repetitiveEmails) {
        render(<MockedRegister />);
        
        fillValidForm(email);
        
        const submitButton = screen.getByRole('button', { name: /create account/i });
        fireEvent.click(submitButton);

        await waitFor(() => {
          expect(screen.getByText(/meaningless/i)).toBeInTheDocument();
        });

        screen.unmount();
      }
    });
  });

  describe('Disposable email rejection', () => {
    test('should reject common disposable email providers', async () => {
      const disposableEmails = [
        'user@10minutemail.com',
        'test@guerrillamail.com',
        'temp@mailinator.com',
        'fake@yopmail.com'
      ];

      for (const email of disposableEmails) {
        render(<MockedRegister />);
        
        fillValidForm(email);
        
        const submitButton = screen.getByRole('button', { name: /create account/i });
        fireEvent.click(submitButton);

        await waitFor(() => {
          expect(screen.getByText(/disposable/i)).toBeInTheDocument();
        });

        screen.unmount();
      }
    });
  });

  describe('Suspicious domain rejection', () => {
    test('should reject very short or suspicious domains', async () => {
      const suspiciousDomainEmails = [
        'user@a',
        'test@123',
        'email@fake',
        'person@test'
      ];

      for (const email of suspiciousDomainEmails) {
        render(<MockedRegister />);
        
        fillValidForm(email);
        
        const submitButton = screen.getByRole('button', { name: /create account/i });
        fireEvent.click(submitButton);

        await waitFor(() => {
          expect(screen.getByText(/domain/i)).toBeInTheDocument();
        });

        screen.unmount();
      }
    });
  });

  describe('Real-time validation', () => {
    test('should show meaningful email error while typing', async () => {
      render(<MockedRegister />);
      
      const emailInput = screen.getByPlaceholderText(/email/i);
      
      // First type a meaningless email
      fireEvent.change(emailInput, { target: { value: '123@gmail.com' } });
      
      // Trigger validation by typing in another field to create errors object
      const firstNameInput = screen.getByPlaceholderText(/first name/i);
      fireEvent.change(firstNameInput, { target: { value: '' } }); // Create error
      fireEvent.blur(firstNameInput);
      
      // Now type in email again to trigger real-time validation
      fireEvent.change(emailInput, { target: { value: '123@gmail.com' } });

      await waitFor(() => {
        expect(screen.getByText(/meaningless/i)).toBeInTheDocument();
      });
    });

    test('should clear meaningful email error when typing valid email', async () => {
      render(<MockedRegister />);
      
      const emailInput = screen.getByPlaceholderText(/email/i);
      
      // First create an error state
      const firstNameInput = screen.getByPlaceholderText(/first name/i);
      fireEvent.change(firstNameInput, { target: { value: '' } });
      fireEvent.blur(firstNameInput);
      
      // Type meaningless email
      fireEvent.change(emailInput, { target: { value: '123@gmail.com' } });
      
      await waitFor(() => {
        expect(screen.getByText(/meaningless/i)).toBeInTheDocument();
      });
      
      // Now type a valid email
      fireEvent.change(emailInput, { target: { value: 'john.doe@gmail.com' } });

      await waitFor(() => {
        expect(screen.queryByText(/meaningless/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Edge cases', () => {
    test('should handle case insensitive validation', async () => {
      render(<MockedRegister />);
      
      fillValidForm('TEST@EXAMPLE.COM');
      
      const submitButton = screen.getByRole('button', { name: /create account/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/meaningless/i)).toBeInTheDocument();
      });
    });

    test('should handle very short numeric patterns', async () => {
      const shortEmails = ['1@test.com', '12@example.com'];

      for (const email of shortEmails) {
        render(<MockedRegister />);
        
        fillValidForm(email);
        
        const submitButton = screen.getByRole('button', { name: /create account/i });
        fireEvent.click(submitButton);

        await waitFor(() => {
          expect(screen.getByText(/too simple/i)).toBeInTheDocument();
        });

        screen.unmount();
      }
    });
  });
});