import '../src/config/env.js';
import mongoose from 'mongoose';
import connectDB from '../src/config/db.js';
import Order from '../src/models/Order.js';
import Hub from '../src/models/Hub.js';
import Product from '../src/models/Product.js';
import User from '../src/models/User.js';

const checkOrder = async () => {
  try {
    await connectDB();
    console.log('✅ Connected to MongoDB\n');

    const orderId = '69675e3bded7d118a9e42de8';
    
    const order = await Order.findById(orderId)
      .populate('collectionHub', 'name district')
      .populate('items.product', 'name')
      .populate('user', 'firstName lastName email');

    if (!order) {
      console.log('❌ Order not found!');
      process.exit(1);
    }

    console.log('📋 ORDER DETAILS:');
    console.log('================');
    console.log('Order ID:', order._id.toString());
    console.log('Status:', order.status);
    console.log('Delivery Type:', order.deliveryType);
    console.log('Collection Hub:', order.collectionHub?.name);
    console.log('Customer:', order.user?.firstName, order.user?.lastName);
    console.log('Total Amount:', order.totalAmount);
    console.log('Payment Method:', order.payment?.method);
    console.log('Payment Status:', order.payment?.status);
    console.log('\n📦 ITEMS:');
    order.items.forEach((item, idx) => {
      console.log(`  ${idx + 1}. ${item.name || item.product?.name} - Qty: ${item.quantity}`);
    });
    
    console.log('\n🕐 TRACKING TIMELINE:');
    order.trackingTimeline.forEach((event, idx) => {
      console.log(`  ${idx + 1}. ${event.status} - ${event.description} (${new Date(event.timestamp).toLocaleString()})`);
    });

    console.log('\n✅ Done!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

checkOrder();
