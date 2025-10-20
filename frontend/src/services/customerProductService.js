// Customer product service - for viewing and adding products to cart
// Uses regular fetch with Firebase auth token

import { auth } from '../config/firebase';

const BASE_URL = '/api/products';
const CART_URL = '/api/cart';
const ORDERS_URL = '/api/orders';

class CustomerProductService {
  // Get auth token for authenticated requests
  async getAuthToken() {
    const user = auth.currentUser;
    if (user) {
      return await user.getIdToken();
    }
    return null;
  }

  // Fetch all products (public endpoint)
  async getProducts(filters = {}) {
    try {
      const params = new URLSearchParams();
      
      if (filters.q) params.append('q', filters.q);
      if (filters.type) params.append('type', filters.type);
      if (filters.available !== undefined) params.append('available', filters.available);
      if (filters.minPrice) params.append('minPrice', filters.minPrice);
      if (filters.maxPrice) params.append('maxPrice', filters.maxPrice);

      const url = params.toString() ? `${BASE_URL}?${params}` : BASE_URL;
      
      const response = await fetch(url);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response body:', errorText);
        throw new Error(`Failed to fetch products: ${response.status} ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const responseText = await response.text();
        console.error('Non-JSON response:', responseText);
        throw new Error('Server returned non-JSON response');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching products:', error);
      throw error;
    }
  }

  // Get single product by ID
  async getProduct(productId) {
    try {
      const response = await fetch(`${BASE_URL}/${productId}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch product: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching product:', error);
      throw error;
    }
  }

  // Add product to cart (requires authentication)
  async addToCart(productId, quantity = 1) {
    try {
      const token = await this.getAuthToken();
      if (!token) {
        throw new Error('User not authenticated');
      }

      const response = await fetch(CART_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          product_id: productId,
          quantity: quantity
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Cart error response:', errorText);
        throw new Error(`Failed to add to cart: ${response.status} ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const responseText = await response.text();
        console.error('Non-JSON cart response:', responseText);
        throw new Error('Server returned non-JSON response for cart operation');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error adding to cart:', error);
      throw error;
    }
  }

  // Get user's cart
  async getCart() {
    try {
      const token = await this.getAuthToken();
      const user = auth.currentUser;
      
      if (!token || !user) {
        throw new Error('User not authenticated');
      }

      const response = await fetch(`${CART_URL}/${user.uid}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch cart');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching cart:', error);
      throw error;
    }
  }

  // Update cart item quantity
  async updateCartQuantity(productId, quantity) {
    try {
      const token = await this.getAuthToken();
      if (!token) {
        throw new Error('User not authenticated');
      }

      const response = await fetch(`${CART_URL}/item/${productId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ quantity })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Update cart error response:', errorText);
        throw new Error(`Failed to update cart: ${response.status} ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const responseText = await response.text();
        console.error('Non-JSON response:', responseText);
        throw new Error('Server returned non-JSON response');
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating cart:', error);
      throw error;
    }
  }

  // Remove item from cart
  async removeFromCart(productId) {
    try {
      const token = await this.getAuthToken();
      if (!token) {
        throw new Error('User not authenticated');
      }

      const response = await fetch(`${CART_URL}/item/${productId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Remove cart error response:', errorText);
        throw new Error(`Failed to remove from cart: ${response.status} ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const responseText = await response.text();
        console.error('Non-JSON response:', responseText);
        throw new Error('Server returned non-JSON response');
      }

      return await response.json();
    } catch (error) {
      console.error('Error removing from cart:', error);
      throw error;
    }
  }

  // Get dashboard stats for overview page
  async getDashboardStats() {
    try {
      const token = await this.getAuthToken();
      if (!token) {
        throw new Error('User not authenticated');
      }

      const response = await fetch(`${ORDERS_URL}/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Dashboard stats error response:', errorText);
        throw new Error(`Failed to fetch dashboard stats: ${response.status} ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const responseText = await response.text();
        console.error('Non-JSON response:', responseText);
        throw new Error('Server returned non-JSON response');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      throw error;
    }
  }
}

export default new CustomerProductService();