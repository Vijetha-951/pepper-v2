import express from 'express';
import asyncHandler from 'express-async-handler';
import User from '../models/User.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = express.Router();
router.use(requireAuth, requireAdmin);

// Admin profile
router.get('/me', asyncHandler(async (req, res) => {
  const admin = await User.findOne({ email: req.user.email }).select('-__v');
  res.json(admin);
}));
router.put('/me', asyncHandler(async (req, res) => {
  const { firstName, lastName, phone, place, district, pincode } = req.body;
  const updated = await User.findOneAndUpdate(
    { email: req.user.email },
    { firstName, lastName, phone, place, district, pincode },
    { new: true }
  ).select('-__v');
  res.json(updated);
}));

// User Management
router.get('/users', asyncHandler(async (req, res) => {
  const { role, active, q } = req.query;
  const filter = {};
  if (role) filter.role = role;
  if (active !== undefined) filter.isActive = active === 'true';
  if (q) filter.$or = [
    { firstName: { $regex: q, $options: 'i' } },
    { lastName: { $regex: q, $options: 'i' } },
    { email: { $regex: q, $options: 'i' } },
    { phone: { $regex: q, $options: 'i' } },
  ];
  const users = await User.find(filter).sort({ createdAt: -1 });
  res.json(users);
}));

router.patch('/users/:id/approve', asyncHandler(async (req, res) => {
  const user = await User.findByIdAndUpdate(req.params.id, { isActive: true }, { new: true });
  res.json(user);
}));
router.patch('/users/:id/reject', asyncHandler(async (req, res) => {
  const user = await User.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
  res.json(user);
}));
router.patch('/users/:id/role', asyncHandler(async (req, res) => {
  const { role } = req.body; // 'user' | 'admin' | 'deliveryboy'
  const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true });
  res.json(user);
}));
router.patch('/delivery-boys/:id/areas', asyncHandler(async (req, res) => {
  const { pincodes = [], districts = [] } = req.body;
  const user = await User.findByIdAndUpdate(
    req.params.id,
    { assignedAreas: { pincodes, districts }, role: 'deliveryboy' },
    { new: true }
  );
  res.json(user);
}));

// Product Management
router.post('/products', asyncHandler(async (req, res) => {
  const created = await Product.create(req.body);
  res.status(201).json(created);
}));
router.get('/products', asyncHandler(async (req, res) => {
  const { q, type, available, minPrice, maxPrice } = req.query;
  const filter = {};
  if (q) filter.name = { $regex: q, $options: 'i' };
  if (type) filter.type = type;
  if (available === 'true') filter.stock = { $gt: 0 };
  if (minPrice || maxPrice) filter.price = {
    ...(minPrice ? { $gte: Number(minPrice) } : {}),
    ...(maxPrice ? { $lte: Number(maxPrice) } : {}),
  };
  const list = await Product.find(filter).sort({ createdAt: -1 });
  res.json(list);
}));
router.get('/products/:id', asyncHandler(async (req, res) => {
  const item = await Product.findById(req.params.id);
  if (!item) return res.status(404).json({ message: 'Not found' });
  res.json(item);
}));
router.put('/products/:id', asyncHandler(async (req, res) => {
  const updated = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!updated) return res.status(404).json({ message: 'Not found' });
  res.json(updated);
}));
router.delete('/products/:id', asyncHandler(async (req, res) => {
  const deleted = await Product.findByIdAndDelete(req.params.id);
  if (!deleted) return res.status(404).json({ message: 'Not found' });
  res.status(204).end();
}));

// Orders Management
router.get('/orders', asyncHandler(async (req, res) => {
  const { status, deliveryStatus } = req.query;
  const filter = {};
  if (status) filter.status = status;
  if (deliveryStatus) filter.deliveryStatus = deliveryStatus;
  const orders = await Order.find(filter)
    .populate('user', 'firstName lastName email phone')
    .populate('deliveryBoy', 'firstName lastName phone')
    .sort({ createdAt: -1 });
  res.json(orders);
}));
router.patch('/orders/:id/approve', asyncHandler(async (req, res) => {
  const o = await Order.findByIdAndUpdate(req.params.id, { status: 'APPROVED' }, { new: true });
  res.json(o);
}));
router.patch('/orders/:id/assign', asyncHandler(async (req, res) => {
  const { deliveryBoyId } = req.body;
  const o = await Order.findByIdAndUpdate(
    req.params.id,
    { deliveryBoy: deliveryBoyId, deliveryStatus: 'ASSIGNED' },
    { new: true }
  );
  res.json(o);
}));
router.patch('/orders/:id/status', asyncHandler(async (req, res) => {
  const { status } = req.body; // APPROVED | OUT_FOR_DELIVERY | DELIVERED | CANCELLED
  const o = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true });
  res.json(o);
}));
router.patch('/orders/:id/cancel', asyncHandler(async (req, res) => {
  const o = await Order.findByIdAndUpdate(req.params.id, { status: 'CANCELLED' }, { new: true });
  res.json(o);
}));

// Simple report
router.get('/reports/summary', asyncHandler(async (_req, res) => {
  const [totalOrders, pending, delivered] = await Promise.all([
    Order.countDocuments({}),
    Order.countDocuments({ status: 'PENDING' }),
    Order.countDocuments({ status: 'DELIVERED' }),
  ]);
  res.json({ totalOrders, pending, delivered });
}));

export default router;