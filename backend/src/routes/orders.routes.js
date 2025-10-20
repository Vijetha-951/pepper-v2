import express from 'express';
import asyncHandler from 'express-async-handler';
import Order from '../models/Order.js';
import User from '../models/User.js';
import Product from '../models/Product.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// Get dashboard stats for user
router.get('/stats', requireAuth, asyncHandler(async (req, res) => {
  const firebaseUid = req.user.uid;
  
  // Get user document by Firebase UID to get MongoDB _id
  const user = await User.findOne({ firebaseUid });
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }
  
  // Get total orders for this user
  const totalOrders = await Order.countDocuments({ user: user._id });
  
  // Get pending/in-progress deliveries (orders that are not DELIVERED or CANCELLED)
  const pendingDeliveries = await Order.countDocuments({ 
    user: user._id, 
    status: { $nin: ['DELIVERED', 'CANCELLED'] } 
  });
  
  // Get available products count
  const totalProducts = await Product.countDocuments({ available_stock: { $gt: 0 } });
  
  // Get recent orders for activity feed
  const recentOrders = await Order.find({ user: user._id })
    .populate('items.product', 'name')
    .sort({ createdAt: -1 })
    .limit(3);
  
  res.status(200).json({
    totalOrders,
    pendingDeliveries,
    totalProducts,
    newNotifications: 0, // Placeholder for future notifications system
    recentActivity: recentOrders.map(order => ({
      _id: order._id,
      type: 'order',
      status: order.status,
      items: order.items,
      createdAt: order.createdAt
    }))
  });
}));

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
  const firebaseUid = req.user.uid;

  // Get user document by Firebase UID to get MongoDB _id
  const user = await User.findOne({ firebaseUid });
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  const order = await Order.findOne({ _id: order_id, user: user._id })
    .populate('items.product', 'name image price')
    .populate('user', 'firstName lastName email phone');

  if (!order) {
    return res.status(404).json({ message: 'Order not found' });
  }

  res.status(200).json(order);
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

// Cancel order (user can cancel their own order)
router.delete('/:order_id', requireAuth, asyncHandler(async (req, res) => {
  const { order_id } = req.params;
  const firebaseUid = req.user.uid;

  // Get user document by Firebase UID to get MongoDB _id
  const user = await User.findOne({ firebaseUid });
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  // Find the order
  const order = await Order.findOne({ _id: order_id, user: user._id });

  if (!order) {
    return res.status(404).json({ message: 'Order not found' });
  }

  // Check if order can be cancelled (only PENDING and APPROVED orders can be cancelled)
  if (!['PENDING', 'APPROVED'].includes(order.status)) {
    return res.status(400).json({ 
      message: `Cannot cancel order with status: ${order.status}. Only PENDING or APPROVED orders can be cancelled.` 
    });
  }

  // Restore stock for each item in the order
  for (const item of order.items) {
    const product = await Product.findById(item.product);
    if (product) {
      // Restore the available stock
      product.available_stock = (product.available_stock || 0) + item.quantity;
      product.stock = product.available_stock; // Keep legacy field in sync
      await product.save();
    }
  }

  // Update order status to CANCELLED
  order.status = 'CANCELLED';
  await order.save();

  res.status(200).json({
    message: 'Order cancelled successfully. Stock has been restored.',
    order
  });
}));

// Get all refunded orders (admin only)
router.get('/admin/refunds', requireAuth, asyncHandler(async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admin only.' });
  }

  const { status, page = 1, limit = 20 } = req.query;
  const filter = {
    'payment.refundId': { $exists: true }
  };
  
  if (status) {
    filter['payment.refundStatus'] = status.toUpperCase();
  }

  const orders = await Order.find(filter)
    .populate('items.product', 'name image')
    .populate('user', 'firstName lastName email phone')
    .sort({ 'payment.refundInitiatedAt': -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const totalOrders = await Order.countDocuments(filter);

  // Calculate summary
  const summary = await Order.aggregate([
    { $match: { 'payment.refundId': { $exists: true } } },
    {
      $group: {
        _id: '$payment.refundStatus',
        count: { $sum: 1 },
        totalAmount: { $sum: '$payment.refundAmount' }
      }
    }
  ]);

  res.status(200).json({
    orders,
    totalPages: Math.ceil(totalOrders / limit),
    currentPage: page,
    totalOrders,
    summary
  });
}));

export default router;