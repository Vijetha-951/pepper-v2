// Admin product management service
// Uses apiFetch so Authorization header is automatically handled with admin bypass

import { apiFetch } from "./api";

const BASE_URL = '/api/admin/products';

const handleJson = async (resp) => {
  let data = null;
  try {
    data = await resp.json();
  } catch (_) {
    /* ignore */
  }
  if (!resp.ok) {
    const message =
      data?.message || data?.error || `Request failed with ${resp.status}`;
    throw new Error(message);
  }
  return data;
};

class ProductService {
  // Search products with filters
  async searchProducts({ query = '', type = '', page = 1, limit = 10 }) {
    try {
      const params = new URLSearchParams({
        ...(query && { q: query }),
        ...(type && { type }),
        page: page.toString(),
        limit: limit.toString()
      });

      const response = await apiFetch(`${BASE_URL}?${params}`, {
        method: 'GET'
      });

      const data = await handleJson(response);
      
      // Backend returns array directly, transform to match expected format
      return {
        products: Array.isArray(data) ? data : [],
        total: Array.isArray(data) ? data.length : 0
      };
    } catch (error) {
      console.error('Search products error:', error);
      throw error;
    }
  }

  // Create new product
  async createProduct(productData) {
    try {
      const response = await apiFetch(`${BASE_URL}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...productData,
          price: Number(productData.price),
          stock: Number(productData.stock)
        })
      });

      return await handleJson(response);
    } catch (error) {
      console.error('Create product error:', error);
      throw error;
    }
  }

  // Update existing product
  async updateProduct(productId, productData) {
    try {
      const response = await apiFetch(`${BASE_URL}/${productId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...productData,
          price: Number(productData.price),
          stock: Number(productData.stock)
        })
      });

      return await handleJson(response);
    } catch (error) {
      console.error('Update product error:', error);
      throw error;
    }
  }

  // Delete product
  async deleteProduct(productId) {
    try {
      const response = await apiFetch(`${BASE_URL}/${productId}`, {
        method: 'DELETE'
      });

      return await handleJson(response);
    } catch (error) {
      console.error('Delete product error:', error);
      throw error;
    }
  }

  // Bulk seed products
  async seedProducts() {
    try {
      const response = await apiFetch(`${BASE_URL}/seed`, {
        method: 'POST'
      });

      return await handleJson(response);
    } catch (error) {
      console.error('Seed products error:', error);
      throw error;
    }
  }
}

export default new ProductService();