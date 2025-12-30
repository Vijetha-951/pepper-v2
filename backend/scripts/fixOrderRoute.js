import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Order from '../src/models/Order.js';
import Hub from '../src/models/Hub.js';
import { generateRoute } from '../src/services/routeGenerationService.js';

dotenv.config();

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/pepper';

async function fixOrderRoute(orderId) {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    const order = await Order.findById(orderId)
      .populate('currentHub')
      .populate('route');
    
    if (!order) {
      console.error('❌ Order not found');
      process.exit(1);
    }

    console.log(`📦 Order ${order._id}`);
    console.log(`Current Status: ${order.status}`);
    console.log(`Current Hub: ${order.currentHub?.name}`);
    console.log(`Current Route:`, order.route?.map(h => h.name));
    
    // Regenerate route
    const destination = order.shippingAddress?.destinationDistrict || order.shippingAddress?.district;
    if (!destination) {
      console.error('❌ Order destination not found');
      process.exit(1);
    }

    console.log(`\n🔄 Regenerating route for destination: ${destination}`);
    const newRoute = await generateRoute(destination);
    console.log(`New Route:`, newRoute.map(h => `${h.name} (${h._id})`));
    
    // Update order route
    order.route = newRoute.map(h => h._id);
    
    // If order is IN_TRANSIT, update currentHub to match the correct hub
    if (order.status === 'IN_TRANSIT') {
      const lastDispatch = [...order.trackingTimeline].reverse().find(t => t.status === 'IN_TRANSIT');
      if (lastDispatch) {
        console.log(`\n📍 Last dispatch was from hub: ${lastDispatch.hub}`);
        const dispatchFromHubIndex = newRoute.findIndex(h => h._id.toString() === lastDispatch.hub?.toString());
        
        if (dispatchFromHubIndex !== -1 && dispatchFromHubIndex < newRoute.length - 1) {
          const correctNextHub = newRoute[dispatchFromHubIndex + 1];
          order.currentHub = correctNextHub._id;
          console.log(`✅ Updated currentHub to: ${correctNextHub.name} (${correctNextHub._id})`);
        } else {
          console.log(`⚠️ Could not determine correct next hub`);
        }
      }
    }
    
    await order.save();
    console.log(`\n✅ Order route fixed successfully!`);
    
    const updatedOrder = await Order.findById(order._id)
      .populate('route', 'name _id')
      .populate('currentHub', 'name _id');
    
    console.log(`\n📦 Updated Order:`);
    console.log(`Status: ${updatedOrder.status}`);
    console.log(`Current Hub: ${updatedOrder.currentHub?.name} (${updatedOrder.currentHub?._id})`);
    console.log(`Route:`, updatedOrder.route.map(h => `${h.name} (${h._id})`));
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

const orderId = process.argv[2] || '690015e0cf5e78093f112b90';
console.log(`\n🔧 Fixing route for order: ${orderId}\n`);
fixOrderRoute(orderId);
