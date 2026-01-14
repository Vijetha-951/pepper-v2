import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Product from '../src/models/Product.js';
import Hub from '../src/models/Hub.js';
import HubInventory from '../src/models/HubInventory.js';
import connectDB from '../src/config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from backend root
dotenv.config({ path: path.join(__dirname, '../.env') });

async function syncKottayamStockWithProducts() {
  try {
    console.log('🔄 Starting Kottayam Hub stock synchronization...\n');
    await connectDB();
    console.log('✅ Connected to MongoDB\n');

    // Find Kottayam Hub
    const kottayamHub = await Hub.findOne({ district: 'Kottayam' });
    if (!kottayamHub) {
      console.log('❌ Kottayam Hub not found in database');
      process.exit(1);
    }
    console.log(`✅ Found Kottayam Hub: ${kottayamHub.name} (${kottayamHub.district})\n`);

    // Get all products
    const products = await Product.find({});
    console.log(`📦 Found ${products.length} products in database\n`);

    let syncedCount = 0;
    let createdCount = 0;
    let updatedCount = 0;
    let unchangedCount = 0;

    // Sync each product with Kottayam Hub inventory
    for (const product of products) {
      // Find existing hub inventory for this product at Kottayam Hub
      let hubInventory = await HubInventory.findOne({
        hub: kottayamHub._id,
        product: product._id
      });

      const productStock = product.available_stock || 0;

      if (!hubInventory) {
        // Create new hub inventory record
        hubInventory = await HubInventory.create({
          hub: kottayamHub._id,
          product: product._id,
          quantity: productStock,
          reservedQuantity: 0
        });
        console.log(`✨ Created: ${product.name} - Set to ${productStock} units`);
        createdCount++;
        syncedCount++;
      } else {
        // Update existing hub inventory to match product stock
        if (hubInventory.quantity !== productStock) {
          const oldQuantity = hubInventory.quantity;
          hubInventory.quantity = productStock;
          await hubInventory.save();
          console.log(`🔄 Updated: ${product.name} - ${oldQuantity} → ${productStock} units`);
          updatedCount++;
          syncedCount++;
        } else {
          console.log(`✓ Already synced: ${product.name} - ${productStock} units`);
          unchangedCount++;
        }
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 SYNCHRONIZATION SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total Products: ${products.length}`);
    console.log(`Created: ${createdCount}`);
    console.log(`Updated: ${updatedCount}`);
    console.log(`Already Synced: ${unchangedCount}`);
    console.log(`Total Changes: ${syncedCount}`);
    console.log('='.repeat(60));
    console.log('\n✅ Kottayam Hub inventory is now synced with Product stock!');
    console.log('ℹ️  Going forward, changes to either will automatically sync.\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error syncing Kottayam stock:', error);
    process.exit(1);
  }
}

syncKottayamStockWithProducts();
