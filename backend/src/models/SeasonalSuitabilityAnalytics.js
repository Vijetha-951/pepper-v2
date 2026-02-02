// Seasonal Suitability Analytics Model
// Tracks ML prediction usage and user actions

import mongoose from 'mongoose';

const seasonalSuitabilityAnalyticsSchema = new mongoose.Schema({
  // User information
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null // Can be null for anonymous users
  },
  sessionId: {
    type: String,
    required: true,
    index: true
  },
  
  // Product/Variety information
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    default: null
  },
  variety: {
    type: String,
    required: true,
    index: true
  },
  
  // Input parameters used for prediction
  inputParameters: {
    month: { type: Number, required: true },
    district: { type: String, required: true },
    pincode: { type: Number, required: true },
    temperature: { type: Number },
    rainfall: { type: Number },
    humidity: { type: Number },
    waterAvailability: { type: String }
  },
  
  // ML prediction results
  prediction: {
    suitability: {
      type: String,
      enum: ['Recommended', 'Plant with Care', 'Not Recommended'],
      required: true
    },
    confidence: {
      type: Number,
      min: 0,
      max: 1
    },
    confidenceScores: {
      recommended: Number,
      plantWithCare: Number,
      notRecommended: Number
    },
    source: {
      type: String,
      enum: ['ml_model', 'rule_based_fallback'],
      default: 'ml_model'
    }
  },
  
  // User actions
  actions: {
    recommendationShown: {
      type: Boolean,
      default: true
    },
    recommendationShownAt: {
      type: Date,
      default: Date.now
    },
    viewedDetails: {
      type: Boolean,
      default: false
    },
    viewedDetailsAt: Date,
    addedToCart: {
      type: Boolean,
      default: false
    },
    addedToCartAt: Date,
    orderPlaced: {
      type: Boolean,
      default: false
    },
    orderPlacedAt: Date,
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order'
    }
  },
  
  // User feedback (optional)
  feedback: {
    helpful: {
      type: Boolean,
      default: null
    },
    comment: String,
    submittedAt: Date
  },
  
  // Location and device info
  locationInfo: {
    ipAddress: String,
    userAgent: String,
    platform: String
  }
}, {
  timestamps: true
});

// Indexes for analytics queries
seasonalSuitabilityAnalyticsSchema.index({ variety: 1, 'prediction.suitability': 1 });
seasonalSuitabilityAnalyticsSchema.index({ 'inputParameters.month': 1, 'inputParameters.district': 1 });
seasonalSuitabilityAnalyticsSchema.index({ 'actions.orderPlaced': 1, createdAt: -1 });
seasonalSuitabilityAnalyticsSchema.index({ userId: 1, createdAt: -1 });

// Static method to track recommendation shown
seasonalSuitabilityAnalyticsSchema.statics.trackRecommendation = async function(data) {
  return await this.create({
    userId: data.userId || null,
    sessionId: data.sessionId,
    productId: data.productId || null,
    variety: data.variety,
    inputParameters: data.inputParameters,
    prediction: data.prediction,
    locationInfo: data.locationInfo || {}
  });
};

// Instance method to track user action
seasonalSuitabilityAnalyticsSchema.methods.trackAction = async function(actionType, additionalData = {}) {
  const validActions = ['viewedDetails', 'addedToCart', 'orderPlaced'];
  
  if (!validActions.includes(actionType)) {
    throw new Error(`Invalid action type: ${actionType}`);
  }
  
  this.actions[actionType] = true;
  this.actions[`${actionType}At`] = new Date();
  
  if (actionType === 'orderPlaced' && additionalData.orderId) {
    this.actions.orderId = additionalData.orderId;
  }
  
  return await this.save();
};

// Instance method to add feedback
seasonalSuitabilityAnalyticsSchema.methods.addFeedback = async function(helpful, comment = null) {
  this.feedback.helpful = helpful;
  this.feedback.comment = comment;
  this.feedback.submittedAt = new Date();
  return await this.save();
};

// Static method to get analytics summary
seasonalSuitabilityAnalyticsSchema.statics.getAnalyticsSummary = async function(filters = {}) {
  const matchStage = {};
  
  if (filters.startDate && filters.endDate) {
    matchStage.createdAt = {
      $gte: new Date(filters.startDate),
      $lte: new Date(filters.endDate)
    };
  }
  
  if (filters.variety) {
    matchStage.variety = filters.variety;
  }
  
  if (filters.district) {
    matchStage['inputParameters.district'] = filters.district;
  }
  
  const summary = await this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalRecommendations: { $sum: 1 },
        totalViewed: {
          $sum: { $cond: ['$actions.viewedDetails', 1, 0] }
        },
        totalAddedToCart: {
          $sum: { $cond: ['$actions.addedToCart', 1, 0] }
        },
        totalOrders: {
          $sum: { $cond: ['$actions.orderPlaced', 1, 0] }
        },
        avgConfidence: { $avg: '$prediction.confidence' },
        mlPredictions: {
          $sum: { $cond: [{ $eq: ['$prediction.source', 'ml_model'] }, 1, 0] }
        },
        fallbackPredictions: {
          $sum: { $cond: [{ $eq: ['$prediction.source', 'rule_based_fallback'] }, 1, 0] }
        }
      }
    }
  ]);
  
  return summary[0] || {
    totalRecommendations: 0,
    totalViewed: 0,
    totalAddedToCart: 0,
    totalOrders: 0,
    avgConfidence: 0,
    mlPredictions: 0,
    fallbackPredictions: 0
  };
};

// Static method to get variety-wise analytics
seasonalSuitabilityAnalyticsSchema.statics.getVarietyAnalytics = async function(filters = {}) {
  const matchStage = {};
  
  if (filters.startDate && filters.endDate) {
    matchStage.createdAt = {
      $gte: new Date(filters.startDate),
      $lte: new Date(filters.endDate)
    };
  }
  
  return await this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: {
          variety: '$variety',
          suitability: '$prediction.suitability'
        },
        count: { $sum: 1 },
        conversions: {
          $sum: { $cond: ['$actions.orderPlaced', 1, 0] }
        },
        avgConfidence: { $avg: '$prediction.confidence' }
      }
    },
    {
      $group: {
        _id: '$_id.variety',
        predictions: {
          $push: {
            suitability: '$_id.suitability',
            count: '$count',
            conversions: '$conversions',
            avgConfidence: '$avgConfidence'
          }
        },
        totalPredictions: { $sum: '$count' },
        totalConversions: { $sum: '$conversions' }
      }
    },
    {
      $project: {
        variety: '$_id',
        predictions: 1,
        totalPredictions: 1,
        totalConversions: 1,
        conversionRate: {
          $cond: [
            { $eq: ['$totalPredictions', 0] },
            0,
            { $multiply: [{ $divide: ['$totalConversions', '$totalPredictions'] }, 100] }
          ]
        }
      }
    },
    { $sort: { totalPredictions: -1 } }
  ]);
};

const SeasonalSuitabilityAnalytics = mongoose.model('SeasonalSuitabilityAnalytics', seasonalSuitabilityAnalyticsSchema);

export default SeasonalSuitabilityAnalytics;
