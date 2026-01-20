import mongoose from 'mongoose';
import HubInventory from './src/models/HubInventory.js';
import Hub from './src/models/Hub.js';
import Product from './src/models/Product.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;

console.log('📝 MongoDB URI:', mongoUri ? '✅ Found' : '❌ Not found');
console.log('📝 URI starts with:', mongoUri ? mongoUri.substring(0, 20) + '...' : 'N/A');

if (!mongoUri) {
  console.error('❌ No MongoDB URI found in .env file!');
  process.exit(1);
}

console.log('🔗 Connecting to MongoDB...');

async function syncKottayamInventory() {
  try {
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');
    
    console.log('🔄 Syncing Kottayam Hub Inventory with Product Stock...\n');

    // Find Kottayam hub
    const kottayamHub = await Hub.findOne({ district: 'Kottayam' });
    if (!kottayamHub) {
      console.log('❌ Kottayam hub not found!');
      process.exit(1);
    }

    console.log(`✅ Found Hub: ${kottayamHub.name} (${kottayamHub.district})\n`);

    // Get all products
    const products = await Product.find({});
    console.log(`📦 Total products: ${products.length}\n`);

    let syncedCount = 0;
    let createdCount = 0;

    for (const product of products) {
      // Check if hub inventory exists
      let hubInv = await HubInventory.findOne({
        hub: kottayamHub._id,
        product: product._id
      });

      if (!hubInv) {
        // Create new hub inventory entry
        console.log(`➕ Creating inventory for: ${product.name}`);
        hubInv = new HubInventory({
          hub: kottayamHub._id,
          product: product._id,
          quantity: product.available_stock || 0,
          reservedQuantity: 0
        });
        await hubInv.save();
        console.log(`   ✅ Created with quantity: ${product.available_stock || 0}\n`);
        createdCount++;
      } else {
        const currentAvailable = hubInv.quantity - (hubInv.reservedQuantity || 0);
        
        if (currentAvailable === 0 && product.available_stock > 0) {
          // Sync: set hub quantity to match product stock
          const oldQuantity = hubInv.quantity;
          hubInv.quantity = product.available_stock;
          await hubInv.save();
          
          console.log(`🔄 ${product.name}`);
          console.log(`   Product stock: ${product.available_stock}`);
          console.log(`   Old hub quantity: ${oldQuantity}`);
          console.log(`   Reserved: ${hubInv.reservedQuantity || 0}`);
          console.log(`   ✅ Updated hub quantity to: ${hubInv.quantity}\n`);
          syncedCount++;
        } else if (product.available_stock > 0) {
          console.log(`✓ ${product.name} - Already synced (Available: ${currentAvailable})`);
        }
      }
    }

    console.log(`\n✅ Sync complete!`);
    console.log(`   Created: ${createdCount} new inventory entries`);
    console.log(`   Synced: ${syncedCount} existing entries`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    mongoose.connection.close();
  }
}

syncKottayamInventory();
