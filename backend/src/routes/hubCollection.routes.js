import express from 'express';
import asyncHandler from 'express-async-handler';
import Order from '../models/Order.js';
import HubInventory from '../models/HubInventory.js';
import RestockRequest from '../models/RestockRequest.js';
import Hub from '../models/Hub.js';
import Product from '../models/Product.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { requireAuth } from '../middleware/auth.js';
import { sendCollectionOtpEmail, sendHubArrivedForCollectionEmail } from '../services/emailService.js';
import { createOrderPlacedNotification, createRestockRequestNotification } from '../services/notificationService.js';

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
      const restockRequest = await RestockRequest.create({
        requestingHub: collectionHubId,
        product: restock.product,
        requestedQuantity: restock.quantity,
        requestedBy: user._id,
        reason: `Order #${order._id} - Stock unavailable`,
        priority: 'HIGH',
        status: 'PENDING'
      });
      
      // Notify admins about restock request
      const product = await Product.findById(restock.product);
      if (product) {
        createRestockRequestNotification(restockRequest, collectionHub, product).catch(err => {
          console.error('Failed to create restock notification:', err);
        });
      }
    }
  }
  
  const populatedOrder = await Order.findById(order._id)
    .populate('items.product', 'name price image')
    .populate('collectionHub', 'name district location')
    .populate('user', 'firstName lastName email');
  
  // Create notification for hub manager (non-blocking)
  if (collectionHub) {
    createOrderPlacedNotification(populatedOrder, collectionHub).catch(err => {
      console.error('Failed to create hub notification:', err);
    });
  }
  
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

// Mark order as arrived at hub (Step 1: Notify customer) (Hub Manager/Admin)
router.patch('/orders/:orderId/arrived-at-hub', requireAuth, asyncHandler(async (req, res) => {
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
  
  if (order.status === 'ARRIVED_AT_HUB' || order.status === 'READY_FOR_COLLECTION') {
    return res.status(400).json({ 
      success: false, 
      message: 'Order has already been marked as arrived' 
    });
  }
  
  // Check if order is PENDING (needs restocking)
  if (order.status === 'PENDING') {
    return res.status(400).json({ 
      success: false, 
      message: 'Order is pending restock approval. Please wait for admin to fulfill restock requests before marking as arrived.' 
    });
  }
  
  // Only APPROVED orders can be marked as arrived
  if (order.status !== 'APPROVED') {
    return res.status(400).json({ 
      success: false, 
      message: `Cannot mark order as arrived. Current status: ${order.status}` 
    });
  }
  
  // Process inventory: release old reservations, check availability, and reserve stock
  const collectionHubId = order.collectionHub._id;
  
  // Step 1: Release old reservations (if any)
  for (const item of order.items) {
    const hubInventory = await HubInventory.findOne({
      hub: collectionHubId,
      product: item.product._id
    });
    
    if (!hubInventory) {
      return res.status(400).json({ 
        success: false, 
        message: `No inventory record found for ${item.name} at this hub.`
      });
    }
    
    if (hubInventory.reservedQuantity > 0) {
      const toRelease = Math.min(item.quantity, hubInventory.reservedQuantity);
      hubInventory.releaseQuantity(toRelease);
      await hubInventory.save();
    }
  }
  
  // Step 2: Check availability (fetch fresh data)
  for (const item of order.items) {
    const hubInventory = await HubInventory.findOne({
      hub: collectionHubId,
      product: item.product._id
    });
    
    const availableQty = hubInventory.getAvailableQuantity();
    if (availableQty < item.quantity) {
      return res.status(400).json({ 
        success: false, 
        message: `Insufficient stock for ${item.name}. Available: ${availableQty}, Required: ${item.quantity}. Please wait for restock.`
      });
    }
  }
  
  // Step 3: Reserve stock (fetch fresh data)
  for (const item of order.items) {
    const hubInventory = await HubInventory.findOne({
      hub: collectionHubId,
      product: item.product._id
    });
    
    await hubInventory.reserveQuantity(item.quantity);
  }
  
  // Update status to ARRIVED_AT_HUB
  order.status = 'ARRIVED_AT_HUB';
  
  order.trackingTimeline.push({
    status: 'ARRIVED_AT_HUB',
    location: order.collectionHub.name,
    hub: order.collectionHub._id,
    timestamp: new Date(),
    description: `Package arrived at ${order.collectionHub.name}. Customer notified.`
  });
  
  await order.save();
  
  // Send arrival notification email to customer
  if (order.user && order.user.email) {
    await sendHubArrivedForCollectionEmail({
      to: order.user.email,
      userName: order.user.firstName,
      order: order,
      hubName: order.collectionHub.name
    });
  }
  
  res.json({ 
    success: true, 
    message: 'Order marked as arrived at hub. Customer notified via email.',
    order 
  });
}));

// Mark order as ready for collection and generate OTP (Step 2: Generate OTP) (Hub Manager/Admin)
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
  
  if (order.status !== 'ARRIVED_AT_HUB') {
    return res.status(400).json({ 
      success: false, 
      message: 'Order must be marked as arrived at hub first. Please mark it as arrived before generating OTP.' 
    });
  }
  
  // Stock was already checked and reserved when order was marked as ARRIVED_AT_HUB
  // No need to check available quantity again, just verify reserved quantity exists
  const collectionHubId = order.collectionHub._id;
  for (const item of order.items) {
    const hubInventory = await HubInventory.findOne({
      hub: collectionHubId,
      product: item.product._id
    });
    
    if (!hubInventory) {
      return res.status(400).json({ 
        success: false, 
        message: `No inventory record found for ${item.name}.`,
        product: item.name
      });
    }
    
    // Check if we have enough total quantity (reserved + available)
    if (hubInventory.quantity < item.quantity) {
      return res.status(400).json({ 
        success: false, 
        message: `Insufficient total stock for ${item.name}. Hub has ${hubInventory.quantity} units but order needs ${item.quantity}.`,
        product: item.name
      });
    }
  }
  
  // No need to reserve again - stock is already reserved from ARRIVED_AT_HUB step
  
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
  const isKottayamHub = order.collectionHub.district === 'Kottayam';
  
  for (const item of order.items) {
    const hubInventory = await HubInventory.findOne({
      hub: collectionHubId,
      product: item.product._id
    });
    
    if (hubInventory) {
      await hubInventory.fulfillOrder(item.quantity);
      
      // Sync Product stock with Kottayam Hub (Main Hub)
      if (isKottayamHub) {
        try {
          const product = await Product.findById(item.product._id);
          if (product) {
            product.available_stock = hubInventory.quantity;
            product.total_stock = hubInventory.quantity;
            product.stock = hubInventory.quantity;
            await product.save();
            console.log(`✅ Synced Product ${product.name} stock to match Kottayam Hub: ${hubInventory.quantity}`);
          }
        } catch (productSyncError) {
          console.error('⚠️ Failed to sync Product stock:', productSyncError);
        }
      }
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
  
  // Delete all notifications related to this order
  try {
    const deletedNotifications = await Notification.deleteMany({
      'metadata.orderId': orderId
    });
    console.log(`🗑️ Deleted ${deletedNotifications.deletedCount} notifications for collected order ${orderId}`);
  } catch (notifError) {
    console.error('⚠️ Failed to delete notifications:', notifError);
    // Don't fail the request if notification deletion fails
  }
  
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

// Release reserved stock for an order (admin only)
router.post('/orders/:orderId/release-reservation', requireAuth, asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  
  // Get user and verify admin
  const user = await User.findOne({ firebaseUid: req.user.uid });
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ 
      success: false, 
      message: 'Only admins can release reservations' 
    });
  }
  
  const order = await Order.findById(orderId)
    .populate('collectionHub')
    .populate('items.product');
    
  if (!order) {
    return res.status(404).json({ success: false, message: 'Order not found' });
  }
  
  const releasedItems = [];
  
  // Release any reserved stock for this order
  for (const item of order.items) {
    const hubInventory = await HubInventory.findOne({
      hub: order.collectionHub._id,
      product: item.product._id
    });

    if (hubInventory && hubInventory.reservedQuantity > 0) {
      const beforeReserved = hubInventory.reservedQuantity;
      const beforeAvailable = hubInventory.getAvailableQuantity();
      
      // Release the quantity (up to what's needed for this order)
      const toRelease = Math.min(item.quantity, hubInventory.reservedQuantity);
      hubInventory.releaseQuantity(toRelease);
      await hubInventory.save();
      
      const afterReserved = hubInventory.reservedQuantity;
      const afterAvailable = hubInventory.getAvailableQuantity();
      
      releasedItems.push({
        productName: item.name,
        released: toRelease,
        reservedBefore: beforeReserved,
        reservedAfter: afterReserved,
        availableBefore: beforeAvailable,
        availableAfter: afterAvailable
      });
    }
  }
  
  res.json({ 
    success: true, 
    message: releasedItems.length > 0 
      ? `Released reservations for ${releasedItems.length} item(s)` 
      : 'No reservations found to release',
    releasedItems,
    order: {
      id: order._id,
      status: order.status
    }
  });
}));

// Delete an order completely (admin only)
router.delete('/orders/:orderId', requireAuth, asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  
  // Get user and verify admin
  const user = await User.findOne({ firebaseUid: req.user.uid });
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ 
      success: false, 
      message: 'Only admins can delete orders' 
    });
  }
  
  const order = await Order.findById(orderId);
    
  if (!order) {
    return res.status(404).json({ success: false, message: 'Order not found' });
  }
  
  // Delete related notifications
  const deletedNotifications = await Notification.deleteMany({
    'metadata.orderId': orderId
  });
  
  // Delete related restock requests
  const deletedRestockRequests = await RestockRequest.deleteMany({
    'orderDetails.orderId': orderId
  });
  
  // Delete the order itself
  await Order.findByIdAndDelete(orderId);
  
  res.json({ 
    success: true, 
    message: 'Order completely deleted from system',
    deleted: {
      order: true,
      notifications: deletedNotifications.deletedCount,
      restockRequests: deletedRestockRequests.deletedCount
    }
  });
}));

export default router;
