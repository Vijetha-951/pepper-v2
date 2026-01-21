import mongoose from 'mongoose';

const videoLikeSchema = new mongoose.Schema({
  videoId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Video',
    required: true
  },
  userId: {
    type: String,
    required: true,
    index: true
  },
  userName: {
    type: String,
    default: ''
  },
  userEmail: {
    type: String,
    default: ''
  },
  likedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound index to ensure one like per user per video
videoLikeSchema.index({ videoId: 1, userId: 1 }, { unique: true });

// Index for faster queries
videoLikeSchema.index({ videoId: 1, likedAt: -1 });

const VideoLike = mongoose.model('VideoLike', videoLikeSchema);

export default VideoLike;
