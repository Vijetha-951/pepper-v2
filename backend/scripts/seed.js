import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import Product from '../src/models/product.js';
 // adjust path if needed

// MongoDB connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB connected for seeding'))
  .catch(err => {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  });

// 21 Pepper varieties
const products = [
  { name: "Karimunda", type: "Climber", category: "Bush Pepper", description: "Popular pepper variety", price: 100, stock: 50 },
  { name: "Naraya Pepper", type: "Climber", category: "Bush Pepper", description: "High-quality pepper", price: 120, stock: 40 },
  { name: "Kumbukkan", type: "Climber", category: "Bush Pepper", description: "Spicy pepper", price: 90, stock: 30 },
  { name: "Randhalmunda", type: "Bush", category: "Bush Pepper", description: "Sweet pepper", price: 110, stock: 60 },
  { name: "Kairali", type: "Bush", category: "Bush Pepper", description: "Local variety", price: 95, stock: 35 },
  { name: "Panniyur 1", type: "Climber", category: "Bush Pepper", description: "High yield", price: 105, stock: 50 },
  { name: "Panniyur 2", type: "Climber", category: "Bush Pepper", description: "Disease resistant", price: 108, stock: 45 },
  { name: "Panniyur 3", type: "Climber", category: "Bush Pepper", description: "Quality pepper", price: 102, stock: 40 },
  { name: "Panniyur 4", type: "Climber", category: "Bush Pepper", description: "Good flavor", price: 99, stock: 35 },
  { name: "Panniyur 5", type: "Climber", category: "Bush Pepper", description: "Popular variety", price: 101, stock: 50 },
  { name: "Panniyur 6", type: "Climber", category: "Bush Pepper", description: "High demand", price: 107, stock: 45 },
  { name: "Panniyur 7", type: "Climber", category: "Bush Pepper", description: "Spicy taste", price: 110, stock: 40 },
  { name: "Panniyur 8", type: "Climber", category: "Bush Pepper", description: "Rich aroma", price: 112, stock: 30 },
  { name: "Panniyur 9", type: "Climber", category: "Bush Pepper", description: "Premium quality", price: 115, stock: 25 },
  { name: "Vijay", type: "Bush", category: "Bush Pepper", description: "Local favorite", price: 100, stock: 50 },
  { name: "Thekkan 1", type: "Bush", category: "Bush Pepper", description: "Good for farming", price: 105, stock: 40 },
  { name: "Thekkan 2", type: "Bush", category: "Bush Pepper", description: "High yield", price: 108, stock: 35 },
  { name: "Neelamundi", type: "Climber", category: "Bush Pepper", description: "Spicy flavor", price: 110, stock: 30 },
  { name: "Vattamundi", type: "Climber", category: "Bush Pepper", description: "Strong aroma", price: 102, stock: 25 },
  { name: "Vellamundi", type: "Climber", category: "Bush Pepper", description: "Popular variety", price: 100, stock: 50 },
  { name: "Kuthiravalley", type: "Bush", category: "Bush Pepper", description: "Premium quality", price: 120, stock: 20 },
];

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
