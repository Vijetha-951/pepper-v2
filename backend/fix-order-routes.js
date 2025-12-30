import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Order from './src/models/Order.js';
import { generateRoute } from './src/services/routeGenerationService.js';

// Load environment variables
dotenv.config();

async function fixOrderRoutes() {
  try {
    console.log('🔧 Starting route correction for all orders...\n');
    
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGO_URI not found in .env file');
    }
    
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');
    
    // Get all orders that have a shipping address with district
    const orders = await Order.find({
      'shippingAddress.district': { $exists: true, $ne: null, $ne: '' }
    });
    
    console.log(`📦 Found ${orders.length} orders to process\n`);
    console.log('='.repeat(80));
    
    let successCount = 0;
    let errorCount = 0;
    let skippedCount = 0;
    const errors = [];
    
    for (const order of orders) {
      const orderId = order._id;
      const district = order.shippingAddress.district;
      const oldRoute = order.route.map(h => h.toString());
      
      try {
        // Generate correct route
        const correctRoute = await generateRoute(district);
        const newRouteIds = correctRoute.map(hub => hub._id);
        
        // Check if route needs updating
        const routeChanged = JSON.stringify(oldRoute) !== JSON.stringify(newRouteIds.map(id => id.toString()));
        
        if (!routeChanged) {
          console.log(`⏭️  Order ${orderId} (${district}): Route already correct`);
          skippedCount++;
          continue;
        }
        
        // Update the order
        order.route = newRouteIds;
        await order.save();
        
        console.log(`✅ Order ${orderId} (${district}):`);
        console.log(`   Old: ${oldRoute.length} hubs`);
        console.log(`   New: ${correctRoute.map(h => h.district).join(' → ')}`);
        console.log('-'.repeat(80));
        
        successCount++;
        
      } catch (error) {
        console.error(`❌ Error processing order ${orderId} (${district}):`, error.message);
        errors.push({ orderId, district, error: error.message });
        errorCount++;
      }
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('📊 Summary:');
    console.log(`   ✅ Successfully updated: ${successCount} orders`);
    console.log(`   ⏭️  Already correct: ${skippedCount} orders`);
    console.log(`   ❌ Errors: ${errorCount} orders`);
    console.log('='.repeat(80));
    
    if (errors.length > 0) {
      console.log('\n❌ Orders with errors:');
      errors.forEach(({ orderId, district, error }) => {
        console.log(`   - ${orderId} (${district}): ${error}`);
      });
    }
    
    console.log('\n✅ Route correction completed!');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

fixOrderRoutes();
