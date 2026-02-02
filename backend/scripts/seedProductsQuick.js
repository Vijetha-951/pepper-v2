import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import Product from '../src/models/Product.js';

// MongoDB connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB connected for seeding');
  } catch (err) {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  }
};

// All 21 pepper varieties with proper data
const pepperVarieties = [
  { name: 'Karimunda', type: 'Climber', category: 'Bush Pepper', description: 'Popular cultivar known for yield.', price: 120, stock: 50, image: '', propagationMethod: 'Rooted Cutting', maturityDuration: '2.5-3 years', bloomingSeason: 'April-June', plantAge: '8-12 Months' },
  { name: 'Naraya Pepper', type: 'Climber', category: 'Bush Pepper', description: 'Locally favored flavor profile.', price: 110, stock: 40, image: '', propagationMethod: 'Rooted Cutting', maturityDuration: '2-2.5 years', bloomingSeason: 'May-June', plantAge: '6-10 Months' },
  { name: 'Kumbukkan', type: 'Climber', category: 'Bush Pepper', description: 'Strong aroma, robust growth.', price: 115, stock: 35, image: '', propagationMethod: 'Rooted Cutting', maturityDuration: '2-2.5 years', bloomingSeason: 'April-June', plantAge: '8-12 Months' },
  { name: 'Randhalmunda', type: 'Climber', category: 'Bush Pepper', description: 'Good disease tolerance.', price: 130, stock: 30, image: '', propagationMethod: 'Rooted Cutting', maturityDuration: '2.5 years', bloomingSeason: 'April-June', plantAge: '8-10 Months' },
  { name: 'Kairali', type: 'Climber', category: 'Bush Pepper', description: 'Balanced flavor and yield.', price: 125, stock: 30, image: '', propagationMethod: 'Rooted Cutting', maturityDuration: '2 years', bloomingSeason: 'April-June', plantAge: '6-10 Months' },
  { name: 'Panniyur 1', type: 'Climber', category: 'Bush Pepper', description: 'High yielding selection.', price: 140, stock: 45, image: '', propagationMethod: 'Rooted Cutting', maturityDuration: '2-2.5 years', bloomingSeason: 'April-June', plantAge: '8-12 Months' },
  { name: 'Panniyur 2', type: 'Climber', category: 'Bush Pepper', description: 'Improved vigor.', price: 145, stock: 40, image: '', propagationMethod: 'Rooted Cutting', maturityDuration: '2-2.5 years', bloomingSeason: 'April-June', plantAge: '8-12 Months' },
  { name: 'Panniyur 3', type: 'Climber', category: 'Bush Pepper', description: 'Uniform spikes.', price: 150, stock: 35, image: '', propagationMethod: 'Rooted Cutting', maturityDuration: '2 years', bloomingSeason: 'April-June', plantAge: '8-10 Months' },
  { name: 'Panniyur 4', type: 'Climber', category: 'Bush Pepper', description: 'Good berry size.', price: 155, stock: 30, image: '', propagationMethod: 'Rooted Cutting', maturityDuration: '2.5 years', bloomingSeason: 'April-June', plantAge: '10-12 Months' },
  { name: 'Panniyur 5', type: 'Climber', category: 'Bush Pepper', description: 'Quality fruits.', price: 160, stock: 30, image: '', propagationMethod: 'Rooted Cutting', maturityDuration: '2-2.5 years', bloomingSeason: 'April-July', plantAge: '8-12 Months' },
  { name: 'Panniyur 6', type: 'Climber', category: 'Bush Pepper', description: 'Consistent producer.', price: 165, stock: 25, image: '', propagationMethod: 'Rooted Cutting', maturityDuration: '2.5 years', bloomingSeason: 'April-June', plantAge: '10-12 Months' },
  { name: 'Panniyur 7', type: 'Climber', category: 'Bush Pepper', description: 'Popular among growers.', price: 170, stock: 25, image: '', propagationMethod: 'Rooted Cutting', maturityDuration: '2 years', bloomingSeason: 'April-June', plantAge: '8-10 Months' },
  { name: 'Panniyur 8', type: 'Climber', category: 'Bush Pepper', description: 'Strong plant health.', price: 175, stock: 20, image: '', propagationMethod: 'Rooted Cutting', maturityDuration: '2-2.5 years', bloomingSeason: 'April-June', plantAge: '8-12 Months' },
  { name: 'Panniyur 9', type: 'Climber', category: 'Bush Pepper', description: 'Latest Panniyur line.', price: 180, stock: 20, image: '', propagationMethod: 'Rooted Cutting', maturityDuration: '2 years', bloomingSeason: 'April-July', plantAge: '8-10 Months' },
  { name: 'Vijay', type: 'Climber', category: 'Bush Pepper', description: 'Reliable cultivar.', price: 135, stock: 40, image: '', propagationMethod: 'Rooted Cutting', maturityDuration: '2.5-3 years', bloomingSeason: 'April-June', plantAge: '10-12 Months' },
  { name: 'Thekkan 1', type: 'Bush', category: 'Bush Pepper', description: 'Compact bush pepper.', price: 100, stock: 60, image: '', propagationMethod: 'Rooted Cutting', maturityDuration: '1.5-2 years', bloomingSeason: 'March-May', plantAge: '6-8 Months' },
  { name: 'Thekkan 2', type: 'Bush', category: 'Bush Pepper', description: 'Bush type, easy maintenance.', price: 105, stock: 55, image: '', propagationMethod: 'Rooted Cutting', maturityDuration: '1.5-2 years', bloomingSeason: 'March-May', plantAge: '6-8 Months' },
  { name: 'Neelamundi', type: 'Climber', category: 'Bush Pepper', description: 'Distinct taste.', price: 115, stock: 30, image: '', propagationMethod: 'Rooted Cutting', maturityDuration: '2.5-3 years', bloomingSeason: 'May-June', plantAge: '8-12 Months' },
  { name: 'Vattamundi', type: 'Climber', category: 'Bush Pepper', description: 'Roundish spike formation.', price: 120, stock: 30, image: '', propagationMethod: 'Rooted Cutting', maturityDuration: '2-2.5 years', bloomingSeason: 'April-June', plantAge: '8-10 Months' },
  { name: 'Vellamundi', type: 'Climber', category: 'Bush Pepper', description: 'Light-colored berries.', price: 120, stock: 30, image: '', propagationMethod: 'Rooted Cutting', maturityDuration: '2-2.5 years', bloomingSeason: 'April-July', plantAge: '8-10 Months' },
  { name: 'Kuthiravalley', type: 'Climber', category: 'Bush Pepper', description: 'Known regional variety.', price: 125, stock: 25, image: '', propagationMethod: 'Rooted Cutting', maturityDuration: '2.5-3 years', bloomingSeason: 'April-June', plantAge: '10-12 Months' },
];

const seedProducts = async () => {
  try {
    await connectDB();
    
    console.log('🌱 Starting product seeding...\n');
    
    // Check existing products
    const existingProducts = await Product.find({ name: { $in: pepperVarieties.map(p => p.name) } });
    const existingNames = existingProducts.map(p => p.name);
    const newVarieties = pepperVarieties.filter(p => !existingNames.includes(p.name));
    
    console.log(`📊 Product Status:`);
    console.log(`   - Existing varieties: ${existingNames.length}`);
    console.log(`   - New varieties to add: ${newVarieties.length}`);
    
    if (newVarieties.length === 0) {
      console.log('\n✅ All 21 pepper varieties already exist in the database!');
      console.log('📝 Existing varieties:');
      existingNames.forEach((name, index) => {
        console.log(`   ${index + 1}. ${name}`);
      });
    } else {
      console.log('\n🚀 Adding new varieties:');
      newVarieties.forEach((variety, index) => {
        console.log(`   ${index + 1}. ${variety.name} (${variety.type}) - ₹${variety.price}`);
      });
      
      const result = await Product.insertMany(newVarieties);
      console.log(`\n✅ Successfully seeded ${result.length} new pepper varieties!`);
    }
    
    // Final count
    const totalCount = await Product.countDocuments({});
    console.log(`\n📈 Total products in database: ${totalCount}`);
    
    // Show all varieties with their details
    const allProducts = await Product.find({}).sort({ type: 1, name: 1 });
    console.log('\n🌶️  All Pepper Varieties:');
    console.log('='.repeat(60));
    
    const climbers = allProducts.filter(p => p.type === 'Climber');
    const bushes = allProducts.filter(p => p.type === 'Bush');
    
    console.log(`\n🧗 Climber Varieties (${climbers.length}):`);
    climbers.forEach((product, index) => {
      const stockStatus = product.stock > 30 ? '🟢' : product.stock > 10 ? '🟡' : '🔴';
      console.log(`   ${index + 1}. ${product.name.padEnd(15)} - ₹${product.price.toString().padStart(3)} - Stock: ${product.stock.toString().padStart(2)} ${stockStatus}`);
    });
    
    console.log(`\n🌳 Bush Varieties (${bushes.length}):`);
    bushes.forEach((product, index) => {
      const stockStatus = product.stock > 30 ? '🟢' : product.stock > 10 ? '🟡' : '🔴';
      console.log(`   ${index + 1}. ${product.name.padEnd(15)} - ₹${product.price.toString().padStart(3)} - Stock: ${product.stock.toString().padStart(2)} ${stockStatus}`);
    });
    
    console.log('\n📊 Stock Legend: 🟢 High (>30) | 🟡 Medium (11-30) | 🔴 Low (≤10)');
    console.log('\n🎉 Seeding completed successfully!');
    
  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    if (error.name === 'ValidationError') {
      console.error('Validation errors:', error.errors);
    }
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Database connection closed.');
    process.exit(0);
  }
};

// Run the seeding
seedProducts();