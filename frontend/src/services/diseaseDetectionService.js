/**
 * Disease Detection Service
 * Frontend service for communicating with disease detection API
 */

import { apiFetch } from './api';

const DISEASE_API_URL = '/api/disease-detection';

class DiseaseDetectionService {
  /**
   * Check if disease detection service is healthy
   */
  async healthCheck() {
    try {
      const response = await apiFetch(`${DISEASE_API_URL}/health`);
      return await response.json();
    } catch (error) {
      console.error('Health check failed:', error);
      throw error;
    }
  }

  /**
   * Get model information
   */
  async getModelInfo() {
    try {
      const response = await apiFetch(`${DISEASE_API_URL}/model-info`);
      return await response.json();
    } catch (error) {
      console.error('Failed to get model info:', error);
      throw error;
    }
  }

  /**
   * Get information about all detectable diseases
   */
  async getDiseasesInfo() {
    try {
      const response = await apiFetch(`${DISEASE_API_URL}/diseases`);
      return await response.json();
    } catch (error) {
      console.error('Failed to get diseases info:', error);
      throw error;
    }
  }

  /**
   * Predict disease from image file
   * @param {File} imageFile - Image file object
   * @param {Object} metadata - Additional metadata
   */
  async predictFromImage(imageFile, metadata = {}) {
    try {
      const formData = new FormData();
      formData.append('image', imageFile);

      // Add metadata
      if (metadata.location) {
        formData.append('location', JSON.stringify(metadata.location));
      }
      if (metadata.plantAge) {
        formData.append('plantAge', metadata.plantAge);
      }
      if (metadata.variety) {
        formData.append('variety', metadata.variety);
      }
      if (metadata.notes) {
        formData.append('notes', metadata.notes);
      }

      const response = await apiFetch(`${DISEASE_API_URL}/predict`, {
        method: 'POST',
        body: formData
        // Don't set Content-Type header - browser will set it automatically with boundary for FormData
      });

      return await response.json();
    } catch (error) {
      console.error('Disease prediction failed:', error);
      throw error;
    }
  }

  /**
   * Predict disease from image URL
   * @param {string} imageUrl - URL of the image
   */
  async predictFromUrl(imageUrl) {
    try {
      const response = await apiFetch(`${DISEASE_API_URL}/predict-url`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ imageUrl })
      });

      return await response.json();
    } catch (error) {
      console.error('URL prediction failed:', error);
      throw error;
    }
  }

  /**
   * Batch predict diseases from multiple images
   * @param {FileList|Array<File>} imageFiles - Array of image files
   */
  async batchPredict(imageFiles) {
    try {
      const formData = new FormData();

      // Add all images
      Array.from(imageFiles).forEach((file) => {
        formData.append('images', file);
      });

      const response = await apiFetch(`${DISEASE_API_URL}/batch-predict`, {
        method: 'POST',
        body: formData
      });

      return await response.json();
    } catch (error) {
      console.error('Batch prediction failed:', error);
      throw error;
    }
  }

  /**
   * Get detection history for current user
   * @param {number} limit - Number of records to fetch
   */
  async getHistory(limit = 20) {
    try {
      const response = await apiFetch(`${DISEASE_API_URL}/history?limit=${limit}`);
      return await response.json();
    } catch (error) {
      console.error('Failed to get history:', error);
      throw error;
    }
  }

  /**
   * Get all detections with pagination (Admin)
   * @param {Object} params - Query parameters
   */
  async getAllDetections(params = {}) {
    try {
      const queryParams = new URLSearchParams();

      if (params.page) queryParams.append('page', params.page);
      if (params.limit) queryParams.append('limit', params.limit);
      if (params.prediction) queryParams.append('prediction', params.prediction);
      if (params.status) queryParams.append('status', params.status);
      if (params.userId) queryParams.append('userId', params.userId);
      if (params.startDate) queryParams.append('startDate', params.startDate);
      if (params.endDate) queryParams.append('endDate', params.endDate);

      const response = await apiFetch(`${DISEASE_API_URL}/all?${queryParams.toString()}`);
      return await response.json();
    } catch (error) {
      console.error('Failed to get all detections:', error);
      throw error;
    }
  }

  /**
   * Get analytics/statistics
   * @param {Object} params - Query parameters
   */
  async getAnalytics(params = {}) {
    try {
      const queryParams = new URLSearchParams();

      if (params.userId) queryParams.append('userId', params.userId);
      if (params.startDate) queryParams.append('startDate', params.startDate);
      if (params.endDate) queryParams.append('endDate', params.endDate);

      const response = await apiFetch(`${DISEASE_API_URL}/analytics?${queryParams.toString()}`);
      return await response.json();
    } catch (error) {
      console.error('Failed to get analytics:', error);
      throw error;
    }
  }

  /**
   * Get disease trends
   * @param {number} days - Number of days to analyze
   */
  async getTrends(days = 30) {
    try {
      const response = await apiFetch(`${DISEASE_API_URL}/trends?days=${days}`);
      return await response.json();
    } catch (error) {
      console.error('Failed to get trends:', error);
      throw error;
    }
  }

  /**
   * Get detections that need follow-up
   */
  async getFollowUps() {
    try {
      const response = await apiFetch(`${DISEASE_API_URL}/follow-ups`);
      return await response.json();
    } catch (error) {
      console.error('Failed to get follow-ups:', error);
      throw error;
    }
  }

  /**
   * Update detection status
   * @param {string} detectionId - Detection ID
   * @param {string} status - New status
   * @param {string} actionTaken - Action description
   */
  async updateStatus(detectionId, status, actionTaken = null) {
    try {
      const response = await apiFetch(`${DISEASE_API_URL}/${detectionId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status, actionTaken })
      });

      return await response.json();
    } catch (error) {
      console.error('Failed to update status:', error);
      throw error;
    }
  }

  /**
   * Add feedback to a detection
   * @param {string} detectionId - Detection ID
   * @param {boolean} accurate - Whether prediction was accurate
   * @param {string} comment - Optional comment
   * @param {number} rating - Optional rating (1-5)
   */
  async addFeedback(detectionId, accurate, comment = null, rating = null) {
    try {
      const response = await apiFetch(`${DISEASE_API_URL}/${detectionId}/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ accurate, comment, rating })
      });

      return await response.json();
    } catch (error) {
      console.error('Failed to add feedback:', error);
      throw error;
    }
  }

  /**
   * Delete a detection
   * @param {string} detectionId - Detection ID
   */
  async deleteDetection(detectionId) {
    try {
      const response = await apiFetch(`${DISEASE_API_URL}/${detectionId}`, {
        method: 'DELETE'
      });

      return await response.json();
    } catch (error) {
      console.error('Failed to delete detection:', error);
      throw error;
    }
  }
}

// Export singleton instance
const diseaseDetectionService = new DiseaseDetectionService();
export default diseaseDetectionService;
