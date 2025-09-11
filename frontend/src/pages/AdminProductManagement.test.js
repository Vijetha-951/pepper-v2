import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AdminProductManagement from './AdminProductManagement';
import authService from '../services/authService';
import productService from '../services/productService';

// Mock services
jest.mock('../services/authService');
jest.mock('../services/productService');

describe('AdminProductManagement', () => {
  const mockUser = {
    uid: 'admin123',
    role: 'admin',
    email: 'admin@test.com'
  };

  const mockProducts = [
    {
      _id: '1',
      name: 'Karimunda',
      type: 'Climber',
      description: 'Popular cultivar known for yield.',
      price: 120,
      stock: 50,
      image: 'http://example.com/image1.jpg'
    },
    {
      _id: '2',
      name: 'Thekkan 1',
      type: 'Bush',
      description: 'Compact bush pepper.',
      price: 100,
      stock: 30,
      image: ''
    }
  ];

  beforeEach(() => {
    // Mock auth service
    authService.getCurrentUser.mockReturnValue(mockUser);
    
    // Mock product service
    productService.searchProducts.mockResolvedValue({
      products: mockProducts,
      total: mockProducts.length
    });
    productService.createProduct.mockResolvedValue({
      _id: '3',
      name: 'New Product',
      type: 'Bush'
    });
    productService.updateProduct.mockResolvedValue({
      _id: '1',
      name: 'Updated Product'
    });
    productService.deleteProduct.mockResolvedValue({
      message: 'Product deleted successfully'
    });
    productService.seedProducts.mockResolvedValue({
      message: 'Products seeded successfully',
      seeded: 15,
      existing: 6
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should render product management interface', async () => {
    render(<AdminProductManagement />);

    expect(screen.getByText('Product Management')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Search products...')).toBeInTheDocument();
    expect(screen.getByText('Add Product')).toBeInTheDocument();
    expect(screen.getByText('🌱 Seed All')).toBeInTheDocument();

    // Wait for products to load
    await waitFor(() => {
      expect(screen.getByText('Karimunda')).toBeInTheDocument();
      expect(screen.getByText('Thekkan 1')).toBeInTheDocument();
    });
  });

  it('should load and display products on mount', async () => {
    render(<AdminProductManagement />);

    await waitFor(() => {
      expect(productService.searchProducts).toHaveBeenCalledWith({
        query: '',
        type: '',
        page: 1,
        limit: 10
      });
    });

    expect(screen.getByText('Karimunda')).toBeInTheDocument();
    expect(screen.getByText('₹120')).toBeInTheDocument();
    expect(screen.getByText('50')).toBeInTheDocument();
    expect(screen.getByText('Thekkan 1')).toBeInTheDocument();
  });

  it('should handle search functionality', async () => {
    render(<AdminProductManagement />);

    const searchInput = screen.getByPlaceholderText('Search products...');
    const searchButton = screen.getByText('Search');

    fireEvent.change(searchInput, { target: { value: 'Karimunda' } });
    fireEvent.click(searchButton);

    await waitFor(() => {
      expect(productService.searchProducts).toHaveBeenCalledWith({
        query: 'Karimunda',
        type: '',
        page: 1,
        limit: 10
      });
    });
  });

  it('should handle type filter', async () => {
    render(<AdminProductManagement />);

    const typeSelect = screen.getByDisplayValue('All Types');
    const searchButton = screen.getByText('Search');

    fireEvent.change(typeSelect, { target: { value: 'Bush' } });
    fireEvent.click(searchButton);

    await waitFor(() => {
      expect(productService.searchProducts).toHaveBeenCalledWith({
        query: '',
        type: 'Bush',
        page: 1,
        limit: 10
      });
    });
  });

  it('should open create product modal', async () => {
    render(<AdminProductManagement />);

    const addButton = screen.getByText('Add Product');
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(screen.getByText('Add New Product')).toBeInTheDocument();
      expect(screen.getByText('Quick Add Varieties')).toBeInTheDocument();
    });
  });

  it('should handle product deletion', async () => {
    // Mock window.confirm to return true
    window.confirm = jest.fn().mockReturnValue(true);

    render(<AdminProductManagement />);

    await waitFor(() => {
      expect(screen.getByText('Karimunda')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByText(/Delete/);
    fireEvent.click(deleteButtons[0]);

    await waitFor(() => {
      expect(productService.deleteProduct).toHaveBeenCalledWith('1');
    });

    window.confirm.mockRestore();
  });

  it('should handle seed products functionality', async () => {
    // Mock window.confirm and alert
    window.confirm = jest.fn().mockReturnValue(true);
    window.alert = jest.fn();

    render(<AdminProductManagement />);

    const seedButton = screen.getByText('🌱 Seed All');
    fireEvent.click(seedButton);

    await waitFor(() => {
      expect(productService.seedProducts).toHaveBeenCalled();
    });

    expect(window.alert).toHaveBeenCalledWith(
      'Products seeded successfully\nSeeded: 15, Existing: 6'
    );

    window.confirm.mockRestore();
    window.alert.mockRestore();
  });

  it('should handle pagination', async () => {
    render(<AdminProductManagement />);

    await waitFor(() => {
      expect(screen.getByText('Page 1 of 1 • 2 products')).toBeInTheDocument();
    });
  });

  it('should redirect non-admin users', () => {
    // Mock non-admin user
    authService.getCurrentUser.mockReturnValue({
      uid: 'user123',
      role: 'user'
    });

    // Mock window.location
    delete window.location;
    window.location = { href: '' };

    render(<AdminProductManagement />);

    expect(window.location.href).toBe('/login');
  });

  it('should display loading state', async () => {
    // Make searchProducts return a promise that doesn't resolve immediately
    productService.searchProducts.mockReturnValue(new Promise(() => {}));

    render(<AdminProductManagement />);

    expect(screen.getByText('Loading products...')).toBeInTheDocument();
  });

  it('should display error messages', async () => {
    productService.searchProducts.mockRejectedValue(new Error('Failed to load products'));

    render(<AdminProductManagement />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load products')).toBeInTheDocument();
    });
  });

  it('should handle product type badges correctly', async () => {
    render(<AdminProductManagement />);

    await waitFor(() => {
      const climberBadge = screen.getByText('Climber');
      const bushBadge = screen.getByText('Bush');
      
      expect(climberBadge).toBeInTheDocument();
      expect(bushBadge).toBeInTheDocument();
    });
  });

  it('should display stock status with correct colors', async () => {
    render(<AdminProductManagement />);

    await waitFor(() => {
      // Check that stock numbers are displayed
      expect(screen.getByText('50')).toBeInTheDocument(); // High stock
      expect(screen.getByText('30')).toBeInTheDocument(); // Medium stock
    });
  });
});