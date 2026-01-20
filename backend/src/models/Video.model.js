import mongoose from 'mongoose';

const videoSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  url: {
    type: String,
    required: true,
    trim: true
  },
  thumbnail: {
    type: String,
    default: ''
  },
  category: {
    type: String,
    enum: ['farming', 'processing', 'cooking', 'benefits', 'testimonial', 'tutorial', 'other'],
    default: 'other'
  },
  duration: {
    type: String,
    default: ''
  },
  tags: [{
    type: String,
    trim: true
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  viewCount: {
    type: Number,
    default: 0
  },
  likes: {
    type: Number,
    default: 0
  },
  uploadedBy: {
    type: String,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for faster queries
videoSchema.index({ isActive: 1, createdAt: -1 });
videoSchema.index({ category: 1 });
videoSchema.index({ tags: 1 });

const Video = mongoose.model('Video', videoSchema);

export default Video;
