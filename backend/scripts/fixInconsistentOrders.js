import '../src/config/env.js';
import mongoose from 'mongoose';
import Order from '../src/models/Order.js';
import Hub from '../src/models/Hub.js';
import connectDB from '../src/config/db.js';

/**
 * Fix orders with inconsistent tracking timeline vs status
 * 
 * Pattern violations:
 * 1. Has ARRIVED_AT_HUB event but status is still PENDING (should be APPROVED)
 * 2. Has IN_TRANSIT event but status doesn't match
 */

async function fixInconsistentOrders() {
  try {
    await connectDB();
    console.log('✅ Connected to MongoDB\n');

    // Find all active orders
    const orders = await Order.find({
      status: { $nin: ['DELIVERED', 'CANCELLED'] }
    }).populate('currentHub', 'name district');

    console.log(`📊 Found ${orders.length} active orders to check\n`);

    let fixedCount = 0;
    let issuesFound = [];

    for (const order of orders) {
      const issues = [];
      let needsUpdate = false;
      let updatedOrder = { ...order._doc };

      // Check for ARRIVED_AT_HUB with PENDING status
      const hasArrivalEvent = order.trackingTimeline?.some(
        t => t.status === 'ARRIVED_AT_HUB'
      );

      if (hasArrivalEvent && order.status === 'PENDING') {
        issues.push('Has ARRIVED_AT_HUB but status is PENDING');
        
        // Fix: Update status to APPROVED
        updatedOrder.status = 'APPROVED';
        needsUpdate = true;
      }

      // Check for IN_TRANSIT with PENDING status
      const hasInTransitEvent = order.trackingTimeline?.some(
        t => t.status === 'IN_TRANSIT'
      );

      if (hasInTransitEvent && order.status === 'PENDING') {
        issues.push('Has IN_TRANSIT but status is PENDING');
        
        // Fix: Update status to IN_TRANSIT
        updatedOrder.status = 'IN_TRANSIT';
        needsUpdate = true;
      }

      // Check for OUT_FOR_DELIVERY event with wrong status
      const hasOutForDeliveryEvent = order.trackingTimeline?.some(
        t => t.status === 'OUT_FOR_DELIVERY'
      );

      if (hasOutForDeliveryEvent && order.status !== 'OUT_FOR_DELIVERY') {
        issues.push('Has OUT_FOR_DELIVERY event but status is not OUT_FOR_DELIVERY');
        
        // Fix: Update status to OUT_FOR_DELIVERY
        updatedOrder.status = 'OUT_FOR_DELIVERY';
        needsUpdate = true;
      }

      // Check for DELIVERED event with wrong status
      const hasDeliveredEvent = order.trackingTimeline?.some(
        t => t.status === 'DELIVERED'
      );

      if (hasDeliveredEvent && order.status !== 'DELIVERED') {
        issues.push('Has DELIVERED event but status is not DELIVERED');
        
        // Fix: Update status to DELIVERED
        updatedOrder.status = 'DELIVERED';
        needsUpdate = true;
      }

      if (issues.length > 0) {
        issuesFound.push({
          orderId: order._id.toString(),
          currentStatus: order.status,
          newStatus: updatedOrder.status,
          currentHub: order.currentHub?.name || 'None',
          issues: issues,
          user: order.user,
          amount: order.totalAmount,
          createdAt: order.createdAt
        });

        if (needsUpdate) {
          // Apply fix
          await Order.findByIdAndUpdate(order._id, {
            status: updatedOrder.status
          });
          fixedCount++;
          console.log(`✅ Fixed Order ${order._id.toString().substring(0, 8)}...`);
          console.log(`   Old Status: ${order.status} → New Status: ${updatedOrder.status}`);
          console.log(`   Issues: ${issues.join(', ')}\n`);
        }
      }
    }

    console.log('\n' + '═'.repeat(80));
    console.log('📊 SUMMARY');
    console.log('═'.repeat(80));
    console.log(`Total Orders Checked: ${orders.length}`);
    console.log(`Issues Found: ${issuesFound.length}`);
    console.log(`Orders Fixed: ${fixedCount}`);

    if (issuesFound.length > 0) {
      console.log('\n📋 DETAILED ISSUES:');
      issuesFound.forEach((issue, idx) => {
        console.log(`\n${idx + 1}. Order ID: ${issue.orderId}`);
        console.log(`   Status: ${issue.currentStatus} → ${issue.newStatus}`);
        console.log(`   Hub: ${issue.currentHub}`);
        console.log(`   Amount: ₹${issue.amount}`);
        console.log(`   Created: ${new Date(issue.createdAt).toLocaleString()}`);
        console.log(`   Issues:`);
        issue.issues.forEach(i => console.log(`      • ${i}`));
      });
    } else {
      console.log('\n✅ No inconsistencies found! All orders follow correct patterns.');
    }

    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

fixInconsistentOrders();
