import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import Product from '../src/models/Product.js';
import pepperVarieties from './seedProducts.js';

// MongoDB connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB connected for seeding'))
  .catch(err => {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  });

// Use the predefined pepper varieties from seedProducts.js
// Add total_stock and available_stock fields to match the stock value
const products = pepperVarieties.map(p => ({
  ...p,
  total_stock: p.stock || 0,
  available_stock: p.stock || 0
}));

const seedDB = async () => {
  try {
    await Product.deleteMany({}); // clear previous data
    await Product.insertMany(products);
    console.log('✅ Products seeded successfully');
    console.log('✅ Stock fields (total_stock, available_stock) initialized');
    process.exit();
  } catch (err) {
    console.error('❌ Seeding failed:', err.message);
    process.exit(1);
  }
};

seedDB();
