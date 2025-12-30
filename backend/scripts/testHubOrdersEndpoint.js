// Test the hub orders endpoint logic locally
import mongoose from 'mongoose';
import Order from '../src/models/Order.js';
import Hub from '../src/models/Hub.js';
import User from '../src/models/User.js';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGO_URI || process.env.MONGODB_URI;

async function simulateHubOrdersEndpoint() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find Kottayam hub
    const hub = await Hub.findOne({ district: 'Kottayam' });
    
    if (!hub) {
      console.log('❌ Kottayam hub not found!');
      return;
    }

    console.log(`🏢 Testing /hub/orders endpoint for: ${hub.name}\n`);

    // Helper function to compare hub IDs (from the actual endpoint)
    const hubIdsMatch = (hubId1, hubId2) => {
      if (!hubId1 || !hubId2) return false;
      const id1 = typeof hubId1 === 'object' && hubId1._id ? hubId1._id.toString() : hubId1.toString();
      const id2 = typeof hubId2 === 'object' && hubId2._id ? hubId2._id.toString() : hubId2.toString();
      return id1 === id2;
    };

    // Step 1: Query orders (exactly as the endpoint does)
    const orders = await Order.find({ 
      currentHub: hub._id,
      status: { $nin: ['DELIVERED', 'CANCELLED', 'OUT_FOR_DELIVERY'] }
    })
      .populate('user', 'firstName lastName email phone name')
      .populate('route', 'name district order type location')
      .populate('currentHub', 'name district type')
      .lean();
    
    console.log(`📦 Step 1: Found ${orders.length} orders at this hub (excluding DELIVERED, CANCELLED, OUT_FOR_DELIVERY)\n`);

    // Step 2: Filter out orders that have been dispatched from this hub (exactly as the endpoint does)
    const activeOrders = orders.filter(order => {
      const dispatchedFromHub = order.trackingTimeline?.some(
        entry => entry.status === 'IN_TRANSIT' && 
        entry.hub && hubIdsMatch(entry.hub, hub._id)
      );
      
      if (dispatchedFromHub) {
        console.log(`   ❌ Filtering out Order ${order._id.toString().slice(-6)} - already dispatched from this hub`);
      }
      
      return !dispatchedFromHub;
    });

    console.log(`\n📦 Step 2: After filtering dispatched orders: ${activeOrders.length} active orders\n`);

    // Show what would be returned
    console.log('📋 ORDERS THAT WOULD BE SHOWN IN DASHBOARD:\n');
    activeOrders.forEach((order, idx) => {
      console.log(`${idx + 1}. Order ID: ...${order._id.toString().slice(-6)}`);
      console.log(`   Customer: ${order.user?.name || order.user?.email}`);
      console.log(`   Status: ${order.status}`);
      console.log(`   Amount: ₹${order.totalAmount}`);
      console.log(`   Items: ${order.items.map(i => `${i.name} (x${i.quantity})`).join(', ')}`);
      console.log(`   Created: ${new Date(order.createdAt).toLocaleDateString()}`);
      console.log('');
    });

    if (activeOrders.length === 0) {
      console.log('⚠️  NO ORDERS WOULD BE DISPLAYED!');
      console.log('\nPossible reasons:');
      console.log('1. All orders at this hub have been dispatched already');
      console.log('2. Orders have status DELIVERED, CANCELLED, or OUT_FOR_DELIVERY');
      console.log('3. All orders have IN_TRANSIT timeline entry from this hub');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

simulateHubOrdersEndpoint();
