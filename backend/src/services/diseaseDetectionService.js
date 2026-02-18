/**
 * Disease Detection Service
 * Node.js service to communicate with Python Disease Detection API
 */

import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import DiseaseDetection from '../models/DiseaseDetection.js';

class DiseaseDetectionService {
  constructor() {
    this.apiUrl = process.env.DISEASE_API_URL || 'http://localhost:5002';
    this.timeout = 30000; // 30 seconds for image processing
  }

  /**
   * Check if Disease Detection API is healthy and ready
   */
  async healthCheck() {
    try {
      const response = await axios.get(`${this.apiUrl}/health`, {
        timeout: 5000
      });
      return response.data;
    } catch (error) {
      console.error('Disease Detection API health check failed:', error.message);
      throw new Error('Disease detection service is not available');
    }
  }

  /**
   * Train the disease detection model
   */
  async trainModel() {
    try {
      const response = await axios.post(
        `${this.apiUrl}/train`,
        {},
        { timeout: 60000 } // 60 seconds for training
      );
      return response.data;
    } catch (error) {
      console.error('Model training failed:', error.message);
      throw new Error(`Failed to train model: ${error.message}`);
    }
  }

  /**
   * Predict disease from image file
   * @param {string} imagePath - Path to the image file
   * @param {Object} metadata - Additional metadata (userId, location, notes, etc.)
   */
  async predictFromFile(imagePath, metadata = {}) {
    try {
      // Create form data
      const formData = new FormData();
      formData.append('image', fs.createReadStream(imagePath));
      
      // Add metadata
      if (metadata.user_id) formData.append('user_id', metadata.user_id);
      if (metadata.location) formData.append('location', metadata.location);
      if (metadata.notes) formData.append('notes', metadata.notes);

      const response = await axios.post(
        `${this.apiUrl}/predict`,
        formData,
        {
          timeout: this.timeout,
          headers: formData.getHeaders()
        }
      );

      return response.data;
    } catch (error) {
      console.error('Disease prediction failed:', error.message);
      throw new Error(`Failed to predict disease: ${error.message}`);
    }
  }

  /**
   * Predict disease from image URL
   * @param {string} imageUrl - URL of the image
   */
  async predictFromUrl(imageUrl) {
    try {
      const response = await axios.post(
        `${this.apiUrl}/predict-url`,
        { image_url: imageUrl },
        {
          timeout: this.timeout,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('URL prediction failed:', error.message);
      throw new Error(`Failed to predict from URL: ${error.message}`);
    }
  }

  /**
   * Batch predict diseases from multiple images
   * @param {Array<string>} imagePaths - Array of image file paths
   */
  async batchPredict(imagePaths) {
    try {
      const formData = new FormData();
      
      imagePaths.forEach(path => {
        formData.append('images', fs.createReadStream(path));
      });

      const response = await axios.post(
        `${this.apiUrl}/batch-predict`,
        formData,
        {
          timeout: this.timeout * 2, // Double timeout for batch
          headers: formData.getHeaders()
        }
      );

      return response.data;
    } catch (error) {
      console.error('Batch prediction failed:', error.message);
      throw new Error(`Failed to batch predict: ${error.message}`);
    }
  }

  /**
   * Get information about all detectable diseases
   */
  async getDiseasesInfo() {
    try {
      const response = await axios.get(`${this.apiUrl}/diseases`, {
        timeout: 5000
      });
      return response.data;
    } catch (error) {
      console.error('Failed to get diseases info:', error.message);
      throw new Error(`Failed to get diseases information: ${error.message}`);
    }
  }

  /**
   * Get model information
   */
  async getModelInfo() {
    try {
      const response = await axios.get(`${this.apiUrl}/model-info`, {
        timeout: 5000
      });
      return response.data;
    } catch (error) {
      console.error('Failed to get model info:', error.message);
      throw new Error(`Failed to get model information: ${error.message}`);
    }
  }

  /**
   * Save detection result to database
   * @param {Object} predictionResult - Result from ML API
   * @param {Object} metadata - Additional metadata
   */
  async saveDetection(predictionResult, metadata = {}) {
    try {
      if (!predictionResult.success) {
        throw new Error('Cannot save failed prediction');
      }

      const detectionData = {
        userId: metadata.userId || null,
        userEmail: metadata.userEmail || null,
        imagePath: predictionResult.metadata?.filename || metadata.imagePath,
        imageUrl: metadata.imageUrl || null,
        originalFilename: metadata.originalFilename || predictionResult.metadata?.filename,
        fileSize: predictionResult.metadata?.file_size || 0,
        
        prediction: predictionResult.prediction,
        confidence: predictionResult.confidence,
        probabilities: predictionResult.probabilities,
        
        diseaseName: predictionResult.disease_info?.name || predictionResult.prediction,
        severity: predictionResult.disease_info?.severity || 'Unknown',
        description: predictionResult.disease_info?.description || '',
        treatment: predictionResult.disease_info?.treatment || [],
        prevention: predictionResult.disease_info?.prevention || [],
        
        location: metadata.location || null,
        plantAge: metadata.plantAge || null,
        variety: metadata.variety || null,
        notes: metadata.notes || null,
        
        status: 'detected'
      };

      const detection = new DiseaseDetection(detectionData);
      await detection.save();

      return detection;
    } catch (error) {
      console.error('Failed to save detection:', error.message);
      throw new Error(`Failed to save detection to database: ${error.message}`);
    }
  }

  /**
   * Get detection history for a user
   * @param {string} userId - User ID
   * @param {number} limit - Number of records to fetch
   */
  async getUserDetections(userId, limit = 20) {
    try {
      const detections = await DiseaseDetection.find({ userId })
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean();
      
      return detections;
    } catch (error) {
      console.error('Failed to get user detections:', error.message);
      throw new Error(`Failed to fetch detection history: ${error.message}`);
    }
  }

  /**
   * Get all detections with pagination
   * @param {number} page - Page number
   * @param {number} limit - Items per page
   * @param {Object} filter - Filter criteria
   */
  async getAllDetections(page = 1, limit = 20, filter = {}) {
    try {
      const skip = (page - 1) * limit;
      const query = {};

      if (filter.prediction) {
        query.prediction = filter.prediction;
      }
      if (filter.status) {
        query.status = filter.status;
      }
      if (filter.userId) {
        query.userId = filter.userId;
      }
      if (filter.startDate || filter.endDate) {
        query.createdAt = {};
        if (filter.startDate) query.createdAt.$gte = new Date(filter.startDate);
        if (filter.endDate) query.createdAt.$lte = new Date(filter.endDate);
      }

      const [detections, total] = await Promise.all([
        DiseaseDetection.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .populate('userId', 'name email')
          .lean(),
        DiseaseDetection.countDocuments(query)
      ]);

      return {
        detections,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('Failed to get all detections:', error.message);
      throw new Error(`Failed to fetch detections: ${error.message}`);
    }
  }

  /**
   * Get analytics/statistics
   * @param {string} userId - Optional user ID for user-specific analytics
   * @param {Date} startDate - Optional start date
   * @param {Date} endDate - Optional end date
   */
  async getAnalytics(userId = null, startDate = null, endDate = null) {
    try {
      const analytics = await DiseaseDetection.getAnalytics(userId, startDate, endDate);
      return analytics;
    } catch (error) {
      console.error('Failed to get analytics:', error.message);
      throw new Error(`Failed to fetch analytics: ${error.message}`);
    }
  }

  /**
   * Get disease trends over time
   * @param {number} days - Number of days to analyze
   */
  async getDiseaseTrends(days = 30) {
    try {
      const trends = await DiseaseDetection.getDiseaseTrends(days);
      return trends;
    } catch (error) {
      console.error('Failed to get disease trends:', error.message);
      throw new Error(`Failed to fetch disease trends: ${error.message}`);
    }
  }

  /**
   * Update detection status
   * @param {string} detectionId - Detection ID
   * @param {string} status - New status
   * @param {string} actionTaken - Action description
   */
  async updateDetectionStatus(detectionId, status, actionTaken = null) {
    try {
      const detection = await DiseaseDetection.findById(detectionId);
      if (!detection) {
        throw new Error('Detection not found');
      }

      await detection.updateStatus(status, actionTaken);
      return detection;
    } catch (error) {
      console.error('Failed to update detection status:', error.message);
      throw new Error(`Failed to update status: ${error.message}`);
    }
  }

  /**
   * Add user feedback to a detection
   * @param {string} detectionId - Detection ID
   * @param {boolean} accurate - Whether prediction was accurate
   * @param {string} comment - Optional comment
   * @param {number} rating - Optional rating (1-5)
   */
  async addFeedback(detectionId, accurate, comment = null, rating = null) {
    try {
      const detection = await DiseaseDetection.findById(detectionId);
      if (!detection) {
        throw new Error('Detection not found');
      }

      await detection.addFeedback(accurate, comment, rating);
      return detection;
    } catch (error) {
      console.error('Failed to add feedback:', error.message);
      throw new Error(`Failed to add feedback: ${error.message}`);
    }
  }

  /**
   * Get detections that need follow-up
   * @param {string} userId - Optional user ID
   */
  async getFollowUpRequired(userId = null) {
    try {
      const query = {
        followUpRequired: true,
        status: { $in: ['detected', 'treating'] },
        followUpDate: { $lte: new Date() }
      };

      if (userId) {
        query.userId = userId;
      }

      const detections = await DiseaseDetection.find(query)
        .sort({ followUpDate: 1 })
        .populate('userId', 'name email')
        .lean();

      return detections;
    } catch (error) {
      console.error('Failed to get follow-up detections:', error.message);
      throw new Error(`Failed to fetch follow-up detections: ${error.message}`);
    }
  }

  /**
   * Delete a detection record
   * @param {string} detectionId - Detection ID
   */
  async deleteDetection(detectionId) {
    try {
      const detection = await DiseaseDetection.findByIdAndDelete(detectionId);
      if (!detection) {
        throw new Error('Detection not found');
      }
      return { success: true, message: 'Detection deleted successfully' };
    } catch (error) {
      console.error('Failed to delete detection:', error.message);
      throw new Error(`Failed to delete detection: ${error.message}`);
    }
  }
}

// Export singleton instance
const diseaseDetectionService = new DiseaseDetectionService();
export default diseaseDetectionService;
