import BrowsingHistory from '../models/BrowsingHistory.js';
import Order from '../models/Order.js';
import Product from '../models/Product.js';

/**
 * KNN Recommendation Engine Service
 * Recommends pepper plant varieties based on user similarity
 */
class RecommendationService {
  /**
   * Calculate Euclidean distance between two user vectors
   */
  calculateDistance(vector1, vector2) {
    const allKeys = new Set([...Object.keys(vector1), ...Object.keys(vector2)]);
    let sumSquaredDiff = 0;

    for (const key of allKeys) {
      const val1 = vector1[key] || 0;
      const val2 = vector2[key] || 0;
      sumSquaredDiff += Math.pow(val1 - val2, 2);
    }

    return Math.sqrt(sumSquaredDiff);
  }

  /**
   * Build user interaction vector from purchase and browsing history
   */
  async buildUserVector(userId) {
    // Get purchase history
    const orders = await Order.find({ user: userId, status: 'DELIVERED' }).populate('items.product');
    
    // Get browsing history
    const browsing = await BrowsingHistory.find({ user: userId }).populate('product');

    const vector = {};

    // Add purchases with higher weight (weight: 3)
    for (const order of orders) {
      for (const item of order.items) {
        const productId = item.product._id.toString();
        vector[productId] = (vector[productId] || 0) + 3;
      }
    }

    // Add browsing with lower weight (weight: 1)
    for (const browse of browsing) {
      const productId = browse.product._id.toString();
      vector[productId] = (vector[productId] || 0) + browse.viewCount;
    }

    return vector;
  }

  /**
   * Get K nearest neighbors (similar users)
   */
  async findKNearestNeighbors(userId, k = 5) {
    try {
      // Get all users (excluding current user)
      const allUsers = await Order.distinct('user');
      
      if (allUsers.length <= 1) {
        return [];
      }

      const targetUserVector = await this.buildUserVector(userId);
      const distances = [];

      // Calculate distance to all other users
      for (const otherUserId of allUsers) {
        if (otherUserId.toString() === userId.toString()) continue;

        const otherUserVector = await this.buildUserVector(otherUserId);
        const distance = this.calculateDistance(targetUserVector, otherUserVector);

        distances.push({
          userId: otherUserId,
          distance: distance
        });
      }

      // Sort by distance and get K nearest
      distances.sort((a, b) => a.distance - b.distance);
      return distances.slice(0, k);
    } catch (error) {
      console.error('Error finding K-nearest neighbors:', error);
      return [];
    }
  }

  /**
   * Get products liked by similar users
   */
  async getRecommendedProducts(userId, k = 5, limit = 5) {
    try {
      // Get user's current preferences
      const userVector = await this.buildUserVector(userId);
      const userProductIds = Object.keys(userVector);

      // Get K nearest neighbors
      const neighbors = await this.findKNearestNeighbors(userId, k);

      if (neighbors.length === 0) {
        // Fallback: recommend popular products if no neighbors found
        return await this.getPopularProducts(userProductIds, limit);
      }

      // Aggregate products from similar users
      const neighborProductScores = {};

      for (const neighbor of neighbors) {
        const neighborProducts = await this.buildUserVector(neighbor.userId);

        // Only consider products the target user hasn't interacted with
        for (const [productId, score] of Object.entries(neighborProducts)) {
          if (!userProductIds.includes(productId)) {
            // Weight score by distance (closer users have more influence)
            const weight = 1 / (1 + neighbor.distance);
            neighborProductScores[productId] = (neighborProductScores[productId] || 0) + score * weight;
          }
        }
      }

      // Sort products by score and get recommendations
      const recommendedProductIds = Object.entries(neighborProductScores)
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([productId]) => productId);

      // Fetch product details
      const products = await Product.find(
        { 
          _id: { $in: recommendedProductIds },
          isActive: true,
          available_stock: { $gt: 0 }
        },
        null,
        { lean: true }
      );

      // Maintain the score order
      return recommendedProductIds
        .map(id => products.find(p => p._id.toString() === id))
        .filter(Boolean);
    } catch (error) {
      console.error('Error getting recommended products:', error);
      return [];
    }
  }

  /**
   * Get popular products as fallback
   */
  async getPopularProducts(excludeProductIds = [], limit = 5) {
    try {
      // Find products that are most purchased
      const pipeline = [
        { $match: { status: 'DELIVERED' } },
        { $unwind: '$items' },
        { $group: {
            _id: '$items.product',
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } },
        { $limit: limit * 2 }
      ];

      const popularProducts = await Order.aggregate(pipeline);
      const productIds = popularProducts
        .map(p => p._id)
        .filter(id => !excludeProductIds.includes(id.toString()))
        .slice(0, limit);

      const products = await Product.find(
        { 
          _id: { $in: productIds },
          isActive: true,
          available_stock: { $gt: 0 }
        },
        null,
        { lean: true }
      );

      return products;
    } catch (error) {
      console.error('Error getting popular products:', error);
      return [];
    }
  }

  /**
   * Track user browsing activity
   */
  async trackBrowsing(userId, productId) {
    try {
      const existing = await BrowsingHistory.findOneAndUpdate(
        { user: userId, product: productId },
        {
          $inc: { viewCount: 1 },
          $set: { lastViewedAt: new Date() }
        },
        { upsert: true, new: true }
      );
      return existing;
    } catch (error) {
      console.error('Error tracking browsing:', error);
      return null;
    }
  }

  /**
   * Get user's recommendation insights
   */
  async getRecommendationInsights(userId) {
    try {
      const userOrders = await Order.countDocuments({ user: userId, status: 'DELIVERED' });
      const userBrowsing = await BrowsingHistory.countDocuments({ user: userId });
      const userVector = await this.buildUserVector(userId);
      
      return {
        totalPurchases: userOrders,
        totalBrowsed: userBrowsing,
        interactedProducts: Object.keys(userVector).length,
        vectorDimension: Object.keys(userVector).length
      };
    } catch (error) {
      console.error('Error getting recommendation insights:', error);
      return {};
    }
  }
}

export default new RecommendationService();