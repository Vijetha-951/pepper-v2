import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Order from '../src/models/Order.js';
import Hub from '../src/models/Hub.js';

dotenv.config();

async function visualizeOrderFlow() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');
    console.log('═'.repeat(80));
    console.log('📦 ORDER FLOW THROUGH MULTI-HUB ROUTE');
    console.log('═'.repeat(80) + '\n');

    // Find an order with a multi-hub route
    const order = await Order.findOne({ 
      route: { $exists: true, $not: { $size: 0 } }
    })
      .populate('route', 'name district type')
      .populate('currentHub', 'name district')
      .lean();

    if (!order) {
      console.log('No orders with routes found.');
      return;
    }

    console.log(`📋 Order ID: ${order._id}`);
    console.log(`Status: ${order.status}`);
    console.log(`Current Hub: ${order.currentHub?.name || 'Not assigned'}\n`);

    console.log(`🗺️  PLANNED ROUTE (${order.route.length} hubs):\n`);
    order.route.forEach((hub, index) => {
      const arrow = index < order.route.length - 1 ? ' →' : '';
      console.log(`   ${index + 1}. ${hub.name} (${hub.type})${arrow}`);
    });

    console.log('\n' + '─'.repeat(80));
    console.log('🔄 WORKFLOW AT EACH HUB:');
    console.log('─'.repeat(80) + '\n');

    order.route.forEach((hub, index) => {
      const isFirst = index === 0;
      const isLast = index === order.route.length - 1;
      const isCurrent = order.currentHub && hub._id.toString() === order.currentHub._id?.toString();

      console.log(`\n${index + 1}. ${hub.name} (${hub.type})`);
      console.log('   ' + '─'.repeat(60));

      if (isFirst) {
        console.log('   📥 RECEIVING:');
        console.log('      • Order created at source warehouse');
        console.log('      • Status: PENDING → APPROVED');
        console.log('\n   📤 DISPATCH OPTIONS:');
        if (order.route.length === 1) {
          console.log('      • Assign to delivery boy (local delivery)');
          console.log('      • Status: APPROVED → OUT_FOR_DELIVERY');
        } else {
          console.log(`      • Dispatch to: ${order.route[index + 1].name}`);
          console.log('      • Status: APPROVED → IN_TRANSIT');
        }
      } else if (isLast) {
        console.log('   📥 RECEIVING:');
        console.log('      • Scan In button available');
        console.log(`      • Receives from: ${order.route[index - 1].name}`);
        console.log('      • Adds ARRIVED_AT_HUB event');
        console.log('      • Status remains: APPROVED');
        console.log('\n   📤 DISPATCH OPTIONS:');
        console.log('      • Assign to delivery boy (final delivery)');
        console.log('      • Generates OTP');
        console.log('      • Sends OTP email to customer');
        console.log('      • Status: APPROVED → OUT_FOR_DELIVERY');
      } else {
        console.log('   📥 RECEIVING:');
        console.log('      • Scan In button available');
        console.log(`      • Receives from: ${order.route[index - 1].name}`);
        console.log('      • Adds ARRIVED_AT_HUB event');
        console.log('      • Status remains: APPROVED or IN_TRANSIT');
        console.log('\n   📤 DISPATCH OPTIONS:');
        console.log(`      • Dispatch to: ${order.route[index + 1].name}`);
        console.log('      • Adds IN_TRANSIT event');
        console.log('      • Updates currentHub to next hub');
        console.log('      • Status: APPROVED → IN_TRANSIT');
      }

      if (isCurrent) {
        console.log('\n   ✅ CURRENT LOCATION');
      }
    });

    console.log('\n\n' + '═'.repeat(80));
    console.log('📋 TRACKING TIMELINE:');
    console.log('═'.repeat(80) + '\n');

    if (order.trackingTimeline && order.trackingTimeline.length > 0) {
      order.trackingTimeline.forEach((event, index) => {
        const time = new Date(event.timestamp || event.createdAt).toLocaleString();
        console.log(`${index + 1}. ${event.status}`);
        console.log(`   Location: ${event.location}`);
        console.log(`   Time: ${time}`);
        console.log(`   Description: ${event.description || 'N/A'}`);
        console.log('');
      });
    } else {
      console.log('No tracking events yet.');
    }

    console.log('═'.repeat(80));
    console.log('🎯 KEY POINTS:');
    console.log('═'.repeat(80) + '\n');

    console.log('1️⃣  EVERY HUB IN THE ROUTE has two actions:');
    console.log('   • SCAN IN: Records package arrival at that hub');
    console.log('   • DISPATCH: Sends package to next hub or delivery boy\n');

    console.log('2️⃣  INTERMEDIATE HUBS (not first, not last):');
    console.log('   • Must scan in when package arrives');
    console.log('   • Then dispatch to NEXT hub in route');
    console.log('   • Cannot skip hubs or send to wrong destination\n');

    console.log('3️⃣  LAST HUB (Destination):');
    console.log('   • Scans in when package arrives');
    console.log('   • Dispatches to DELIVERY BOY (not another hub)');
    console.log('   • Generates OTP for secure delivery\n');

    console.log('4️⃣  TRACKING TIMELINE:');
    console.log('   • Records every scan-in (ARRIVED_AT_HUB)');
    console.log('   • Records every dispatch (IN_TRANSIT or OUT_FOR_DELIVERY)');
    console.log('   • Provides full visibility of package journey\n');

    console.log('═'.repeat(80));

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB\n');
  }
}

visualizeOrderFlow();
