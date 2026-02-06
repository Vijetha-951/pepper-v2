// Seasonal Suitability Frontend Helper
// Add this to your frontend utilities

class SeasonalSuitabilityHelper {
  constructor() {
    this.analyticsId = null;
    this.apiUrl = '/api/seasonal-suitability';
  }

  /**
   * Get seasonal recommendation for a product
   * @param {Object} product - Product with variety information
   * @param {Object} userLocation - User's location data
   * @returns {Promise<Object>} Recommendation data
   */
  async getRecommendation(product, userLocation = {}) {
    try {
      const currentDate = new Date();
      
      const response = await fetch(`${this.apiUrl}/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          month: currentDate.getMonth() + 1,
          district: userLocation.district || 'Kottayam',
          pincode: userLocation.pincode || 686001,
          variety: product.variety || 'Karimunda',
          temperature: userLocation.temperature || this.getDefaultTemperature(currentDate.getMonth() + 1),
          rainfall: userLocation.rainfall || this.getDefaultRainfall(currentDate.getMonth() + 1),
          humidity: userLocation.humidity || 75,
          waterAvailability: userLocation.waterAvailability || 'Medium',
          productId: product._id,
          // Include dynamic plant specifications
          plantAge: product.plantAge,
          isMature: product.isMature,
          isCurrentlyBlooming: product.isCurrentlyBlooming,
          maturityDuration: product.maturityDuration
        })
      });

      const result = await response.json();
      
      if (result.success) {
        // Store analytics ID for tracking
        this.analyticsId = result.analyticsId;
        return result.data;
      }
      
      throw new Error(result.message || 'Failed to get recommendation');
    } catch (error) {
      console.error('Seasonal recommendation error:', error);
      return null;
    }
  }

  /**
   * Track user action
   * @param {string} actionType - 'viewedDetails', 'addedToCart', or 'orderPlaced'
   * @param {string} orderId - Order ID (required for orderPlaced action)
   */
  async trackAction(actionType, orderId = null) {
    if (!this.analyticsId) {
      console.warn('No analytics ID available for tracking');
      return;
    }

    try {
      await fetch(`${this.apiUrl}/track-action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          analyticsId: this.analyticsId,
          actionType,
          orderId
        })
      });
    } catch (error) {
      console.error('Track action error:', error);
    }
  }

  /**
   * Render recommendation as HTML
   * @param {Object} recommendation - Recommendation data from API
   * @returns {string} HTML string
   */
  renderRecommendation(recommendation) {
    if (!recommendation) {
      return '<div class="seasonal-recommendation-error">Unable to load seasonal recommendation</div>';
    }

    const badgeClass = {
      'success': 'bg-success',
      'warning': 'bg-warning',
      'danger': 'bg-danger'
    }[recommendation.badge];

    const iconClass = {
      '✓': 'bi-check-circle-fill text-success',
      '!': 'bi-exclamation-triangle-fill text-warning',
      '×': 'bi-x-circle-fill text-danger'
    }[recommendation.icon];

    return `
      <div class="seasonal-recommendation card border-${recommendation.badge} mb-4">
        <div class="card-header ${badgeClass} text-white">
          <div class="d-flex justify-content-between align-items-center">
            <h5 class="mb-0">
              <i class="bi ${iconClass}"></i>
              ${recommendation.title}
            </h5>
            <span class="badge badge-light">${recommendation.confidence} Confidence</span>
          </div>
        </div>
        <div class="card-body">
          <p class="card-text">${recommendation.description}</p>
          <h6 class="mt-3">Growing Tips:</h6>
          <ul class="list-unstyled">
            ${recommendation.tips.map(tip => `
              <li class="mb-2">
                <i class="bi bi-arrow-right-circle text-primary"></i>
                ${tip}
              </li>
            `).join('')}
          </ul>
        </div>
      </div>
    `;
  }

  /**
   * Get default temperature based on month (Kerala climate)
   * @private
   */
  getDefaultTemperature(month) {
    const temps = {
      1: 26, 2: 27, 3: 29, 4: 31, 5: 30, 6: 27,
      7: 26, 8: 26, 9: 27, 10: 27, 11: 27, 12: 26
    };
    return temps[month] || 27;
  }

  /**
   * Get default rainfall based on month (Kerala climate)
   * @private
   */
  getDefaultRainfall(month) {
    const rainfall = {
      1: 30, 2: 40, 3: 80, 4: 120, 5: 200, 6: 350,
      7: 380, 8: 340, 9: 250, 10: 200, 11: 120, 12: 50
    };
    return rainfall[month] || 150;
  }
}

// Export for use in your app
export default SeasonalSuitabilityHelper;

// Or for vanilla JS (without modules)
if (typeof window !== 'undefined') {
  window.SeasonalSuitabilityHelper = SeasonalSuitabilityHelper;
}
