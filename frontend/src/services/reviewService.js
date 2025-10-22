import authService from './authService';

const API_BASE = '/api/reviews';

const reviewService = {
  // Submit a new review
  async submitReview(reviewData) {
    const token = await authService.getAuthToken();
    const response = await fetch(`${API_BASE}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(reviewData)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to submit review');
    }

    return response.json();
  },

  // Get user's reviews
  async getUserReviews() {
    const token = await authService.getAuthToken();
    const response = await fetch(`${API_BASE}/user/my-reviews`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch user reviews');
    }

    return response.json();
  },

  // Get single review
  async getReview(reviewId) {
    const token = await authService.getAuthToken();
    const response = await fetch(`${API_BASE}/${reviewId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch review');
    }

    return response.json();
  },

  // Update review
  async updateReview(reviewId, updates) {
    const token = await authService.getAuthToken();
    const response = await fetch(`${API_BASE}/${reviewId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(updates)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update review');
    }

    return response.json();
  },

  // Delete review
  async deleteReview(reviewId) {
    const token = await authService.getAuthToken();
    const response = await fetch(`${API_BASE}/${reviewId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete review');
    }

    return response.json();
  },

  // Get product reviews (public endpoint)
  async getProductReviews(productId, sortBy = 'recent') {
    try {
      const response = await fetch(`${API_BASE}/public/product/${productId}?sortBy=${sortBy}`);
      if (!response.ok) {
        throw new Error('Failed to fetch product reviews');
      }
      return response.json();
    } catch (error) {
      console.error('Error fetching product reviews:', error);
      return { reviews: [], stats: { totalReviews: 0, averageRating: 0, ratingBreakdown: {} } };
    }
  }
};

export default reviewService;