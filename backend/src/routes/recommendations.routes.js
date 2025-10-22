import express from 'express';
import asyncHandler from 'express-async-handler';
import admin from '../config/firebase.js';
import recommendationService from '../services/recommendationService.js';
import User from '../models/User.js';

const router = express.Router();

/**
 * Middleware: Verify Firebase token
 */
const verifyToken = async (req, res, next) => {
  const token = req.headers.authorization?.split('Bearer ')[1];
  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token', error: error.message });
  }
};

/**
 * GET /api/recommendations/products
 * Get personalized product recommendations for current user
 */
router.get(
  '/products',
  verifyToken,
  asyncHandler(async (req, res) => {
    const { k = 5, limit = 5 } = req.query;
    
    // Get user from database
    const user = await User.findOne({ firebaseUid: req.user.uid });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const recommendations = await recommendationService.getRecommendedProducts(
      user._id,
      parseInt(k),
      parseInt(limit)
    );

    res.json({
      success: true,
      count: recommendations.length,
      recommendations: recommendations
    });
  })
);

/**
 * POST /api/recommendations/track
 * Track product browsing activity
 */
router.post(
  '/track',
  verifyToken,
  asyncHandler(async (req, res) => {
    const { productId } = req.body;
    
    if (!productId) {
      return res.status(400).json({ message: 'Product ID is required' });
    }

    // Get user from database
    const user = await User.findOne({ firebaseUid: req.user.uid });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const tracked = await recommendationService.trackBrowsing(user._id, productId);
    
    res.json({
      success: true,
      message: 'Browsing activity tracked',
      data: tracked
    });
  })
);

/**
 * GET /api/recommendations/insights
 * Get recommendation system insights for current user
 */
router.get(
  '/insights',
  verifyToken,
  asyncHandler(async (req, res) => {
    const user = await User.findOne({ firebaseUid: req.user.uid });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const insights = await recommendationService.getRecommendationInsights(user._id);
    
    res.json({
      success: true,
      insights: insights
    });
  })
);

export default router;