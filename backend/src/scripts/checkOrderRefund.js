/**
 * Check refund status from MongoDB database
 * 
 * Usage:
 * node backend/src/scripts/checkOrderRefund.js <order_id>
 * 
 * Example:
 * node backend/src/scripts/checkOrderRefund.js 507f1f77bcf86cd799439011
 */

require('dotenv').config();
const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pepper_db')
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  });

// Order Schema (simplified)
const orderSchema = new mongoose.Schema({}, { strict: false });
const Order = mongoose.model('Order', orderSchema);

async function checkOrderRefund(orderId) {
  try {
    console.log('\n🔍 Checking order refund status...\n');
    
    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      console.error('❌ Invalid Order ID format');
      console.log('💡 Order ID should be a 24-character hex string');
      process.exit(1);
    }

    // Find order
    const order = await Order.findById(orderId);
    
    if (!order) {
      console.error('❌ Order not found');
      process.exit(1);
    }

    console.log('📦 Order Details:\n');
    console.log(`Order ID: ${order._id}`);
    console.log(`Status: ${order.status}`);
    console.log(`Total Amount: ₹${order.totalAmount}`);
    console.log(`Created: ${new Date(order.createdAt).toLocaleString()}`);
    
    console.log('\n💳 Payment Details:\n');
    console.log(`Method: ${order.payment?.method || 'N/A'}`);
    console.log(`Status: ${order.payment?.status || 'N/A'}`);
    console.log(`Transaction ID: ${order.payment?.transactionId || 'N/A'}`);
    
    // Check refund information
    if (order.payment?.refundId) {
      console.log('\n✅ REFUND INFORMATION:\n');
      console.log(`Refund ID: ${order.payment.refundId}`);
      console.log(`Refund Amount: ₹${order.payment.refundAmount || 'N/A'}`);
      console.log(`Refund Status: ${order.payment.refundStatus || 'N/A'}`);
      console.log(`Initiated At: ${order.payment.refundInitiatedAt ? new Date(order.payment.refundInitiatedAt).toLocaleString() : 'N/A'}`);
      
      console.log('\n📊 Status Meanings:');
      console.log('  - PENDING: Refund initiated, processing');
      console.log('  - PROCESSED: Refund completed by Razorpay');
      console.log('  - FAILED: Refund failed, contact support');
      
      console.log('\n⏱️  Timeline: 5-7 business days for money to reach customer');
      
      // Calculate days since refund
      if (order.payment.refundInitiatedAt) {
        const daysSince = Math.floor((Date.now() - new Date(order.payment.refundInitiatedAt)) / (1000 * 60 * 60 * 24));
        console.log(`\n📅 Days since refund initiated: ${daysSince} days`);
        
        if (daysSince < 7) {
          console.log('✅ Within normal processing time');
        } else {
          console.log('⚠️  Beyond normal processing time - may need follow-up');
        }
      }
      
    } else {
      console.log('\nℹ️  No refund information found for this order');
      
      if (order.payment?.method === 'COD') {
        console.log('💡 This is a COD order - no refund needed');
      } else if (order.status === 'CANCELLED') {
        console.log('⚠️  Order is cancelled but no refund was processed');
        console.log('💡 Possible reasons:');
        console.log('   - Payment was not completed');
        console.log('   - Refund processing failed');
        console.log('   - Order was cancelled before payment');
      }
    }
    
    console.log('\n');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed\n');
  }
}

// List recent cancelled orders with refunds
async function listRecentRefunds(limit = 10) {
  try {
    console.log('\n📋 Recent Refunded Orders:\n');
    
    const orders = await Order.find({
      'payment.refundId': { $exists: true }
    })
    .sort({ 'payment.refundInitiatedAt': -1 })
    .limit(limit);
    
    if (orders.length === 0) {
      console.log('ℹ️  No refunded orders found');
      return;
    }
    
    console.log(`Found ${orders.length} refunded order(s):\n`);
    
    orders.forEach((order, index) => {
      console.log(`${index + 1}. Order ID: ${order._id}`);
      console.log(`   Amount: ₹${order.totalAmount}`);
      console.log(`   Refund ID: ${order.payment.refundId}`);
      console.log(`   Refund Status: ${order.payment.refundStatus}`);
      console.log(`   Initiated: ${new Date(order.payment.refundInitiatedAt).toLocaleString()}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed\n');
  }
}

// Main execution
const args = process.argv.slice(2);

if (args.length === 0) {
  console.log('\n❌ Missing order ID!\n');
  console.log('Usage:');
  console.log('  Check specific order:');
  console.log('    node checkOrderRefund.js <order_id>');
  console.log('');
  console.log('  List recent refunds:');
  console.log('    node checkOrderRefund.js --list');
  console.log('');
  console.log('Examples:');
  console.log('  node checkOrderRefund.js 507f1f77bcf86cd799439011');
  console.log('  node checkOrderRefund.js --list');
  console.log('');
  process.exit(1);
}

if (args[0] === '--list') {
  listRecentRefunds(args[1] ? parseInt(args[1]) : 10);
} else {
  checkOrderRefund(args[0]);
}