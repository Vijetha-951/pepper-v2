import express from 'express';
import asyncHandler from 'express-async-handler';
import User from '../models/User.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import admin from '../config/firebase.js';
import { getFirestore } from 'firebase-admin/firestore';
import DemandPredictionService from '../services/demandPredictionService.js';

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
  
  // Validate role
  if (!role || !['user', 'admin', 'deliveryboy'].includes(role)) {
    return res.status(400).json({ success: false, error: 'Valid role (user/admin/deliveryboy) is required' });
  }
  
  let user = null;
  try { user = await User.findByIdAndUpdate(id, { role }, { new: true }); } catch { /* ignore */ }
  if (!user) user = await User.findOneAndUpdate({ firebaseUid: id }, { role }, { new: true });
  if (!user) return res.status(404).json({ success: false, error: 'User not found' });
  
  // Also update Firestore and Firebase Claims to ensure consistency
  if (user.firebaseUid) {
    try {
      const db = getFirestore();
      
      // Update Firestore
      await db.collection('users').doc(user.firebaseUid).set({ 
        uid: user.firebaseUid,
        email: user.email,
        role: role,
        provider: 'firebase'
      }, { merge: true });
      
      // Update Firebase custom claims
      await admin.auth().setCustomUserClaims(user.firebaseUid, { role });
      
      console.log(`Successfully updated role to ${role} for user ${user.email} (${user.firebaseUid})`);
      
    } catch (err) {
      console.error('Failed to update Firestore/Firebase claims for role change:', err);
      // Don't fail the request, but log the error
    }
  }
  
  res.json({ success: true, user, message: `Role updated to ${role}` });
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
// Normalize inputs and ensure enhanced stock fields are set for new products
router.post('/products', asyncHandler(async (req, res) => {
  const { name, type, category, description, price, stock, image, isActive } = req.body;

  if (!name || !type || price === undefined || stock === undefined) {
    return res.status(400).json({ success: false, message: 'Missing required fields: name, type, price, stock' });
  }

  const normalized = {
    name: String(name).trim(),
    type,
    category: category || 'Bush Pepper',
    description: description || '',
    price: Number(price),
    stock: Number(stock),
    total_stock: Number(stock),
    available_stock: Number(stock),
    image: image || '',
    isActive: typeof isActive === 'boolean' ? isActive : true,
  };

  const created = await Product.create(normalized);
  res.status(201).json(created);
}));

// Bulk seed products with all 21 pepper varieties
router.post('/products/seed', asyncHandler(async (req, res) => {
  const pepperVarieties = [
    { name: 'Karimunda', type: 'Climber', category: 'Bush Pepper', description: 'Popular cultivar known for yield.', price: 120, stock: 50 },
    { name: 'Naraya Pepper', type: 'Climber', category: 'Bush Pepper', description: 'Locally favored flavor profile.', price: 110, stock: 40 },
    { name: 'Kumbukkan', type: 'Climber', category: 'Bush Pepper', description: 'Strong aroma, robust growth.', price: 115, stock: 35 },
    { name: 'Randhalmunda', type: 'Climber', category: 'Bush Pepper', description: 'Good disease tolerance.', price: 130, stock: 30 },
    { name: 'Kairali', type: 'Climber', category: 'Bush Pepper', description: 'Balanced flavor and yield.', price: 125, stock: 30 },
    { name: 'Panniyur 1', type: 'Climber', category: 'Bush Pepper', description: 'High yielding selection.', price: 140, stock: 45 },
    { name: 'Panniyur 2', type: 'Climber', category: 'Bush Pepper', description: 'Improved vigor.', price: 145, stock: 40 },
    { name: 'Panniyur 3', type: 'Climber', category: 'Bush Pepper', description: 'Uniform spikes.', price: 150, stock: 35 },
    { name: 'Panniyur 4', type: 'Climber', category: 'Bush Pepper', description: 'Good berry size.', price: 155, stock: 30 },
    { name: 'Panniyur 5', type: 'Climber', category: 'Bush Pepper', description: 'Quality fruits.', price: 160, stock: 30 },
    { name: 'Panniyur 6', type: 'Climber', category: 'Bush Pepper', description: 'Consistent producer.', price: 165, stock: 25 },
    { name: 'Panniyur 7', type: 'Climber', category: 'Bush Pepper', description: 'Popular among growers.', price: 170, stock: 25 },
    { name: 'Panniyur 8', type: 'Climber', category: 'Bush Pepper', description: 'Strong plant health.', price: 175, stock: 20 },
    { name: 'Panniyur 9', type: 'Climber', category: 'Bush Pepper', description: 'Latest Panniyur line.', price: 180, stock: 20 },
    { name: 'Vijay', type: 'Climber', category: 'Bush Pepper', description: 'Reliable cultivar.', price: 135, stock: 40 },
    { name: 'Thekkan 1', type: 'Bush', category: 'Bush Pepper', description: 'Compact bush pepper.', price: 100, stock: 60 },
    { name: 'Thekkan 2', type: 'Bush', category: 'Bush Pepper', description: 'Bush type, easy maintenance.', price: 105, stock: 55 },
    { name: 'Neelamundi', type: 'Climber', category: 'Bush Pepper', description: 'Distinct taste.', price: 115, stock: 30 },
    { name: 'Vattamundi', type: 'Climber', category: 'Bush Pepper', description: 'Roundish spike formation.', price: 120, stock: 30 },
    { name: 'Vellamundi', type: 'Climber', category: 'Bush Pepper', description: 'Light-colored berries.', price: 120, stock: 30 },
    { name: 'Kuthiravalley', type: 'Climber', category: 'Bush Pepper', description: 'Known regional variety.', price: 125, stock: 25 },
  ];

  try {
    // Check which varieties don't exist yet
    const existingProducts = await Product.find({ name: { $in: pepperVarieties.map(p => p.name) } });
    const existingNames = existingProducts.map(p => p.name);
    const newVarieties = pepperVarieties.filter(p => !existingNames.includes(p.name));

    if (newVarieties.length === 0) {
      return res.json({ message: 'All pepper varieties already exist', seeded: 0, existing: existingProducts.length });
    }

    const seededProducts = await Product.insertMany(newVarieties);
    res.json({ 
      message: `Successfully seeded ${seededProducts.length} new pepper varieties`, 
      seeded: seededProducts.length,
      existing: existingProducts.length,
      products: seededProducts
    });
  } catch (error) {
    console.error('Seed error:', error);
    res.status(500).json({ error: 'Failed to seed products' });
  }
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
  const body = { ...req.body };

  // Keep enhanced stock fields in sync when legacy stock is updated
  if (typeof body.stock === 'number') {
    // If caller did not provide enhanced fields, derive from stock
    if (typeof body.available_stock !== 'number') body.available_stock = body.stock;
    if (typeof body.total_stock !== 'number') {
      // Preserve existing total_stock if possible; otherwise use max of current and new available
      const existing = await Product.findById(req.params.id).select('total_stock available_stock stock');
      const currentTotal = existing?.total_stock ?? existing?.stock ?? 0;
      body.total_stock = Math.max(currentTotal, body.available_stock);
    }
  }

  const updated = await Product.findByIdAndUpdate(req.params.id, body, { new: true });
  if (!updated) return res.status(404).json({ message: 'Not found' });

  // Ensure legacy stock mirrors available_stock for backward compatibility
  if (updated.available_stock !== undefined && updated.stock !== updated.available_stock) {
    updated.stock = updated.available_stock;
    await updated.save();
  }

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

// Get individual order details with all related info
router.get('/orders/:id', asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate('user', 'firstName lastName email phone')
    .populate('deliveryBoy', 'firstName lastName phone deliveryStatus assignedAreas');
  
  if (!order) {
    return res.status(404).json({ success: false, message: 'Order not found' });
  }
  
  res.json(order);
}));

// Admin Dashboard Stats - comprehensive system-wide statistics
router.get('/stats', asyncHandler(async (_req, res) => {
  // Get total orders in system
  const totalOrders = await Order.countDocuments({});
  
  // Get pending deliveries (orders not DELIVERED or CANCELLED)
  const pendingDeliveries = await Order.countDocuments({ 
    status: { $nin: ['DELIVERED', 'CANCELLED'] } 
  });
  
  // Get available products count
  const totalProducts = await Product.countDocuments({ available_stock: { $gt: 0 } });
  
  // Get order status breakdown
  const statusBreakdown = await Order.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);
  
  // Convert status breakdown to object
  const statusStats = {};
  statusBreakdown.forEach(item => {
    statusStats[item._id] = item.count;
  });
  
  // Get recent orders for activity feed (last 5 orders from all users)
  const recentOrders = await Order.find({})
    .populate('user', 'firstName lastName email')
    .populate('items.product', 'name')
    .sort({ createdAt: -1 })
    .limit(5);
  
  // Calculate revenue stats
  const revenueStats = await Order.aggregate([
    {
      $match: { status: 'DELIVERED' } // Only count delivered orders as completed revenue
    },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: '$totalAmount' },
        averageOrderValue: { $avg: '$totalAmount' },
        completedOrders: { $sum: 1 }
      }
    }
  ]);
  
  const revenue = revenueStats.length > 0 ? {
    totalRevenue: revenueStats[0].totalRevenue || 0,
    averageOrderValue: parseFloat((revenueStats[0].averageOrderValue || 0).toFixed(2)),
    completedOrders: revenueStats[0].completedOrders || 0
  } : {
    totalRevenue: 0,
    averageOrderValue: 0,
    completedOrders: 0
  };
  
  // Get today's stats
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrowStart = new Date(today);
  tomorrowStart.setDate(tomorrowStart.getDate() + 1);
  
  const todayOrders = await Order.countDocuments({
    createdAt: { $gte: today, $lt: tomorrowStart }
  });
  
  const todayRevenue = await Order.aggregate([
    {
      $match: {
        status: 'DELIVERED',
        createdAt: { $gte: today, $lt: tomorrowStart }
      }
    },
    {
      $group: {
        _id: null,
        total: { $sum: '$totalAmount' }
      }
    }
  ]);
  
  res.status(200).json({
    totalOrders,
    pendingDeliveries,
    totalProducts,
    newNotifications: 0, // Placeholder for future notifications system
    statusStats,
    revenue,
    todayOrders,
    todayRevenue: todayRevenue.length > 0 ? todayRevenue[0].total : 0,
    recentActivity: recentOrders.map(order => ({
      _id: order._id,
      type: 'order',
      status: order.status,
      user: order.user,
      items: order.items,
      totalAmount: order.totalAmount,
      createdAt: order.createdAt
    }))
  });
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

// Get all delivery boys with their current status
router.get('/delivery-boys/status', asyncHandler(async (req, res) => {
  const deliveryBoys = await User.find({ role: 'deliveryboy' })
    .select('firstName lastName email phone deliveryStatus lastStatusUpdate assignedAreas isActive')
    .sort({ lastStatusUpdate: -1 });
  
  res.json({ 
    success: true, 
    deliveryBoys,
    total: deliveryBoys.length 
  });
}));

// Get delivery boys with OPEN_FOR_DELIVERY status
router.get('/delivery-boys/available', asyncHandler(async (req, res) => {
  // Find delivery boys who are available for delivery
  // Include both approved (isActive: true) and pending (isActive: null) delivery boys
  // as long as they have explicitly set their status to OPEN_FOR_DELIVERY
  const availableDeliveryBoys = await User.find({ 
    role: 'deliveryboy',
    deliveryStatus: 'OPEN_FOR_DELIVERY',
    isActive: { $ne: false } // Include true and null, but exclude false (rejected)
  })
    .select('_id firstName lastName email phone deliveryStatus assignedAreas')
    .sort({ firstName: 1 });
  
  res.json({ 
    success: true, 
    deliveryBoys: availableDeliveryBoys,
    total: availableDeliveryBoys.length 
  });
}));

// === STOCK DEMAND PREDICTION ENDPOINTS ===

// GET /api/admin/demand-predictions/summary/dashboard - Get dashboard summary
// MUST come before /:productId to avoid route param matching
router.get('/demand-predictions/summary/dashboard', asyncHandler(async (req, res) => {
  const predictions = await DemandPredictionService.generatePredictions(6);
  
  // Create summary statistics
  const summary = {
    totalProducts: predictions.length,
    criticalStocks: predictions.filter(p => p.currentStock <= 5).length,
    increaseDemand: predictions.filter(p => p.prediction.recommendation === 'INCREASE').length,
    reduceDemand: predictions.filter(p => p.prediction.recommendation === 'REDUCE').length,
    trends: {
      rising: predictions.filter(p => p.salesMetrics.trend === 'RISING').length,
      declining: predictions.filter(p => p.salesMetrics.trend === 'DECLINING').length,
      stable: predictions.filter(p => p.salesMetrics.trend === 'STABLE').length
    },
    topUrgent: predictions.slice(0, 5),
    generalHealth: {
      healthy: predictions.filter(p => p.stockHealth === 'HEALTHY').length,
      adequate: predictions.filter(p => p.stockHealth === 'ADEQUATE').length,
      low: predictions.filter(p => p.stockHealth === 'LOW').length,
      outOfStock: predictions.filter(p => p.stockHealth === 'OUT_OF_STOCK').length
    }
  };
  
  res.json({
    success: true,
    summary,
    generatedAt: new Date()
  });
}));

// GET /api/admin/demand-predictions - Get top demand predictions
router.get('/demand-predictions', asyncHandler(async (req, res) => {
  const { limit = 10, monthsBack = 6 } = req.query;
  
  const predictions = await DemandPredictionService.getTopPredictions(
    parseInt(limit),
    parseInt(monthsBack)
  );
  
  // Calculate stats for frontend
  const stats = {
    criticalStocks: predictions.filter(p => p.stock <= 10).length,
    needIncrease: predictions.filter(p => p.prediction.recommendation === 'INCREASE').length,
    canReduce: predictions.filter(p => p.prediction.recommendation === 'REDUCE').length,
    totalAnalyzed: predictions.length
  };
  
  res.json({
    success: true,
    predictions,
    stats,
    total: predictions.length,
    generatedAt: new Date(),
    analysisMetadata: {
      monthsAnalyzed: parseInt(monthsBack),
      recommendedActions: {
        INCREASE: stats.needIncrease,
        REDUCE: stats.canReduce,
        MAINTAIN: predictions.filter(p => p.prediction.recommendation === 'MAINTAIN').length,
        MONITOR: predictions.filter(p => p.prediction.recommendation === 'MONITOR').length
      }
    }
  });
}));

// GET /api/admin/demand-predictions/:productId - Get prediction for specific product
router.get('/demand-predictions/:productId', asyncHandler(async (req, res) => {
  const { monthsBack = 6 } = req.query;
  
  const prediction = await DemandPredictionService.getPredictionForProduct(
    req.params.productId,
    parseInt(monthsBack)
  );
  
  res.json({
    success: true,
    prediction,
    generatedAt: new Date()
  });
}));

export default router;