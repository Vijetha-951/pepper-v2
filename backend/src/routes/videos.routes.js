import express from 'express';
import asyncHandler from 'express-async-handler';
import Video from '../models/Video.model.js';
import VideoLike from '../models/VideoLike.model.js';
import VideoView from '../models/VideoView.model.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// ====== PUBLIC ROUTES (for authenticated users) ======

/**
 * GET /api/videos
 * Get all active videos (for users)
 */
router.get('/', requireAuth, asyncHandler(async (req, res) => {
  const { category, limit = 50 } = req.query;
  
  console.log('📹 GET /api/videos - User:', req.user?.uid);
  console.log('📹 Category filter:', category);
  
  const filter = { isActive: true };
  if (category && category !== 'all') {
    filter.category = category;
  }

  console.log('📹 Query filter:', filter);

  const videos = await Video.find(filter)
    .sort({ createdAt: -1 })
    .limit(parseInt(limit))
    .select('-__v');

  console.log('📹 Found videos:', videos.length);

  res.json({
    success: true,
    count: videos.length,
    videos
  });
}));

/**
 * GET /api/videos/:id
 * Get single video by ID and track view
 */
router.get('/:id', requireAuth, asyncHandler(async (req, res) => {
  const video = await Video.findById(req.params.id);

  if (!video) {
    return res.status(404).json({
      success: false,
      message: 'Video not found'
    });
  }

  if (!video.isActive) {
    return res.status(403).json({
      success: false,
      message: 'Video is not available'
    });
  }

  // Track detailed view
  const videoView = new VideoView({
    videoId: video._id,
    userId: req.user.uid,
    userName: req.user.email?.split('@')[0] || '',
    userEmail: req.user.email || ''
  });
  await videoView.save();

  // Increment view count atomically
  const updatedVideo = await Video.findByIdAndUpdate(
    req.params.id,
    { $inc: { viewCount: 1 } },
    { new: true }
  );

  // Check if user has liked this video
  const userLike = await VideoLike.findOne({
    videoId: video._id,
    userId: req.user.uid
  });

  res.json({
    success: true,
    video: {
      ...updatedVideo.toObject(),
      hasLiked: !!userLike
    }
  });
}));

/**
 * POST /api/videos/:id/like
 * Like a video (toggle like/unlike)
 */
router.post('/:id/like', requireAuth, asyncHandler(async (req, res) => {
  const video = await Video.findById(req.params.id);

  if (!video) {
    return res.status(404).json({
      success: false,
      message: 'Video not found'
    });
  }

  // Check if user already liked this video
  const existingLike = await VideoLike.findOne({
    videoId: video._id,
    userId: req.user.uid
  });

  if (existingLike) {
    // Unlike - remove the like
    await existingLike.deleteOne();
    
    // Decrement likes atomically, but don't go below 0
    const updatedVideo = await Video.findOneAndUpdate(
      { _id: video._id, likes: { $gt: 0 } },
      { $inc: { likes: -1 } },
      { new: true }
    ) || await Video.findById(video._id);

    return res.json({
      success: true,
      message: 'Video unliked',
      liked: false,
      likes: updatedVideo.likes
    });
  }

  // Like - add new like
  const videoLike = new VideoLike({
    videoId: video._id,
    userId: req.user.uid,
    userName: req.user.email?.split('@')[0] || '',
    userEmail: req.user.email || ''
  });
  await videoLike.save();

  // Increment likes atomically
  const updatedVideo = await Video.findByIdAndUpdate(
    video._id,
    { $inc: { likes: 1 } },
    { new: true }
  );

  res.json({
    success: true,
    message: 'Video liked',
    liked: true,
    likes: updatedVideo.likes
  });
}));

/**
 * GET /api/videos/categories/list
 * Get all video categories
 */
router.get('/categories/list', requireAuth, asyncHandler(async (req, res) => {
  const categories = [
    { value: 'all', label: 'All Videos' },
    { value: 'farming', label: 'Farming' },
    { value: 'processing', label: 'Processing' },
    { value: 'cooking', label: 'Cooking' },
    { value: 'benefits', label: 'Health Benefits' },
    { value: 'testimonial', label: 'Testimonials' },
    { value: 'tutorial', label: 'Tutorials' },
    { value: 'other', label: 'Other' }
  ];

  res.json({
    success: true,
    categories
  });
}));

// ====== ADMIN ROUTES ======

/**
 * GET /api/videos/admin/all
 * Get all videos (including inactive) - Admin only
 */
router.get('/admin/all', requireAuth, requireAdmin, asyncHandler(async (req, res) => {
  const videos = await Video.find()
    .sort({ createdAt: -1 })
    .select('-__v');

  res.json({
    success: true,
    count: videos.length,
    videos
  });
}));

/**
 * POST /api/videos/admin/create
 * Create new video - Admin only
 */
router.post('/admin/create', requireAuth, requireAdmin, asyncHandler(async (req, res) => {
  const { title, description, url, thumbnail, category, duration, tags } = req.body;

  // Validation
  if (!title || !description || !url) {
    return res.status(400).json({
      success: false,
      message: 'Title, description, and URL are required'
    });
  }

  const video = new Video({
    title,
    description,
    url,
    thumbnail: thumbnail || '',
    category: category || 'other',
    duration: duration || '',
    tags: tags || [],
    uploadedBy: req.user.uid,
    isActive: true
  });

  await video.save();

  res.status(201).json({
    success: true,
    message: 'Video created successfully',
    video
  });
}));

/**
 * PUT /api/videos/admin/:id
 * Update video - Admin only
 */
router.put('/admin/:id', requireAuth, requireAdmin, asyncHandler(async (req, res) => {
  const { title, description, url, thumbnail, category, duration, tags, isActive } = req.body;

  const video = await Video.findById(req.params.id);

  if (!video) {
    return res.status(404).json({
      success: false,
      message: 'Video not found'
    });
  }

  // Update fields
  if (title !== undefined) video.title = title;
  if (description !== undefined) video.description = description;
  if (url !== undefined) video.url = url;
  if (thumbnail !== undefined) video.thumbnail = thumbnail;
  if (category !== undefined) video.category = category;
  if (duration !== undefined) video.duration = duration;
  if (tags !== undefined) video.tags = tags;
  if (isActive !== undefined) video.isActive = isActive;

  video.updatedAt = Date.now();
  await video.save();

  res.json({
    success: true,
    message: 'Video updated successfully',
    video
  });
}));

/**
 * DELETE /api/videos/admin/:id
 * Delete video - Admin only
 */
router.delete('/admin/:id', requireAuth, requireAdmin, asyncHandler(async (req, res) => {
  const video = await Video.findById(req.params.id);

  if (!video) {
    return res.status(404).json({
      success: false,
      message: 'Video not found'
    });
  }

  await video.deleteOne();

  res.json({
    success: true,
    message: 'Video deleted successfully'
  });
}));

/**
 * GET /api/videos/admin/stats
 * Get video statistics - Admin only
 */
router.get('/admin/stats', requireAuth, requireAdmin, asyncHandler(async (req, res) => {
  const totalVideos = await Video.countDocuments();
  const activeVideos = await Video.countDocuments({ isActive: true });
  
  // Aggregate totals from the actual activity collections for maximum accuracy
  const totalViewsCount = await VideoView.countDocuments();
  const totalLikesCount = await VideoLike.countDocuments();

  const videosByCategory = await Video.aggregate([
    { $match: { isActive: true } },
    { $group: { _id: '$category', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);

  // Most viewed videos
  const mostViewed = await Video.find({ isActive: true })
    .sort({ viewCount: -1 })
    .limit(10)
    .select('title viewCount likes category');

  // Most liked videos
  const mostLiked = await Video.find({ isActive: true })
    .sort({ likes: -1 })
    .limit(10)
    .select('title viewCount likes category');

  // Recent views (last 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const recentViews = await VideoView.countDocuments({ 
    viewedAt: { $gte: sevenDaysAgo } 
  });

  // Recent likes (last 7 days)
  const recentLikes = await VideoLike.countDocuments({ 
    likedAt: { $gte: sevenDaysAgo } 
  });

  // Unique viewers
  const uniqueViewers = await VideoView.distinct('userId').then(users => users.length);

  // Engagement rate (likes per view)
  const engagementRate = totalViewsCount > 0 
    ? ((totalLikesCount / totalViewsCount) * 100).toFixed(2) 
    : 0;

  res.json({
    success: true,
    stats: {
      totalVideos,
      activeVideos,
      inactiveVideos: totalVideos - activeVideos,
      totalViews: totalViewsCount,
      totalLikes: totalLikesCount,
      recentViews,
      recentLikes,
      uniqueViewers,
      engagementRate: parseFloat(engagementRate),
      videosByCategory,
      mostViewed,
      mostLiked
    }
  });
}));

/**
 * GET /api/videos/admin/:id/analytics
 * Get detailed analytics for a specific video - Admin only
 */
router.get('/admin/:id/analytics', requireAuth, requireAdmin, asyncHandler(async (req, res) => {
  const video = await Video.findById(req.params.id);

  if (!video) {
    return res.status(404).json({
      success: false,
      message: 'Video not found'
    });
  }

  // Get all likes for this video
  const likes = await VideoLike.find({ videoId: video._id })
    .sort({ likedAt: -1 })
    .limit(100);

  // Get all views for this video
  const views = await VideoView.find({ videoId: video._id })
    .sort({ viewedAt: -1 })
    .limit(100);

  // View statistics by day (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const viewsByDay = await VideoView.aggregate([
    { 
      $match: { 
        videoId: video._id,
        viewedAt: { $gte: thirtyDaysAgo }
      } 
    },
    {
      $group: {
        _id: { 
          $dateToString: { format: '%Y-%m-%d', date: '$viewedAt' }
        },
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  // Like statistics by day (last 30 days)
  const likesByDay = await VideoLike.aggregate([
    { 
      $match: { 
        videoId: video._id,
        likedAt: { $gte: thirtyDaysAgo }
      } 
    },
    {
      $group: {
        _id: { 
          $dateToString: { format: '%Y-%m-%d', date: '$likedAt' }
        },
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  // Unique viewers
  const uniqueViewers = await VideoView.distinct('userId', { videoId: video._id });

  res.json({
    success: true,
    video: {
      id: video._id,
      title: video.title,
      category: video.category,
      viewCount: video.viewCount,
      likes: video.likes,
      createdAt: video.createdAt
    },
    analytics: {
      totalViews: video.viewCount,
      totalLikes: video.likes,
      uniqueViewers: uniqueViewers.length,
      engagementRate: video.viewCount > 0 
        ? ((video.likes / video.viewCount) * 100).toFixed(2) 
        : 0,
      recentLikes: likes,
      recentViews: views,
      viewsByDay,
      likesByDay
    }
  });
}));

/**
 * GET /api/videos/admin/users/:userId/activity
 * Get video activity for a specific user - Admin only
 */
router.get('/admin/users/:userId/activity', requireAuth, requireAdmin, asyncHandler(async (req, res) => {
  const userId = req.params.userId;

  // Get user's liked videos
  const likedVideos = await VideoLike.find({ userId })
    .populate('videoId', 'title category thumbnail')
    .sort({ likedAt: -1 })
    .limit(50);

  // Get user's viewed videos
  const viewedVideos = await VideoView.find({ userId })
    .populate('videoId', 'title category thumbnail')
    .sort({ viewedAt: -1 })
    .limit(50);

  // Get statistics
  const totalLikes = await VideoLike.countDocuments({ userId });
  const totalViews = await VideoView.countDocuments({ userId });

  res.json({
    success: true,
    userId,
    stats: {
      totalLikes,
      totalViews
    },
    likedVideos: likedVideos.map(like => ({
      video: like.videoId,
      likedAt: like.likedAt
    })),
    viewedVideos: viewedVideos.map(view => ({
      video: view.videoId,
      viewedAt: view.viewedAt,
      duration: view.duration
    }))
  });
}));

export default router;
