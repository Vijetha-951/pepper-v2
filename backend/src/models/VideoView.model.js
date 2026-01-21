import mongoose from 'mongoose';

const videoViewSchema = new mongoose.Schema({
  videoId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Video',
    required: true
  },
  userId: {
    type: String,
    required: true
  },
  userName: {
    type: String,
    default: ''
  },
  userEmail: {
    type: String,
    default: ''
  },
  viewedAt: {
    type: Date,
    default: Date.now
  },
  duration: {
    type: Number, // seconds watched
    default: 0
  },
  completed: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index for faster queries
videoViewSchema.index({ videoId: 1, viewedAt: -1 });
videoViewSchema.index({ userId: 1, viewedAt: -1 });

const VideoView = mongoose.model('VideoView', videoViewSchema);

export default VideoView;
