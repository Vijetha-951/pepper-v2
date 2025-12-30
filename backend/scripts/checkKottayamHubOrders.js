import mongoose from 'mongoose';
import Hub from '../src/models/Hub.js';
import User from '../src/models/User.js';
import Order from '../src/models/Order.js';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGO_URI || process.env.MONGODB_URI;

async function checkKottayamHubOrders() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find Kottayam hub
    const kottayamHub = await Hub.findOne({ district: 'Kottayam' })
      .populate('managedBy', 'email firstName lastName name role');
    
    if (!kottayamHub) {
      console.log('❌ Kottayam hub not found!');
      return;
    }

    console.log('🏢 KOTTAYAM HUB:');
    console.log('Hub ID:', kottayamHub._id);
    console.log('Hub Name:', kottayamHub.name);
    console.log('Hub Type:', kottayamHub.type);
    console.log('Hub District:', kottayamHub.district);
    console.log('\n👤 HUB MANAGERS:');
    if (kottayamHub.managedBy && kottayamHub.managedBy.length > 0) {
      kottayamHub.managedBy.forEach((manager, idx) => {
        console.log(`${idx + 1}. Manager ID: ${manager._id}`);
        console.log(`   Manager Email: ${manager.email}`);
        console.log(`   Manager Name: ${manager.name || `${manager.firstName} ${manager.lastName}`}`);
        console.log(`   Manager Role: ${manager.role}`);
      });
    } else {
      console.log('❌ NO MANAGERS ASSIGNED!');
    }

    // Find orders at Kottayam hub
    console.log('\n\n📦 ORDERS AT KOTTAYAM HUB:');
    const orders = await Order.find({
      currentHub: kottayamHub._id,
      status: { $nin: ['DELIVERED', 'CANCELLED'] }
    })
      .populate('user', 'email name firstName lastName')
      .populate('currentHub', 'name district')
      .sort({ createdAt: -1 });

    console.log(`Total orders: ${orders.length}\n`);

    if (orders.length === 0) {
      console.log('❌ No active orders at Kottayam hub!');
      
      // Check if there are any orders in the system with Kottayam in route
      const ordersWithKottayamInRoute = await Order.find({
        route: kottayamHub._id
      }).populate('currentHub', 'name district');
      
      console.log(`\n📋 Orders with Kottayam in route: ${ordersWithKottayamInRoute.length}`);
      ordersWithKottayamInRoute.forEach((order, idx) => {
        console.log(`  ${idx + 1}. Order ${order._id}`);
        console.log(`     Status: ${order.status}`);
        console.log(`     Current Hub: ${order.currentHub?.name || 'None'}`);
        console.log(`     Created: ${order.createdAt}`);
      });
    } else {
      orders.forEach((order, idx) => {
        console.log(`${idx + 1}. Order ID: ${order._id}`);
        console.log(`   Customer: ${order.user?.name || order.user?.email}`);
        console.log(`   Status: ${order.status}`);
        console.log(`   Current Hub: ${order.currentHub?.name}`);
        console.log(`   Total Amount: ₹${order.totalAmount}`);
        console.log(`   Created: ${order.createdAt}`);
        
        // Check if order has been dispatched from this hub
        const dispatchedFromKottayam = order.trackingTimeline?.some(
          entry => entry.status === 'IN_TRANSIT' && 
          entry.hub && entry.hub.toString() === kottayamHub._id.toString()
        );
        console.log(`   Dispatched from Kottayam: ${dispatchedFromKottayam ? 'YES' : 'NO'}`);
        
        console.log(`   Items: ${order.items.map(i => `${i.name} (x${i.quantity})`).join(', ')}`);
        console.log('');
      });
    }

    // Check all users with hubmanager role
    console.log('\n\n👥 ALL HUB MANAGERS IN SYSTEM:');
    const allHubManagers = await User.find({ role: 'hubmanager' })
      .select('email name firstName lastName');
    
    allHubManagers.forEach((manager, idx) => {
      console.log(`${idx + 1}. ${manager.name || `${manager.firstName} ${manager.lastName}`} (${manager.email})`);
    });

    // Check which hubs each manager is assigned to
    console.log('\n\n🏢 HUB MANAGER ASSIGNMENTS:');
    const hubs = await Hub.find().populate('managedBy', 'email name firstName lastName');
    hubs.forEach(hub => {
      const managers = hub.managedBy && hub.managedBy.length > 0 
        ? hub.managedBy.map(m => m.name || m.email).join(', ')
        : 'NO MANAGER';
      console.log(`${hub.name} (${hub.district}): ${managers}`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

checkKottayamHubOrders();
