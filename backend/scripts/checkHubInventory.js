import '../src/config/env.js';
import mongoose from 'mongoose';
import connectDB from '../src/config/db.js';
import HubInventory from '../src/models/HubInventory.js';
import Hub from '../src/models/Hub.js';
import Product from '../src/models/Product.js';

const checkHubInventory = async () => {
  try {
    await connectDB();
    console.log('✅ Connected to MongoDB\n');

    const hub = await Hub.findOne({ name: 'Kozhikode Hub' });
    if (!hub) {
      console.log('❌ Kozhikode Hub not found!');
      process.exit(1);
    }

    const product = await Product.findOne({ name: 'Vattamundi' });
    if (!product) {
      console.log('❌ Vattamundi product not found!');
      process.exit(1);
    }

    const hubInv = await HubInventory.findOne({
      hub: hub._id,
      product: product._id
    }).populate('product', 'name');

    console.log('📦 HUB INVENTORY CHECK:');
    console.log('======================');
    console.log('Hub:', hub.name);
    console.log('Product:', product.name);
    
    if (hubInv) {
      console.log('Total Quantity:', hubInv.quantity);
      console.log('Reserved Quantity:', hubInv.reservedQuantity);
      console.log('Available Quantity:', hubInv.getAvailableQuantity());
      console.log('\n📊 Stock Status:');
      console.log(`  - Can fulfill 14 units? ${hubInv.getAvailableQuantity() >= 14 ? '✅ YES' : '❌ NO'}`);
      console.log(`  - Has total stock of 14 units? ${hubInv.quantity >= 14 ? '✅ YES' : '❌ NO'}`);
    } else {
      console.log('❌ No inventory record found for this product at this hub!');
    }

    console.log('\n✅ Done!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

checkHubInventory();
