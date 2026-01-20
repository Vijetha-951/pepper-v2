import mongoose from 'mongoose';
import Product from '../src/models/Product.js';
import dotenv from 'dotenv';

dotenv.config();

async function resetProductImages() {
  try {
    console.log('\n🧹 Resetting All Product Images\n');
    console.log('═══════════════════════════════════════\n');

    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    const beforeCount = await Product.countDocuments({ 
      image: { $exists: true, $ne: '', $ne: '/default-product.jpg' } 
    });
    
    console.log(`📸 Products with images: ${beforeCount}\n`);

    if (beforeCount === 0) {
      console.log('✅ No product images to reset\n');
      process.exit(0);
    }

    const result = await Product.updateMany(
      {},
      { $set: { image: '' } }
    );

    console.log(`✅ Reset completed!`);
    console.log(`   • Products updated: ${result.modifiedCount}\n`);
    
    const afterCount = await Product.countDocuments({ 
      image: { $exists: true, $ne: '', $ne: '/default-product.jpg' } 
    });
    
    console.log(`📊 Verification:`);
    console.log(`   • Before: ${beforeCount} products with images`);
    console.log(`   • After:  ${afterCount} products with images\n`);
    
    console.log('═══════════════════════════════════════');
    console.log('\n✨ All pepper product images have been removed from database\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

resetProductImages();
