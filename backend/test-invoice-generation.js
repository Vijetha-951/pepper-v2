/**
 * Test Invoice Generation System
 * 
 * This script tests the invoice generation functionality
 * Run with: node test-invoice-generation.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import Order from './src/models/Order.js';
import User from './src/models/User.js';
import Product from './src/models/Product.js';
import { generateInvoice, invoiceExists, getInvoicePath } from './src/services/invoiceService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/pepper-db';

async function testInvoiceGeneration() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find a completed order with user and items
    console.log('🔍 Finding a sample order...');
    const order = await Order.findOne({
      $or: [
        { 'payment.status': 'PAID' },
        { 'payment.method': 'COD' }
      ]
    })
      .populate('user', 'firstName lastName email')
      .populate('items.product', 'name price')
      .limit(1);

    if (!order) {
      console.log('❌ No orders found. Please create an order first.');
      console.log('💡 Tip: Place an order through the frontend or use the seed script.');
      return;
    }

    console.log('✅ Found order:', order._id);
    console.log('   Customer:', order.user?.email || 'N/A');
    console.log('   Items:', order.items.length);
    console.log('   Total:', `₹${order.totalAmount.toFixed(2)}`);
    console.log('   Payment:', order.payment?.method || 'N/A');
    console.log();

    // Check if invoice already exists
    const invoicePath = getInvoicePath(order._id);
    console.log('📄 Invoice path:', invoicePath);
    
    if (invoiceExists(order._id)) {
      console.log('ℹ️  Invoice already exists');
    } else {
      console.log('ℹ️  Invoice does not exist, will generate...');
    }
    console.log();

    // Generate invoice
    console.log('🎨 Generating PDF invoice...');
    const generatedPath = await generateInvoice(order);
    console.log('✅ Invoice generated successfully!');
    console.log('📁 File saved at:', generatedPath);
    console.log();

    // Verify the file exists
    if (invoiceExists(order._id)) {
      console.log('✅ Invoice file verified');
      const invoiceNumber = `INV-${order._id.toString().slice(-8).toUpperCase()}`;
      console.log('📋 Invoice Number:', invoiceNumber);
      console.log();
      console.log('🎉 SUCCESS! The invoice system is working correctly.');
      console.log();
      console.log('📌 Next Steps:');
      console.log('   1. Check the generated PDF in: backend/invoices/');
      console.log('   2. Test the API endpoint: GET /api/invoices/' + order._id);
      console.log('   3. Place a new order to test automatic email attachment');
    } else {
      console.log('❌ Invoice file not found after generation');
    }

  } catch (error) {
    console.error('❌ Error testing invoice generation:', error);
    console.error(error.stack);
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Disconnected from MongoDB');
  }
}

// Run the test
console.log('========================================');
console.log('  INVOICE GENERATION TEST');
console.log('========================================\n');

testInvoiceGeneration();
