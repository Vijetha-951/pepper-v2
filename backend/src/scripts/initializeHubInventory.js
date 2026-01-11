import '../config/env.js';
import mongoose from 'mongoose';
import Hub from '../models/Hub.js';
import Product from '../models/Product.js';
import HubInventory from '../models/HubInventory.js';
import connectDB from '../config/db.js';

/**
 * Initialize inventory for all hubs
 * Kottayam (main hub) gets full stock, other hubs get partial stock
 */

const initializeHubInventories = async () => {
  try {
    await connectDB();
    console.log('✅ Connected to MongoDB\n');

    // Get all active hubs
    const hubs = await Hub.find({ isActive: true }).sort({ order: 1 });
    console.log(`📍 Found ${hubs.length} active hubs\n`);

    // Get all active products
    const products = await Product.find({ isActive: true });
    console.log(`📦 Found ${products.length} active products\n`);

    if (products.length === 0) {
      console.log('⚠️  No products found. Please seed products first.');
      process.exit(1);
    }

    // Identify Kottayam hub (main hub)
    const mainHub = hubs.find(h => h.district === 'Kottayam');
    if (!mainHub) {
      console.log('⚠️  Kottayam hub not found. Creating it as main hub...');
      // You might want to create it here or exit
      process.exit(1);
    }

    console.log(`🏢 Main Hub: ${mainHub.name} (${mainHub.district})\n`);
    console.log('=' .repeat(80));

    let totalCreated = 0;
    let totalUpdated = 0;
    let totalSkipped = 0;

    for (const hub of hubs) {
      console.log(`\n📍 Processing ${hub.name} (${hub.district})...`);
      
      const isMainHub = hub.district === 'Kottayam';
      let hubCreated = 0;
      let hubUpdated = 0;
      let hubSkipped = 0;

      for (const product of products) {
        // Check if inventory already exists
        let inventory = await HubInventory.findOne({
          hub: hub._id,
          product: product._id
        });

        if (inventory) {
          // Inventory exists - optionally update or skip
          console.log(`   ⏭️  ${product.name}: Already exists (${inventory.quantity} units)`);
          hubSkipped++;
          totalSkipped++;
          continue;
        }

        // Determine initial stock based on hub type
        let initialQuantity = 0;
        if (isMainHub) {
          // Main hub - full stock
          initialQuantity = product.available_stock || 100;
          // Ensure minimum quantity for main hub
          initialQuantity = Math.max(initialQuantity, 100);
        } else {
          // Other hubs - partial stock
          const availableStock = product.available_stock || 0;
          if (availableStock > 0) {
            // Give 20% of available stock or minimum 10 units
            initialQuantity = Math.max(Math.floor(availableStock * 0.2), 10);
            // Cap at 50 units for regional hubs
            initialQuantity = Math.min(initialQuantity, 50);
          } else {
            // Product out of stock - set to 0
            initialQuantity = 0;
          }
        }

        // Create inventory entry
        inventory = await HubInventory.create({
          hub: hub._id,
          product: product._id,
          quantity: initialQuantity,
          reservedQuantity: 0,
          restockHistory: [{
            quantity: initialQuantity,
            source: 'ADMIN',
            timestamp: new Date(),
            notes: `Initial inventory setup - ${isMainHub ? 'Main Hub' : 'Regional Hub'}`
          }]
        });

        console.log(`   ✅ ${product.name}: ${initialQuantity} units`);
        hubCreated++;
        totalCreated++;
      }

      console.log(`\n   Summary: ${hubCreated} created, ${hubUpdated} updated, ${hubSkipped} skipped`);
    }

    console.log('\n' + '='.repeat(80));
    console.log('\n📊 FINAL SUMMARY:');
    console.log(`   Total inventory entries created: ${totalCreated}`);
    console.log(`   Total inventory entries updated: ${totalUpdated}`);
    console.log(`   Total inventory entries skipped: ${totalSkipped}`);
    console.log('='.repeat(80));

    // Show inventory summary by hub
    console.log('\n📋 Inventory Summary by Hub:\n');
    for (const hub of hubs) {
      const inventoryCount = await HubInventory.countDocuments({ hub: hub._id });
      const totalStock = await HubInventory.aggregate([
        { $match: { hub: hub._id } },
        { $group: { _id: null, total: { $sum: '$quantity' } } }
      ]);

      const stockTotal = totalStock.length > 0 ? totalStock[0].total : 0;
      const isMainHub = hub.district === 'Kottayam';
      
      console.log(`${isMainHub ? '🏢' : '📍'} ${hub.name.padEnd(30)} | Products: ${inventoryCount.toString().padStart(3)} | Total Stock: ${stockTotal.toString().padStart(5)} units`);
    }

    console.log('\n✅ Hub inventories initialized successfully!');
    console.log('\n💡 Next steps:');
    console.log('   1. Verify inventory levels in admin panel');
    console.log('   2. Adjust stock quantities as needed');
    console.log('   3. Test hub collection flow');
    console.log('   4. Monitor restock requests\n');

  } catch (error) {
    console.error('❌ Error initializing hub inventories:', error);
    console.error(error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
    process.exit(0);
  }
};

// Run the script
initializeHubInventories();
