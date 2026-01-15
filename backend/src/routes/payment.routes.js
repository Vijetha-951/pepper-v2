import '../config/env.js'; // Load environment variables first
import express from 'express';
import asyncHandler from 'express-async-handler';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import Cart from '../models/Cart.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import User from '../models/User.js';
import Hub from '../models/Hub.js';
import HubInventory from '../models/HubInventory.js';
import RestockRequest from '../models/RestockRequest.js';
import { requireAuth } from '../middleware/auth.js';
import { sendPaymentSuccessEmail } from '../services/emailService.js';
import { planRoute } from '../services/logisticsService.js';
import { createOrderPlacedNotification, createRestockRequestNotification } from '../services/notificationService.js';

const router = express.Router();

// Test endpoint to check Razorpay configuration
router.get('/test-config', (req, res) => {
  res.json({
    razorpayConfigured: !!razorpay,
    keyIdExists: !!process.env.RAZORPAY_KEY_ID,
    keySecretExists: !!process.env.RAZORPAY_KEY_SECRET,
    keyId: process.env.RAZORPAY_KEY_ID ? process.env.RAZORPAY_KEY_ID.substring(0, 8) + '...' : 'not set'
  });
});

// Initialize Razorpay (only if keys are provided)
console.log('🔑 Razorpay Key ID from env:', process.env.RAZORPAY_KEY_ID);
console.log('🔑 Razorpay Key Secret exists:', !!process.env.RAZORPAY_KEY_SECRET);

let razorpay = null;
if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_ID !== 'your_razorpay_key_id') {
  razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
  });
  console.log('✅ Razorpay initialized successfully');
} else {
  console.log('❌ Razorpay NOT initialized - Key ID:', process.env.RAZORPAY_KEY_ID);
}

// Create Razorpay order
router.post('/create-order', requireAuth, asyncHandler(async (req, res) => {
  console.log('🚀 Create order endpoint hit');
  console.log('👤 User ID:', req.user?.uid);
  console.log('🔧 Razorpay instance exists:', !!razorpay);
  
  if (!razorpay) {
    console.log('❌ Razorpay not initialized!');
    return res.status(503).json({ 
      success: false, 
      message: 'Payment gateway not configured. Please contact administrator.' 
    });
  }
  
  const userId = req.user.uid;
  const { isHubCollection, collectionHubId, items: hubCollectionItems } = req.body;

  let totalAmount = 0;
  let cart = null;

  // Hub Collection flow
  if (isHubCollection && collectionHubId && hubCollectionItems) {
    console.log('📍 Hub Collection order creation');
    
    // Validate and calculate total for hub collection items
    for (const item of hubCollectionItems) {
      const product = await Product.findById(item.productId);
      if (!product) {
        return res.status(400).json({ 
          message: `Product not found: ${item.productId}` 
        });
      }
      
      const availableStock = product.available_stock !== undefined 
        ? product.available_stock 
        : product.stock;
      
      if (availableStock < item.quantity) {
        return res.status(400).json({
          message: `Not enough stock for ${product.name}. Available: ${availableStock}, Required: ${item.quantity}`
        });
      }
      
      totalAmount += product.price * item.quantity;
    }
  } else {
    // Regular order flow - Get user's cart
    cart = await Cart.findOne({ user: userId }).populate('items.product');
  
    console.log('📦 Cart found:', !!cart);
    console.log('📦 Cart items count:', cart?.items?.length || 0);
    console.log('📦 Cart items:', JSON.stringify(cart?.items, null, 2));
  
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: 'Cart is empty' });
    }

    // Filter out items where product no longer exists (was deleted)
    const validItems = cart.items.filter(item => item.product !== null);
    const removedItemsCount = cart.items.length - validItems.length;
  
    // If some products were removed, clean up the cart
    if (removedItemsCount > 0) {
      cart.items = validItems;
      await cart.save();
    
      if (validItems.length === 0) {
        return res.status(400).json({ 
          message: 'All products in your cart have been removed from the store. Please add new products.' 
        });
      }
    
      // Continue with valid items but inform user
      console.log(`⚠️ Removed ${removedItemsCount} invalid items from cart`);
    }

    // Verify stock for each valid product
    for (const item of validItems) {
      console.log('🔍 Checking item:', item);
      console.log('🔍 Product exists:', !!item.product);
    
      const availableStock = item.product.available_stock !== undefined 
        ? item.product.available_stock 
        : item.product.stock;
    
      if (availableStock < item.quantity) {
        return res.status(400).json({
          message: `Not enough stock for ${item.product.name}. Available: ${availableStock}, Required: ${item.quantity}`
        });
      }
    }

    // Calculate total amount
    try {
      totalAmount = await cart.getCartTotal();
      console.log('💰 Total amount calculated:', totalAmount);
    } catch (error) {
      console.error('❌ Error calculating cart total:', error);
      return res.status(500).json({ message: 'Failed to calculate cart total' });
    }
  }

  if (!totalAmount || totalAmount <= 0) {
    return res.status(400).json({ message: 'Invalid cart total amount' });
  }

  try {
    // Create Razorpay order
    // Generate a short receipt ID (max 40 chars for Razorpay)
    // Use first 8 chars of userId + timestamp (last 10 digits)
    const shortUserId = userId.substring(0, 8);
    const timestamp = Date.now().toString().slice(-10);
    const receiptId = `ord_${shortUserId}_${timestamp}`;
    
    const options = {
      amount: Math.round(totalAmount * 100), // Amount in paise (ensure it's an integer)
      currency: 'INR',
      receipt: receiptId, // Max 40 characters
      payment_capture: 1
    };

    console.log('📝 Creating Razorpay order with options:', options);
    console.log('📝 Receipt ID length:', receiptId.length);
    const razorpayOrder = await razorpay.orders.create(options);
    console.log('✅ Razorpay order created:', razorpayOrder.id);

    res.status(200).json({
      order_id: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      key: process.env.RAZORPAY_KEY_ID,
      cart: cart
    });

  } catch (error) {
    console.error('❌ Razorpay order creation error:', error);
    console.error('❌ Error details:', error.message);
    console.error('❌ Error stack:', error.stack);
    console.error('❌ Error response:', error.error);
    
    // Return detailed error in development
    res.status(500).json({ 
      message: 'Failed to create payment order',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      details: process.env.NODE_ENV === 'development' ? {
        errorType: error.constructor.name,
        errorCode: error.code,
        errorDescription: error.description,
        statusCode: error.statusCode
      } : undefined
    });
  }
}));

// Verify payment and create order
router.post('/verify', requireAuth, asyncHandler(async (req, res) => {
  const { 
    razorpay_payment_id, 
    razorpay_order_id, 
    razorpay_signature, 
    shippingAddress,
    isHubCollection,
    collectionHubId
  } = req.body;
  const userId = req.user.uid;

  // Verify Razorpay signature
  const body = razorpay_order_id + '|' + razorpay_payment_id;
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(body.toString())
    .digest('hex');

  if (expectedSignature !== razorpay_signature) {
    return res.status(400).json({ message: 'Invalid payment signature' });
  }

  try {
    // Get user document by Firebase UID to get MongoDB _id
    const user = await User.findOne({ firebaseUid: userId });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Hub Collection Order Flow
    if (isHubCollection && collectionHubId) {
      console.log('📍 Processing hub collection order payment verification');
      
      // Get user's cart for hub collection items
      const cart = await Cart.findOne({ user: userId }).populate('items.product');
      if (!cart || cart.items.length === 0) {
        return res.status(400).json({ message: 'Cart is empty' });
      }

      // Get hub
      const collectionHub = await Hub.findById(collectionHubId);
      if (!collectionHub) {
        return res.status(404).json({ message: 'Collection hub not found' });
      }

      // Check hub inventory and create order items
      const orderItems = [];
      const unavailableItems = [];
      const restockNeeded = [];
      let totalAmount = 0;

      for (const item of cart.items) {
        const product = item.product;
        
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

      // Create hub collection order
      const order = new Order({
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
        payment: {
          method: 'ONLINE',
          status: 'PAID',
          transactionId: razorpay_payment_id
        },
        notes: '',
        trackingTimeline: [{
          status: 'ORDER_PLACED',
          location: collectionHub.name,
          hub: collectionHub._id,
          timestamp: new Date(),
          description: `Order placed for collection at ${collectionHub.name}`
        }]
      });

      await order.save();

      // If all items available, reserve them
      if (unavailableItems.length === 0) {
        // Group items by product to avoid saving same document multiple times
        const productQuantities = {};
        for (const item of orderItems) {
          const productId = item.product.toString();
          productQuantities[productId] = (productQuantities[productId] || 0) + item.quantity;
        }
        
        // Reserve inventory for each unique product
        for (const [productId, totalQuantity] of Object.entries(productQuantities)) {
          const hubInventory = await HubInventory.findOne({
            hub: collectionHubId,
            product: productId
          });
          
          if (hubInventory) {
            await hubInventory.reserveQuantity(totalQuantity);
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
            reason: `Order #${order._id} - Stock unavailable (Online Payment)`,
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

      await order.populate('collectionHub', 'name district');
      await order.populate('items.product', 'name image price');

      // Clear the cart
      await cart.clearCart();

      // Send notification to hub manager (non-blocking)
      if (collectionHub) {
        createOrderPlacedNotification(order, collectionHub).catch(err => {
          console.error('Failed to create hub notification:', err);
        });
      }

      // Send payment success email
      sendPaymentSuccessEmail({
        to: user.email,
        userName: user.name || `${user.firstName} ${user.lastName}`,
        order: order,
        paymentId: razorpay_payment_id
      }).catch(err => console.error('Email sending failed:', err));

      return res.status(200).json({
        success: true,
        message: 'Hub collection order placed successfully',
        order
      });
    }

    // Regular Home Delivery Order Flow
    // Get user's cart
    const cart = await Cart.findOne({ user: userId }).populate('items.product');
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: 'Cart is empty' });
    }

    // Final stock verification before processing
    for (const item of cart.items) {
      const product = await Product.findById(item.product._id);
      const availableStock = product.available_stock !== undefined 
        ? product.available_stock 
        : product.stock;
      
      if (availableStock < item.quantity) {
        return res.status(400).json({
          message: `Not enough stock for ${product.name}. Available: ${availableStock}`
        });
      }
    }

    // Start transaction-like operations
    const session = await Product.startSession();
    session.startTransaction();

    try {
      // Deduct stock for each product
      for (const item of cart.items) {
        await Product.findByIdAndUpdate(
          item.product._id,
          {
            $inc: { 
              available_stock: -item.quantity,
              stock: -item.quantity  // Keep legacy stock field in sync
            }
          },
          { session }
        );
      }

      // Create order
      const orderItems = cart.items.map(item => ({
        product: item.product._id,
        name: item.product.name,
        priceAtOrder: item.product.price,
        quantity: item.quantity
      }));

      const totalAmount = await cart.getCartTotal();

      // Plan Route
      const route = await planRoute(shippingAddress?.pincode, shippingAddress?.district);
      const initialHub = route.length > 0 ? route[0] : null;

      const order = new Order({
        user: user._id, // Use MongoDB ObjectId instead of Firebase UID
        items: orderItems,
        totalAmount,
        status: 'PENDING',
        shippingAddress: shippingAddress || {},
        payment: {
          method: 'ONLINE',
          status: 'PAID',
          transactionId: razorpay_payment_id
        },
        route: route,
        currentHub: initialHub,
        trackingTimeline: initialHub ? [{
          status: 'ORDER_PLACED',
          location: 'Warehouse', // Assuming first hub is warehouse
          hub: initialHub,
          description: 'Order placed and assigned to route'
        }] : []
      });

      await order.save({ session });

      // Clear the cart
      await cart.clearCart();

      await session.commitTransaction();

      // Populate product details for the response
      await order.populate('items.product', 'name image price');

      // Send payment success email (non-blocking)
      sendPaymentSuccessEmail({
        to: user.email,
        userName: user.name || `${user.firstName} ${user.lastName}`,
        order: order,
        paymentId: razorpay_payment_id
      }).catch(err => {
        console.error('Failed to send payment success email:', err);
        // Don't fail the request if email fails
      });

      // Create notification for hub manager (non-blocking)
      if (initialHub) {
        const populatedOrder = await Order.findById(order._id).populate('user', 'firstName lastName email');
        createOrderPlacedNotification(populatedOrder, initialHub).catch(err => {
          console.error('Failed to create hub notification:', err);
        });
      }

      res.status(200).json({
        message: 'Payment verified and order created successfully',
        order: order,
        payment_id: razorpay_payment_id
      });

    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }

  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({ message: 'Failed to process payment' });
  }
}));

export default router;