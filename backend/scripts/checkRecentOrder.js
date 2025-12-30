import mongoose from 'mongoose';
import Order from '../src/models/Order.js';
import User from '../src/models/User.js';
import Hub from '../src/models/Hub.js';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGO_URI || process.env.MONGODB_URI;

async function checkRecentOrder() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get the most recent order
    const recentOrder = await Order.findOne()
      .sort({ createdAt: -1 })
      .populate('user', 'email name firstName lastName district pincode place')
      .populate('currentHub', 'name district type')
      .populate('route', 'name district type');

    if (!recentOrder) {
      console.log('❌ No orders found in database');
      return;
    }

    console.log('📦 MOST RECENT ORDER:');
    console.log('Order ID:', recentOrder._id);
    console.log('Created At:', recentOrder.createdAt);
    console.log('Status:', recentOrder.status);
    console.log('\n👤 USER INFO:');
    console.log('Email:', recentOrder.user?.email);
    console.log('Name:', recentOrder.user?.name || `${recentOrder.user?.firstName} ${recentOrder.user?.lastName}`);
    console.log('District:', recentOrder.user?.district);
    console.log('Pincode:', recentOrder.user?.pincode);
    console.log('Place:', recentOrder.user?.place);
    
    console.log('\n📍 SHIPPING ADDRESS:');
    console.log('District:', recentOrder.shippingAddress?.district);
    console.log('State:', recentOrder.shippingAddress?.state);
    console.log('Pincode:', recentOrder.shippingAddress?.pincode);
    console.log('Line1:', recentOrder.shippingAddress?.line1);
    
    console.log('\n🚚 ROUTE INFO:');
    console.log('Route Length:', recentOrder.route?.length || 0);
    if (recentOrder.route && recentOrder.route.length > 0) {
      console.log('Route Hubs:');
      recentOrder.route.forEach((hub, index) => {
        console.log(`  ${index + 1}. ${hub.name} (${hub.district}) - ${hub.type}`);
      });
    } else {
      console.log('❌ NO ROUTE ASSIGNED!');
    }
    
    console.log('\n🏢 CURRENT HUB:');
    if (recentOrder.currentHub) {
      console.log('Hub Name:', recentOrder.currentHub.name);
      console.log('Hub District:', recentOrder.currentHub.district);
      console.log('Hub Type:', recentOrder.currentHub.type);
    } else {
      console.log('❌ NO CURRENT HUB ASSIGNED!');
    }
    
    console.log('\n📊 ORDER ITEMS:');
    recentOrder.items.forEach((item, index) => {
      console.log(`  ${index + 1}. ${item.name} - Qty: ${item.quantity} - Price: ₹${item.priceAtOrder}`);
    });
    console.log('Total Amount: ₹' + recentOrder.totalAmount);
    
    console.log('\n📅 TRACKING TIMELINE:');
    if (recentOrder.trackingTimeline && recentOrder.trackingTimeline.length > 0) {
      recentOrder.trackingTimeline.forEach((event, index) => {
        console.log(`  ${index + 1}. ${event.status} - ${event.location} - ${event.description}`);
        console.log(`     Time: ${event.timestamp}`);
      });
    } else {
      console.log('❌ NO TRACKING TIMELINE!');
    }

    // Check if Kottayam hub exists
    console.log('\n\n🏢 KOTTAYAM HUB CHECK:');
    const kottayamHub = await Hub.findOne({ district: 'Kottayam' });
    if (kottayamHub) {
      console.log('✅ Kottayam Hub Found:');
      console.log('Hub ID:', kottayamHub._id);
      console.log('Hub Name:', kottayamHub.name);
      console.log('Hub Type:', kottayamHub.type);
      console.log('Hub District:', kottayamHub.district);
    } else {
      console.log('❌ NO KOTTAYAM HUB FOUND IN DATABASE!');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

checkRecentOrder();
