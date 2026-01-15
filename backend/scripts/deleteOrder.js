import mongoose from 'mongoose';
import Order from '../src/models/Order.js';
import Notification from '../src/models/Notification.js';
import RestockRequest from '../src/models/RestockRequest.js';

async function deleteOrder() {
  try {
    await mongoose.connect('mongodb://localhost:27017/pepper-delivery');
    console.log('✅ Connected to MongoDB\n');

    const orderId = process.argv[2];
    if (!orderId) {
      console.log('❌ Please provide an order ID');
      console.log('Usage: node scripts/deleteOrder.js <orderId>');
      process.exit(1);
    }

    // Find the order first
    const order = await Order.findById(orderId);
    
    if (!order) {
      console.log('❌ Order not found');
      await mongoose.disconnect();
      process.exit(1);
    }

    console.log('📋 DELETING ORDER:');
    console.log(`Order ID: ${order._id}`);
    console.log(`Status: ${order.status}`);
    console.log('');

    // Delete related notifications
    const deletedNotifications = await Notification.deleteMany({
      'metadata.orderId': orderId
    });
    console.log(`✅ Deleted ${deletedNotifications.deletedCount} related notifications`);

    // Delete related restock requests
    const deletedRestockRequests = await RestockRequest.deleteMany({
      'orderDetails.orderId': orderId
    });
    console.log(`✅ Deleted ${deletedRestockRequests.deletedCount} related restock requests`);

    // Delete the order itself
    await Order.findByIdAndDelete(orderId);
    console.log(`✅ Deleted order ${orderId}`);

    console.log('\n✅ Order completely removed from system!');
    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error.message);
    await mongoose.disconnect();
    process.exit(1);
  }
}

deleteOrder();
