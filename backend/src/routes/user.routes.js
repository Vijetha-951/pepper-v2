import express from 'express';
import asyncHandler from 'express-async-handler';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import User from '../models/User.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();
router.use(requireAuth);

// Only allow users with role 'user' to use these endpoints
function requireCustomer(req, res, next) {
  if (req.userRole === 'user') return next();
  return res.status(403).json({ message: 'Customers only' });
}

// Profile
router.get('/me', requireCustomer, asyncHandler(async (req, res) => {
  const user = await User.findOne({ email: req.user.email }).select('-__v');
  res.json(user);
}));
router.put('/me', requireCustomer, asyncHandler(async (req, res) => {
  const { firstName, lastName, phone, place, district, pincode } = req.body;
  const updated = await User.findOneAndUpdate(
    { email: req.user.email },
    { firstName, lastName, phone, place, district, pincode },
    { new: true }
  ).select('-__v');
  res.json(updated);
}));

// Products (browse)
router.get('/products', requireCustomer, asyncHandler(async (req, res) => {
  const { q, type, available, minPrice, maxPrice } = req.query;
  const filter = { isActive: true };
  if (q) filter.name = { $regex: q, $options: 'i' };
  if (type) filter.type = type;
  if (available === 'true') filter.stock = { $gt: 0 };
  if (minPrice || maxPrice) filter.price = {
    ...(minPrice ? { $gte: Number(minPrice) } : {}),
    ...(maxPrice ? { $lte: Number(maxPrice) } : {}),
  };
  const products = await Product.find(filter).sort({ name: 1 });
  res.json(products);
}));
router.get('/products/:id', requireCustomer, asyncHandler(async (req, res) => {
  const p = await Product.findById(req.params.id);
  res.json(p);
}));

// Orders
router.post('/orders', requireCustomer, asyncHandler(async (req, res) => {
  const { items, payment = { method: 'COD' }, notes } = req.body;
  if (!Array.isArray(items) || items.length === 0) return res.status(400).json({ message: 'Items required' });

  const productIds = items.map(i => i.productId);
  const products = await Product.find({ _id: { $in: productIds }, isActive: true });
  const productMap = Object.fromEntries(products.map(p => [String(p._id), p]));

  const orderItems = [];
  let total = 0;
  for (const i of items) {
    const p = productMap[i.productId];
    if (!p) return res.status(400).json({ message: `Product not found: ${i.productId}` });
    if (p.stock < i.quantity) return res.status(400).json({ message: `Insufficient stock for ${p.name}` });
    orderItems.push({ product: p._id, name: p.name, priceAtOrder: p.price, quantity: i.quantity });
    total += p.price * i.quantity;
  }

  const me = await User.findOne({ email: req.user.email });
  const order = await Order.create({
    user: me._id,
    items: orderItems,
    totalAmount: total,
    status: 'PENDING',
    deliveryStatus: null,
    shippingAddress: {
      line1: me?.place || '',
      line2: '',
      district: me?.district || '',
      state: 'Kerala',
      pincode: me?.pincode || '',
    },
    payment,
    notes,
  });

  await Promise.all(orderItems.map(i =>
    Product.updateOne({ _id: i.product }, { $inc: { stock: -i.quantity } })
  ));

  res.status(201).json(order);
}));

router.get('/orders', requireCustomer, asyncHandler(async (req, res) => {
  const me = await User.findOne({ email: req.user.email });
  const orders = await Order.find({ user: me._id }).sort({ createdAt: -1 });
  res.json(orders);
}));
router.get('/orders/:id', requireCustomer, asyncHandler(async (req, res) => {
  const me = await User.findOne({ email: req.user.email });
  const o = await Order.findOne({ _id: req.params.id, user: me._id });
  if (!o) return res.status(404).json({ message: 'Not found' });
  res.json(o);
}));

export default router;