// Seasonal Suitability Service
// Integrates with Python ML API and provides rule-based fallback

import axios from 'axios';
import SeasonalSuitabilityAnalytics from '../models/SeasonalSuitabilityAnalytics.js';

class SeasonalSuitabilityService {
  constructor() {
    // Python ML API configuration
    this.mlApiUrl = process.env.ML_API_URL || 'http://127.0.0.1:5001';
    this.mlApiTimeout = 5000; // 5 seconds timeout
    this.useCache = true;
    this.cache = new Map();
    this.cacheExpiry = 3600000; // 1 hour
  }

  /**
   * Get seasonal suitability prediction
   * @param {Object} params - Prediction parameters
   * @returns {Object} Prediction result with user-friendly text
   */
  async getPrediction(params) {
    try {
      // Validate input
      this._validateInput(params);

      // Check cache
      const cacheKey = this._getCacheKey(params);
      if (this.useCache && this.cache.has(cacheKey)) {
        const cached = this.cache.get(cacheKey);
        if (Date.now() - cached.timestamp < this.cacheExpiry) {
          console.log('Returning cached prediction');
          return { ...cached.data, fromCache: true };
        }
      }

      // Try ML API first
      let prediction;
      let source = 'ml_model';
      
      try {
        prediction = await this._callMLApi(params);
      } catch (mlError) {
        console.warn('ML API failed, using rule-based fallback:', mlError.message);
        prediction = this._ruleBasedFallback(params);
        source = 'rule_based_fallback';
      }

      // Convert to user-friendly format
      const result = this._formatPrediction(prediction, params, source);

      // Cache result
      if (this.useCache) {
        this.cache.set(cacheKey, {
          data: result,
          timestamp: Date.now()
        });
      }

      return result;
    } catch (error) {
      console.error('Prediction error:', error);
      throw error;
    }
  }

  /**
   * Call Python ML API
   * @private
   */
  async _callMLApi(params) {
    const response = await axios.post(
      `${this.mlApiUrl}/predict`,
      {
        month: params.month,
        district: params.district,
        pincode: params.pincode,
        variety: params.variety,
        temperature: params.temperature,
        rainfall: params.rainfall,
        humidity: params.humidity,
        water_availability: params.waterAvailability
      },
      {
        timeout: this.mlApiTimeout,
        headers: { 'Content-Type': 'application/json' }
      }
    );

    if (!response.data.success) {
      throw new Error(response.data.error || 'ML API returned error');
    }

    return {
      suitability: response.data.prediction,
      confidence: response.data.confidence,
      confidenceScores: response.data.confidence_scores
    };
  }

  /**
   * Rule-based fallback when ML API is unavailable
   * @private
   */
  _ruleBasedFallback(params) {
    const { 
      month, district, variety, temperature, rainfall, humidity, waterAvailability, 
      isMature, isCurrentlyBlooming 
    } = params;

    // Planting season logic
    const isPlantingSeason = [6, 7].includes(month); // June-July
    const isMonsoon = [6, 7, 8, 9].includes(month);
    const isSummer = [3, 4, 5].includes(month);

    // Highland districts (better for pepper)
    const highlandDistricts = ['Idukki', 'Wayanad', 'Pathanamthitta'];
    const isHighland = highlandDistricts.includes(district);

    // Variety characteristics
    const droughtTolerant = ['Panniyur 1', 'IISR Shakthi', 'Karimunda'];
    const highYield = ['Panniyur 5', 'Sreekara', 'Pournami'];

    // Scoring system
    let score = 0;

    // Plant maturity bonus (mature plants are more resilient)
    // If maturity data is missing, assume neutral (don't penalize old products)
    if (isMature === true) {
      score += 2; // Mature plants handle conditions better
    } else if (isMature === false) {
      score -= 1; // Only penalize if we know it's young
    }
    // If undefined/null, no adjustment (neutral for backward compatibility)

    // Blooming season consideration
    if (isCurrentlyBlooming === true) {
      score += 1; // Blooming indicates good conditions
      if (isSummer && waterAvailability === 'Low') {
        score -= 2; // But needs water during bloom
      }
    }

    // Temperature scoring (optimal: 20-30°C)
    if (temperature >= 20 && temperature <= 30) {
      score += 2;
    } else if (temperature >= 18 && temperature <= 35) {
      score += 1;
    } else {
      score -= 2;
    }

    // Rainfall scoring (optimal: 150-300mm/month)
    if (rainfall >= 150 && rainfall <= 300) {
      score += 2;
    } else if (rainfall >= 100 && rainfall <= 400) {
      score += 1;
    } else if (rainfall > 500) {
      score -= 2;
    } else {
      score -= 1;
    }

    // Humidity scoring (optimal: 60-85%)
    if (humidity >= 60 && humidity <= 85) {
      score += 1;
    } else if (humidity < 50 || humidity > 90) {
      score -= 1;
    }

    // Water availability
    if (['High', 'Medium'].includes(waterAvailability)) {
      score += 1;
    } else {
      score -= 2;
    }

    // Seasonal adjustments
    if (isPlantingSeason) {
      score += 3;
    } else if (isMonsoon) {
      score += 1;
    } else if (isSummer && waterAvailability === 'Low') {
      score -= 2;
    }

    // Location bonus
    if (isHighland) {
      score += 1;
    }

    // Variety-specific adjustments
    if (droughtTolerant.includes(variety) && waterAvailability === 'Low') {
      score += 1;
    }
    if (highYield.includes(variety) && temperature >= 20 && temperature <= 30 && ['High', 'Medium'].includes(waterAvailability)) {
      score += 1;
    }

    // Determine suitability (adjusted thresholds for year-round growing)
    let suitability;
    let confidence;

    if (score >= 4) {
      suitability = 'Recommended';
      confidence = 0.85;
    } else if (score >= 0) {
      suitability = 'Plant with Care';
      confidence = 0.70;
    } else {
      suitability = 'Not Recommended';
      confidence = 0.80;
    }

    return {
      suitability,
      confidence,
      confidenceScores: {
        'Recommended': suitability === 'Recommended' ? confidence : 0.1,
        'Plant with Care': suitability === 'Plant with Care' ? confidence : 0.2,
        'Not Recommended': suitability === 'Not Recommended' ? confidence : 0.1
      }
    };
  }

  /**
   * Format prediction with user-friendly text (no ML terms)
   * @private
   */
  _formatPrediction(prediction, params, source) {
    const { suitability, confidence } = prediction;
    const { month, variety, district } = params;

    // Month names
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    // User-friendly messages (no ML terminology)
    const messages = {
      'Recommended': {
        badge: 'success',
        title: 'Perfect Growing Conditions',
        description: `${monthNames[month - 1]} is an excellent time to plant ${variety} in ${district}. Current weather conditions are ideal for healthy growth and good yields.`,
        tips: [
          'Ideal planting conditions detected',
          'Weather patterns support strong growth',
          'Expected to perform well in your area'
        ],
        icon: '✓'
      },
      'Plant with Care': {
        badge: 'warning',
        title: 'Moderate Growing Conditions',
        description: `${variety} can be planted in ${district} during ${monthNames[month - 1]}, but may require extra attention. Consider additional care and monitoring.`,
        tips: [
          'Regular monitoring recommended',
          'May need supplemental care',
          'Success possible with proper management'
        ],
        icon: '!'
      },
      'Not Recommended': {
        badge: 'danger',
        title: 'Challenging Growing Conditions',
        description: `${monthNames[month - 1]} may not be ideal for planting ${variety} in ${district}. Consider waiting for better conditions or choosing a different variety.`,
        tips: [
          'Weather conditions not optimal',
          'Higher risk of poor outcomes',
          'Consider alternative timing or varieties'
        ],
        icon: '×'
      }
    };

    const message = messages[suitability];

    // Additional contextual tips
    const contextualTips = this._getContextualTips(params, suitability);

    return {
      suitability,
      badge: message.badge,
      title: message.title,
      description: message.description,
      icon: message.icon,
      tips: [...message.tips, ...contextualTips],
      confidence: this._getConfidenceLevel(confidence),
      technicalData: {
        source,
        confidenceScore: confidence,
        month: monthNames[month - 1],
        variety,
        district
      }
    };
  }

  /**
   * Get contextual tips based on parameters
   * @private
   */
  _getContextualTips(params, suitability) {
    const tips = [];
    const { month, temperature, rainfall, waterAvailability, isMature, isCurrentlyBlooming, plantAge } = params;

    // Plant age and maturity specific tips (only if data exists)
    if (isMature === true) {
      tips.push('✅ Mature plant - more resilient to weather variations');
    } else if (isMature === false && plantAge) {
      tips.push('🌱 Young plant - requires consistent care and monitoring');
    }

    // Blooming season tips (only if currently blooming)
    if (isCurrentlyBlooming === true) {
      tips.push('🌸 Currently blooming - ensure adequate water and nutrients');
      if (waterAvailability === 'Low') {
        tips.push('⚠️ Critical: Increase watering during bloom period');
      }
    }

    // Seasonal tips
    if ([6, 7].includes(month)) {
      tips.push('Peak planting season - optimal time for establishment');
    } else if ([3, 4, 5].includes(month)) {
      tips.push('Summer season - ensure adequate irrigation');
    }

    // Temperature tips
    if (temperature < 20) {
      tips.push('Cooler temperatures may slow initial growth');
      if (isMature === false) {
        tips.push('Young plants especially sensitive to cold - protect if needed');
      }
    } else if (temperature > 30) {
      tips.push('Provide shade during hottest hours');
    }

    // Rainfall tips
    if (rainfall > 300 && suitability !== 'Not Recommended') {
      tips.push('Heavy rainfall expected - ensure good drainage');
    } else if (rainfall < 100) {
      tips.push('Low rainfall period - irrigation will be essential');
    }

    // Water availability
    if (waterAvailability === 'Low' && suitability !== 'Not Recommended') {
      tips.push('Limited water - consider drip irrigation system');
    }

    return tips.slice(0, 2); // Return max 2 contextual tips
  }

  /**
   * Convert confidence score to user-friendly level
   * @private
   */
  _getConfidenceLevel(score) {
    if (score >= 0.85) return 'Very High';
    if (score >= 0.75) return 'High';
    if (score >= 0.60) return 'Moderate';
    return 'Low';
  }

  /**
   * Validate input parameters
   * @private
   */
  _validateInput(params) {
    const required = ['month', 'district', 'pincode', 'variety', 'temperature', 'rainfall', 'humidity', 'waterAvailability'];
    
    for (const field of required) {
      if (params[field] === undefined || params[field] === null) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    if (params.month < 1 || params.month > 12) {
      throw new Error('Month must be between 1 and 12');
    }

    if (params.temperature < 0 || params.temperature > 50) {
      throw new Error('Temperature must be between 0 and 50°C');
    }

    if (params.humidity < 0 || params.humidity > 100) {
      throw new Error('Humidity must be between 0 and 100%');
    }

    if (!['Low', 'Medium', 'High'].includes(params.waterAvailability)) {
      throw new Error('Water availability must be Low, Medium, or High');
    }
  }

  /**
   * Generate cache key
   * @private
   */
  _getCacheKey(params) {
    return `${params.month}_${params.district}_${params.pincode}_${params.variety}_${params.temperature}_${params.rainfall}_${params.humidity}_${params.waterAvailability}`;
  }

  /**
   * Track prediction in analytics
   */
  async trackPrediction(params, prediction, userId, sessionId, productId, locationInfo) {
    try {
      const analytics = await SeasonalSuitabilityAnalytics.trackRecommendation({
        userId,
        sessionId,
        productId,
        variety: params.variety,
        inputParameters: {
          month: params.month,
          district: params.district,
          pincode: params.pincode,
          temperature: params.temperature,
          rainfall: params.rainfall,
          humidity: params.humidity,
          waterAvailability: params.waterAvailability
        },
        prediction: {
          suitability: prediction.suitability,
          confidence: prediction.technicalData.confidenceScore,
          confidenceScores: {
            recommended: prediction.technicalData.confidenceScore,
            plantWithCare: 0,
            notRecommended: 0
          },
          source: prediction.technicalData.source
        },
        locationInfo
      });

      return analytics._id;
    } catch (error) {
      console.error('Error tracking prediction:', error);
      return null;
    }
  }

  /**
   * Track user action
   */
  async trackAction(analyticsId, actionType, additionalData = {}) {
    try {
      const analytics = await SeasonalSuitabilityAnalytics.findById(analyticsId);
      if (analytics) {
        await analytics.trackAction(actionType, additionalData);
      }
    } catch (error) {
      console.error('Error tracking action:', error);
    }
  }

  /**
   * Check ML API health
   */
  async checkHealth() {
    try {
      const response = await axios.get(`${this.mlApiUrl}/health`, {
        timeout: 3000
      });
      return {
        available: true,
        status: response.data
      };
    } catch (error) {
      return {
        available: false,
        error: error.message
      };
    }
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
    console.log('Prediction cache cleared');
  }
}

export default new SeasonalSuitabilityService();
