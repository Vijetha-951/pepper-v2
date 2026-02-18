import mongoose from 'mongoose';

const diseaseDetectionSchema = new mongoose.Schema(
  {
    // User Information
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    userEmail: {
      type: String,
      default: null
    },
    
    // Image Information
    imagePath: {
      type: String,
      required: true
    },
    imageUrl: {
      type: String,
      default: null
    },
    originalFilename: {
      type: String,
      required: true
    },
    fileSize: {
      type: Number,
      default: 0
    },
    
    // Detection Results
    prediction: {
      type: String,
      required: true,
      enum: ['Healthy', 'Bacterial Spot', 'Yellow Leaf Curl', 'Nutrient Deficiency']
    },
    confidence: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    probabilities: {
      type: Map,
      of: Number,
      default: {}
    },
    
    // Disease Information
    diseaseName: {
      type: String,
      required: true
    },
    severity: {
      type: String,
      enum: ['None', 'Low', 'Low to Moderate', 'Moderate', 'Moderate to High', 'High'],
      default: 'None'
    },
    description: {
      type: String,
      default: ''
    },
    treatment: [{
      type: String
    }],
    prevention: [{
      type: String
    }],
    
    // Additional Metadata
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        default: null
      },
      address: {
        type: String,
        default: null
      }
    },
    plantAge: {
      type: String,
      default: null
    },
    variety: {
      type: String,
      default: null
    },
    notes: {
      type: String,
      default: null
    },
    
    // Status and Follow-up
    status: {
      type: String,
      enum: ['detected', 'treating', 'resolved', 'monitoring'],
      default: 'detected'
    },
    followUpRequired: {
      type: Boolean,
      default: false
    },
    followUpDate: {
      type: Date,
      default: null
    },
    actionTaken: {
      type: String,
      default: null
    },
    
    // Analytics
    viewCount: {
      type: Number,
      default: 0
    },
    shared: {
      type: Boolean,
      default: false
    },
    
    // Feedback
    userFeedback: {
      accurate: {
        type: Boolean,
        default: null
      },
      comment: {
        type: String,
        default: null
      },
      rating: {
        type: Number,
        min: 1,
        max: 5,
        default: null
      }
    }
  },
  {
    timestamps: true, // Adds createdAt and updatedAt fields
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Indexes for better query performance
diseaseDetectionSchema.index({ userId: 1, createdAt: -1 });
diseaseDetectionSchema.index({ prediction: 1 });
diseaseDetectionSchema.index({ status: 1 });
diseaseDetectionSchema.index({ createdAt: -1 });
diseaseDetectionSchema.index({ confidence: -1 });

// Geospatial index for location-based queries
diseaseDetectionSchema.index({ 'location.coordinates': '2dsphere' });

// Virtual for formatted date
diseaseDetectionSchema.virtual('formattedDate').get(function() {
  return this.createdAt.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
});

// Method to update status
diseaseDetectionSchema.methods.updateStatus = function(newStatus, actionTaken = null) {
  this.status = newStatus;
  if (actionTaken) {
    this.actionTaken = actionTaken;
  }
  return this.save();
};

// Method to add user feedback
diseaseDetectionSchema.methods.addFeedback = function(accurate, comment = null, rating = null) {
  this.userFeedback = {
    accurate,
    comment,
    rating
  };
  return this.save();
};

// Static method to get analytics
diseaseDetectionSchema.statics.getAnalytics = async function(userId = null, startDate = null, endDate = null) {
  const matchStage = {};
  
  if (userId) {
    matchStage.userId = mongoose.Types.ObjectId(userId);
  }
  
  if (startDate || endDate) {
    matchStage.createdAt = {};
    if (startDate) matchStage.createdAt.$gte = new Date(startDate);
    if (endDate) matchStage.createdAt.$lte = new Date(endDate);
  }
  
  const analytics = await this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$prediction',
        count: { $sum: 1 },
        avgConfidence: { $avg: '$confidence' },
        maxConfidence: { $max: '$confidence' },
        minConfidence: { $min: '$confidence' }
      }
    },
    { $sort: { count: -1 } }
  ]);
  
  const totalDetections = await this.countDocuments(matchStage);
  
  return {
    totalDetections,
    diseaseBreakdown: analytics,
    healthyPercentage: analytics.find(a => a._id === 'Healthy')?.count / totalDetections * 100 || 0
  };
};

// Static method to get recent detections
diseaseDetectionSchema.statics.getRecentDetections = function(userId, limit = 10) {
  const query = userId ? { userId } : {};
  return this.find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('userId', 'name email');
};

// Static method to get disease trends
diseaseDetectionSchema.statics.getDiseaseTrends = async function(days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  return this.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: {
          date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          disease: '$prediction'
        },
        count: { $sum: 1 }
      }
    },
    {
      $sort: { '_id.date': 1 }
    }
  ]);
};

// Pre-save hook to set disease information
diseaseDetectionSchema.pre('save', function(next) {
  // Ensure followUpDate is set for non-healthy detections
  if (this.prediction !== 'Healthy' && !this.followUpDate) {
    const followUpDate = new Date();
    followUpDate.setDate(followUpDate.getDate() + 7); // Follow up in 7 days
    this.followUpDate = followUpDate;
    this.followUpRequired = true;
  }
  next();
});

const DiseaseDetection = mongoose.model('DiseaseDetection', diseaseDetectionSchema);

export default DiseaseDetection;
