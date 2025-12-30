import mongoose from 'mongoose';
import Order from '../src/models/Order.js';

const orderId = '6944db34504bc6b33af658d1';

async function checkOrder() {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/pepper-delivery');
    console.log('✅ Connected to MongoDB');

    const order = await Order.findById(orderId)
      .populate('trackingTimeline.hub', 'name')
      .populate('currentHub', 'name');

    if (!order) {
      console.log('❌ Order not found');
      process.exit(1);
    }

    console.log('\n📦 Order Details:');
    console.log('ID:', order._id);
    console.log('Status:', order.status);
    console.log('Created:', order.createdAt);
    console.log('Current Hub:', order.currentHub?.name || 'None');

    console.log('\n📍 Tracking Timeline:');
    if (order.trackingTimeline && order.trackingTimeline.length > 0) {
      order.trackingTimeline.forEach((event, i) => {
        console.log(`${i + 1}. ${event.status} at ${event.hub?.name || event.location || 'unknown'}`);
        console.log(`   Timestamp: ${event.timestamp || event.createdAt || 'No timestamp'}`);
        console.log(`   Hub ID: ${event.hub?._id || 'No hub'}`);
        console.log('');
      });
    } else {
      console.log('⚠️ No tracking timeline events');
    }

    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkOrder();
