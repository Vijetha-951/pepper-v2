
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Order from './src/models/Order.js';
import { generateRoute } from './src/services/routeGenerationService.js';

dotenv.config();

async function fixOrders() {
  try {
    await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const orders = await Order.find({
      status: { $nin: ['DELIVERED', 'CANCELLED'] }
    });

    console.log(`Processing ${orders.length} active orders...\n`);

    let fixedCount = 0;

    for (const order of orders) {
      const district = order.shippingAddress?.district;
      if (!district) continue;

      try {
        const correctRoute = await generateRoute(district);
        const correctRouteIds = correctRoute.map(h => h._id.toString());
        const currentRouteIds = order.route.map(h => h.toString());

        let needsUpdate = JSON.stringify(currentRouteIds) !== JSON.stringify(correctRouteIds);

        // Also check if currentHub is in the new route
        if (order.currentHub) {
          if (!correctRouteIds.includes(order.currentHub.toString())) {
            console.log(`⚠️  Order ${order._id}: currentHub ${order.currentHub} not in NEW route. Resetting currentHub to first hub of new route.`);
            order.currentHub = correctRoute[0]._id;
            needsUpdate = true;
          }
        } else if (correctRoute.length > 0) {
          order.currentHub = correctRoute[0]._id;
          needsUpdate = true;
        }

        if (needsUpdate) {
          order.route = correctRoute.map(h => h._id);
          await order.save();
          fixedCount++;
          console.log(`✅ Fixed Order ${order._id} for ${district}`);
        }
      } catch (err) {
        console.log(`❌ Error fixing Order ${order._id}: ${err.message}`);
      }
    }

    console.log(`\nFixed ${fixedCount} orders.`);
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

fixOrders();
