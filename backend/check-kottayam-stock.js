import mongoose from 'mongoose';
import HubInventory from './src/models/HubInventory.js';
import Hub from './src/models/Hub.js';
import Product from './src/models/Product.js';

mongoose.connect('mongodb://localhost:27017/pepper-db', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

async function checkKottayamStock() {
  try {
    console.log('🔍 Checking Kottayam Hub Inventory...\n');

    // Find Kottayam hub
    const kottayamHub = await Hub.findOne({ district: 'Kottayam' });
    if (!kottayamHub) {
      console.log('❌ Kottayam hub not found!');
      process.exit(1);
    }

    console.log(`✅ Found Hub: ${kottayamHub.name} (${kottayamHub.district})\n`);

    // Get all inventory for this hub
    const inventory = await HubInventory.find({ hub: kottayamHub._id })
      .populate('product', 'name')
      .lean();

    console.log(`📦 Total products in inventory: ${inventory.length}\n`);

    // Show inventory details
    inventory.forEach((item, index) => {
      const available = item.quantity - (item.reservedQuantity || 0);
      const status = available > 0 ? '✅' : '❌';
      
      console.log(`${status} ${index + 1}. ${item.product.name}`);
      console.log(`   Quantity: ${item.quantity}`);
      console.log(`   Reserved: ${item.reservedQuantity || 0}`);
      console.log(`   Available: ${available}`);
      console.log('');
    });

    // Check products with 0 available
    const zeroAvailable = inventory.filter(item => 
      (item.quantity - (item.reservedQuantity || 0)) <= 0
    );

    if (zeroAvailable.length > 0) {
      console.log(`\n⚠️  Products with 0 or negative available stock: ${zeroAvailable.length}`);
      zeroAvailable.forEach(item => {
        console.log(`   - ${item.product.name}: quantity=${item.quantity}, reserved=${item.reservedQuantity || 0}`);
      });
    }

    // Compare with Product stock
    console.log('\n\n🔄 Checking Product vs Hub Inventory mismatch...\n');
    
    const products = await Product.find({});
    
    for (const product of products) {
      const hubInv = inventory.find(inv => inv.product._id.toString() === product._id.toString());
      
      if (!hubInv) {
        console.log(`⚠️  ${product.name}: Product has ${product.available_stock} stock but NOT in Kottayam hub inventory`);
      } else {
        const hubAvailable = hubInv.quantity - (hubInv.reservedQuantity || 0);
        if (product.available_stock > 0 && hubAvailable === 0) {
          console.log(`❌ ${product.name}:`);
          console.log(`   Product stock: ${product.available_stock}`);
          console.log(`   Hub quantity: ${hubInv.quantity}`);
          console.log(`   Hub reserved: ${hubInv.reservedQuantity || 0}`);
          console.log(`   Hub available: ${hubAvailable}`);
          console.log(`   → MISMATCH: Product has stock but hub doesn't!\n`);
        }
      }
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    mongoose.connection.close();
  }
}

checkKottayamStock();
