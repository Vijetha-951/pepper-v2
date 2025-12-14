import express from 'express';
import asyncHandler from 'express-async-handler';
import Order from '../models/Order.js';
import User from '../models/User.js';
import { requireAuth } from '../middleware/auth.js';
import { sendDeliveryOtpEmail } from '../services/emailService.js';

const router = express.Router();
router.use(requireAuth);

function requireDeliveryBoy(req, res, next) {
  if (req.userRole === 'deliveryboy') return next();
  return res.status(403).json({ message: 'Delivery Boys only' });
}

router.get('/me', requireDeliveryBoy, asyncHandler(async (req, res) => {
  const me = await User.findOne({ email: req.user.email }).select('-__v');
  res.json(me);
}));

router.get('/orders/assigned', requireDeliveryBoy, asyncHandler(async (req, res) => {
  const me = await User.findOne({ email: req.user.email });
  const { status, deliveryStatus } = req.query;
  const filter = { deliveryBoy: me._id };
  if (status) filter.status = status;
  if (deliveryStatus) filter.deliveryStatus = deliveryStatus;
  const orders = await Order.find(filter).sort({ createdAt: -1 });
  res.json(orders);
}));

router.patch('/orders/:id/accept', requireDeliveryBoy, asyncHandler(async (req, res) => {
  const me = await User.findOne({ email: req.user.email });
  const o = await Order.findOneAndUpdate(
    { _id: req.params.id, deliveryBoy: me._id },
    { deliveryStatus: 'ACCEPTED', status: 'APPROVED' },
    { new: true }
  );
  res.json(o);
}));

router.patch('/orders/:id/out-for-delivery', requireDeliveryBoy, asyncHandler(async (req, res) => {
  const me = await User.findOne({ email: req.user.email });
  
  const order = await Order.findOne({ _id: req.params.id, deliveryBoy: me._id }).populate('user');
  if (!order) return res.status(404).json({ message: 'Order not found' });

  // Generate OTP if not exists
  if (!order.deliveryOtp) {
    order.deliveryOtp = Math.floor(100000 + Math.random() * 900000).toString();
  }

  order.deliveryStatus = 'OUT_FOR_DELIVERY';
  order.status = 'OUT_FOR_DELIVERY';
  
  order.trackingTimeline.push({
    status: 'OUT_FOR_DELIVERY',
    location: 'Out for Delivery',
    timestamp: new Date(),
    description: `Out for delivery by ${me.firstName} ${me.lastName}`
  });

  await order.save();

  // Send OTP Email
  if (order.user && order.user.email) {
    await sendDeliveryOtpEmail({
      to: order.user.email,
      userName: order.user.firstName,
      order: order,
      otp: order.deliveryOtp
    });
  }

  res.json(order);
}));

router.patch('/orders/:id/delivered', requireDeliveryBoy, asyncHandler(async (req, res) => {
  const { otp } = req.body;
  const me = await User.findOne({ email: req.user.email });
  
  const order = await Order.findOne({ _id: req.params.id, deliveryBoy: me._id });
  if (!order) return res.status(404).json({ message: 'Order not found' });

  // Verify OTP
  if (order.deliveryOtp && order.deliveryOtp !== otp) {
    return res.status(400).json({ message: 'Invalid OTP' });
  }

  order.deliveryStatus = 'DELIVERED';
  order.status = 'DELIVERED';
  
  order.trackingTimeline.push({
    status: 'DELIVERED',
    location: 'Delivered',
    timestamp: new Date(),
    description: `Delivered by ${me.firstName} ${me.lastName}`
  });

  await order.save();
  res.json(order);
}));

// Mark COD payment as accepted (payment collected)
router.patch('/orders/:id/payment/cod-accepted', requireDeliveryBoy, asyncHandler(async (req, res) => {
  const me = await User.findOne({ email: req.user.email });
  const order = await Order.findOne({ _id: req.params.id, deliveryBoy: me._id });
  
  if (!order) {
    return res.status(404).json({ message: 'Order not found' });
  }
  
  if (order.payment.method !== 'COD') {
    return res.status(400).json({ message: 'This order is not a COD payment' });
  }
  
  if (order.payment.status !== 'PENDING') {
    return res.status(400).json({ message: 'Payment has already been processed' });
  }
  
  const o = await Order.findOneAndUpdate(
    { _id: req.params.id, deliveryBoy: me._id },
    { 'payment.status': 'PAID' },
    { new: true }
  );
  res.json(o);
}));

// Update delivery boy status
router.patch('/status', requireDeliveryBoy, asyncHandler(async (req, res) => {
  const { status } = req.body;
  
  // Validate status
  const validStatuses = ['OFFLINE', 'OPEN_FOR_DELIVERY', 'OUT_FOR_DELIVERY'];
  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({ 
      success: false, 
      message: 'Valid status required (OFFLINE, OPEN_FOR_DELIVERY, OUT_FOR_DELIVERY)' 
    });
  }
  
  const me = await User.findOneAndUpdate(
    { email: req.user.email },
    { 
      deliveryStatus: status,
      lastStatusUpdate: new Date()
    },
    { new: true }
  ).select('-__v');
  
  res.json({ success: true, user: me });
}));

// Get current delivery boy status
router.get('/status', requireDeliveryBoy, asyncHandler(async (req, res) => {
  const me = await User.findOne({ email: req.user.email }).select('deliveryStatus lastStatusUpdate');
  res.json({ 
    deliveryStatus: me.deliveryStatus || 'OFFLINE',
    lastStatusUpdate: me.lastStatusUpdate 
  });
}));

export default router;