/**
 * Disease Detection Routes
 * REST API endpoints for pepper plant disease detection from leaf images
 */

import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import diseaseDetectionService from '../services/diseaseDetectionService.js';
// import { protect } from '../middleware/authMiddleware.js'; // Uncomment if you have auth

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = 'backend/uploads/disease_images';
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  // Accept images only
  const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/bmp'];
  const allowedExtensions = /\.(jpeg|jpg|png|gif|bmp)$/i;
  
  const ext = path.extname(file.originalname).toLowerCase();
  const mime = file.mimetype.toLowerCase();
  
  // Debug logging
  console.log(`[Upload] File: ${file.originalname}, Extension: ${ext}, Mimetype: ${mime}`);
  
  const extMatch = allowedExtensions.test(file.originalname);
  const mimeMatch = allowedMimeTypes.includes(mime);

  if (mimeMatch && extMatch) {
    console.log('[Upload] File accepted ✓');
    return cb(null, true);
  } else {
    console.log(`[Upload] File rejected - Extension match: ${extMatch}, Mime match: ${mimeMatch}`);
    cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, bmp)'));
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB max file size
  },
  fileFilter: fileFilter
});

/**
 * @route   GET /api/disease-detection/health
 * @desc    Check if disease detection service is available
 * @access  Public
 */
router.get('/health', async (req, res) => {
  try {
    const health = await diseaseDetectionService.healthCheck();
    res.json({
      success: true,
      message: 'Disease detection service is healthy',
      data: health
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      message: 'Disease detection service is not available',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/disease-detection/model-info
 * @desc    Get information about the disease detection model
 * @access  Public
 */
router.get('/model-info', async (req, res) => {
  try {
    const modelInfo = await diseaseDetectionService.getModelInfo();
    res.json({
      success: true,
      data: modelInfo
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get model information',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/disease-detection/diseases
 * @desc    Get information about all detectable diseases
 * @access  Public
 */
router.get('/diseases', async (req, res) => {
  try {
    const diseasesInfo = await diseaseDetectionService.getDiseasesInfo();
    res.json(diseasesInfo);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get diseases information',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/disease-detection/train
 * @desc    Train the disease detection model
 * @access  Admin only (add auth middleware)
 */
router.post('/train', async (req, res) => {
  try {
    const result = await diseaseDetectionService.trainModel();
    res.json({
      success: true,
      message: 'Model trained successfully',
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to train model',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/disease-detection/predict
 * @desc    Predict disease from uploaded image
 * @access  Public/Private (add auth middleware if needed)
 */
router.post('/predict', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file uploaded'
      });
    }

    const imagePath = req.file.path;
    
    // Get metadata from request
    const metadata = {
      userId: req.user?.id || req.body.userId || null,
      userEmail: req.user?.email || req.body.userEmail || null,
      location: req.body.location ? JSON.parse(req.body.location) : null,
      plantAge: req.body.plantAge || null,
      variety: req.body.variety || null,
      notes: req.body.notes || null,
      pepperType: req.body.pepper_type || req.body.pepperType || 'black_pepper',
      originalFilename: req.file.originalname,
      imagePath: req.file.path
    };

    // Get prediction from ML service
    const prediction = await diseaseDetectionService.predictFromFile(imagePath, {
      user_id: metadata.userId,
      location: metadata.location?.address,
      notes: metadata.notes,
      pepper_type: metadata.pepperType
    });

    // Check for validation errors or other failures returned as objects
    if (!prediction.success) {
      return res.status(400).json(prediction);
    }

    // Try to save to database if prediction was successful (but don't fail if MongoDB is unavailable)
    let savedDetection = null;
    try {
      savedDetection = await diseaseDetectionService.saveDetection(prediction, metadata);
    } catch (dbError) {
      console.warn('⚠️  Could not save to database (MongoDB may not be running):', dbError.message);
      // Continue anyway - we can still return the prediction without saving it
    }

    // Return Flask prediction structure directly
    res.json({
      success: true,
      message: 'Disease detection completed',
      prediction: prediction.prediction, // Extract nested prediction from Flask response
      detection: savedDetection ? {
        id: savedDetection._id,
        createdAt: savedDetection.createdAt
      } : null
    });

  } catch (error) {
    console.error('Disease prediction error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to predict disease',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/disease-detection/predict-url
 * @desc    Predict disease from image URL
 * @access  Public/Private
 */
router.post('/predict-url', async (req, res) => {
  try {
    console.log('📥 Received predict-url request:', req.body);
    const { imageUrl, image_url, pepper_type, pepperType } = req.body;
    const finalImageUrl = imageUrl || image_url;
    const finalPepperType = pepper_type || pepperType || 'black_pepper';

    if (!finalImageUrl) {
      console.log('❌ No URL provided');
      return res.status(400).json({
        success: false,
        message: 'Image URL is required'
      });
    }

    console.log('🔗 Calling Flask with URL:', finalImageUrl);
    console.log('🌶️ Pepper type:', finalPepperType);
    const prediction = await diseaseDetectionService.predictFromUrl(finalImageUrl, finalPepperType);
    console.log('✅ Got Flask response:', prediction);

    // Check for validation errors or other failures
    if (!prediction.success) {
      return res.status(400).json(prediction);
    }

    // Optionally save to database
    const metadata = {
      userId: req.user?.id || null,
      userEmail: req.user?.email || null,
      imageUrl: finalImageUrl,
      originalFilename: 'url_image.jpg'
    };

    const savedDetection = await diseaseDetectionService.saveDetection(prediction, metadata);

    res.json({
      success: true,
      prediction: prediction.prediction,
      detection: savedDetection
    });

  } catch (error) {
    console.error('❌ predict-url error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to predict from URL',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/disease-detection/batch-predict
 * @desc    Predict diseases from multiple images
 * @access  Public/Private
 */
router.post('/batch-predict', upload.array('images', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No image files uploaded'
      });
    }

    const imagePaths = req.files.map(file => file.path);
    const results = await diseaseDetectionService.batchPredict(imagePaths);

    res.json({
      success: true,
      message: `Processed ${req.files.length} images`,
      results
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to batch predict',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/disease-detection/history
 * @desc    Get detection history for current user or recent detections
 * @access  Public/Private
 */
router.get('/history', async (req, res) => {
  try {
    const userId = req.user?.id || req.query.userId;
    const limit = parseInt(req.query.limit) || 20;

    let detections;
    
    if (!userId) {
      // If no userId provided, return recent detections from all users
      detections = await diseaseDetectionService.getRecentDetections(limit);
    } else {
      // If userId provided, return user-specific history
      detections = await diseaseDetectionService.getUserDetections(userId, limit);
    }

    res.json({
      success: true,
      count: detections.length,
      detections
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get detection history',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/disease-detection/all
 * @desc    Get all detections with pagination and filters
 * @access  Admin only (add auth middleware)
 */
router.get('/all', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    
    const filter = {
      prediction: req.query.prediction,
      status: req.query.status,
      userId: req.query.userId,
      startDate: req.query.startDate,
      endDate: req.query.endDate
    };

    const result = await diseaseDetectionService.getAllDetections(page, limit, filter);

    res.json({
      success: true,
      ...result
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get detections',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/disease-detection/analytics
 * @desc    Get disease detection analytics
 * @access  Public/Admin
 */
router.get('/analytics', async (req, res) => {
  try {
    const userId = req.query.userId || null;
    const startDate = req.query.startDate || null;
    const endDate = req.query.endDate || null;

    const analytics = await diseaseDetectionService.getAnalytics(userId, startDate, endDate);

    res.json({
      success: true,
      analytics
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get analytics',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/disease-detection/trends
 * @desc    Get disease trends over time
 * @access  Public/Admin
 */
router.get('/trends', async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const trends = await diseaseDetectionService.getDiseaseTrends(days);

    res.json({
      success: true,
      days,
      trends
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get trends',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/disease-detection/follow-ups
 * @desc    Get detections that need follow-up
 * @access  Private/Admin
 */
router.get('/follow-ups', async (req, res) => {
  try {
    const userId = req.user?.id || req.query.userId || null;
    const detections = await diseaseDetectionService.getFollowUpRequired(userId);

    res.json({
      success: true,
      count: detections.length,
      detections
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get follow-ups',
      error: error.message
    });
  }
});

/**
 * @route   PATCH /api/disease-detection/:id/status
 * @desc    Update detection status
 * @access  Private
 */
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, actionTaken } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required'
      });
    }

    const detection = await diseaseDetectionService.updateDetectionStatus(id, status, actionTaken);

    res.json({
      success: true,
      message: 'Status updated successfully',
      detection
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update status',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/disease-detection/:id/feedback
 * @desc    Add user feedback to a detection
 * @access  Private
 */
router.post('/:id/feedback', async (req, res) => {
  try {
    const { id } = req.params;
    const { accurate, comment, rating } = req.body;

    if (accurate === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Accurate field is required (true/false)'
      });
    }

    const detection = await diseaseDetectionService.addFeedback(id, accurate, comment, rating);

    res.json({
      success: true,
      message: 'Feedback added successfully',
      detection
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to add feedback',
      error: error.message
    });
  }
});

/**
 * @route   DELETE /api/disease-detection/:id
 * @desc    Delete a detection record
 * @access  Private/Admin
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await diseaseDetectionService.deleteDetection(id);

    res.json(result);

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete detection',
      error: error.message
    });
  }
});

// ====== Multer Error Handling Middleware ======
// This middleware catches multer errors (file validation, size limits, etc.)
router.use((err, req, res, next) => {
  // Check if it's a multer error
  if (err instanceof multer.MulterError) {
    // Multer-specific error
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'File Too Large',
        message: 'Image file size exceeds 10MB limit'
      });
    }
    return res.status(400).json({
      success: false,
      error: 'Upload Error',
      message: err.message
    });
  } else if (err) {
    // Other errors (like file filter rejection)
    return res.status(400).json({
      success: false,
      error: 'Invalid File',
      message: err.message
    });
  }
  next();
});

export default router;
