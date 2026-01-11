import mongoose from 'mongoose';
import Order from '../src/models/Order.js';
import Hub from '../src/models/Hub.js';
import dotenv from 'dotenv';
import { generateRoute } from '../src/services/routeGenerationService.js';

dotenv.config();

async function fixKottayamLocalOrders() {
  try {
    const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
    await mongoose.connect(uri);
    console.log('✅ Connected to MongoDB\n');

    // Find all orders with Kottayam destination that have incorrect routes
    const orders = await Order.find({
      'shippingAddress.district': { $regex: /^Kottayam$/i }
    })
      .populate('route', 'name district')
      .lean();

    console.log(`Found ${orders.length} orders with Kottayam destination\n`);

    let fixedCount = 0;
    let alreadyCorrect = 0;
    let errorCount = 0;

    for (const order of orders) {
      const hasErnakulam = order.route?.some(h => h.district === 'Ernakulam');
      const routeLength = order.route?.length || 0;

      if (routeLength === 1 && !hasErnakulam) {
        alreadyCorrect++;
        continue;
      }

      if (routeLength > 1 || hasErnakulam) {
        console.log(`\n📦 Fixing Order: ${order._id}`);
        console.log(`   Current Route: ${order.route?.map(h => h.name).join(' → ')}`);

        try {
          // Generate correct route
          const newRoute = await generateRoute(order.shippingAddress.district);
          
          console.log(`   New Route: ${newRoute.map(h => h.name).join(' → ')}`);

          // Update the order
          await Order.findByIdAndUpdate(order._id, {
            route: newRoute.map(h => h._id),
            // Keep currentHub as Kottayam if it's already there
            currentHub: order.currentHub || newRoute[0]._id
          });

          console.log(`   ✅ Fixed`);
          fixedCount++;

        } catch (error) {
          console.log(`   ❌ Error: ${error.message}`);
          errorCount++;
        }
      }
    }

    console.log('\n' + '═'.repeat(70));
    console.log('📊 Summary:');
    console.log(`   Total Orders: ${orders.length}`);
    console.log(`   Already Correct: ${alreadyCorrect}`);
    console.log(`   Fixed: ${fixedCount}`);
    console.log(`   Errors: ${errorCount}`);
    console.log('═'.repeat(70));

    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

fixKottayamLocalOrders();
