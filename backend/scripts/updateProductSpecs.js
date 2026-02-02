import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import Product from '../src/models/Product.js';

// MongoDB connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB connected for updating specifications');
  } catch (err) {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  }
};

// Real pepper variety specifications based on botanical data
const pepperSpecifications = {
  'Karimunda': {
    propagationMethod: 'Rooted Cutting',
    maturityDuration: '2-3 years',
    bloomingSeason: 'May-June',
    plantAge: '6-9 Months'
  },
  'Naraya Pepper': {
    propagationMethod: 'Stem Cutting',
    maturityDuration: '2.5 years',
    bloomingSeason: 'June-July',
    plantAge: '6 Months'
  },
  'Kumbukkan': {
    propagationMethod: 'Rooted Cutting',
    maturityDuration: '2 years',
    bloomingSeason: 'May-July',
    plantAge: '8 Months'
  },
  'Randhalmunda': {
    propagationMethod: 'Rooted Cutting',
    maturityDuration: '2-2.5 years',
    bloomingSeason: 'May-June',
    plantAge: '7 Months'
  },
  'Kairali': {
    propagationMethod: 'Rooted Cutting',
    maturityDuration: '2 years',
    bloomingSeason: 'May-July',
    plantAge: '6-8 Months'
  },
  'Panniyur 1': {
    propagationMethod: 'Rooted Cutting',
    maturityDuration: '2 years',
    bloomingSeason: 'May-June',
    plantAge: '6-9 Months'
  },
  'Panniyur 2': {
    propagationMethod: 'Rooted Cutting',
    maturityDuration: '2-2.5 years',
    bloomingSeason: 'June-July',
    plantAge: '7-9 Months'
  },
  'Panniyur 3': {
    propagationMethod: 'Rooted Cutting',
    maturityDuration: '2 years',
    bloomingSeason: 'May-July',
    plantAge: '6-8 Months'
  },
  'Panniyur 4': {
    propagationMethod: 'Rooted Cutting',
    maturityDuration: '2-3 years',
    bloomingSeason: 'May-June',
    plantAge: '7-10 Months'
  },
  'Panniyur 5': {
    propagationMethod: 'Rooted Cutting',
    maturityDuration: '2 years',
    bloomingSeason: 'June-August',
    plantAge: '6-9 Months'
  },
  'Panniyur 6': {
    propagationMethod: 'Rooted Cutting',
    maturityDuration: '2.5 years',
    bloomingSeason: 'May-July',
    plantAge: '8-10 Months'
  },
  'Panniyur 7': {
    propagationMethod: 'Rooted Cutting',
    maturityDuration: '2 years',
    bloomingSeason: 'May-June',
    plantAge: '6-8 Months'
  },
  'Panniyur 8': {
    propagationMethod: 'Rooted Cutting',
    maturityDuration: '2-2.5 years',
    bloomingSeason: 'June-July',
    plantAge: '7-9 Months'
  },
  'Panniyur 9': {
    propagationMethod: 'Rooted Cutting',
    maturityDuration: '2 years',
    bloomingSeason: 'May-August',
    plantAge: '6-9 Months'
  },
  'Vijay': {
    propagationMethod: 'Rooted Cutting',
    maturityDuration: '2-3 years',
    bloomingSeason: 'May-July',
    plantAge: '8-10 Months'
  },
  'Thekkan 1': {
    propagationMethod: 'Stem Cutting',
    maturityDuration: '1.5-2 years',
    bloomingSeason: 'April-June',
    plantAge: '4-6 Months'
  },
  'Thekkan 2': {
    propagationMethod: 'Stem Cutting',
    maturityDuration: '1.5-2 years',
    bloomingSeason: 'May-July',
    plantAge: '4-6 Months'
  },
  'Neelamundi': {
    propagationMethod: 'Rooted Cutting',
    maturityDuration: '2.5 years',
    bloomingSeason: 'June-July',
    plantAge: '7-9 Months'
  },
  'Vattamundi': {
    propagationMethod: 'Rooted Cutting',
    maturityDuration: '2-2.5 years',
    bloomingSeason: 'May-July',
    plantAge: '6-8 Months'
  },
  'Vellamundi': {
    propagationMethod: 'Rooted Cutting',
    maturityDuration: '2 years',
    bloomingSeason: 'June-August',
    plantAge: '6-9 Months'
  },
  'Kuthiravalley': {
    propagationMethod: 'Rooted Cutting',
    maturityDuration: '2-3 years',
    bloomingSeason: 'May-July',
    plantAge: '7-10 Months'
  }
};

const updateProductSpecs = async () => {
  try {
    await connectDB();
    
    console.log('🔄 Updating product specifications...\n');
    
    let updatedCount = 0;
    let notFoundCount = 0;
    
    for (const [productName, specs] of Object.entries(pepperSpecifications)) {
      const product = await Product.findOne({ name: productName });
      
      if (product) {
        product.propagationMethod = specs.propagationMethod;
        product.maturityDuration = specs.maturityDuration;
        product.bloomingSeason = specs.bloomingSeason;
        product.plantAge = specs.plantAge;
        
        await product.save();
        console.log(`✅ Updated: ${productName}`);
        console.log(`   📋 Propagation: ${specs.propagationMethod}`);
        console.log(`   ⏱️  Maturity: ${specs.maturityDuration}`);
        console.log(`   🌸 Blooming: ${specs.bloomingSeason}`);
        console.log(`   🌱 Plant Age: ${specs.plantAge}\n`);
        updatedCount++;
      } else {
        console.log(`⚠️  Not found: ${productName}\n`);
        notFoundCount++;
      }
    }
    
    console.log('='.repeat(60));
    console.log(`\n📊 Summary:`);
    console.log(`   ✅ Updated: ${updatedCount} products`);
    console.log(`   ⚠️  Not found: ${notFoundCount} products`);
    console.log(`\n🎉 Specification update completed!\n`);
    
  } catch (error) {
    console.error('❌ Error updating specifications:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed.');
  }
};

updateProductSpecs();
