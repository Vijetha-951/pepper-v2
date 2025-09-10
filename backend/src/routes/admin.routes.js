import express from 'express';
import asyncHandler from 'express-async-handler';
import User from '../models/User.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import admin from '../config/firebase.js';
import { getFirestore } from 'firebase-admin/firestore';

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
  const { role, active, status, q } = req.query;
  // Pagination params with sane defaults
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 10));
  const skip = (page - 1) * limit;

  const filter = {};
  if (role) filter.role = role;
  
  // Handle status filtering (approved, rejected, pending)
  if (status !== undefined) {
    const s = String(status).toLowerCase();
    if (s === 'approved') filter.isActive = true;
    else if (s === 'rejected') filter.isActive = false;
    else if (s === 'pending') {
      // For pending, we need users who haven't been explicitly approved/rejected
      // This could mean isActive is null, undefined, or we can add a new field
      // For now, let's assume pending users have isActive = null
      filter.isActive = null;
    }
  } else if (active !== undefined) {
    filter.isActive = active === 'true';
  }
  
  if (q) {
    filter.$or = [
      { firstName: { $regex: q, $options: 'i' } },
      { lastName: { $regex: q, $options: 'i' } },
      { email: { $regex: q, $options: 'i' } },
      { phone: { $regex: q, $options: 'i' } },
    ];
  }

  const [users, total] = await Promise.all([
    User.find(filter)
      .select('-__v')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    User.countDocuments(filter),
  ]);

  res.json({ users, total, page, limit, pages: Math.ceil(total / limit) });
}));

router.patch('/users/:id/approve', asyncHandler(async (req, res) => {
  const id = String(req.params.id);
  let user = null;
  try { user = await User.findByIdAndUpdate(id, { isActive: true }, { new: true }); } catch { /* ignore */ }
  if (!user) user = await User.findOneAndUpdate({ firebaseUid: id }, { isActive: true }, { new: true });
  if (!user) return res.status(404).json({ success: false, error: 'User not found' });
  res.json(user);
}));
router.patch('/users/:id/reject', asyncHandler(async (req, res) => {
  const id = String(req.params.id);
  let user = null;
  try { user = await User.findByIdAndUpdate(id, { isActive: false }, { new: true }); } catch { /* ignore */ }
  if (!user) user = await User.findOneAndUpdate({ firebaseUid: id }, { isActive: false }, { new: true });
  if (!user) return res.status(404).json({ success: false, error: 'User not found' });
  res.json(user);
}));
router.patch('/users/:id/role', asyncHandler(async (req, res) => {
  const { role } = req.body; // 'user' | 'admin' | 'deliveryboy'
  const id = String(req.params.id);
  let user = null;
  try { user = await User.findByIdAndUpdate(id, { role }, { new: true }); } catch { /* ignore */ }
  if (!user) user = await User.findOneAndUpdate({ firebaseUid: id }, { role }, { new: true });
  if (!user) return res.status(404).json({ success: false, error: 'User not found' });
  res.json(user);
}));

// Delete user in Firebase Auth, Firestore (users collection), and MongoDB
router.delete('/users/:id', asyncHandler(async (req, res) => {
  const param = String(req.params.id);

  // Accept either MongoDB _id or Firebase UID
  let mongoUser = null;
  try {
    mongoUser = await User.findById(param);
  } catch (_) {
    mongoUser = null;
  }
  if (!mongoUser) {
    mongoUser = await User.findOne({ firebaseUid: param });
  }
  if (!mongoUser) return res.status(404).json({ success: false, error: 'User not found' });

  const uid = mongoUser.firebaseUid;
  const db = getFirestore();

  // Delete from Firebase Auth (if uid exists)
  if (uid) {
    try {
      await admin.auth().deleteUser(uid);
    } catch (err) {
      // If user not found in Firebase, continue cleanup
      const code = err?.errorInfo?.code || err?.code || '';
      if (!String(code).includes('auth/user-not-found')) {
        console.error('Failed deleting Firebase user:', err);
      }
    }

    // Delete Firestore user doc (users/{uid}) if exists
    try {
      await db.collection('users').doc(uid).delete();
    } catch (err) {
      console.warn('Failed deleting Firestore user doc:', err?.message || err);
    }
  }

  // Delete related Orders or other resources if needed (optional)
  // await Order.deleteMany({ user: mongoUser._id });

  // Finally remove from MongoDB
  await User.deleteOne({ _id: mongoUser._id });

  return res.json({ success: true, message: 'User deleted from Firebase (if present), Firestore, and MongoDB' });
}));

router.patch('/delivery-boys/:id/areas', asyncHandler(async (req, res) => {
  const { pincodes = [], districts = [] } = req.body;
  const id = String(req.params.id);
  let user = null;
  try { user = await User.findByIdAndUpdate(id, { assignedAreas: { pincodes, districts }, role: 'deliveryboy' }, { new: true }); } catch { /* ignore */ }
  if (!user) user = await User.findOneAndUpdate({ firebaseUid: id }, { assignedAreas: { pincodes, districts }, role: 'deliveryboy' }, { new: true });
  if (!user) return res.status(404).json({ success: false, error: 'User not found' });
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