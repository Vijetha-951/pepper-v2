import mongoose from 'mongoose';
import Product from '../models/Product.js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../../.env') });

async function testProductsAPI() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Test 1: All products
    const allProducts = await Product.find({});
    console.log(`📦 Total products in database: ${allProducts.length}\n`);

    // Test 2: Products with available_stock > 0 (what API should return)
    const availableProducts = await Product.find({ available_stock: { $gt: 0 } });
    console.log(`✅ Products with available_stock > 0: ${availableProducts.length}`);
    console.log('Products that SHOULD be visible:');
    availableProducts.forEach((p, i) => {
      console.log(`  ${i + 1}. ${p.name} - Stock: ${p.available_stock}, Active: ${p.isActive}`);
    });

    // Test 3: Products with available_stock = 0 (should be hidden)
    const outOfStock = await Product.find({ available_stock: { $lte: 0 } });
    console.log(`\n❌ Products with available_stock <= 0: ${outOfStock.length}`);
    if (outOfStock.length > 0) {
      console.log('Products that should be HIDDEN:');
      outOfStock.forEach((p, i) => {
        console.log(`  ${i + 1}. ${p.name} - Stock: ${p.available_stock}, Active: ${p.isActive}`);
      });
    }

    // Test 4: Check isActive status
    const inactiveProducts = await Product.find({ isActive: false });
    console.log(`\n⚠️ Inactive products (isActive: false): ${inactiveProducts.length}`);
    if (inactiveProducts.length > 0) {
      console.log('Inactive products:');
      inactiveProducts.forEach((p, i) => {
        console.log(`  ${i + 1}. ${p.name} - Stock: ${p.available_stock}, Active: ${p.isActive}`);
      });
    }

    // Test 5: Products that should be visible (available_stock > 0 AND isActive = true)
    const visibleProducts = await Product.find({ 
      available_stock: { $gt: 0 },
      isActive: true 
    });
    console.log(`\n🎯 Products that should be visible (stock > 0 AND active): ${visibleProducts.length}`);

    // Test 6: Check if any products have null/undefined available_stock
    const nullStock = await Product.find({ 
      $or: [
        { available_stock: null },
        { available_stock: { $exists: false } }
      ]
    });
    console.log(`\n⚠️ Products with null/undefined available_stock: ${nullStock.length}`);
    if (nullStock.length > 0) {
      console.log('Products with missing stock data:');
      nullStock.forEach((p, i) => {
        console.log(`  ${i + 1}. ${p.name} - available_stock: ${p.available_stock}`);
      });
    }

    console.log('\n' + '='.repeat(60));
    console.log('SUMMARY:');
    console.log('='.repeat(60));
    console.log(`Total products: ${allProducts.length}`);
    console.log(`Should be visible (stock > 0): ${availableProducts.length}`);
    console.log(`Should be hidden (stock <= 0): ${outOfStock.length}`);
    console.log(`Inactive products: ${inactiveProducts.length}`);
    console.log(`Visible AND active: ${visibleProducts.length}`);
    console.log(`Missing stock data: ${nullStock.length}`);
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
  }
}

testProductsAPI();