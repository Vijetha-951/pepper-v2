import express from 'express';
import asyncHandler from 'express-async-handler';
import Order from '../models/Order.js';
import User from '../models/User.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// Get user's orders
router.get('/', requireAuth, asyncHandler(async (req, res) => {
  const firebaseUid = req.user.uid;
  
  // Get user document by Firebase UID to get MongoDB _id
  const user = await User.findOne({ firebaseUid });
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }
  
  const orders = await Order.find({ user: user._id })
    .populate('items.product', 'name image')
    .sort({ createdAt: -1 });

  res.status(200).json(orders);
}));

// Get specific order
router.get('/:order_id', requireAuth, asyncHandler(async (req, res) => {
  const { order_id } = req.params;
  const userId = req.user.uid;

  const order = await Order.findOne({ _id: order_id, user: userId })
    .populate('items.product', 'name image price')
    .populate('user', 'firstName lastName email phone');

  if (!order) {
    return res.status(404).json({ message: 'Order not found' });
  }

  res.status(200).json({ order });
}));

// Get all orders (admin only)
router.get('/admin/all', requireAuth, asyncHandler(async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admin only.' });
  }

  const { status, page = 1, limit = 20 } = req.query;
  const filter = {};
  
  if (status && status !== 'all') {
    filter.status = status.toUpperCase();
  }

  const orders = await Order.find(filter)
    .populate('items.product', 'name image')
    .populate('user', 'firstName lastName email phone')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const totalOrders = await Order.countDocuments(filter);

  res.status(200).json({
    orders,
    totalPages: Math.ceil(totalOrders / limit),
    currentPage: page,
    totalOrders
  });
}));

// Update order status (admin only)
router.put('/:order_id/status', requireAuth, asyncHandler(async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admin only.' });
  }

  const { order_id } = req.params;
  const { status } = req.body;

  const validStatuses = ['PENDING', 'APPROVED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'];
  
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ message: 'Invalid status' });
  }

  const order = await Order.findByIdAndUpdate(
    order_id,
    { status },
    { new: true }
  ).populate('items.product', 'name image');

  if (!order) {
    return res.status(404).json({ message: 'Order not found' });
  }

  res.status(200).json({
    message: 'Order status updated successfully',
    order
  });
}));

export default router;