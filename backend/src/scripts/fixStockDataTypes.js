import mongoose from 'mongoose';
import Product from '../models/Product.js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../../.env') });

async function fixStockDataTypes() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get all products
    const allProducts = await Product.find({});
    console.log(`📦 Total products: ${allProducts.length}\n`);

    let fixedCount = 0;
    let alreadyCorrect = 0;

    for (const product of allProducts) {
      const needsUpdate = {};
      let hasIssue = false;

      // Check available_stock
      if (product.available_stock !== undefined && product.available_stock !== null) {
        const currentType = typeof product.available_stock;
        const currentValue = product.available_stock;
        
        if (currentType !== 'number') {
          console.log(`⚠️ ${product.name}:`);
          console.log(`   available_stock: "${currentValue}" (type: ${currentType})`);
          needsUpdate.available_stock = Number(currentValue) || 0;
          hasIssue = true;
        }
      }

      // Check total_stock
      if (product.total_stock !== undefined && product.total_stock !== null) {
        const currentType = typeof product.total_stock;
        const currentValue = product.total_stock;
        
        if (currentType !== 'number') {
          console.log(`⚠️ ${product.name}:`);
          console.log(`   total_stock: "${currentValue}" (type: ${currentType})`);
          needsUpdate.total_stock = Number(currentValue) || 0;
          hasIssue = true;
        }
      }

      // Check stock (legacy)
      if (product.stock !== undefined && product.stock !== null) {
        const currentType = typeof product.stock;
        const currentValue = product.stock;
        
        if (currentType !== 'number') {
          console.log(`⚠️ ${product.name}:`);
          console.log(`   stock: "${currentValue}" (type: ${currentType})`);
          needsUpdate.stock = Number(currentValue) || 0;
          hasIssue = true;
        }
      }

      if (hasIssue) {
        // Update the product
        await Product.findByIdAndUpdate(product._id, { $set: needsUpdate });
        console.log(`   ✅ Fixed: ${JSON.stringify(needsUpdate)}\n`);
        fixedCount++;
      } else {
        alreadyCorrect++;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('SUMMARY:');
    console.log('='.repeat(60));
    console.log(`Total products: ${allProducts.length}`);
    console.log(`Fixed: ${fixedCount}`);
    console.log(`Already correct: ${alreadyCorrect}`);
    console.log('='.repeat(60));

    // Verify the fix
    console.log('\n🔍 Verifying fix...\n');
    const availableProducts = await Product.find({ available_stock: { $gt: 0 } });
    console.log(`✅ Products now matching available_stock > 0: ${availableProducts.length}`);
    
    const outOfStock = await Product.find({ available_stock: { $lte: 0 } });
    console.log(`❌ Products with available_stock <= 0: ${outOfStock.length}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
  }
}

fixStockDataTypes();