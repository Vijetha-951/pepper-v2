import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Product from './src/models/Product.js';
import axios from 'axios';

dotenv.config();

// Map product names to their correct varieties
const varietyMapping = {
  // Karimunda variety products
  'Karimunda': 'Karimunda',
  'Naraya Pepper': 'Karimunda',
  'Kumbukkan': 'Karimunda',
  'Randhalmunda': 'Karimunda',
  'Kairali': 'Karimunda',
  'Neelamundi': 'Karimunda',
  'Vattamundi': 'Karimunda',
  'Vellamundi': 'Karimunda',
  'Kuthiravalley': 'Karimunda',
  
  // Panniyur varieties
  'Panniyur 1': 'Panniyur 1',
  'Panniyur 2': 'Panniyur 1', // Assuming same variety
  'Panniyur 3': 'Panniyur 1',
  'Panniyur 4': 'Panniyur 1',
  'Panniyur 5': 'Panniyur 5',
  'Panniyur 6': 'Panniyur 5',
  'Panniyur 7': 'Panniyur 5',
  'Panniyur 8': 'Panniyur 5',
  'Panniyur 9': 'Panniyur 5',
  
  // Other varieties
  'Vijay': 'Pournami', // High-yield variety
  'Thekkan 1': 'Sreekara', // High-yield variety
  'Thekkan 2': 'Sreekara',
};

async function updateAndTestVarieties() {
  try {
    const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
    await mongoose.connect(uri);
    
    console.log('\n╔═══════════════════════════════════════════════════════════╗');
    console.log('║    SEASONAL SUITABILITY FOR YOUR 21 PRODUCTS             ║');
    console.log('║    (February 2026)                                        ║');
    console.log('╚═══════════════════════════════════════════════════════════╝\n');
    
    const recommended = [];
    const plantWithCare = [];
    
    for (const [productName, varietyName] of Object.entries(varietyMapping)) {
      // Update the product variety
      const product = await Product.findOne({ name: productName, isActive: true });
      
      if (!product) {
        console.log(`⚠️  Product not found: ${productName}`);
        continue;
      }
      
      // Update variety
      await Product.updateOne(
        { _id: product._id },
        { $set: { variety: varietyName } }
      );
      
      // Test prediction
      try {
        const response = await axios.post('http://localhost:5000/api/seasonal-suitability/predict', {
          variety: varietyName,
          month: 2,
          district: 'Kottayam',
          pincode: 686001,
          temperature: 25,
          rainfall: 50,
          humidity: 75,
          waterAvailability: 'Medium',
          productId: product._id.toString()
        });
        
        const result = response.data.data;
        
        if (result.suitability === 'Recommended') {
          recommended.push({
            name: productName,
            variety: varietyName,
            confidence: result.confidence
          });
        } else {
          plantWithCare.push({
            name: productName,
            variety: varietyName,
            confidence: result.confidence
          });
        }
        
      } catch (error) {
        console.log(`❌ Error testing ${productName}:`, error.message);
      }
    }
    
    // Display results
    console.log('\n' + '═'.repeat(60));
    console.log(`✅ RECOMMENDED (${recommended.length} products)`);
    console.log('═'.repeat(60));
    recommended.forEach((p, i) => {
      console.log(`${(i + 1).toString().padStart(2, ' ')}. ${p.name.padEnd(25)} (${p.variety})`);
      console.log(`    └─ Confidence: ${p.confidence}`);
    });
    
    console.log('\n' + '═'.repeat(60));
    console.log(`⚠️  PLANT WITH CARE (${plantWithCare.length} products)`);
    console.log('═'.repeat(60));
    plantWithCare.forEach((p, i) => {
      console.log(`${(i + 1).toString().padStart(2, ' ')}. ${p.name.padEnd(25)} (${p.variety})`);
      console.log(`    └─ Confidence: ${p.confidence}`);
    });
    
    console.log('\n' + '═'.repeat(60));
    console.log('✅ Update Complete!');
    console.log('═'.repeat(60));
    console.log(`\nTotal: ${recommended.length + plantWithCare.length} products updated`);
    console.log(`✓ Recommended: ${recommended.length}`);
    console.log(`⚠ Plant with Care: ${plantWithCare.length}\n`);
    
    await mongoose.connection.close();
    
  } catch (error) {
    console.error('Error:', error.message);
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
    }
  }
}

updateAndTestVarieties();
