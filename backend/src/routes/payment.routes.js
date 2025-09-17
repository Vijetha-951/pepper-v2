import express from 'express';
import asyncHandler from 'express-async-handler';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import Cart from '../models/Cart.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import User from '../models/User.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// Initialize Razorpay (only if keys are provided)
let razorpay = null;
if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_ID !== 'your_razorpay_key_id') {
  razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
  });
}

// Create Razorpay order
router.post('/create-order', requireAuth, asyncHandler(async (req, res) => {
  if (!razorpay) {
    return res.status(503).json({ 
      success: false, 
      message: 'Payment gateway not configured. Please contact administrator.' 
    });
  }
  
  const userId = req.user.uid;

  // Get user's cart
  const cart = await Cart.findOne({ user: userId }).populate('items.product');
  if (!cart || cart.items.length === 0) {
    return res.status(400).json({ message: 'Cart is empty' });
  }

  // Verify stock for each product
  for (const item of cart.items) {
    if (!item.product) {
      return res.status(400).json({ message: 'Product not found in cart' });
    }
    
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
  const totalAmount = await cart.getCartTotal();

  try {
    // Create Razorpay order
    const options = {
      amount: totalAmount * 100, // Amount in paise
      currency: 'INR',
      receipt: `order_${userId}_${Date.now()}`,
      payment_capture: 1
    };

    const razorpayOrder = await razorpay.orders.create(options);

    res.status(200).json({
      order_id: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      key: process.env.RAZORPAY_KEY_ID,
      cart: cart
    });

  } catch (error) {
    console.error('Razorpay order creation error:', error);
    res.status(500).json({ message: 'Failed to create payment order' });
  }
}));

// Verify payment and create order
router.post('/verify', requireAuth, asyncHandler(async (req, res) => {
  const { 
    razorpay_payment_id, 
    razorpay_order_id, 
    razorpay_signature, 
    shippingAddress 
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
            $inc: { available_stock: -item.quantity }
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

      const order = new Order({
        user: userId,
        items: orderItems,
        totalAmount,
        status: 'PENDING',
        shippingAddress: shippingAddress || {},
        payment: {
          method: 'ONLINE',
          status: 'PAID',
          transactionId: razorpay_payment_id
        }
      });

      await order.save({ session });

      // Clear the cart
      await cart.clearCart();

      await session.commitTransaction();

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