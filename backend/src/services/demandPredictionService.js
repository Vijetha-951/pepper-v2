import Order from '../models/Order.js';
import Product from '../models/Product.js';

/**
 * Decision Tree Service for Stock Demand Prediction
 * Predicts upcoming product demand based on:
 * - Month of year
 * - Past sales trend
 * - Product type (Climber/Bush)
 */

class DemandPredictionService {
  /**
   * Analyze historical sales data and generate predictions
   * @param {number} monthsBack - Number of months of history to analyze (default: 6)
   * @returns {Promise<Array>} Array of predictions with product details and recommendations
   */
  static async generatePredictions(monthsBack = 6) {
    try {
      // Get historical orders from the past N months
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - monthsBack);
      startDate.setDate(1);

      const orders = await Order.find({
        createdAt: { $gte: startDate },
        status: { $ne: 'CANCELLED' }
      }).populate('items.product');

      // Aggregate sales data by product and month
      const salesData = this.aggregateSalesByProductAndMonth(orders);

      // Get all products
      const products = await Product.find({ isActive: true });

      // Generate predictions for each product
      const predictions = products.map(product => {
        const productSales = salesData[product._id] || {};
        return this.predictDemand(product, productSales);
      });

      return predictions.sort((a, b) => b.urgencyScore - a.urgencyScore);
    } catch (error) {
      console.error('Error generating demand predictions:', error);
      throw new Error(`Demand prediction failed: ${error.message}`);
    }
  }

  /**
   * Aggregate sales data by product and month
   * @private
   */
  static aggregateSalesByProductAndMonth(orders) {
    const salesData = {};

    orders.forEach(order => {
      order.items.forEach(item => {
        const productId = String(item.product._id);
        if (!salesData[productId]) {
          salesData[productId] = {
            byMonth: {},
            total: 0,
            orderCount: 0
          };
        }

        const month = this.getMonthKey(item.product.createdAt || order.createdAt);
        if (!salesData[productId].byMonth[month]) {
          salesData[productId].byMonth[month] = 0;
        }

        salesData[productId].byMonth[month] += item.quantity;
        salesData[productId].total += item.quantity;
        salesData[productId].orderCount += 1;
      });
    });

    return salesData;
  }

  /**
   * Get month key in format YYYY-MM
   * @private
   */
  static getMonthKey(date) {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  }

  /**
   * Get current month for seasonal analysis
   * @private
   */
  static getCurrentMonthNumber() {
    return new Date().getMonth() + 1; // 1-12
  }

  /**
   * Decision Tree: Predict demand and stock adjustment
   * @private
   */
  static predictDemand(product, salesData) {
    const currentMonth = this.getCurrentMonthNumber();
    const months = Object.keys(salesData.byMonth || {}).sort();
    const recentMonths = months.slice(-3); // Last 3 months
    
    // Calculate metrics
    const averageMonthlySales = salesData.total && months.length ? salesData.total / months.length : 0;
    const recentSales = recentMonths.reduce((sum, m) => sum + (salesData.byMonth[m] || 0), 0);
    const recentAverage = recentMonths.length > 0 ? recentSales / recentMonths.length : 0;
    
    // Determine trend
    const trend = this.calculateTrend(recentMonths, salesData.byMonth || {});
    
    // Current stock info
    const currentStock = product.available_stock !== undefined ? product.available_stock : product.stock || 0;
    const totalStock = product.total_stock || product.stock || 0;

    // **DECISION TREE LOGIC**
    let recommendation = 'MAINTAIN';
    let adjustmentPercentage = 0;
    let reason = '';

    // Decision Node 1: Check if product has sales history
    if (months.length === 0) {
      // No sales history
      recommendation = 'MONITOR';
      reason = 'New product with no sales history. Monitor initial demand.';
      adjustmentPercentage = 0;
    } else if (recentAverage === 0) {
      // No recent sales
      recommendation = 'REDUCE';
      reason = 'No sales in recent months. Consider reducing stock.';
      adjustmentPercentage = -10;
    } else {
      // Decision Node 2: Check trend direction
      if (trend === 'RISING') {
        // Sales trending up - increase stock
        const urgency = recentAverage > averageMonthlySales * 1.5 ? 'HIGH' : 'MEDIUM';
        
        // Decision Node 3: Check current stock level
        if (currentStock < recentAverage) {
          recommendation = 'INCREASE';
          adjustmentPercentage = urgency === 'HIGH' ? 30 : 20;
          reason = `Rising trend with insufficient stock. Current: ${currentStock}, Recent avg: ${Math.round(recentAverage)}.`;
        } else {
          recommendation = 'MONITOR';
          adjustmentPercentage = 0;
          reason = `Rising trend but adequate stock available.`;
        }
      } else if (trend === 'DECLINING') {
        // Sales trending down - decrease stock
        // Decision Node 4: Check stock utilization
        const stockTurnover = currentStock > 0 ? recentAverage / currentStock : 0;
        
        if (stockTurnover < 0.3) {
          recommendation = 'REDUCE';
          adjustmentPercentage = -20;
          reason = `Declining trend with poor stock turnover (${(stockTurnover * 100).toFixed(1)}%).`;
        } else {
          recommendation = 'MAINTAIN';
          adjustmentPercentage = 0;
          reason = `Declining trend but acceptable stock movement.`;
        }
      } else {
        // STABLE trend
        // Decision Node 5: Check seasonal patterns
        const isSeasonal = this.checkSeasonalPattern(currentMonth, product.type);
        
        if (isSeasonal) {
          recommendation = 'INCREASE';
          adjustmentPercentage = 15;
          reason = `Stable trend with seasonal demand spike expected for ${product.type} type in month ${currentMonth}.`;
        } else {
          // Check if stock is critically low
          if (currentStock <= 5) {
            recommendation = 'INCREASE';
            adjustmentPercentage = 10;
            reason = `Critical stock level (${currentStock} units). Reorder recommended.`;
          } else {
            recommendation = 'MAINTAIN';
            adjustmentPercentage = 0;
            reason = `Stable trend with adequate stock level.`;
          }
        }
      }
    }

    // Calculate urgency score (0-100) for sorting
    const urgencyScore = this.calculateUrgencyScore(recommendation, currentStock, recentAverage);

    return {
      product: {
        _id: product._id,
        name: product.name,
        type: product.type,
        category: product.category,
        price: product.price,
        image: product.image
      },
      currentStock,
      totalStock,
      stockHealth: this.getStockHealth(currentStock),
      salesMetrics: {
        averageMonthlySales: Math.round(averageMonthlySales * 10) / 10,
        recentAverageMonthlySales: Math.round(recentAverage * 10) / 10,
        trend,
        salesHistory: this.formatSalesHistory(recentMonths, salesData.byMonth || {})
      },
      prediction: {
        recommendation,
        adjustmentPercentage,
        suggestedStock: Math.round(currentStock * (1 + adjustmentPercentage / 100)),
        reason,
        confidence: this.calculateConfidence(recentMonths.length, recentAverage)
      },
      urgencyScore
    };
  }

  /**
   * Calculate sales trend (RISING, DECLINING, STABLE)
   * @private
   */
  static calculateTrend(months, monthlyData) {
    if (months.length < 2) return 'STABLE';

    const recent = months.slice(-3).map(m => monthlyData[m] || 0);
    if (recent.length < 2) return 'STABLE';

    const avgOlder = recent.slice(0, -1).reduce((a, b) => a + b, 0) / (recent.length - 1);
    const newest = recent[recent.length - 1];

    if (newest > avgOlder * 1.2) return 'RISING';
    if (newest < avgOlder * 0.8) return 'DECLINING';
    return 'STABLE';
  }

  /**
   * Check if current month typically has seasonal demand
   * @private
   */
  static checkSeasonalPattern(month, productType) {
    // Example seasonal patterns (can be customized based on business data)
    const seasonalMonths = {
      'Climber': [3, 4, 5, 9, 10, 11], // Spring and Fall for climbing plants
      'Bush': [4, 5, 6, 7, 8] // Summer for bush peppers
    };

    return (seasonalMonths[productType] || []).includes(month);
  }

  /**
   * Calculate urgency score for sorting predictions
   * @private
   */
  static calculateUrgencyScore(recommendation, currentStock, recentAverage) {
    let score = 0;

    // Recommendation weight
    const weights = {
      'INCREASE': 80,
      'REDUCE': 40,
      'MAINTAIN': 20,
      'MONITOR': 30
    };
    score = weights[recommendation] || 20;

    // Stock criticality
    if (currentStock <= 5) score += 20;
    else if (currentStock <= 10) score += 10;

    // Demand strength
    if (recentAverage > 20) score += 10;
    else if (recentAverage > 10) score += 5;

    return Math.min(score, 100);
  }

  /**
   * Get stock health status
   * @private
   */
  static getStockHealth(stock) {
    if (stock > 30) return 'HEALTHY';
    if (stock > 10) return 'ADEQUATE';
    if (stock > 0) return 'LOW';
    return 'OUT_OF_STOCK';
  }

  /**
   * Calculate prediction confidence based on data availability
   * @private
   */
  static calculateConfidence(dataPoints, averageSales) {
    let confidence = 0.5; // Base confidence

    // More data points = higher confidence
    if (dataPoints >= 12) confidence = 0.9;
    else if (dataPoints >= 6) confidence = 0.8;
    else if (dataPoints >= 3) confidence = 0.7;
    else if (dataPoints >= 1) confidence = 0.6;

    // High volume = higher confidence
    if (averageSales > 20) confidence = Math.min(confidence + 0.1, 0.95);

    return Math.round(confidence * 100);
  }

  /**
   * Format sales history for display
   * @private
   */
  static formatSalesHistory(months, monthlyData) {
    return months.map(month => ({
      month,
      sales: monthlyData[month] || 0
    }));
  }

  /**
   * Get top products by urgency
   */
  static async getTopPredictions(limit = 10, monthsBack = 6) {
    const predictions = await this.generatePredictions(monthsBack);
    return predictions.slice(0, limit);
  }

  /**
   * Get predictions for a specific product
   */
  static async getPredictionForProduct(productId, monthsBack = 6) {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - monthsBack);
    startDate.setDate(1);

    const orders = await Order.find({
      createdAt: { $gte: startDate },
      status: { $ne: 'CANCELLED' }
    }).populate('items.product');

    const salesData = this.aggregateSalesByProductAndMonth(orders);
    const product = await Product.findById(productId);

    if (!product) {
      throw new Error('Product not found');
    }

    const productSales = salesData[productId] || {};
    return this.predictDemand(product, productSales);
  }
}

export default DemandPredictionService;