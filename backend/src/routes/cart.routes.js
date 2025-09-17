import express from 'express';
import asyncHandler from 'express-async-handler';
import Cart from '../models/Cart.js';
import Product from '../models/Product.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// Add to cart
router.post('/', requireAuth, asyncHandler(async (req, res) => {
  const { product_id, quantity } = req.body;
  const userId = req.user.uid;

  if (!product_id || !quantity || quantity < 1) {
    return res.status(400).json({ message: 'Product ID and valid quantity are required' });
  }

  // Check if product exists and has enough stock
  const product = await Product.findById(product_id);
  if (!product) {
    return res.status(404).json({ message: 'Product not found' });
  }

  const availableStock = product.available_stock !== undefined ? product.available_stock : product.stock;
  if (availableStock < quantity) {
    return res.status(400).json({ 
      message: `Not enough stock for ${product.name}. Available: ${availableStock}` 
    });
  }

  // Find or create cart for user
  let cart = await Cart.findOne({ user: userId });
  if (!cart) {
    cart = new Cart({ user: userId, items: [] });
  }

  // Check if product already in cart
  const existingItemIndex = cart.items.findIndex(item => item.product.toString() === product_id);
  
  if (existingItemIndex >= 0) {
    // Update quantity
    const newQuantity = cart.items[existingItemIndex].quantity + quantity;
    if (newQuantity > availableStock) {
      return res.status(400).json({ 
        message: `Not enough stock for ${product.name}. Available: ${availableStock}` 
      });
    }
    cart.items[existingItemIndex].quantity = newQuantity;
  } else {
    // Add new item
    cart.items.push({ product: product_id, quantity });
  }

  await cart.save();
  await cart.populate('items.product');

  res.status(200).json({
    message: 'Product added to cart successfully',
    cart
  });
}));

// Get user's cart
router.get('/:user_id', requireAuth, asyncHandler(async (req, res) => {
  const { user_id } = req.params;

  // Ensure user can only access their own cart (or admin)
  if (req.user.uid !== user_id && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied' });
  }

  const cart = await Cart.findOne({ user: user_id }).populate({
    path: 'items.product',
    select: 'name price available_stock stock image'
  });

  if (!cart) {
    return res.status(200).json({ items: [], total: 0 });
  }

  // Calculate subtotals and total
  const cartWithSubtotals = {
    ...cart.toObject(),
    items: cart.items.map(item => ({
      ...item.toObject(),
      subtotal: item.product ? item.product.price * item.quantity : 0
    }))
  };

  const total = await cart.getCartTotal();

  res.status(200).json({
    ...cartWithSubtotals,
    total
  });
}));

// Update cart item quantity
router.put('/item/:product_id', requireAuth, asyncHandler(async (req, res) => {
  const { product_id } = req.params;
  const { quantity } = req.body;
  const userId = req.user.uid;

  if (!quantity || quantity < 0) {
    return res.status(400).json({ message: 'Valid quantity is required' });
  }

  const cart = await Cart.findOne({ user: userId });
  if (!cart) {
    return res.status(404).json({ message: 'Cart not found' });
  }

  const itemIndex = cart.items.findIndex(item => item.product.toString() === product_id);
  if (itemIndex === -1) {
    return res.status(404).json({ message: 'Item not found in cart' });
  }

  if (quantity === 0) {
    // Remove item from cart
    cart.items.splice(itemIndex, 1);
  } else {
    // Check stock availability
    const product = await Product.findById(product_id);
    const availableStock = product.available_stock !== undefined ? product.available_stock : product.stock;
    
    if (quantity > availableStock) {
      return res.status(400).json({ 
        message: `Not enough stock for ${product.name}. Available: ${availableStock}` 
      });
    }
    
    cart.items[itemIndex].quantity = quantity;
  }

  await cart.save();
  await cart.populate('items.product');

  const total = await cart.getCartTotal();

  res.status(200).json({
    message: 'Cart updated successfully',
    cart,
    total
  });
}));

// Remove item from cart
router.delete('/item/:product_id', requireAuth, asyncHandler(async (req, res) => {
  const { product_id } = req.params;
  const userId = req.user.uid;

  const cart = await Cart.findOne({ user: userId });
  if (!cart) {
    return res.status(404).json({ message: 'Cart not found' });
  }

  cart.items = cart.items.filter(item => item.product.toString() !== product_id);
  await cart.save();

  res.status(200).json({
    message: 'Item removed from cart successfully',
    cart
  });
}));

// Clear entire cart
router.delete('/', requireAuth, asyncHandler(async (req, res) => {
  const userId = req.user.uid;

  const cart = await Cart.findOne({ user: userId });
  if (!cart) {
    return res.status(404).json({ message: 'Cart not found' });
  }

  await cart.clearCart();

  res.status(200).json({
    message: 'Cart cleared successfully'
  });
}));

export default router;