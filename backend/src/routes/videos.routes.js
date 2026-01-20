import express from 'express';
import asyncHandler from 'express-async-handler';
import Video from '../models/Video.model.js';
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
 * Get single video by ID and increment view count
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

  // Increment view count
  video.viewCount += 1;
  await video.save();

  res.json({
    success: true,
    video
  });
}));

/**
 * POST /api/videos/:id/like
 * Like a video
 */
router.post('/:id/like', requireAuth, asyncHandler(async (req, res) => {
  const video = await Video.findById(req.params.id);

  if (!video) {
    return res.status(404).json({
      success: false,
      message: 'Video not found'
    });
  }

  video.likes += 1;
  await video.save();

  res.json({
    success: true,
    message: 'Video liked',
    likes: video.likes
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
  const totalViews = await Video.aggregate([
    { $group: { _id: null, total: { $sum: '$viewCount' } } }
  ]);
  const totalLikes = await Video.aggregate([
    { $group: { _id: null, total: { $sum: '$likes' } } }
  ]);

  const videosByCategory = await Video.aggregate([
    { $match: { isActive: true } },
    { $group: { _id: '$category', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);

  res.json({
    success: true,
    stats: {
      totalVideos,
      activeVideos,
      inactiveVideos: totalVideos - activeVideos,
      totalViews: totalViews[0]?.total || 0,
      totalLikes: totalLikes[0]?.total || 0,
      videosByCategory
    }
  });
}));

export default router;
