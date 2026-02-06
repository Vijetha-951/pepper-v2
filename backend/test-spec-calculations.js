import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Product from './src/models/Product.js';

dotenv.config();

async function testSpecificationCalculations() {
  try {
    const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
    await mongoose.connect(uri);
    
    console.log('\n╔═══════════════════════════════════════════════════════════╗');
    console.log('║   TESTING PRODUCT SPECIFICATION CALCULATIONS              ║');
    console.log('║   Current Date: February 6, 2026                          ║');
    console.log('╚═══════════════════════════════════════════════════════════╝\n');
    
    // Get a sample product
    const product = await Product.findOne({ name: 'Panniyur 5' });
    
    if (!product) {
      console.log('❌ Product not found');
      return;
    }
    
    console.log('Testing with: ' + product.name);
    console.log('─'.repeat(60) + '\n');
    
    // Test if getDynamicSpecifications method exists
    if (typeof product.getDynamicSpecifications === 'function') {
      const specs = product.getDynamicSpecifications();
      
      console.log('✅ Dynamic Specifications Method EXISTS\n');
      console.log('Results:');
      console.log('─'.repeat(60));
      console.log('1. Propagation Method:', product.propagationMethod || 'NOT SET');
      console.log('   (Static field - should show: Rooted Cutting, Grafted, etc.)\n');
      
      console.log('2. Plant Age:', specs.plantAge);
      console.log('   Propagation Date:', product.propagationDate || product.createdAt);
      console.log('   Age in months:', specs.ageInMonths || 'N/A');
      console.log('   Location:', specs.location || product.location?.region || 'NOT SET');
      console.log('   ✓ Should calculate: Current Date - Propagation Date\n');
      
      console.log('3. Blooming Season:', specs.bloomingSeason);
      console.log('   Blooming Months:', product.bloomingMonths || 'NOT SET');
      console.log('   Current Month:', new Date().getMonth() + 1, '(February)');
      console.log('   Is Currently Blooming?:', specs.isCurrentlyBlooming ? 'YES 🌸' : 'NO');
      console.log('   ✓ Should check if current month is in bloomingMonths array\n');
      
      console.log('4. Maturity Status:', specs.maturityDuration);
      console.log('   Maturity Period:', product.maturityMonths || 'NOT SET', 'months');
      console.log('   Current Age:', specs.ageInMonths || 'N/A', 'months');
      console.log('   Is Mature?:', specs.isMature ? 'YES ✅' : 'NO ⏳');
      console.log('   ✓ Should show "Mature" if age >= maturity period\n');
      
      console.log('─'.repeat(60));
      console.log('\nFull Specification Object:');
      console.log(JSON.stringify(specs, null, 2));
      
    } else {
      console.log('❌ getDynamicSpecifications method DOES NOT EXIST');
      console.log('\nStatic fields only:');
      console.log('─'.repeat(60));
      console.log('Propagation Method:', product.propagationMethod);
      console.log('Propagation Date:', product.propagationDate);
      console.log('Maturity Months:', product.maturityMonths);
      console.log('Blooming Months:', product.bloomingMonths);
      console.log('Location:', product.location);
      console.log('\n⚠️  Dynamic calculations are NOT implemented!');
    }
    
    await mongoose.connection.close();
    
  } catch (error) {
    console.error('Error:', error.message);
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
    }
  }
}

testSpecificationCalculations();
