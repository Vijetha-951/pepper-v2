
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Order from './src/models/Order.js';
import Hub from './src/models/Hub.js';

dotenv.config();

async function diagnose() {
  try {
    await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const orders = await Order.find({
      status: { $nin: ['DELIVERED', 'CANCELLED'] }
    }).populate('currentHub').populate('route');

    console.log(`Analyzing ${orders.length} active orders...\n`);

    let mismatchCount = 0;
    let pendingCount = 0;
    let approvedCount = 0;
    let inTransitCount = 0;

    for (const order of orders) {
      const currentHubId = order.currentHub?._id?.toString();
      const routeIds = order.route?.map(h => h._id?.toString()) || [];
      
      const inRoute = routeIds.includes(currentHubId);
      
      if (currentHubId && !inRoute) {
        mismatchCount++;
        console.log(`❌ Order ${order._id} [${order.status}]: Current hub ${order.currentHub?.name} (${currentHubId}) NOT in route!`);
        console.log(`   Route: ${order.route?.map(h => h.name).join(' -> ')}`);
      }

      if (order.status === 'PENDING') pendingCount++;
      if (order.status === 'APPROVED') approvedCount++;
      if (order.status === 'IN_TRANSIT') inTransitCount++;
    }

    console.log('\nSummary:');
    console.log(`- Mismatched Hub/Route: ${mismatchCount}`);
    console.log(`- PENDING: ${pendingCount}`);
    console.log(`- APPROVED: ${approvedCount}`);
    console.log(`- IN_TRANSIT: ${inTransitCount}`);

    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

diagnose();
