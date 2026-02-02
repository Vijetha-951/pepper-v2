// Seasonal Suitability Routes
// API endpoints for seasonal suitability predictions

import express from 'express';
import seasonalSuitabilityService from '../services/seasonalSuitability.service.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

/**
 * @route   POST /api/seasonal-suitability/predict
 * @desc    Get seasonal suitability prediction for a pepper variety
 * @access  Public
 */
router.post('/predict', async (req, res) => {
  try {
    const {
      month,
      district,
      pincode,
      variety,
      temperature,
      rainfall,
      humidity,
      waterAvailability,
      productId
    } = req.body;

    // Validate required fields
    if (!month || !district || !pincode || !variety || 
        temperature === undefined || rainfall === undefined || 
        humidity === undefined || !waterAvailability) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
        requiredFields: [
          'month', 'district', 'pincode', 'variety',
          'temperature', 'rainfall', 'humidity', 'waterAvailability'
        ]
      });
    }

    // Get prediction
    const prediction = await seasonalSuitabilityService.getPrediction({
      month: parseInt(month),
      district,
      pincode: parseInt(pincode),
      variety,
      temperature: parseFloat(temperature),
      rainfall: parseFloat(rainfall),
      humidity: parseFloat(humidity),
      waterAvailability
    });

    // Track prediction
    const sessionId = req.sessionID || uuidv4();
    const userId = req.user?._id || null;
    const locationInfo = {
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      platform: req.get('sec-ch-ua-platform') || 'unknown'
    };

    const analyticsId = await seasonalSuitabilityService.trackPrediction(
      {
        month: parseInt(month),
        district,
        pincode: parseInt(pincode),
        variety,
        temperature: parseFloat(temperature),
        rainfall: parseFloat(rainfall),
        humidity: parseFloat(humidity),
        waterAvailability
      },
      prediction,
      userId,
      sessionId,
      productId || null,
      locationInfo
    );

    res.json({
      success: true,
      data: prediction,
      analyticsId
    });

  } catch (error) {
    console.error('Prediction error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get prediction',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/seasonal-suitability/batch-predict
 * @desc    Get predictions for multiple scenarios
 * @access  Public
 */
router.post('/batch-predict', async (req, res) => {
  try {
    const { predictions } = req.body;

    if (!Array.isArray(predictions) || predictions.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid input. Expected array of prediction requests.'
      });
    }

    if (predictions.length > 20) {
      return res.status(400).json({
        success: false,
        message: 'Maximum 20 predictions per batch request'
      });
    }

    const results = await Promise.all(
      predictions.map(async (params) => {
        try {
          const prediction = await seasonalSuitabilityService.getPrediction({
            month: parseInt(params.month),
            district: params.district,
            pincode: parseInt(params.pincode),
            variety: params.variety,
            temperature: parseFloat(params.temperature),
            rainfall: parseFloat(params.rainfall),
            humidity: parseFloat(params.humidity),
            waterAvailability: params.waterAvailability
          });
          return { success: true, data: prediction, params };
        } catch (error) {
          return { success: false, error: error.message, params };
        }
      })
    );

    const successCount = results.filter(r => r.success).length;

    res.json({
      success: true,
      totalRequests: predictions.length,
      successfulPredictions: successCount,
      failedPredictions: predictions.length - successCount,
      results
    });

  } catch (error) {
    console.error('Batch prediction error:', error);
    res.status(500).json({
      success: false,
      message: 'Batch prediction failed',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/seasonal-suitability/track-action
 * @desc    Track user action (viewed details, added to cart, placed order)
 * @access  Public
 */
router.post('/track-action', async (req, res) => {
  try {
    const { analyticsId, actionType, orderId } = req.body;

    if (!analyticsId || !actionType) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: analyticsId, actionType'
      });
    }

    const validActions = ['viewedDetails', 'addedToCart', 'orderPlaced'];
    if (!validActions.includes(actionType)) {
      return res.status(400).json({
        success: false,
        message: `Invalid action type. Must be one of: ${validActions.join(', ')}`
      });
    }

    await seasonalSuitabilityService.trackAction(
      analyticsId,
      actionType,
      { orderId }
    );

    res.json({
      success: true,
      message: 'Action tracked successfully'
    });

  } catch (error) {
    console.error('Track action error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to track action',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/seasonal-suitability/health
 * @desc    Check ML API health status
 * @access  Public
 */
router.get('/health', async (req, res) => {
  try {
    const health = await seasonalSuitabilityService.checkHealth();
    
    res.json({
      success: true,
      mlApi: health,
      fallbackAvailable: true,
      service: 'operational'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Health check failed',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/seasonal-suitability/analytics/summary
 * @desc    Get analytics summary
 * @access  Private/Admin
 */
router.get('/analytics/summary', async (req, res) => {
  try {
    const { startDate, endDate, variety, district } = req.query;

    const { default: SeasonalSuitabilityAnalytics } = await import('../models/SeasonalSuitabilityAnalytics.js');
    
    const summary = await SeasonalSuitabilityAnalytics.getAnalyticsSummary({
      startDate,
      endDate,
      variety,
      district
    });

    res.json({
      success: true,
      data: summary
    });

  } catch (error) {
    console.error('Analytics summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get analytics summary',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/seasonal-suitability/analytics/by-variety
 * @desc    Get variety-wise analytics
 * @access  Private/Admin
 */
router.get('/analytics/by-variety', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const { default: SeasonalSuitabilityAnalytics } = await import('../models/SeasonalSuitabilityAnalytics.js');
    
    const analytics = await SeasonalSuitabilityAnalytics.getVarietyAnalytics({
      startDate,
      endDate
    });

    res.json({
      success: true,
      data: analytics
    });

  } catch (error) {
    console.error('Variety analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get variety analytics',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/seasonal-suitability/clear-cache
 * @desc    Clear prediction cache
 * @access  Private/Admin
 */
router.post('/clear-cache', async (req, res) => {
  try {
    seasonalSuitabilityService.clearCache();
    
    res.json({
      success: true,
      message: 'Cache cleared successfully'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to clear cache',
      error: error.message
    });
  }
});

export default router;
