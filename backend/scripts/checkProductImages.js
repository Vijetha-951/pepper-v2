import mongoose from 'mongoose';
import Product from '../src/models/Product.js';
import dotenv from 'dotenv';

dotenv.config();

async function checkProductImages() {
  try {
    console.log('\n🔍 Checking Product Images in Database\n');
    console.log('═══════════════════════════════════════\n');

    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    const products = await Product.find({});
    
    console.log(`Found ${products.length} products in database\n`);
    
    let withImages = 0;
    let withoutImages = 0;
    
    products.forEach((product, index) => {
      const hasImage = product.image && product.image !== '' && product.image !== '/default-product.jpg';
      
      if (hasImage) {
        withImages++;
        console.log(`${index + 1}. ${product.name}`);
        console.log(`   Image: ${product.image}`);
        console.log(`   Price: ₹${product.price}`);
        console.log('');
      } else {
        withoutImages++;
      }
    });

    console.log('═══════════════════════════════════════');
    console.log(`\n📊 Summary:`);
    console.log(`   • Total Products: ${products.length}`);
    console.log(`   • With Images: ${withImages}`);
    console.log(`   • Without Images: ${withoutImages}\n`);
    
    if (withImages > 0) {
      console.log('💡 Product images are stored in MongoDB database.');
      console.log('   Git revert does NOT affect database content.');
      console.log('\n   To reset product images, you need to:');
      console.log('   1. Clear image URLs from database');
      console.log('   2. Delete physical image files (if any)\n');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkProductImages();
