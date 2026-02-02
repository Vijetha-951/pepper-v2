import express from 'express';
import asyncHandler from 'express-async-handler';
import fs from 'fs';
import Order from '../models/Order.js';
import User from '../models/User.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { generateInvoice, getInvoicePath, invoiceExists } from '../services/invoiceService.js';

const router = express.Router();

/**
 * @route   GET /api/invoices/:orderId
 * @desc    Get invoice PDF for an order (for customers - their own orders)
 * @access  Private (Authenticated users)
 */
router.get('/:orderId', requireAuth, asyncHandler(async (req, res) => {
  const { orderId } = req.params;

  console.log('📄 Invoice request for order:', orderId);
  console.log('👤 Request user:', { uid: req.user.uid, email: req.user.email, role: req.userRole });

  // Find the order
  const order = await Order.findById(orderId)
    .populate('user', 'firstName lastName email firebaseUid')
    .populate('items.product', 'name')
    .populate('collectionHub', 'name address');

  if (!order) {
    console.log('❌ Order not found:', orderId);
    return res.status(404).json({ message: 'Order not found' });
  }

  console.log('📦 Order found:', {
    orderId: order._id,
    userEmail: order.user?.email,
    userFirebaseUid: order.user?.firebaseUid,
    paymentMethod: order.payment?.method,
    paymentStatus: order.payment?.status
  });

  // Check if user owns this order (match by Firebase UID or email)
  const userOwnsOrder = 
    order.user?.firebaseUid === req.user.uid || 
    order.user?.email === req.user.email;

  console.log('🔐 User owns order:', userOwnsOrder);

  // Admins can access any invoice
  if (!userOwnsOrder && req.userRole !== 'admin') {
    console.log('❌ User not authorized to access this invoice');
    return res.status(403).json({ message: 'Not authorized to access this invoice' });
  }

  try {
    let invoicePath = getInvoicePath(orderId);

    // Always regenerate invoice to ensure latest data
    console.log(`Regenerating invoice for order ${orderId}...`);
    console.log('👤 User data:', { 
      firstName: order.user?.firstName, 
      lastName: order.user?.lastName, 
      email: order.user?.email 
    });
    
    // Delete old invoice if exists
    if (fs.existsSync(invoicePath)) {
      fs.unlinkSync(invoicePath);
      console.log('🗑️ Deleted old invoice');
    }
    
    invoicePath = await generateInvoice(order);
    console.log('✅ New invoice generated');

    // Check if file exists
    if (!fs.existsSync(invoicePath)) {
      return res.status(404).json({ message: 'Invoice file not found' });
    }

    // Set headers for PDF download
    const invoiceNumber = `INV-${orderId.toString().slice(-8).toUpperCase()}`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${invoiceNumber}.pdf"`);

    // Stream the PDF file
    const fileStream = fs.createReadStream(invoicePath);
    fileStream.pipe(res);

  } catch (error) {
    console.error('Error generating/sending invoice:', error);
    res.status(500).json({ message: 'Failed to generate invoice', error: error.message });
  }
}));

/**
 * @route   GET /api/invoices/admin/:orderId
 * @desc    Get invoice PDF for any order (for admins)
 * @access  Private (Admin)
 */
router.get('/admin/:orderId', requireAuth, requireAdmin, asyncHandler(async (req, res) => {
  const { orderId } = req.params;

  console.log('📄 Admin invoice request for order:', orderId);
  console.log('👤 Admin user:', { uid: req.user.uid, email: req.user.email, role: req.userRole });

  // Find the order
  const order = await Order.findById(orderId)
    .populate('user', 'firstName lastName email')
    .populate('items.product', 'name')
    .populate('collectionHub', 'name address');

  if (!order) {
    console.log('❌ Order not found:', orderId);
    return res.status(404).json({ message: 'Order not found' });
  }

  console.log('📦 Order found for admin:', order._id);

  try {
    let invoicePath = getInvoicePath(orderId);

    // Always regenerate invoice to ensure latest data
    console.log(`Regenerating admin invoice for order ${orderId}...`);
    console.log('👤 User data:', { 
      firstName: order.user?.firstName, 
      lastName: order.user?.lastName, 
      email: order.user?.email 
    });
    
    // Delete old invoice if exists
    if (fs.existsSync(invoicePath)) {
      fs.unlinkSync(invoicePath);
      console.log('🗑️ Deleted old invoice');
    }
    
    invoicePath = await generateInvoice(order);
    console.log('✅ New invoice generated');

    // Check if file exists
    if (!fs.existsSync(invoicePath)) {
      return res.status(404).json({ message: 'Invoice file not found' });
    }

    // Set headers for PDF download
    const invoiceNumber = `INV-${orderId.toString().slice(-8).toUpperCase()}`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${invoiceNumber}.pdf"`);

    // Stream the PDF file
    const fileStream = fs.createReadStream(invoicePath);
    fileStream.pipe(res);

  } catch (error) {
    console.error('Error generating/sending invoice:', error);
    res.status(500).json({ message: 'Failed to generate invoice', error: error.message });
  }
}));

/**
 * @route   POST /api/invoices/regenerate/:orderId
 * @desc    Regenerate invoice for an order (for admins)
 * @access  Private (Admin)
 */
router.post('/regenerate/:orderId', requireAdmin, asyncHandler(async (req, res) => {
  const { orderId } = req.params;

  // Find the order
  const order = await Order.findById(orderId)
    .populate('user', 'firstName lastName email')
    .populate('items.product', 'name');

  if (!order) {
    return res.status(404).json({ message: 'Order not found' });
  }

  try {
    // Delete existing invoice if it exists
    const invoicePath = getInvoicePath(orderId);
    if (fs.existsSync(invoicePath)) {
      fs.unlinkSync(invoicePath);
      console.log(`Deleted existing invoice for order ${orderId}`);
    }

    // Generate new invoice
    const newInvoicePath = await generateInvoice(order);
    const invoiceNumber = `INV-${orderId.toString().slice(-8).toUpperCase()}`;

    res.json({
      success: true,
      message: 'Invoice regenerated successfully',
      invoiceNumber,
      orderId
    });

  } catch (error) {
    console.error('Error regenerating invoice:', error);
    res.status(500).json({ message: 'Failed to regenerate invoice', error: error.message });
  }
}));

/**
 * @route   GET /api/invoices/preview/:orderId
 * @desc    Preview invoice in browser (for admins)
 * @access  Private (Admin)
 */
router.get('/preview/:orderId', requireAdmin, asyncHandler(async (req, res) => {
  const { orderId } = req.params;

  // Find the order
  const order = await Order.findById(orderId)
    .populate('user', 'firstName lastName email')
    .populate('items.product', 'name');

  if (!order) {
    return res.status(404).json({ message: 'Order not found' });
  }

  try {
    let invoicePath = getInvoicePath(orderId);

    // Generate invoice if it doesn't exist
    if (!invoiceExists(orderId)) {
      console.log(`Generating invoice for order ${orderId}...`);
      invoicePath = await generateInvoice(order);
    }

    // Check if file exists
    if (!fs.existsSync(invoicePath)) {
      return res.status(404).json({ message: 'Invoice file not found' });
    }

    // Set headers for inline viewing (not download)
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline');

    // Stream the PDF file
    const fileStream = fs.createReadStream(invoicePath);
    fileStream.pipe(res);

  } catch (error) {
    console.error('Error previewing invoice:', error);
    res.status(500).json({ message: 'Failed to preview invoice', error: error.message });
  }
}));

export default router;
