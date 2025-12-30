import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Order from '../src/models/Order.js';
import Hub from '../src/models/Hub.js';
import User from '../src/models/User.js';

dotenv.config();

async function checkOrdersAtHub() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find Kottayam hub(s)
    const kottayamHubs = await Hub.find({ 
      $or: [
        { name: /Kottayam/i },
        { district: 'Kottayam' }
      ]
    });

    console.log(`📍 Found ${kottayamHubs.length} Kottayam Hub(s):\n`);
    
    for (const hub of kottayamHubs) {
      console.log(`\n🏢 Hub: ${hub.name} (${hub.type})`);
      console.log(`   ID: ${hub._id}`);
      console.log(`   District: ${hub.district}`);
      console.log(`   Managed By: ${hub.managedBy}`);
      console.log(`   Active: ${hub.isActive}`);

      // Find all orders for this hub
      const allOrders = await Order.find({ currentHub: hub._id })
        .populate('user', 'firstName lastName email')
        .lean();

      console.log(`\n   📦 Total Orders at this hub: ${allOrders.length}`);

      if (allOrders.length > 0) {
        console.log('\n   Order Details:');
        allOrders.forEach((order, index) => {
          console.log(`\n   ${index + 1}. Order ID: ${order._id}`);
          console.log(`      Status: ${order.status}`);
          console.log(`      User: ${order.user?.firstName} ${order.user?.lastName}`);
          console.log(`      Amount: ₹${order.totalAmount}`);
          console.log(`      Created: ${new Date(order.createdAt).toLocaleString()}`);
          console.log(`      Current Hub: ${order.currentHub}`);
          
          // Check tracking timeline
          if (order.trackingTimeline && order.trackingTimeline.length > 0) {
            console.log(`      Tracking Timeline (${order.trackingTimeline.length} events):`);
            order.trackingTimeline.forEach((event, i) => {
              const hubMatch = event.hub?.toString() === hub._id.toString();
              console.log(`         ${i + 1}. ${event.status} at ${event.location || 'N/A'} ${hubMatch ? '✅ (THIS HUB)' : ''}`);
              console.log(`            Hub ID: ${event.hub || 'N/A'}`);
              console.log(`            Time: ${new Date(event.timestamp).toLocaleString()}`);
            });
          } else {
            console.log(`      ⚠️  No tracking timeline`);
          }

          // Check if dispatched from this hub
          const dispatchedFromHub = order.trackingTimeline?.some(
            entry => entry.status === 'IN_TRANSIT' && 
            entry.hub?.toString() === hub._id.toString()
          );
          console.log(`      Dispatched from this hub: ${dispatchedFromHub ? '✅ YES' : '❌ NO'}`);
        });
      }

      // Check filters used by the endpoint
      const activeOrdersQuery = {
        currentHub: hub._id,
        status: { $nin: ['DELIVERED', 'CANCELLED', 'OUT_FOR_DELIVERY'] }
      };

      const activeOrders = await Order.find(activeOrdersQuery)
        .populate('user', 'firstName lastName email')
        .lean();

      console.log(`\n   📊 Orders matching active query (not DELIVERED/CANCELLED/OUT_FOR_DELIVERY): ${activeOrders.length}`);

      // Filter out dispatched orders
      const notDispatchedOrders = activeOrders.filter(order => {
        const dispatchedFromHub = order.trackingTimeline?.some(
          entry => entry.status === 'IN_TRANSIT' && 
          entry.hub?.toString() === hub._id.toString()
        );
        return !dispatchedFromHub;
      });

      console.log(`   📋 Orders after filtering out dispatched: ${notDispatchedOrders.length}`);
    }

    // Check ALL orders in the system
    console.log('\n\n📊 ALL ORDERS IN SYSTEM:\n');
    const allSystemOrders = await Order.find()
      .populate('currentHub', 'name district')
      .populate('user', 'firstName lastName')
      .lean();

    console.log(`Total orders in system: ${allSystemOrders.length}\n`);

    const ordersByStatus = {};
    const ordersByHub = {};

    allSystemOrders.forEach(order => {
      // Count by status
      ordersByStatus[order.status] = (ordersByStatus[order.status] || 0) + 1;
      
      // Count by hub
      const hubName = order.currentHub?.name || 'No Hub';
      ordersByHub[hubName] = (ordersByHub[hubName] || 0) + 1;
    });

    console.log('Orders by Status:');
    Object.entries(ordersByStatus).forEach(([status, count]) => {
      console.log(`   ${status}: ${count}`);
    });

    console.log('\nOrders by Current Hub:');
    Object.entries(ordersByHub).forEach(([hub, count]) => {
      console.log(`   ${hub}: ${count}`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

checkOrdersAtHub();
