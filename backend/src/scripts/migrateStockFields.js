import mongoose from 'mongoose';
import Product from '../models/Product.js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../../.env') });

async function migrateStockFields() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find products missing available_stock or total_stock
    const productsNeedingMigration = await Product.find({
      $or: [
        { available_stock: { $exists: false } },
        { total_stock: { $exists: false } }
      ]
    });

    console.log(`📦 Products needing migration: ${productsNeedingMigration.length}\n`);

    if (productsNeedingMigration.length === 0) {
      console.log('✅ All products already have stock fields!');
      return;
    }

    let migratedCount = 0;

    for (const product of productsNeedingMigration) {
      const updates = {};

      // If available_stock is missing, copy from stock
      if (product.available_stock === undefined || product.available_stock === null) {
        updates.available_stock = product.stock || 0;
      }

      // If total_stock is missing, copy from stock
      if (product.total_stock === undefined || product.total_stock === null) {
        updates.total_stock = product.stock || 0;
      }

      if (Object.keys(updates).length > 0) {
        await Product.findByIdAndUpdate(product._id, { $set: updates });
        console.log(`✅ Migrated: ${product.name}`);
        console.log(`   stock: ${product.stock} → available_stock: ${updates.available_stock}, total_stock: ${updates.total_stock}\n`);
        migratedCount++;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('MIGRATION SUMMARY:');
    console.log('='.repeat(60));
    console.log(`Products migrated: ${migratedCount}`);
    console.log('='.repeat(60));

    // Verify the migration
    console.log('\n🔍 Verifying migration...\n');
    
    const allProducts = await Product.find({});
    const availableProducts = await Product.find({ available_stock: { $gt: 0 } });
    const outOfStock = await Product.find({ available_stock: { $lte: 0 } });
    const missingFields = await Product.find({
      $or: [
        { available_stock: { $exists: false } },
        { total_stock: { $exists: false } }
      ]
    });

    console.log(`Total products: ${allProducts.length}`);
    console.log(`✅ Products with available_stock > 0: ${availableProducts.length}`);
    console.log(`❌ Products with available_stock <= 0: ${outOfStock.length}`);
    console.log(`⚠️ Products still missing fields: ${missingFields.length}`);
    
    console.log('\n' + '='.repeat(60));
    console.log('EXPECTED RESULT:');
    console.log('='.repeat(60));
    console.log(`Users should now see ${availableProducts.length} products (instead of 13)`);
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
  }
}

migrateStockFields();