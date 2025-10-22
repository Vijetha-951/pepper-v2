import express from 'express';
import asyncHandler from 'express-async-handler';
import Review from '../models/Review.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import User from '../models/User.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// ============ PUBLIC ENDPOINTS (No Auth Required) ============

// GET - Get product reviews (public, for product detail pages)
router.get(
  '/public/product/:productId',
  asyncHandler(async (req, res) => {
    const { sortBy = 'recent' } = req.query;

    const sortOptions = {
      recent: { createdAt: -1 },
      helpful: { helpfulCount: -1 },
      rating_high: { rating: -1 },
      rating_low: { rating: 1 }
    };

    const reviews = await Review.find({ product: req.params.productId, isPublished: true })
      .populate('user', 'firstName lastName')
      .sort(sortOptions[sortBy] || sortOptions.recent)
      .lean();

    // Calculate average rating
    const allReviews = await Review.find({ product: req.params.productId, isPublished: true });
    const averageRating = allReviews.length > 0 ? (allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length).toFixed(1) : 0;

    // Rating breakdown
    const ratingBreakdown = {
      5: allReviews.filter((r) => r.rating === 5).length,
      4: allReviews.filter((r) => r.rating === 4).length,
      3: allReviews.filter((r) => r.rating === 3).length,
      2: allReviews.filter((r) => r.rating === 2).length,
      1: allReviews.filter((r) => r.rating === 1).length
    };

    res.json({
      reviews,
      stats: {
        totalReviews: allReviews.length,
        averageRating,
        ratingBreakdown
      }
    });
  })
);

// ============ AUTHENTICATED ENDPOINTS ============
// All routes below require authentication
router.use(requireAuth);

// ============ USER REVIEW ENDPOINTS ============

// POST - Submit a new review
router.post(
  '/',
  asyncHandler(async (req, res) => {
    const { productId, orderId, rating, comment, complaintType, complaintDescription } = req.body;

    // Validate input
    if (!productId || !orderId || !rating) {
      return res.status(400).json({ message: 'Product ID, Order ID, and rating are required' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    // Get user
    const user = await User.findOne({ email: req.user.email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify user owns the order and it's delivered
    const order = await Order.findOne({ _id: orderId, user: user._id });
    if (!order) {
      return res.status(403).json({ message: 'Order not found or you do not own this order' });
    }

    if (order.status !== 'DELIVERED') {
      return res.status(400).json({ message: 'Can only review delivered orders' });
    }

    // Verify product is in the order
    const orderItem = order.items.find((item) => item.product.toString() === productId);
    if (!orderItem) {
      return res.status(403).json({ message: 'This product is not in your order' });
    }

    // Check if review already exists
    const existingReview = await Review.findOne({ user: user._id, product: productId });
    if (existingReview) {
      return res.status(400).json({ message: 'You have already reviewed this product. You can edit your existing review.' });
    }

    // Get product snapshot
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Create review
    const review = await Review.create({
      user: user._id,
      product: productId,
      order: orderId,
      rating: Math.round(rating),
      comment: comment || '',
      complaintType: complaintType || 'None',
      complaintDescription: complaintDescription || '',
      isPublished: true,
      productSnapshot: {
        name: product.name,
        price: product.price,
        image: product.image
      }
    });

    await review.populate('product', 'name image price');
    res.status(201).json({ success: true, message: 'Review submitted successfully', review });
  })
);

// GET - Get user's reviews
router.get(
  '/user/my-reviews',
  asyncHandler(async (req, res) => {
    const user = await User.findOne({ email: req.user.email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const reviews = await Review.find({ user: user._id })
      .populate('product', 'name image price')
      .sort({ createdAt: -1 });

    // Add canEdit flag based on 30-day window
    const enrichedReviews = reviews.map((review) => {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const canEdit = review.createdAt > thirtyDaysAgo;
      return {
        ...review.toObject(),
        canEdit
      };
    });

    res.json(enrichedReviews);
  })
);

// GET - Get single review by ID
router.get(
  '/:reviewId',
  asyncHandler(async (req, res) => {
    const review = await Review.findById(req.params.reviewId).populate('product', 'name image price').populate('user', 'firstName lastName');

    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const canEdit = review.createdAt > thirtyDaysAgo;

    res.json({
      ...review.toObject(),
      canEdit
    });
  })
);

// PUT - Edit review (only within 30 days and by review owner)
router.put(
  '/:reviewId',
  asyncHandler(async (req, res) => {
    const { rating, comment, complaintType, complaintDescription } = req.body;

    const review = await Review.findById(req.params.reviewId);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    // Check ownership
    const user = await User.findOne({ email: req.user.email });
    if (review.user.toString() !== user._id.toString()) {
      return res.status(403).json({ message: 'You can only edit your own reviews' });
    }

    // Check edit window (30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    if (review.createdAt < thirtyDaysAgo) {
      return res.status(400).json({ message: 'Reviews can only be edited within 30 days of creation' });
    }

    // Validate rating if provided
    if (rating !== undefined && (rating < 1 || rating > 5)) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    // Update review
    if (rating !== undefined) review.rating = Math.round(rating);
    if (comment !== undefined) review.comment = comment;
    if (complaintType !== undefined) review.complaintType = complaintType;
    if (complaintDescription !== undefined) review.complaintDescription = complaintDescription;

    review.lastEditedAt = new Date();
    review.editCount = (review.editCount || 0) + 1;

    await review.save();
    await review.populate('product', 'name image price');

    res.json({ success: true, message: 'Review updated successfully', review });
  })
);

// DELETE - Delete review (only within 30 days and by review owner)
router.delete(
  '/:reviewId',
  asyncHandler(async (req, res) => {
    const review = await Review.findById(req.params.reviewId);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    // Check ownership
    const user = await User.findOne({ email: req.user.email });
    if (review.user.toString() !== user._id.toString()) {
      return res.status(403).json({ message: 'You can only delete your own reviews' });
    }

    // Check edit window (30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    if (review.createdAt < thirtyDaysAgo) {
      return res.status(400).json({ message: 'Reviews can only be deleted within 30 days of creation' });
    }

    await Review.findByIdAndDelete(req.params.reviewId);
    res.json({ success: true, message: 'Review deleted successfully' });
  })
);

export default router;