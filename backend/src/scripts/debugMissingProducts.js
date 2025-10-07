import mongoose from 'mongoose';
import Product from '../models/Product.js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../../.env') });

async function debugMissingProducts() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get all products
    const allProducts = await Product.find({}).lean();
    console.log(`📦 Total products: ${allProducts.length}\n`);

    // Products matching the query
    const matchingQuery = await Product.find({ available_stock: { $gt: 0 } }).lean();
    console.log(`✅ Products matching { available_stock: { $gt: 0 } }: ${matchingQuery.length}\n`);

    // Find the missing ones
    const matchingIds = new Set(matchingQuery.map(p => p._id.toString()));
    const missingProducts = allProducts.filter(p => 
      !matchingIds.has(p._id.toString()) && p.available_stock !== 0
    );

    console.log(`❓ Products NOT matching query (but should): ${missingProducts.length}\n`);

    if (missingProducts.length > 0) {
      console.log('Detailed analysis of missing products:\n');
      missingProducts.forEach((p, i) => {
        console.log(`${i + 1}. ${p.name}`);
        console.log(`   _id: ${p._id}`);
        console.log(`   available_stock: ${p.available_stock} (type: ${typeof p.available_stock})`);
        console.log(`   available_stock === null: ${p.available_stock === null}`);
        console.log(`   available_stock === undefined: ${p.available_stock === undefined}`);
        console.log(`   available_stock > 0: ${p.available_stock > 0}`);
        console.log(`   Has 'available_stock' field: ${p.hasOwnProperty('available_stock')}`);
        console.log(`   JSON: ${JSON.stringify({
          name: p.name,
          available_stock: p.available_stock,
          total_stock: p.total_stock,
          stock: p.stock
        })}\n`);
      });
    }

    // Check the raw MongoDB data
    console.log('\n🔍 Checking raw MongoDB data for one missing product...\n');
    if (missingProducts.length > 0) {
      const firstMissing = missingProducts[0];
      const rawDoc = await mongoose.connection.db
        .collection('products')
        .findOne({ _id: firstMissing._id });
      
      console.log('Raw document from MongoDB:');
      console.log(JSON.stringify(rawDoc, null, 2));
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
  }
}

debugMissingProducts();