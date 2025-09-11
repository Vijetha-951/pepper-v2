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
const products = pepperVarieties;

const seedDB = async () => {
  try {
    await Product.deleteMany({}); // clear previous data
    await Product.insertMany(products);
    console.log('✅ Products seeded successfully');
    process.exit();
  } catch (err) {
    console.error('❌ Seeding failed:', err.message);
    process.exit(1);
  }
};

seedDB();
