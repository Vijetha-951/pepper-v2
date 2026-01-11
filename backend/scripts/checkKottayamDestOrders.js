import mongoose from 'mongoose';
import Order from '../src/models/Order.js';
import User from '../src/models/User.js';
import Hub from '../src/models/Hub.js';
import dotenv from 'dotenv';

dotenv.config();

async function checkKottayamDestOrders() {
  try {
    const uri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/pepper-delivery';
    await mongoose.connect(uri);
    console.log('✅ Connected to MongoDB\n');

    // Find orders with Kottayam as destination
    const orders = await Order.find({
      'shippingAddress.district': { $regex: /^Kottayam$/i }
    })
      .populate('user', 'firstName lastName email')
      .populate('currentHub', 'name district type')
      .populate('route', 'name district type order')
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    console.log('='.repeat(70));
    console.log(`📦 Orders with Kottayam as Destination (Last 10)`);
    console.log('='.repeat(70));

    if (orders.length === 0) {
      console.log('❌ No orders found with Kottayam destination\n');
    } else {
      orders.forEach((order, index) => {
        console.log(`\n${index + 1}. Order ID: ${order._id}`);
        console.log(`   Status: ${order.status}`);
        console.log(`   Destination: ${order.shippingAddress?.district}`);
        console.log(`   Current Hub: ${order.currentHub?.name || 'None'} (${order.currentHub?.district || 'N/A'})`);
        console.log(`   Route (${order.route?.length || 0} hubs):`);
        
        if (order.route && order.route.length > 0) {
          order.route.forEach((hub, idx) => {
            const arrow = idx < order.route.length - 1 ? ' →' : '';
            console.log(`      ${idx + 1}. ${hub.name} (${hub.district})${arrow}`);
          });
        } else {
          console.log(`      No route assigned`);
        }

        // Check if route goes through Ernakulam
        const hasErnakulam = order.route?.some(h => h.district === 'Ernakulam');
        if (hasErnakulam) {
          console.log(`   ⚠️  ISSUE: Route includes Ernakulam for local Kottayam delivery!`);
        }
      });
    }

    console.log('\n' + '='.repeat(70));
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkKottayamDestOrders();
