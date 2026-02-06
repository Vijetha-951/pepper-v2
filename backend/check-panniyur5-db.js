import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Product from './src/models/Product.js';

dotenv.config();

async function checkPanniyur5() {
  try {
    const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
    console.log('Connecting to MongoDB...');
    await mongoose.connect(uri);
    
    console.log('\n═══════════════════════════════════════');
    console.log('  Checking Panniyur 5 Product Data');
    console.log('═══════════════════════════════════════\n');
    
    const product = await Product.findOne({ name: 'Panniyur 5' });
    
    if (product) {
      console.log('✅ Product found in database');
      console.log('');
      console.log('Product Details:');
      console.log('  Name:', product.name);
      console.log('  Variety:', product.variety);
      console.log('  Type:', product.type);
      console.log('  ID:', product._id);
      console.log('  Price:', product.price);
      console.log('  Stock:', product.stock);
      console.log('');
      
      // Now test prediction with this exact variety value
      const axios = (await import('axios')).default;
      console.log('Testing prediction with database variety value...');
      const response = await axios.post('http://localhost:5000/api/seasonal-suitability/predict', {
        variety: product.variety,
        month: 2,
        district: 'Kottayam',
        pincode: 686001,
        temperature: 25,
        rainfall: 50,
        humidity: 75,
        waterAvailability: 'Medium',
        productId: product._id.toString()
      });
      
      console.log('');
      console.log('Prediction Result:');
      console.log('  Suitability:', response.data.data.suitability);
      console.log('  Confidence:', response.data.data.confidence);
      console.log('  Tips:', response.data.data.tips);
      console.log('');
      
    } else {
      console.log('❌ Product NOT found in database');
    }
    
    await mongoose.connection.close();
    console.log('Done!');
    
  } catch (error) {
    console.error('Error:', error.message);
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
    }
  }
}

checkPanniyur5();
