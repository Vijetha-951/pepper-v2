import express from 'express';
import asyncHandler from 'express-async-handler';
import HubInventory from '../models/HubInventory.js';
import RestockRequest from '../models/RestockRequest.js';
import Hub from '../models/Hub.js';
import Product from '../models/Product.js';
import User from '../models/User.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Get all hubs for selection (user-facing)
router.get('/hubs/available', asyncHandler(async (req, res) => {
  const hubs = await Hub.find({ isActive: true })
    .select('name district type location order')
    .sort({ order: 1 });
  
  res.json({ 
    success: true, 
    hubs 
  });
}));

// Get inventory for a specific hub
router.get('/hubs/:hubId/inventory', requireAuth, asyncHandler(async (req, res) => {
  const { hubId } = req.params;
  
  const inventory = await HubInventory.find({ hub: hubId })
    .populate('product', 'name type price image')
    .sort({ 'product.name': 1 });
  
  const inventoryWithAvailability = inventory.map(item => ({
    ...item.toObject(),
    availableQuantity: item.getAvailableQuantity()
  }));
  
  res.json({ 
    success: true, 
    inventory: inventoryWithAvailability 
  });
}));

// Check product availability at a specific hub
router.post('/hubs/:hubId/check-availability', asyncHandler(async (req, res) => {
  const { hubId } = req.params;
  const { items } = req.body; // Array of { productId, quantity }
  
  const availability = [];
  let allAvailable = true;
  
  for (const item of items) {
    const inventory = await HubInventory.findOne({ 
      hub: hubId, 
      product: item.productId 
    }).populate('product', 'name price');
    
    if (!inventory) {
      // Product not in this hub's inventory - needs to be stocked
      availability.push({
        productId: item.productId,
        productName: item.productName || 'Unknown',
        requestedQuantity: item.quantity,
        availableQuantity: 0,
        available: false,
        needsRestock: true
      });
      allAvailable = false;
    } else {
      const availableQty = inventory.getAvailableQuantity();
      const isAvailable = availableQty >= item.quantity;
      
      availability.push({
        productId: item.productId,
        productName: inventory.product.name,
        requestedQuantity: item.quantity,
        availableQuantity: availableQty,
        available: isAvailable,
        needsRestock: !isAvailable
      });
      
      if (!isAvailable) {
        allAvailable = false;
      }
    }
  }
  
  res.json({ 
    success: true, 
    allAvailable,
    availability 
  });
}));

// Initialize hub inventory (Admin only)
router.post('/admin/hubs/:hubId/inventory/initialize', requireAuth, requireAdmin, asyncHandler(async (req, res) => {
  const { hubId } = req.params;
  
  const hub = await Hub.findById(hubId);
  if (!hub) {
    return res.status(404).json({ success: false, message: 'Hub not found' });
  }
  
  // Get all products
  const products = await Product.find({ isActive: true });
  
  const inventoryItems = [];
  for (const product of products) {
    // Check if inventory already exists
    let inventory = await HubInventory.findOne({ 
      hub: hubId, 
      product: product._id 
    });
    
    if (!inventory) {
      // Initialize with quantity based on hub type
      let initialQuantity = 0;
      if (hub.district === 'Kottayam') {
        // Main hub - stock all products generously
        initialQuantity = product.available_stock || 100;
      } else {
        // Other hubs - smaller initial stock
        initialQuantity = Math.min(product.available_stock || 0, 20);
      }
      
      inventory = await HubInventory.create({
        hub: hubId,
        product: product._id,
        quantity: initialQuantity,
        reservedQuantity: 0,
        restockHistory: [{
          quantity: initialQuantity,
          source: 'ADMIN',
          timestamp: new Date(),
          notes: 'Initial stock setup'
        }]
      });
    }
    
    inventoryItems.push(inventory);
  }
  
  res.json({ 
    success: true, 
    message: `Initialized inventory for ${inventoryItems.length} products`,
    inventory: inventoryItems 
  });
}));

// Update hub inventory (Admin only)
router.put('/admin/hubs/:hubId/inventory/:productId', requireAuth, requireAdmin, asyncHandler(async (req, res) => {
  const { hubId, productId } = req.params;
  const { quantity, action, notes } = req.body; // action: 'SET' | 'ADD' | 'SUBTRACT'
  
  let inventory = await HubInventory.findOne({ 
    hub: hubId, 
    product: productId 
  });
  
  if (!inventory) {
    // Create if doesn't exist
    inventory = await HubInventory.create({
      hub: hubId,
      product: productId,
      quantity: action === 'SET' ? quantity : 0,
      reservedQuantity: 0
    });
  } else {
    // Update quantity based on action
    if (action === 'SET') {
      inventory.quantity = quantity;
    } else if (action === 'ADD') {
      await inventory.restock(quantity, 'ADMIN', notes || 'Admin adjustment');
    } else if (action === 'SUBTRACT') {
      inventory.quantity = Math.max(0, inventory.quantity - quantity);
    }
    
    await inventory.save();
  }
  
  res.json({ 
    success: true, 
    inventory 
  });
}));

// Get all restock requests (Admin)
router.get('/admin/restock-requests', requireAuth, requireAdmin, asyncHandler(async (req, res) => {
  const { status } = req.query;
  
  const filter = {};
  if (status) {
    filter.status = status;
  }
  
  const requests = await RestockRequest.find(filter)
    .populate('requestingHub', 'name district type')
    .populate('product', 'name type price')
    .populate('requestedBy', 'firstName lastName email')
    .populate('approvedBy', 'firstName lastName email')
    .sort({ createdAt: -1 });
  
  res.json({ 
    success: true, 
    requests 
  });
}));

// Get restock requests for a hub (Hub Manager)
router.get('/hub/restock-requests', requireAuth, asyncHandler(async (req, res) => {
  // Get hub from request (set by requireHubManager middleware if used)
  const user = await User.findOne({ firebaseUid: req.user.uid });
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }
  
  // Find hubs managed by this user
  const hubs = await Hub.find({ managedBy: user._id });
  if (hubs.length === 0) {
    return res.status(403).json({ success: false, message: 'Not authorized as hub manager' });
  }
  
  const hubIds = hubs.map(h => h._id);
  
  const requests = await RestockRequest.find({ requestingHub: { $in: hubIds } })
    .populate('requestingHub', 'name district type')
    .populate('product', 'name type price')
    .populate('requestedBy', 'firstName lastName email')
    .populate('approvedBy', 'firstName lastName email')
    .sort({ createdAt: -1 });
  
  res.json({ 
    success: true, 
    requests 
  });
}));

// Create restock request (Hub Manager)
router.post('/hub/restock-requests', requireAuth, asyncHandler(async (req, res) => {
  const { hubId, productId, quantity, reason, priority } = req.body;
  
  const user = await User.findOne({ firebaseUid: req.user.uid });
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }
  
  // Verify hub exists and user manages it
  const hub = await Hub.findById(hubId);
  if (!hub) {
    return res.status(404).json({ success: false, message: 'Hub not found' });
  }
  
  // Verify product exists
  const product = await Product.findById(productId);
  if (!product) {
    return res.status(404).json({ success: false, message: 'Product not found' });
  }
  
  // Create restock request
  const request = await RestockRequest.create({
    requestingHub: hubId,
    product: productId,
    requestedQuantity: quantity,
    requestedBy: user._id,
    reason: reason || `Low stock at ${hub.name}`,
    priority: priority || 'MEDIUM',
    status: 'PENDING'
  });
  
  const populatedRequest = await RestockRequest.findById(request._id)
    .populate('requestingHub', 'name district type')
    .populate('product', 'name type price')
    .populate('requestedBy', 'firstName lastName email');
  
  res.json({ 
    success: true, 
    message: 'Restock request created successfully',
    request: populatedRequest 
  });
}));

// Approve/Reject restock request (Admin)
router.patch('/admin/restock-requests/:requestId', requireAuth, requireAdmin, asyncHandler(async (req, res) => {
  const { requestId } = req.params;
  const { action, rejectedReason, notes } = req.body; // action: 'APPROVE' | 'REJECT'
  
  const user = await User.findOne({ firebaseUid: req.user.uid });
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }
  
  const request = await RestockRequest.findById(requestId)
    .populate('requestingHub')
    .populate('product');
  
  if (!request) {
    return res.status(404).json({ success: false, message: 'Request not found' });
  }
  
  if (request.status !== 'PENDING') {
    return res.status(400).json({ 
      success: false, 
      message: `Cannot ${action.toLowerCase()} request with status: ${request.status}` 
    });
  }
  
  if (action === 'APPROVE') {
    // Check if main hub (Kottayam) has enough stock
    const mainHub = await Hub.findOne({ district: 'Kottayam' });
    if (!mainHub) {
      return res.status(500).json({ success: false, message: 'Main hub not found' });
    }
    
    const mainHubInventory = await HubInventory.findOne({
      hub: mainHub._id,
      product: request.product._id
    });
    
    if (!mainHubInventory || mainHubInventory.getAvailableQuantity() < request.requestedQuantity) {
      return res.status(400).json({ 
        success: false, 
        message: 'Insufficient stock in main hub',
        available: mainHubInventory ? mainHubInventory.getAvailableQuantity() : 0
      });
    }
    
    // Transfer stock from main hub to requesting hub
    // Reduce from main hub
    mainHubInventory.quantity -= request.requestedQuantity;
    await mainHubInventory.save();
    
    // Add to requesting hub
    let requestingHubInventory = await HubInventory.findOne({
      hub: request.requestingHub._id,
      product: request.product._id
    });
    
    if (!requestingHubInventory) {
      requestingHubInventory = await HubInventory.create({
        hub: request.requestingHub._id,
        product: request.product._id,
        quantity: request.requestedQuantity,
        reservedQuantity: 0,
        restockHistory: []
      });
    }
    
    await requestingHubInventory.restock(
      request.requestedQuantity, 
      'MAIN_HUB', 
      `Fulfilled restock request #${request._id}`
    );
    
    // Update request status
    request.status = 'FULFILLED';
    request.approvedBy = user._id;
    request.approvedAt = new Date();
    request.fulfilledAt = new Date();
    request.notes = notes || '';
    await request.save();
    
    res.json({ 
      success: true, 
      message: 'Restock request approved and fulfilled',
      request 
    });
  } else if (action === 'REJECT') {
    request.status = 'REJECTED';
    request.approvedBy = user._id;
    request.approvedAt = new Date();
    request.rejectedReason = rejectedReason || 'Rejected by admin';
    request.notes = notes || '';
    await request.save();
    
    res.json({ 
      success: true, 
      message: 'Restock request rejected',
      request 
    });
  } else {
    return res.status(400).json({ success: false, message: 'Invalid action' });
  }
}));

export default router;
