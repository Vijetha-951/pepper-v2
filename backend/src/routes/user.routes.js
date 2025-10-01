import express from 'express';
import asyncHandler from 'express-async-handler';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import User from '../models/User.js';
import { requireAuth } from '../middleware/auth.js';
import { sendOrderConfirmationEmail } from '../services/emailService.js';

const router = express.Router();
router.use(requireAuth);

// Allow authenticated roles to manage their own profile/addresses
function requireCustomer(req, res, next) {
  if (['user', 'admin', 'deliveryboy'].includes(req.userRole)) return next();
  return res.status(403).json({ message: 'Authenticated customers only' });
}

// Profile
router.get('/me', requireCustomer, asyncHandler(async (req, res) => {
  const user = await User.findOne({ email: req.user.email }).select('-__v');
  res.json(user);
}));
router.put('/me', requireCustomer, asyncHandler(async (req, res) => {
  const { firstName, lastName, phone, place, district, pincode, address, addresses } = req.body || {};

  // If address object provided, map legacy fields for convenience
  const legacy = address ? {
    place: address.line1 ?? place,
    district: address.district ?? district,
    pincode: address.pincode ?? pincode,
    address: {
      line1: address.line1 || '',
      line2: address.line2 || '',
      district: address.district || '',
      state: address.state || '',
      pincode: address.pincode || '',
    }
  } : {};

  const updateDoc = {
    ...(firstName !== undefined ? { firstName } : {}),
    ...(lastName !== undefined ? { lastName } : {}),
    ...(phone !== undefined ? { phone } : {}),
    ...(place !== undefined || legacy.place !== undefined ? { place: legacy.place ?? place } : {}),
    ...(district !== undefined || legacy.district !== undefined ? { district: legacy.district ?? district } : {}),
    ...(pincode !== undefined || legacy.pincode !== undefined ? { pincode: legacy.pincode ?? pincode } : {}),
    ...(legacy.address ? { address: legacy.address } : {}),
    ...(Array.isArray(addresses) ? { addresses } : {}),
  };

  // Upsert user if missing with minimal required fields
  const updated = await User.findOneAndUpdate(
    { email: req.user.email },
    { 
      $set: updateDoc,
      $setOnInsert: { 
        firebaseUid: req.firebaseUid,
        email: req.user.email,
        firstName: firstName ?? 'Guest',
        lastName: lastName ?? ''
      }
    },
    { new: true, upsert: true }
  ).select('-__v');
  res.json(updated);
}));

// Address book endpoints
router.get('/addresses', requireCustomer, asyncHandler(async (req, res) => {
  const me = await User.findOne({ email: req.user.email }).select('addresses address place district pincode');
  res.json({
    addresses: me.addresses || [],
    primary: me.address || null,
    legacy: { place: me.place || '', district: me.district || '', pincode: me.pincode || '' }
  });
}));

router.post('/addresses', requireCustomer, asyncHandler(async (req, res) => {
  let { line1 = '', line2 = '', district = '', state = '', pincode = '', phone = '' } = req.body || {};
  line1 = String(line1).trim();
  line2 = String(line2).trim();
  district = String(district).trim();
  state = String(state).trim();
  pincode = String(pincode).trim();
  phone = String(phone).trim();
  // Normalize common formats: remove spaces/dashes
  const normalizedPincode = pincode.replace(/\D/g, ''); // digits only
  const normalizedPhone = phone.replace(/\D/g, ''); // digits only

  if (!line1 || !district || !normalizedPincode) {
    return res.status(400).json({ message: 'Address Line 1, district, and pincode are required' });
  }
  if (line1.length < 3) return res.status(400).json({ message: 'Address Line 1 must be at least 3 characters' });
  if (district.length < 2) return res.status(400).json({ message: 'District must be at least 2 characters' });
  if (!/^\d{6}$/.test(normalizedPincode)) return res.status(400).json({ message: 'Pincode must be a 6-digit number' });
  if (!normalizedPhone) return res.status(400).json({ message: 'Phone number is required' });
  if (!/^\d{10}$/.test(normalizedPhone)) return res.status(400).json({ message: 'Phone number must be exactly 10 digits' });

  // Ensure user exists, create minimal record if missing
  let me = await User.findOne({ email: req.user.email });
  if (!me) {
    me = await User.create({
      firebaseUid: req.firebaseUid,
      email: req.user.email,
      firstName: 'Guest',
      lastName: ''
    });
  }

  const wasEmpty = !me.addresses || me.addresses.length === 0;
  me.addresses.push({ line1, line2, district, state, pincode: normalizedPincode, phone: normalizedPhone });

  // If it is the first address, set as primary and fill legacy fields
  if (wasEmpty) {
    me.address = { line1, line2, district, state, pincode: normalizedPincode };
    me.place = line1;
    me.district = district;
    me.pincode = normalizedPincode;
  }

  await me.save();
  res.status(201).json({ addresses: me.addresses, primary: me.address || null });
}));

router.put('/addresses/:id', requireCustomer, asyncHandler(async (req, res) => {
  const { id } = req.params;
  let { line1 = '', line2 = '', district = '', state = '', pincode = '', phone = '' } = req.body || {};
  line1 = String(line1).trim();
  line2 = String(line2).trim();
  district = String(district).trim();
  state = String(state).trim();
  pincode = String(pincode).trim();
  phone = String(phone).trim();
  // Normalize
  const normalizedPincode = pincode.replace(/\D/g, '');
  const normalizedPhone = phone.replace(/\D/g, '');

  if (!line1 || !district || !normalizedPincode) {
    return res.status(400).json({ message: 'Address Line 1, district, and pincode are required' });
  }
  if (line1.length < 3) return res.status(400).json({ message: 'Address Line 1 must be at least 3 characters' });
  if (district.length < 2) return res.status(400).json({ message: 'District must be at least 2 characters' });
  if (!/^\d{6}$/.test(normalizedPincode)) return res.status(400).json({ message: 'Pincode must be a 6-digit number' });
  if (!normalizedPhone) return res.status(400).json({ message: 'Phone number is required' });
  if (!/^\d{10}$/.test(normalizedPhone)) return res.status(400).json({ message: 'Phone number must be exactly 10 digits' });

  const me = await User.findOne({ email: req.user.email });
  const addr = me.addresses.id(id);
  if (!addr) return res.status(404).json({ message: 'Address not found' });
  addr.line1 = line1; addr.line2 = line2; addr.district = district; addr.state = state; addr.pincode = normalizedPincode; addr.phone = normalizedPhone;
  await me.save();
  res.json({ addresses: me.addresses });
}));

router.delete('/addresses/:id', requireCustomer, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const me = await User.findOne({ email: req.user.email });
  const addr = me.addresses.id(id);
  if (!addr) return res.status(404).json({ message: 'Address not found' });
  addr.remove();
  await me.save();
  res.json({ addresses: me.addresses });
}));

router.post('/addresses/:id/select', requireCustomer, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const me = await User.findOne({ email: req.user.email });
  const addr = me.addresses.id(id);
  if (!addr) return res.status(404).json({ message: 'Address not found' });

  // Set as primary (both structured and legacy fields)
  me.address = {
    line1: addr.line1 || '',
    line2: addr.line2 || '',
    district: addr.district || '',
    state: addr.state || '',
    pincode: addr.pincode || '',
  };
  me.place = addr.line1 || '';
  me.district = addr.district || '';
  me.pincode = addr.pincode || '';

  await me.save();
  res.json({ primary: me.address, legacy: { place: me.place, district: me.district, pincode: me.pincode } });
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

  // Populate product details for the response
  await order.populate('items.product', 'name image price');

  // Send order confirmation email for COD orders (non-blocking)
  if (payment.method === 'COD') {
    sendOrderConfirmationEmail({
      to: me.email,
      userName: me.name || `${me.firstName} ${me.lastName}`,
      order: order
    }).catch(err => {
      console.error('Failed to send order confirmation email:', err);
      // Don't fail the request if email fails
    });
  }

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