/**
 * Pepper Nursery ML Prediction Routes
 * REST API endpoints for pepper yield prediction and cultivation recommendations
 */

import express from 'express';
import pepperMLService from '../services/pepperMLService.js';

const router = express.Router();

/**
 * @route   GET /api/pepper-ml/health
 * @desc    Check if ML service is available
 * @access  Public
 */
router.get('/health', async (req, res) => {
  try {
    const health = await pepperMLService.healthCheck();
    res.json({
      success: true,
      message: 'ML service is healthy',
      data: health
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      message: 'ML service is not available',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/pepper-ml/predict
 * @desc    Predict pepper yield and get recommendations
 * @access  Public/Private (based on your auth setup)
 * @body    {
 *            soil_type: 'Sandy' | 'Loamy' | 'Clay',
 *            water_availability: 'Low' | 'Medium' | 'High',
 *            irrigation_frequency: 1-7,
 *            crop_stage: 'Seedling' | 'Vegetative' | 'Flowering' | 'Fruiting',
 *            location: 'Kerala' (optional)
 *          }
 */
router.post('/predict', async (req, res) => {
  try {
    const input = req.body;

    // Normalize input if needed
    const normalizedInput = pepperMLService.normalizeInput(input);

    // Get prediction
    const result = await pepperMLService.predictYield(normalizedInput);

    res.json({
      success: true,
      message: 'Prediction generated successfully',
      data: result
    });
  } catch (error) {
    console.error('Prediction error:', error);
    res.status(400).json({
      success: false,
      message: 'Prediction failed',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/pepper-ml/batch-predict
 * @desc    Batch predict for multiple scenarios
 * @access  Public/Private
 * @body    {
 *            inputs: [
 *              { soil_type: 'Loamy', ... },
 *              { soil_type: 'Sandy', ... }
 *            ]
 *          }
 */
router.post('/batch-predict', async (req, res) => {
  try {
    const { inputs } = req.body;

    if (!inputs || !Array.isArray(inputs)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid input format. Expected array of inputs.'
      });
    }

    // Normalize all inputs
    const normalizedInputs = inputs.map(input => 
      pepperMLService.normalizeInput(input)
    );

    const result = await pepperMLService.batchPredict(normalizedInputs);

    res.json({
      success: true,
      message: 'Batch predictions generated successfully',
      data: result
    });
  } catch (error) {
    console.error('Batch prediction error:', error);
    res.status(400).json({
      success: false,
      message: 'Batch prediction failed',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/pepper-ml/recommendations
 * @desc    Get quick recommendations based on query parameters
 * @access  Public
 * @query   soilType, waterAvailability, cropStage, irrigationFrequency
 */
router.get('/recommendations', async (req, res) => {
  try {
    const {
      soilType,
      waterAvailability,
      cropStage,
      irrigationFrequency = 4
    } = req.query;

    if (!soilType || !waterAvailability || !cropStage) {
      return res.status(400).json({
        success: false,
        message: 'Missing required parameters: soilType, waterAvailability, cropStage'
      });
    }

    const result = await pepperMLService.getRecommendations(
      soilType,
      waterAvailability,
      cropStage,
      parseInt(irrigationFrequency)
    );

    res.json({
      success: true,
      message: 'Recommendations generated successfully',
      data: result
    });
  } catch (error) {
    console.error('Recommendations error:', error);
    res.status(400).json({
      success: false,
      message: 'Failed to generate recommendations',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/pepper-ml/model-info
 * @desc    Get information about the ML models
 * @access  Public
 */
router.get('/model-info', async (req, res) => {
  try {
    const modelInfo = await pepperMLService.getModelInfo();
    res.json({
      success: true,
      message: 'Model information retrieved successfully',
      data: modelInfo
    });
  } catch (error) {
    console.error('Model info error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve model information',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/pepper-ml/compare-scenarios
 * @desc    Compare different cultivation scenarios
 * @access  Public/Private
 * @body    Base parameters and variations to compare
 */
router.post('/compare-scenarios', async (req, res) => {
  try {
    const { baseParams, variations } = req.body;

    if (!baseParams) {
      return res.status(400).json({
        success: false,
        message: 'Base parameters are required'
      });
    }

    // Generate scenarios by combining base params with variations
    const scenarios = [];
    
    // Add base scenario
    scenarios.push({
      name: 'Current',
      ...baseParams
    });

    // Add variations if provided
    if (variations && Array.isArray(variations)) {
      variations.forEach((variation, index) => {
        scenarios.push({
          name: variation.name || `Scenario ${index + 2}`,
          ...baseParams,
          ...variation
        });
      });
    }

    // Get predictions for all scenarios
    const inputs = scenarios.map(s => pepperMLService.normalizeInput(s));
    const predictions = await pepperMLService.batchPredict(inputs);

    // Combine scenarios with predictions
    const comparison = scenarios.map((scenario, index) => {
      const predictionResult = predictions.results[index];
      return {
        scenario_name: scenario.name,
        parameters: scenario,
        prediction: predictionResult.success ? predictionResult.data : null,
        error: predictionResult.success ? null : predictionResult.error
      };
    });

    res.json({
      success: true,
      message: 'Scenario comparison completed',
      data: {
        total_scenarios: comparison.length,
        scenarios: comparison
      }
    });
  } catch (error) {
    console.error('Scenario comparison error:', error);
    res.status(400).json({
      success: false,
      message: 'Failed to compare scenarios',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/pepper-ml/options
 * @desc    Get available options for dropdowns/forms
 * @access  Public
 */
router.get('/options', (req, res) => {
  res.json({
    success: true,
    data: {
      soil_types: [
        { value: 'Sandy', label: 'Sandy Soil', description: 'Well-draining, requires frequent irrigation' },
        { value: 'Loamy', label: 'Loamy Soil', description: 'Ideal for pepper, balanced drainage and retention' },
        { value: 'Clay', label: 'Clay Soil', description: 'High water retention, ensure good drainage' }
      ],
      water_availability: [
        { value: 'Low', label: 'Low', description: 'Limited water access, requires water conservation' },
        { value: 'Medium', label: 'Medium', description: 'Moderate water access, regular irrigation needed' },
        { value: 'High', label: 'High', description: 'Abundant water, focus on drainage' }
      ],
      crop_stages: [
        { value: 'Seedling', label: 'Seedling', description: '0-2 months, young plants' },
        { value: 'Vegetative', label: 'Vegetative', description: '2-6 months, active growth' },
        { value: 'Flowering', label: 'Flowering', description: '6-8 months, flower formation' },
        { value: 'Fruiting', label: 'Fruiting', description: '8+ months, fruit development' }
      ],
      irrigation_frequency: {
        min: 1,
        max: 7,
        unit: 'times per week',
        recommended: 4
      }
    }
  });
});

export default router;
