import express from 'express';
import asyncHandler from 'express-async-handler';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import User from '../models/User.js';
import Hub from '../models/Hub.js';
import HubInventory from '../models/HubInventory.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// POST /api/products - Add product with enhanced stock management
router.post('/products', requireAuth, requireAdmin, asyncHandler(async (req, res) => {
  const { name, type, category, description, price, total_stock, available_stock, image } = req.body;
  
  // Validation
  if (!name || !type || price === undefined || total_stock === undefined || available_stock === undefined) {
    return res.status(400).json({ 
      success: false, 
      message: 'Missing required fields: name, type, price, total_stock, available_stock' 
    });
  }

  if (total_stock < 0 || available_stock < 0) {
    return res.status(400).json({ 
      success: false, 
      message: 'Stock quantities must be non-negative' 
    });
  }

  if (available_stock > total_stock) {
    return res.status(400).json({ 
      success: false, 
      message: 'Available stock cannot exceed total stock' 
    });
  }

  try {
    const product = await Product.create({
      name: name.trim(),
      type,
      category: category || 'Bush Pepper',
      description: description || '',
      price: Number(price),
      total_stock: Number(total_stock),
      available_stock: Number(available_stock),
      stock: Number(available_stock), // For backward compatibility
      image: image || '',
      isActive: true
    });

    res.status(201).json({ 
      success: true, 
      product: product.toDashboardJSON() 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
}));

// GET /api/admin/stock - Fetch all products with enhanced stock information
router.get('/admin/stock', requireAuth, requireAdmin, asyncHandler(async (req, res) => {
  try {
    const { status, type, search, sortBy, sortOrder, page = 1, limit = 10 } = req.query;
    
    let filter = {};
    
    // Apply filters
    if (type && type !== 'all') {
      // Case-insensitive exact match for type (e.g., 'bush' matches 'Bush')
      filter.type = { $regex: `^${type}$`, $options: 'i' };
    }
    
    if (search) {
      filter.name = { $regex: search, $options: 'i' };
    }

    let query = Product.find(filter);
    
    // Apply sorting
    if (sortBy) {
      const sortDirection = sortOrder === 'desc' ? -1 : 1;
      const sortObj = {};
      
      switch (sortBy) {
        case 'name':
          // Case-insensitive sorting for names
          query = query.collation({ locale: 'en', strength: 1 });
          sortObj.name = sortDirection;
          break;
        case 'price':
          sortObj.price = sortDirection;
          break;
        case 'total_stock':
          sortObj.total_stock = sortDirection;
          break;
        case 'available_stock':
          sortObj.available_stock = sortDirection;
          break;
        default:
          sortObj.createdAt = -1; // Default sort by newest first
      }
      
      query = query.sort(sortObj);
    } else {
      query = query.sort({ createdAt: -1 });
    }

    const products = await query.exec();
    
    // Transform products with enhanced stock information
    let stockData = products.map(product => {
      // Handle legacy products that may not have new stock fields
      const total_stock = product.total_stock !== undefined ? product.total_stock : (product.stock || 0);
      const available_stock = product.available_stock !== undefined ? product.available_stock : (product.stock || 0);
      const sold = total_stock - available_stock;
      
      // Determine status
      let productStatus = 'Out of Stock';
      let statusColor = 'red';
      
      if (available_stock > 5) {
        productStatus = 'In Stock';
        statusColor = 'green';
      } else if (available_stock >= 1) {
        productStatus = 'Low Stock';
        statusColor = 'yellow';
      }

      return {
        _id: product._id,
        name: product.name,
        type: product.type,
        category: product.category,
        description: product.description,
        price: product.price,
        total_stock,
        available_stock,
        sold,
        status: productStatus,
        statusColor,
        image: product.image,
        isActive: product.isActive,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt
      };
    });

    // Apply status filter after transformation
    if (status && status !== 'all') {
      stockData = stockData.filter(product => 
        product.status.toLowerCase() === status.toLowerCase()
      );
    }

    // Ensure correct sorting for derived stock fields (sort after mapping)
    if (sortBy === 'available_stock' || sortBy === 'total_stock') {
      const sortDirection = sortOrder === 'desc' ? -1 : 1;
      stockData.sort((a, b) => {
        const av = sortBy === 'available_stock' ? a.available_stock : a.total_stock;
        const bv = sortBy === 'available_stock' ? b.available_stock : b.total_stock;
        return (av - bv) * sortDirection;
      });
    }

    // Calculate summary statistics (before pagination)
    const totalItems = stockData.length;
    const summary = {
      total: totalItems,
      inStock: stockData.filter(p => p.status === 'In Stock').length,
      lowStock: stockData.filter(p => p.status === 'Low Stock').length,
      outOfStock: stockData.filter(p => p.status === 'Out of Stock').length,
      totalValue: stockData.reduce((sum, p) => sum + (p.price * p.available_stock), 0),
      totalInventoryItems: stockData.reduce((sum, p) => sum + p.available_stock, 0)
    };

    // Apply pagination
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;
    const paginatedProducts = stockData.slice(startIndex, endIndex);

    // Calculate pagination info
    const pagination = {
      currentPage: pageNum,
      totalPages: Math.ceil(totalItems / limitNum),
      totalItems: totalItems,
      itemsPerPage: limitNum,
      hasNextPage: endIndex < totalItems,
      hasPrevPage: pageNum > 1
    };

    res.json({ 
      success: true, 
      products: paginatedProducts,
      summary,
      pagination
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
}));

// POST /api/orders - Purchase products and update available_stock
router.post('/orders', requireAuth, asyncHandler(async (req, res) => {
  try {
    const { items, shippingAddress, notes } = req.body;
    const firebaseUid = req.user.uid;
    
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Order items are required' 
      });
    }

    if (!firebaseUid) {
      return res.status(401).json({
        success: false,
        message: 'User authentication required'
      });
    }

    // Get user document by Firebase UID to get MongoDB _id
    const user = await User.findOne({ firebaseUid });
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Validate stock availability and prepare order items
    let totalAmount = 0;
    const orderItems = [];
    const stockUpdates = [];

    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) {
        return res.status(404).json({ 
          success: false, 
          message: `Product not found: ${item.productId}` 
        });
      }

      // Check available stock
      const available = product.available_stock !== undefined ? product.available_stock : product.stock;
      if (available < item.quantity) {
        return res.status(400).json({ 
          success: false, 
          message: `Insufficient stock for ${product.name}. Available: ${available}, Requested: ${item.quantity}` 
        });
      }

      totalAmount += product.price * item.quantity;
      
      orderItems.push({
        product: product._id,
        name: product.name,
        priceAtOrder: product.price,
        quantity: item.quantity
      });

      stockUpdates.push({
        productId: product._id,
        quantity: item.quantity,
        product: product
      });
    }

    // Create order
    const order = await Order.create({
      user: user._id, // Use MongoDB ObjectId instead of Firebase UID
      items: orderItems,
      totalAmount,
      status: 'PENDING',
      shippingAddress: shippingAddress || {},
      payment: { method: 'COD', status: 'PENDING' },
      notes: notes || ''
    });

    // Update stock for each product
    for (const update of stockUpdates) {
      const product = update.product;
      
      if (product.available_stock !== undefined) {
        product.available_stock -= update.quantity;
      }
      
      // Always update legacy stock field for backward compatibility
      if (product.stock !== undefined) {
        product.stock -= update.quantity;
      } else {
        product.stock = product.available_stock;
      }
      
      await product.save();
    }

    // Populate order for response
    const populatedOrder = await Order.findById(order._id)
      .populate('user', 'firstName lastName email phone')
      .populate('items.product', 'name price image');

    res.status(201).json({ 
      success: true, 
      order: populatedOrder,
      message: 'Order created successfully and stock updated'
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
}));

// PUT /api/products/restock/:id - Restock product (increases both total_stock and available_stock)
router.put('/products/restock/:id', requireAuth, requireAdmin, asyncHandler(async (req, res) => {
  try {
    const { quantity, reason } = req.body;
    const productId = req.params.id;

    if (!quantity || quantity <= 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Restock quantity must be a positive number' 
      });
    }

    if (quantity > 100000) {
      return res.status(400).json({
        success: false,
        message: 'Restock quantity seems too large. Please verify the amount.'
      });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ 
        success: false, 
        message: 'Product not found' 
      });
    }

    // Store original values for audit
    const originalTotal = product.total_stock || product.stock || 0;
    const originalAvailable = product.available_stock !== undefined ? product.available_stock : product.stock || 0;

    // Update stock quantities
    product.total_stock = originalTotal + quantity;
    product.available_stock = originalAvailable + quantity;
    product.stock = product.available_stock; // Keep legacy field in sync

    const updatedProduct = await product.save();

    // Sync with Kottayam Hub (Main Hub)
    try {
      const kottayamHub = await Hub.findOne({ district: 'Kottayam' });
      if (kottayamHub) {
        let kottayamInventory = await HubInventory.findOne({
          hub: kottayamHub._id,
          product: productId
        });

        if (kottayamInventory) {
          // Update existing inventory
          kottayamInventory.quantity = updatedProduct.available_stock;
          await kottayamInventory.save();
          console.log(`✅ Synced ${product.name} inventory to Kottayam Hub: ${updatedProduct.available_stock}`);
        } else {
          // Create new inventory record
          await HubInventory.create({
            hub: kottayamHub._id,
            product: productId,
            quantity: updatedProduct.available_stock,
            reservedQuantity: 0
          });
          console.log(`✅ Created ${product.name} inventory in Kottayam Hub: ${updatedProduct.available_stock}`);
        }
      }
    } catch (hubSyncError) {
      console.error('⚠️ Failed to sync with Kottayam Hub:', hubSyncError);
      // Don't fail the whole operation if hub sync fails
    }

    // Log restock activity (in a real app, you might want to store this in a separate audit table)
    console.log(`Product Restocked: ${product.name} (ID: ${productId})`, {
      quantity,
      reason: reason || 'Admin restock',
      originalTotal,
      newTotal: updatedProduct.total_stock,
      originalAvailable,
      newAvailable: updatedProduct.available_stock,
      restockedBy: req.user.email,
      timestamp: new Date()
    });

    res.json({ 
      success: true, 
      product: updatedProduct.toDashboardJSON(),
      message: `Successfully restocked ${quantity} units of ${product.name}`,
      restockInfo: {
        quantity,
        previousTotal: originalTotal,
        newTotal: updatedProduct.total_stock,
        previousAvailable: originalAvailable,
        newAvailable: updatedProduct.available_stock
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
}));

// GET /api/products/:id/stock-history - Get stock history for a product
router.get('/products/:id/stock-history', requireAuth, requireAdmin, asyncHandler(async (req, res) => {
  try {
    const productId = req.params.id;
    
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // In a real implementation, you would fetch from a stock_history table
    // For now, we'll return current stock information
    const stockInfo = {
      productId: product._id,
      productName: product.name,
      currentStock: product.getStockInfo(),
      // This would be replaced with actual stock history from database
      history: [
        {
          date: product.createdAt,
          action: 'Initial Stock',
          quantity: product.total_stock,
          total_stock: product.total_stock,
          available_stock: product.available_stock,
          note: 'Product created'
        }
      ]
    };

    res.json({
      success: true,
      stockHistory: stockInfo
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
}));

// GET /api/admin/low-stock-alerts - Get products that need restocking
router.get('/admin/low-stock-alerts', requireAuth, requireAdmin, asyncHandler(async (req, res) => {
  try {
    const threshold = parseInt(req.query.threshold) || 5;
    
    const lowStockProducts = await Product.find({
      $or: [
        { available_stock: { $lte: threshold, $gte: 0 } },
        { 
          available_stock: { $exists: false },
          stock: { $lte: threshold, $gte: 0 }
        }
      ],
      isActive: true
    }).sort({ available_stock: 1, stock: 1 });

    const alerts = lowStockProducts.map(product => {
      const available = product.available_stock !== undefined ? product.available_stock : product.stock || 0;
      const total = product.total_stock || product.stock || 0;
      
      return {
        _id: product._id,
        name: product.name,
        type: product.type,
        available_stock: available,
        total_stock: total,
        sold: total - available,
        status: available === 0 ? 'Out of Stock' : 'Low Stock',
        statusColor: available === 0 ? 'red' : 'yellow',
        priority: available === 0 ? 'high' : 'medium',
        lastUpdated: product.updatedAt
      };
    });

    res.json({
      success: true,
      alerts,
      count: alerts.length,
      threshold
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
}));

export default router;