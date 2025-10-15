import '../config/env.js';
import mongoose from 'mongoose';
import Order from '../models/Order.js';
import { processOrderRefund } from '../services/refundService.js';

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Test refund service
const testRefundService = async () => {
  try {
    console.log('\n🧪 Testing Refund Service...\n');

    // Find a PAID order with ONLINE payment
    const order = await Order.findOne({
      'payment.method': 'ONLINE',
      'payment.status': 'PAID',
      'status': { $in: ['PENDING', 'APPROVED'] }
    });

    if (!order) {
      console.log('⚠️ No eligible orders found for testing');
      console.log('📝 To test refunds, you need an order with:');
      console.log('   - Payment method: ONLINE');
      console.log('   - Payment status: PAID');
      console.log('   - Order status: PENDING or APPROVED');
      console.log('   - Valid transaction ID');
      return;
    }

    console.log('📦 Found test order:');
    console.log('   Order ID:', order._id);
    console.log('   Total Amount:', order.totalAmount);
    console.log('   Payment Method:', order.payment.method);
    console.log('   Payment Status:', order.payment.status);
    console.log('   Transaction ID:', order.payment.transactionId);
    console.log('\n🔄 Processing refund...\n');

    // Process refund
    const result = await processOrderRefund(order);

    if (result.success) {
      console.log('✅ REFUND SUCCESSFUL!');
      console.log('   Refund ID:', result.refundId);
      console.log('   Amount:', result.amount);
      console.log('   Status:', result.status);
      console.log('   Message:', result.message);
      console.log('\n⚠️ NOTE: This was a real refund! The amount will be credited back.');
      console.log('   Check Razorpay dashboard: https://dashboard.razorpay.com');
    } else {
      console.log('❌ REFUND FAILED');
      console.log('   Error:', result.error);
      console.log('   Code:', result.code);
    }

  } catch (error) {
    console.error('❌ Test error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Test completed. Database connection closed.');
  }
};

// Run test
(async () => {
  await connectDB();
  await testRefundService();
})();