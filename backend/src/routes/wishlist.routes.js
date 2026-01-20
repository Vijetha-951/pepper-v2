import express from 'express';
import asyncHandler from 'express-async-handler';
import Wishlist from '../models/Wishlist.js';
import Product from '../models/Product.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// Get user's wishlist
router.get('/:userId', requireAuth, asyncHandler(async (req, res) => {
  const { userId } = req.params;

  // Verify user can only access their own wishlist
  if (userId !== req.user.uid && req.userRole !== 'admin') {
    return res.status(403).json({ message: 'Access denied' });
  }

  let wishlist = await Wishlist.findOne({ user: userId }).populate('items.product');
  
  if (!wishlist) {
    wishlist = await Wishlist.create({ user: userId, items: [] });
  }

  res.json(wishlist);
}));

// Add item to wishlist
router.post('/add', requireAuth, asyncHandler(async (req, res) => {
  const { productId } = req.body;
  const userId = req.user.uid;

  if (!productId) {
    return res.status(400).json({ message: 'Product ID is required' });
  }

  // Check if product exists
  const product = await Product.findById(productId);
  if (!product) {
    return res.status(404).json({ message: 'Product not found' });
  }

  // Find or create wishlist
  let wishlist = await Wishlist.findOne({ user: userId });
  if (!wishlist) {
    wishlist = await Wishlist.create({ user: userId, items: [] });
  }

  // Add item
  await wishlist.addItem(productId);
  await wishlist.populate('items.product');

  res.json({ 
    message: 'Product added to wishlist',
    wishlist 
  });
}));

// Remove item from wishlist
router.delete('/item/:productId', requireAuth, asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const userId = req.user.uid;

  const wishlist = await Wishlist.findOne({ user: userId });
  if (!wishlist) {
    return res.status(404).json({ message: 'Wishlist not found' });
  }

  await wishlist.removeItem(productId);
  await wishlist.populate('items.product');

  res.json({ 
    message: 'Product removed from wishlist',
    wishlist 
  });
}));

// Check if product is in wishlist
router.get('/check/:productId', requireAuth, asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const userId = req.user.uid;

  const wishlist = await Wishlist.findOne({ user: userId });
  const inWishlist = wishlist ? wishlist.hasProduct(productId) : false;

  res.json({ inWishlist });
}));

// Clear entire wishlist
router.delete('/clear', requireAuth, asyncHandler(async (req, res) => {
  const userId = req.user.uid;

  const wishlist = await Wishlist.findOne({ user: userId });
  if (wishlist) {
    wishlist.items = [];
    await wishlist.save();
  }

  res.json({ message: 'Wishlist cleared' });
}));

export default router;
