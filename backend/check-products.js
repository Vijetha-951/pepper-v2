// Check products in database
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config({ path: '.env' });

// Simple product schema for checking
const ProductSchema = new mongoose.Schema({
  name: String,
  type: String,
  price: Number,
  stock: Number,
  total_stock: Number,
  available_stock: Number
}, { timestamps: true });

const Product = mongoose.model('Product', ProductSchema);

async function checkProducts() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pepper-db');
    console.log('Connected to MongoDB');

    const products = await Product.find({}).limit(5);
    console.log(`\nFound ${products.length} products in database:`);
    
    products.forEach((product, index) => {
      console.log(`${index + 1}. ${product.name}`);
      console.log(`   Type: ${product.type}`);
      console.log(`   Price: ₹${product.price}`);
      console.log(`   Stock: ${product.stock}`);
      console.log(`   Total Stock: ${product.total_stock || 'undefined'}`);
      console.log(`   Available Stock: ${product.available_stock || 'undefined'}`);
      console.log('');
    });

    if (products.length === 0) {
      console.log('❌ No products found. You need to add products first.');
      console.log('💡 Try seeding products first via the Admin Product Management page.');
    } else {
      console.log('✅ Products found! Stock management should work once auth is resolved.');
    }

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkProducts();