import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Product from './src/models/Product.js';

dotenv.config();

// Products the user wants to keep (21 products)
const productsToKeep = [
  'Karimunda',
  'Naraya Pepper',
  'Kumbukkan',
  'Randhalmunda',
  'Kairali',
  'Panniyur 1',
  'Panniyur 2',
  'Panniyur 3',
  'Panniyur 4',
  'Panniyur 5',
  'Panniyur 6',
  'Panniyur 7',
  'Panniyur 8',
  'Panniyur 9',
  'Vijay',
  'Thekkan 1',
  'Thekkan 2',
  'Neelamundi',
  'Vattamundi',
  'Vellamundi',
  'Kuthiravalley'
];

async function cleanupProducts() {
  try {
    const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
    await mongoose.connect(uri);
    
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('  Cleaning Up Product Database');
    console.log('═══════════════════════════════════════════════════════\n');
    
    // Get all products
    const allProducts = await Product.find({});
    console.log(`Found ${allProducts.length} total products in database\n`);
    
    // Separate into keep and remove
    const toKeep = [];
    const toRemove = [];
    
    for (const product of allProducts) {
      if (productsToKeep.includes(product.name)) {
        toKeep.push(product);
      } else {
        toRemove.push(product);
      }
    }
    
    console.log('─'.repeat(60));
    console.log(`✅ Products to KEEP (${toKeep.length}):`);
    console.log('─'.repeat(60));
    toKeep.forEach((p, i) => {
      console.log(`${(i + 1).toString().padStart(2, ' ')}. ${p.name.padEnd(20)} (${p.type}, ${p.variety})`);
    });
    
    console.log('\n' + '─'.repeat(60));
    console.log(`❌ Products to REMOVE (${toRemove.length}):`);
    console.log('─'.repeat(60));
    toRemove.forEach((p, i) => {
      console.log(`${(i + 1).toString().padStart(2, ' ')}. ${p.name.padEnd(20)} (${p.type}, ${p.variety})`);
    });
    
    if (toRemove.length > 0) {
      console.log('\n' + '═'.repeat(60));
      console.log('Deactivating removed products...');
      console.log('═'.repeat(60) + '\n');
      
      for (const product of toRemove) {
        await Product.updateOne(
          { _id: product._id },
          { $set: { isActive: false } }
        );
        console.log(`❌ Deactivated: ${product.name}`);
      }
    }
    
    console.log('\n' + '═'.repeat(60));
    console.log('✅ Cleanup Complete!');
    console.log('═'.repeat(60));
    console.log(`\nFinal count: ${toKeep.length} active products`);
    console.log(`Deactivated: ${toRemove.length} products\n`);
    
    await mongoose.connection.close();
    
  } catch (error) {
    console.error('Error:', error.message);
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
    }
  }
}

cleanupProducts();
