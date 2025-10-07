import mongoose from 'mongoose';
import Product from '../models/Product.js';
import '../config/env.js';

/**
 * Script to check products and their isActive status
 */

async function checkProductActive() {
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
    console.log('PRODUCT ACTIVE STATUS REPORT');
    console.log('='.repeat(100));
    console.log(
      'Name'.padEnd(30) + 
      'Available'.padEnd(12) + 
      'isActive'.padEnd(12) + 
      'Visible to Users?'
    );
    console.log('-'.repeat(100));

    let visibleCount = 0;
    let hiddenByStock = 0;
    let hiddenByActive = 0;
    let hiddenByBoth = 0;

    products.forEach(product => {
      const available = product.available_stock || 0;
      const isActive = product.isActive !== false; // Default to true if undefined
      
      let visibleToUsers = '';
      if (available > 0 && isActive) {
        visibleToUsers = '✅ YES';
        visibleCount++;
      } else if (available <= 0 && !isActive) {
        visibleToUsers = '❌ NO (Stock=0 & Inactive)';
        hiddenByBoth++;
      } else if (available <= 0) {
        visibleToUsers = '❌ NO (Stock=0)';
        hiddenByStock++;
      } else if (!isActive) {
        visibleToUsers = '❌ NO (Inactive)';
        hiddenByActive++;
      }

      console.log(
        product.name.substring(0, 28).padEnd(30) + 
        available.toString().padEnd(12) + 
        (isActive ? 'true' : 'false').padEnd(12) + 
        visibleToUsers
      );
    });

    console.log('-'.repeat(100));
    console.log('\n📈 SUMMARY:');
    console.log(`   Total Products: ${products.length}`);
    console.log(`   ✅ Visible to Users: ${visibleCount}`);
    console.log(`   ❌ Hidden (Stock=0): ${hiddenByStock}`);
    console.log(`   ❌ Hidden (isActive=false): ${hiddenByActive}`);
    console.log(`   ❌ Hidden (Both): ${hiddenByBoth}`);
    console.log(`   Total Hidden: ${hiddenByStock + hiddenByActive + hiddenByBoth}`);

    if (hiddenByActive > 0 || hiddenByBoth > 0) {
      console.log('\n⚠️  WARNING: Some products are hidden due to isActive=false');
      console.log('   To show them, update isActive to true in the database or admin panel.');
    }

    console.log('\n✅ Check complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkProductActive();