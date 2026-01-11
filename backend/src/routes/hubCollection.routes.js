import express from 'express';
import asyncHandler from 'express-async-handler';
import Order from '../models/Order.js';
import HubInventory from '../models/HubInventory.js';
import RestockRequest from '../models/RestockRequest.js';
import Hub from '../models/Hub.js';
import Product from '../models/Product.js';
import User from '../models/User.js';
import { requireAuth } from '../middleware/auth.js';
import { sendCollectionOtpEmail } from '../services/emailService.js';

const router = express.Router();

// Generate 6-digit OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Create order with hub collection
router.post('/orders/hub-collection', requireAuth, asyncHandler(async (req, res) => {
  const { items, collectionHubId, payment, notes } = req.body;
  
  // Validate input
  if (!items || items.length === 0) {
    return res.status(400).json({ 
      success: false, 
      message: 'Order items are required' 
    });
  }
  
  if (!collectionHubId) {
    return res.status(400).json({ 
      success: false, 
      message: 'Collection hub is required' 
    });
  }
  
  // Get user
  const user = await User.findOne({ firebaseUid: req.user.uid });
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }
  
  // Verify hub exists
  const collectionHub = await Hub.findById(collectionHubId);
  if (!collectionHub) {
    return res.status(404).json({ success: false, message: 'Collection hub not found' });
  }
  
  // Process items and check availability
  const orderItems = [];
  const unavailableItems = [];
  const restockNeeded = [];
  let totalAmount = 0;
  
  for (const item of items) {
    const product = await Product.findById(item.productId);
    if (!product) {
      return res.status(404).json({ 
        success: false, 
        message: `Product not found: ${item.productId}` 
      });
    }
    
    // Check hub inventory
    let hubInventory = await HubInventory.findOne({
      hub: collectionHubId,
      product: product._id
    });
    
    if (!hubInventory) {
      // Product not in hub inventory - create entry and mark for restock
      hubInventory = await HubInventory.create({
        hub: collectionHubId,
        product: product._id,
        quantity: 0,
        reservedQuantity: 0
      });
      
      unavailableItems.push({
        productId: product._id,
        productName: product.name,
        requestedQuantity: item.quantity,
        availableQuantity: 0
      });
      
      restockNeeded.push({
        product: product._id,
        quantity: item.quantity,
        hubInventory
      });
    } else {
      const availableQty = hubInventory.getAvailableQuantity();
      
      if (availableQty < item.quantity) {
        unavailableItems.push({
          productId: product._id,
          productName: product.name,
          requestedQuantity: item.quantity,
          availableQuantity: availableQty
        });
        
        restockNeeded.push({
          product: product._id,
          quantity: item.quantity - availableQty,
          hubInventory
        });
      }
    }
    
    orderItems.push({
      product: product._id,
      name: product.name,
      priceAtOrder: product.price,
      quantity: item.quantity
    });
    
    totalAmount += product.price * item.quantity;
  }
  
  // Create order
  const order = await Order.create({
    user: user._id,
    items: orderItems,
    totalAmount,
    status: unavailableItems.length > 0 ? 'PENDING' : 'APPROVED',
    deliveryType: 'HUB_COLLECTION',
    collectionHub: collectionHubId,
    currentHub: collectionHubId,
    shippingAddress: {
      line1: collectionHub.location?.address || '',
      district: collectionHub.district,
      state: collectionHub.location?.state || 'Kerala',
      pincode: collectionHub.location?.pincode || ''
    },
    payment: payment || { method: 'COD', status: 'PENDING' },
    notes: notes || '',
    trackingTimeline: [{
      status: 'ORDER_PLACED',
      location: collectionHub.name,
      hub: collectionHub._id,
      timestamp: new Date(),
      description: `Order placed for collection at ${collectionHub.name}`
    }]
  });
  
  // If all items available, reserve them
  if (unavailableItems.length === 0) {
    for (const item of orderItems) {
      const hubInventory = await HubInventory.findOne({
        hub: collectionHubId,
        product: item.product
      });
      
      if (hubInventory) {
        await hubInventory.reserveQuantity(item.quantity);
      }
    }
  } else {
    // Create restock requests for unavailable items
    for (const restock of restockNeeded) {
      await RestockRequest.create({
        requestingHub: collectionHubId,
        product: restock.product,
        requestedQuantity: restock.quantity,
        requestedBy: user._id,
        reason: `Order #${order._id} - Stock unavailable`,
        priority: 'HIGH',
        status: 'PENDING'
      });
    }
  }
  
  const populatedOrder = await Order.findById(order._id)
    .populate('items.product', 'name price image')
    .populate('collectionHub', 'name district location');
  
  // Customer-friendly message - don't expose internal restock details
  res.status(201).json({ 
    success: true, 
    message: 'Order placed successfully! You will be notified when your order is ready for collection.',
    order: populatedOrder,
    // Internal info - not shown in UI, only for logging/admin
    _internal: {
      unavailableItems,
      restockRequested: unavailableItems.length > 0
    }
  });
}));

// Mark order as ready for collection and generate OTP (Hub Manager/Admin)
router.patch('/orders/:orderId/ready-for-collection', requireAuth, asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  
  const order = await Order.findById(orderId)
    .populate('user', 'firstName lastName email')
    .populate('collectionHub', 'name district')
    .populate('items.product', 'name price');
  
  if (!order) {
    return res.status(404).json({ success: false, message: 'Order not found' });
  }
  
  if (order.deliveryType !== 'HUB_COLLECTION') {
    return res.status(400).json({ 
      success: false, 
      message: 'This order is not for hub collection' 
    });
  }
  
  if (order.status === 'READY_FOR_COLLECTION') {
    return res.status(400).json({ 
      success: false, 
      message: 'Order is already ready for collection' 
    });
  }
  
  // Check if all items are available in hub inventory
  const collectionHubId = order.collectionHub._id;
  for (const item of order.items) {
    const hubInventory = await HubInventory.findOne({
      hub: collectionHubId,
      product: item.product._id
    });
    
    if (!hubInventory || hubInventory.getAvailableQuantity() < item.quantity) {
      return res.status(400).json({ 
        success: false, 
        message: `Insufficient stock for ${item.name}. Please fulfill restock requests first.`,
        product: item.name
      });
    }
  }
  
  // Reserve inventory for this order
  for (const item of order.items) {
    const hubInventory = await HubInventory.findOne({
      hub: collectionHubId,
      product: item.product._id
    });
    
    if (hubInventory) {
      await hubInventory.reserveQuantity(item.quantity);
    }
  }
  
  // Generate OTP
  const otp = generateOTP();
  order.collectionOtp = otp;
  order.collectionOtpGeneratedAt = new Date();
  order.status = 'READY_FOR_COLLECTION';
  
  order.trackingTimeline.push({
    status: 'READY_FOR_COLLECTION',
    location: order.collectionHub.name,
    hub: order.collectionHub._id,
    timestamp: new Date(),
    description: `Order is ready for collection. OTP sent to customer.`
  });
  
  await order.save();
  
  // Send OTP email to customer
  if (order.user && order.user.email) {
    await sendCollectionOtpEmail({
      to: order.user.email,
      userName: order.user.firstName,
      order: order,
      otp: otp,
      hubName: order.collectionHub.name
    });
  }
  
  res.json({ 
    success: true, 
    message: 'Order is ready for collection. OTP sent to customer.',
    order 
  });
}));

// Get order details for collection verification (Hub Staff)
router.get('/orders/:orderId/details', requireAuth, asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  
  const order = await Order.findById(orderId)
    .populate('user', 'firstName lastName email phone')
    .populate('collectionHub', 'name district address')
    .populate('items.product', 'name price image');
  
  if (!order) {
    return res.status(404).json({ success: false, message: 'Order not found' });
  }
  
  if (order.deliveryType !== 'HUB_COLLECTION') {
    return res.status(400).json({ 
      success: false, 
      message: 'This is not a hub collection order' 
    });
  }
  
  res.json(order);
}));

// Verify OTP and complete collection (Hub Staff)
router.post('/orders/:orderId/verify-collection', requireAuth, asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const { otp } = req.body;
  
  if (!otp) {
    return res.status(400).json({ success: false, message: 'OTP is required' });
  }
  
  const order = await Order.findById(orderId)
    .populate('user', 'firstName lastName email')
    .populate('collectionHub', 'name district')
    .populate('items.product', 'name price');
  
  if (!order) {
    return res.status(404).json({ success: false, message: 'Order not found' });
  }
  
  if (order.deliveryType !== 'HUB_COLLECTION') {
    return res.status(400).json({ 
      success: false, 
      message: 'This order is not for hub collection' 
    });
  }
  
  if (order.status !== 'READY_FOR_COLLECTION') {
    return res.status(400).json({ 
      success: false, 
      message: `Order is not ready for collection. Current status: ${order.status}` 
    });
  }
  
  // Verify OTP
  if (order.collectionOtp !== otp) {
    return res.status(400).json({ 
      success: false, 
      message: 'Invalid OTP' 
    });
  }
  
  // Check OTP expiry (24 hours)
  const otpAge = Date.now() - order.collectionOtpGeneratedAt.getTime();
  const twentyFourHours = 24 * 60 * 60 * 1000;
  if (otpAge > twentyFourHours) {
    return res.status(400).json({ 
      success: false, 
      message: 'OTP has expired' 
    });
  }
  
  // Fulfill order - reduce inventory
  const collectionHubId = order.collectionHub._id;
  for (const item of order.items) {
    const hubInventory = await HubInventory.findOne({
      hub: collectionHubId,
      product: item.product._id
    });
    
    if (hubInventory) {
      await hubInventory.fulfillOrder(item.quantity);
    }
  }
  
  // Update order status
  order.status = 'DELIVERED';
  order.collectedAt = new Date();
  order.payment.status = 'PAID'; // Assuming payment on collection
  
  order.trackingTimeline.push({
    status: 'DELIVERED',
    location: order.collectionHub.name,
    hub: order.collectionHub._id,
    timestamp: new Date(),
    description: `Order collected by customer at ${order.collectionHub.name}`
  });
  
  await order.save();
  
  res.json({ 
    success: true, 
    message: 'Order collected successfully',
    order 
  });
}));

// Get orders ready for collection at a hub (Hub Manager)
router.get('/hub/:hubId/ready-for-collection', requireAuth, asyncHandler(async (req, res) => {
  const { hubId } = req.params;
  
  const orders = await Order.find({
    collectionHub: hubId,
    status: 'READY_FOR_COLLECTION'
  })
    .populate('user', 'firstName lastName email phone')
    .populate('items.product', 'name price image')
    .sort({ collectionOtpGeneratedAt: -1 });
  
  res.json({ 
    success: true, 
    orders 
  });
}));

// Get all hub collection orders for a hub (Hub Manager)
router.get('/hub/:hubId/collection-orders', requireAuth, asyncHandler(async (req, res) => {
  const { hubId } = req.params;
  const { status } = req.query;
  
  const filter = {
    collectionHub: hubId,
    deliveryType: 'HUB_COLLECTION'
  };
  
  if (status) {
    filter.status = status;
  }
  
  const orders = await Order.find(filter)
    .populate('user', 'firstName lastName email phone')
    .populate('items.product', 'name price image')
    .populate('collectionHub', 'name district')
    .sort({ createdAt: -1 });
  
  res.json({ 
    success: true, 
    orders 
  });
}));

export default router;
