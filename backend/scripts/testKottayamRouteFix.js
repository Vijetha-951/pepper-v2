import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { generateRoute } from '../src/services/routeGenerationService.js';

dotenv.config();

async function testKottayamRoute() {
  try {
    const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
    await mongoose.connect(uri);
    console.log('✅ Connected to MongoDB\n');

    console.log('Testing route generation for Kottayam (different cases):\n');

    // Test with different cases
    const testCases = ['Kottayam', 'kottayam', 'KOTTAYAM', 'KoTtAyAm'];

    for (const testDistrict of testCases) {
      console.log(`\n${'─'.repeat(60)}`);
      console.log(`📍 Testing: "${testDistrict}"`);
      console.log('─'.repeat(60));

      try {
        const route = await generateRoute(testDistrict);
        
        console.log(`Route (${route.length} hubs):`);
        route.forEach((hub, index) => {
          console.log(`   ${index + 1}. ${hub.name} (${hub.district})`);
        });

        if (route.length === 1) {
          console.log(`\n✅ CORRECT: Local delivery, no Ernakulam hop`);
        } else if (route.length === 2 && route[1].district === 'Ernakulam') {
          console.log(`\n❌ INCORRECT: Sending to Ernakulam for local delivery`);
        }

      } catch (error) {
        console.log(`❌ Error: ${error.message}`);
      }
    }

    console.log('\n' + '═'.repeat(60));
    await mongoose.disconnect();
    console.log('\n✅ Test Complete');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

testKottayamRoute();
