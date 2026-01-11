/**
 * Pepper ML Service
 * Node.js service to communicate with Python ML API for pepper yield predictions
 */

import axios from 'axios';

class PepperMLService {
  constructor() {
    this.mlApiUrl = process.env.ML_API_URL || 'http://localhost:5001';
    this.timeout = 10000; // 10 seconds
  }

  /**
   * Check if ML API is healthy and ready
   */
  async healthCheck() {
    try {
      const response = await axios.get(`${this.mlApiUrl}/health`, {
        timeout: this.timeout
      });
      return response.data;
    } catch (error) {
      console.error('ML API health check failed:', error.message);
      throw new Error('ML service is not available');
    }
  }

  /**
   * Predict pepper yield and get recommendations
   * @param {Object} input - Prediction input parameters
   * @param {string} input.soil_type - 'Sandy' | 'Loamy' | 'Clay'
   * @param {string} input.water_availability - 'Low' | 'Medium' | 'High'
   * @param {number} input.irrigation_frequency - 1-7 (times per week)
   * @param {string} input.crop_stage - 'Seedling' | 'Vegetative' | 'Flowering' | 'Fruiting'
   * @param {string} input.location - Optional location/region
   */
  async predictYield(input) {
    try {
      // Validate input
      this._validateInput(input);

      const response = await axios.post(
        `${this.mlApiUrl}/predict`,
        input,
        {
          timeout: this.timeout,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        return {
          success: true,
          ...response.data.data
        };
      } else {
        throw new Error(response.data.error || 'Prediction failed');
      }
    } catch (error) {
      console.error('Pepper yield prediction error:', error.message);
      
      if (error.response) {
        // ML API returned an error
        throw new Error(error.response.data.error || 'Prediction failed');
      } else if (error.request) {
        // No response from ML API
        throw new Error('ML service is not responding. Please ensure the Python ML API is running.');
      } else {
        throw error;
      }
    }
  }

  /**
   * Batch predict for multiple inputs
   * @param {Array} inputs - Array of prediction input objects
   */
  async batchPredict(inputs) {
    try {
      if (!Array.isArray(inputs) || inputs.length === 0) {
        throw new Error('Inputs must be a non-empty array');
      }

      const response = await axios.post(
        `${this.mlApiUrl}/batch-predict`,
        { inputs },
        {
          timeout: this.timeout * 2, // Longer timeout for batch
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        return {
          success: true,
          results: response.data.results
        };
      } else {
        throw new Error(response.data.error || 'Batch prediction failed');
      }
    } catch (error) {
      console.error('Batch prediction error:', error.message);
      
      if (error.response) {
        throw new Error(error.response.data.error || 'Batch prediction failed');
      } else if (error.request) {
        throw new Error('ML service is not responding');
      } else {
        throw error;
      }
    }
  }

  /**
   * Get ML model information
   */
  async getModelInfo() {
    try {
      const response = await axios.get(`${this.mlApiUrl}/model-info`, {
        timeout: this.timeout
      });
      return response.data;
    } catch (error) {
      console.error('Failed to get model info:', error.message);
      throw new Error('Could not retrieve model information');
    }
  }

  /**
   * Validate prediction input
   * @private
   */
  _validateInput(input) {
    const requiredFields = ['soil_type', 'water_availability', 'irrigation_frequency', 'crop_stage'];
    const missingFields = requiredFields.filter(field => !(field in input));

    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }

    // Validate soil type
    const validSoilTypes = ['Sandy', 'Loamy', 'Clay'];
    if (!validSoilTypes.includes(input.soil_type)) {
      throw new Error(`Invalid soil_type. Must be one of: ${validSoilTypes.join(', ')}`);
    }

    // Validate water availability
    const validWaterAvail = ['Low', 'Medium', 'High'];
    if (!validWaterAvail.includes(input.water_availability)) {
      throw new Error(`Invalid water_availability. Must be one of: ${validWaterAvail.join(', ')}`);
    }

    // Validate crop stage
    const validCropStages = ['Seedling', 'Vegetative', 'Flowering', 'Fruiting'];
    if (!validCropStages.includes(input.crop_stage)) {
      throw new Error(`Invalid crop_stage. Must be one of: ${validCropStages.join(', ')}`);
    }

    // Validate irrigation frequency
    const irrigationFreq = parseInt(input.irrigation_frequency);
    if (isNaN(irrigationFreq) || irrigationFreq < 1 || irrigationFreq > 7) {
      throw new Error('irrigation_frequency must be between 1 and 7');
    }
  }

  /**
   * Convert user-friendly input to ML API format
   * Handles case variations and provides defaults
   */
  normalizeInput(userInput) {
    const normalized = {};

    // Normalize soil type
    if (userInput.soilType || userInput.soil_type) {
      const soilType = (userInput.soilType || userInput.soil_type).toLowerCase();
      if (soilType.includes('sand')) normalized.soil_type = 'Sandy';
      else if (soilType.includes('loam')) normalized.soil_type = 'Loamy';
      else if (soilType.includes('clay')) normalized.soil_type = 'Clay';
      else normalized.soil_type = 'Loamy'; // Default
    }

    // Normalize water availability
    if (userInput.waterAvailability || userInput.water_availability) {
      const water = (userInput.waterAvailability || userInput.water_availability).toLowerCase();
      if (water.includes('low') || water.includes('scarce')) normalized.water_availability = 'Low';
      else if (water.includes('high') || water.includes('abundant')) normalized.water_availability = 'High';
      else normalized.water_availability = 'Medium'; // Default
    }

    // Normalize irrigation frequency
    if (userInput.irrigationFrequency || userInput.irrigation_frequency) {
      normalized.irrigation_frequency = parseInt(
        userInput.irrigationFrequency || userInput.irrigation_frequency
      );
    }

    // Normalize crop stage
    if (userInput.cropStage || userInput.crop_stage) {
      const stage = (userInput.cropStage || userInput.crop_stage).toLowerCase();
      if (stage.includes('seed')) normalized.crop_stage = 'Seedling';
      else if (stage.includes('veget')) normalized.crop_stage = 'Vegetative';
      else if (stage.includes('flower') || stage.includes('bloom')) normalized.crop_stage = 'Flowering';
      else if (stage.includes('fruit')) normalized.crop_stage = 'Fruiting';
      else normalized.crop_stage = 'Vegetative'; // Default
    }

    // Add location if provided
    if (userInput.location) {
      normalized.location = userInput.location;
    }

    return normalized;
  }

  /**
   * Get recommendations based on current conditions
   * Simplified interface for quick recommendations
   */
  async getRecommendations(soilType, waterAvailability, cropStage, irrigationFrequency = 4) {
    const input = {
      soil_type: soilType,
      water_availability: waterAvailability,
      crop_stage: cropStage,
      irrigation_frequency: irrigationFrequency
    };

    return await this.predictYield(input);
  }
}

// Export singleton instance
const pepperMLService = new PepperMLService();
export default pepperMLService;
