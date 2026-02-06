import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Product from './src/models/Product.js';
import axios from 'axios';

dotenv.config();

async function checkAllProductsWithSpecs() {
  try {
    const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
    await mongoose.connect(uri);
    
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('  Testing All Products with Their Specifications');
    console.log('═══════════════════════════════════════════════════════\n');
    
    const products = await Product.find({ isActive: true }).sort({ name: 1 });
    
    for (const product of products) {
      console.log(`\n${'─'.repeat(60)}`);
      console.log(`📦 ${product.name}`);
      console.log(`${'─'.repeat(60)}`);
      console.log('Database Fields:');
      console.log('  Variety:', product.variety || 'NOT SET');
      console.log('  Type:', product.type);
      console.log('  Age:', product.plantAge || 'NOT SET');
      console.log('  Mature:', product.isMature || false);
      console.log('  Blooming:', product.isCurrentlyBlooming || false);
      console.log('  Maturity Duration:', product.maturityDuration || 'NOT SET');
      console.log('  Propagation:', product.propagationMethod);
      console.log('  Growth Rate:', product.growthRate);
      
      if (product.variety) {
        try {
          const response = await axios.post('http://localhost:5000/api/seasonal-suitability/predict', {
            variety: product.variety,
            month: 2,
            district: 'Kottayam',
            pincode: 686001,
            temperature: 25,
            rainfall: 50,
            humidity: 75,
            waterAvailability: 'Medium',
            productId: product._id.toString(),
            plantAge: product.plantAge,
            isMature: product.isMature,
            isCurrentlyBlooming: product.isCurrentlyBlooming,
            maturityDuration: product.maturityDuration
          });
          
          const result = response.data.data;
          const icon = result.suitability === 'Recommended' ? '✅' : 
                       result.suitability === 'Plant with Care' ? '⚠️' : '❌';
          
          console.log('\nPrediction:');
          console.log(`  ${icon} ${result.suitability}`);
          console.log('  Confidence:', result.confidence);
          console.log('  Tips:', result.tips.slice(0, 2).join(', '));
          
        } catch (error) {
          console.log('\n❌ Prediction Error:', error.message);
        }
      } else {
        console.log('\n⚠️ No variety set - skipping prediction');
      }
    }
    
    await mongoose.connection.close();
    console.log('\n\n✅ Testing complete!\n');
    
  } catch (error) {
    console.error('Error:', error.message);
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
    }
  }
}

checkAllProductsWithSpecs();
