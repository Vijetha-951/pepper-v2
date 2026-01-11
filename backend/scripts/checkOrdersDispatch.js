import mongoose from 'mongoose';
import Order from '../src/models/Order.js';
import User from '../src/models/User.js';
import Hub from '../src/models/Hub.js';
import dotenv from 'dotenv';

dotenv.config();

const orderIds = ['695b44fe6c949741fa307071', '69479b5588025d32efd1a720'];

async function checkOrders() {
  try {
    const uri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/pepper-delivery';
    await mongoose.connect(uri);
    console.log('✅ Connected to MongoDB\n');

    for (const orderId of orderIds) {
      console.log('='.repeat(70));
      console.log(`📦 Checking Order: ${orderId}`);
      console.log('='.repeat(70));

      const order = await Order.findById(orderId)
        .populate('user', 'firstName lastName email phone')
        .populate('currentHub', 'name district type')
        .populate('deliveryBoy', 'firstName lastName email phone')
        .populate('route', 'name district type order')
        .lean();

      if (!order) {
        console.log(`❌ Order not found: ${orderId}\n`);
        continue;
      }

      console.log('\n📋 Order Details:');
      console.log(`   ID: ${order._id}`);
      console.log(`   Status: ${order.status}`);
      console.log(`   Delivery Status: ${order.deliveryStatus || 'N/A'}`);
      console.log(`   Total Amount: ₹${order.totalAmount}`);
      console.log(`   Created: ${order.createdAt}`);

      console.log('\n👤 Customer:');
      if (order.user) {
        console.log(`   Name: ${order.user.firstName || ''} ${order.user.lastName || ''}`);
        console.log(`   Email: ${order.user.email}`);
      } else {
        console.log(`   ❌ No user found`);
      }

      console.log('\n📍 Shipping Address:');
      console.log(`   District: ${order.shippingAddress?.district || 'N/A'}`);
      console.log(`   Address: ${order.shippingAddress?.line1 || 'N/A'}`);
      console.log(`   Pincode: ${order.shippingAddress?.pincode || 'N/A'}`);

      console.log('\n🏢 Current Hub:');
      if (order.currentHub) {
        console.log(`   Name: ${order.currentHub.name}`);
        console.log(`   District: ${order.currentHub.district}`);
        console.log(`   Type: ${order.currentHub.type}`);
      } else {
        console.log(`   ❌ No current hub assigned`);
      }

      console.log('\n🚚 Delivery Boy:');
      if (order.deliveryBoy) {
        console.log(`   Name: ${order.deliveryBoy.firstName || ''} ${order.deliveryBoy.lastName || ''}`);
        console.log(`   Email: ${order.deliveryBoy.email}`);
      } else {
        console.log(`   ❌ No delivery boy assigned`);
      }

      console.log('\n🛣️  Route:');
      if (order.route && order.route.length > 0) {
        order.route.forEach((hub, index) => {
          const isCurrent = order.currentHub && hub._id.toString() === order.currentHub._id.toString();
          console.log(`   ${index + 1}. ${hub.name} (${hub.district}) - ${hub.type} ${isCurrent ? '← CURRENT' : ''}`);
        });
      } else {
        console.log(`   ❌ No route defined`);
      }

      console.log('\n📍 Tracking Timeline:');
      if (order.trackingTimeline && order.trackingTimeline.length > 0) {
        order.trackingTimeline.forEach((event, i) => {
          const time = event.timestamp || event.createdAt || 'N/A';
          console.log(`   ${i + 1}. ${event.status} - ${event.location || 'N/A'}`);
          console.log(`      Time: ${time}`);
          if (event.description) console.log(`      Description: ${event.description}`);
        });
      } else {
        console.log(`   ⚠️  No tracking events`);
      }

      // Check why it can't be dispatched
      console.log('\n🔍 Dispatch Analysis:');
      const issues = [];

      if (!order.currentHub) {
        issues.push('❌ No current hub assigned');
      }

      if (!order.route || order.route.length === 0) {
        issues.push('❌ No delivery route defined');
      }

      if (order.status === 'CANCELLED') {
        issues.push('❌ Order is cancelled');
      }

      if (order.status === 'DELIVERED') {
        issues.push('❌ Order is already delivered');
      }

      if (order.status === 'OUT_FOR_DELIVERY') {
        issues.push('❌ Order is already out for delivery');
      }

      // Check if already dispatched from current hub
      if (order.currentHub && order.trackingTimeline) {
        const dispatchedFromCurrentHub = order.trackingTimeline.some(
          entry => entry.status === 'IN_TRANSIT' && 
          entry.hub && entry.hub.toString() === order.currentHub._id.toString()
        );
        if (dispatchedFromCurrentHub) {
          issues.push('❌ Order has already been dispatched from current hub');
        }
      }

      // Check if order hasn't arrived at current hub yet
      if (order.currentHub && order.trackingTimeline) {
        const arrivedAtCurrentHub = order.trackingTimeline.some(
          entry => (entry.status === 'ARRIVED_AT_HUB' || entry.status === 'SCANNED_IN') && 
          entry.hub && entry.hub.toString() === order.currentHub._id.toString()
        );
        if (!arrivedAtCurrentHub) {
          issues.push('⚠️  Order has not been scanned in at current hub yet');
        }
      }

      if (issues.length > 0) {
        console.log('   Issues preventing dispatch:');
        issues.forEach(issue => console.log(`   ${issue}`));
      } else {
        console.log('   ✅ Order appears ready for dispatch');
      }

      console.log('\n');
    }

    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkOrders();
