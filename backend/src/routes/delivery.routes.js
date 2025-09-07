import express from 'express';
import asyncHandler from 'express-async-handler';
import Order from '../models/Order.js';
import User from '../models/User.js';
import { requireAuth } from '../middleware/auth.js';

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
  const o = await Order.findOneAndUpdate(
    { _id: req.params.id, deliveryBoy: me._id },
    { deliveryStatus: 'OUT_FOR_DELIVERY', status: 'OUT_FOR_DELIVERY' },
    { new: true }
  );
  res.json(o);
}));

router.patch('/orders/:id/delivered', requireDeliveryBoy, asyncHandler(async (req, res) => {
  const me = await User.findOne({ email: req.user.email });
  const o = await Order.findOneAndUpdate(
    { _id: req.params.id, deliveryBoy: me._id },
    { deliveryStatus: 'DELIVERED', status: 'DELIVERED' },
    { new: true }
  );
  res.json(o);
}));

export default router;