import mongoose from 'mongoose';
import Product from '../models/Product.js';
import '../config/env.js';

/**
 * Script to sync stock fields across all products
 * This ensures available_stock, total_stock, and stock are consistent
 */

async function syncStockFields() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGO_URI environment variable is not set');
    }
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    console.log('\n📊 Fetching all products...');
    const products = await Product.find({});
    console.log(`Found ${products.length} products\n`);

    let fixedCount = 0;
    let issuesFound = [];

    for (const product of products) {
      const before = {
        stock: product.stock,
        available_stock: product.available_stock,
        total_stock: product.total_stock
      };

      let needsUpdate = false;

      // Check for inconsistencies
      if (product.available_stock !== product.stock) {
        needsUpdate = true;
        issuesFound.push({
          name: product.name,
          issue: 'available_stock and stock mismatch',
          before: { ...before }
        });
      }

      // Check for negative stock
      if (product.available_stock < 0 || product.stock < 0) {
        needsUpdate = true;
        issuesFound.push({
          name: product.name,
          issue: 'negative stock detected',
          before: { ...before }
        });
      }

      // Fix: Use the maximum of stock and available_stock as the source of truth
      // If both are negative, set to 0
      if (needsUpdate) {
        const correctAvailableStock = Math.max(0, Math.max(product.stock || 0, product.available_stock || 0));
        
        // If total_stock is less than available_stock, update it
        const correctTotalStock = Math.max(product.total_stock || 0, correctAvailableStock);

        product.available_stock = correctAvailableStock;
        product.stock = correctAvailableStock;
        product.total_stock = correctTotalStock;

        await product.save();
        fixedCount++;

        console.log(`✅ Fixed: ${product.name}`);
        console.log(`   Before: stock=${before.stock}, available=${before.available_stock}, total=${before.total_stock}`);
        console.log(`   After:  stock=${product.stock}, available=${product.available_stock}, total=${product.total_stock}\n`);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log(`📊 Summary:`);
    console.log(`   Total products: ${products.length}`);
    console.log(`   Products fixed: ${fixedCount}`);
    console.log(`   Issues found: ${issuesFound.length}`);
    console.log('='.repeat(60));

    if (issuesFound.length > 0) {
      console.log('\n⚠️  Issues that were fixed:');
      issuesFound.forEach((issue, index) => {
        console.log(`\n${index + 1}. ${issue.name}`);
        console.log(`   Issue: ${issue.issue}`);
        console.log(`   Before: stock=${issue.before.stock}, available=${issue.before.available_stock}, total=${issue.before.total_stock}`);
      });
    }

    console.log('\n✅ Stock synchronization completed successfully!');
    
  } catch (error) {
    console.error('❌ Error syncing stock fields:', error);
    throw error;
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 MongoDB connection closed');
  }
}

// Run the script
syncStockFields()
  .then(() => {
    console.log('\n✨ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Script failed:', error);
    process.exit(1);
  });