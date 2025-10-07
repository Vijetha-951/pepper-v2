import mongoose from 'mongoose';
import Product from '../models/Product.js';
import '../config/env.js';

/**
 * Script to check all products and their stock status
 */

async function checkProductStock() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGO_URI environment variable is not set');
    }
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');

    console.log('📊 Fetching all products...');
    const products = await Product.find({}).sort({ name: 1 });
    console.log(`Found ${products.length} total products\n`);

    console.log('='.repeat(100));
    console.log('PRODUCT STOCK REPORT');
    console.log('='.repeat(100));
    console.log(
      'Name'.padEnd(30) + 
      'Stock'.padEnd(10) + 
      'Available'.padEnd(12) + 
      'Total'.padEnd(10) + 
      'Status'
    );
    console.log('-'.repeat(100));

    let inStock = 0;
    let outOfStock = 0;
    let lowStock = 0;

    products.forEach(product => {
      const stock = product.stock || 0;
      const available = product.available_stock || 0;
      const total = product.total_stock || 0;
      
      let status = '';
      if (available <= 0) {
        status = '❌ OUT OF STOCK';
        outOfStock++;
      } else if (available <= 5) {
        status = '⚠️  LOW STOCK';
        lowStock++;
      } else {
        status = '✅ IN STOCK';
        inStock++;
      }

      console.log(
        product.name.substring(0, 28).padEnd(30) + 
        stock.toString().padEnd(10) + 
        available.toString().padEnd(12) + 
        total.toString().padEnd(10) + 
        status
      );
    });

    console.log('-'.repeat(100));
    console.log('\n📈 SUMMARY:');
    console.log(`   Total Products: ${products.length}`);
    console.log(`   ✅ In Stock (available_stock > 5): ${inStock}`);
    console.log(`   ⚠️  Low Stock (available_stock 1-5): ${lowStock}`);
    console.log(`   ❌ Out of Stock (available_stock = 0): ${outOfStock}`);
    console.log(`\n   🛒 Products visible to users: ${inStock + lowStock}`);
    console.log(`   🚫 Products hidden from users: ${outOfStock}`);

    console.log('\n✅ Check complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkProductStock();