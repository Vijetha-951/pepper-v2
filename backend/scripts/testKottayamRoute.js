import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { generateRoute, getRouteInfo } from '../src/services/routeGenerationService.js';

dotenv.config();

async function testKottayamRoute() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');
    console.log('═'.repeat(80));
    console.log('🗺️  ROUTE PLANNING TEST: KOTTAYAM DESTINATION');
    console.log('═'.repeat(80));

    console.log('\n📍 Destination: Kottayam');
    console.log('📦 Source: Kottayam (WAREHOUSE)\n');

    console.log('🔍 Analyzing route logic:\n');
    console.log('1. Source District: Kottayam');
    console.log('2. Source Mega Hub: Ernakulam (from HUB_TOPOLOGY)');
    console.log('3. Destination District: Kottayam');
    console.log('4. Destination Mega Hub: Ernakulam (from HUB_TOPOLOGY)\n');

    console.log('🧠 Route Construction Steps:\n');
    console.log('Step 1: Start at Source → [Kottayam]');
    console.log('Step 2: Source (Kottayam) != SourceMega (Ernakulam)');
    console.log('        → Add SourceMega → [Kottayam, Ernakulam]');
    console.log('Step 3: SourceMega (Ernakulam) == DestMega (Ernakulam)');
    console.log('        → No jump needed');
    console.log('Step 4: DestMega (Ernakulam) != Destination (Kottayam)');
    console.log('        → Should add Destination? Let\'s check...\n');

    console.log('⚠️  WAIT! According to your rule:');
    console.log('    "Kottayam (Same district): Kottayam → Ernakulam"');
    console.log('    "✅ (No destination hub added because source = destination)"\n');

    console.log('🔧 But the current code logic says:');
    console.log('    if (destMega !== destDistrict) → Add destination');
    console.log('    Ernakulam !== Kottayam → TRUE');
    console.log('    So it WILL add Kottayam again!\n');

    console.log('─'.repeat(80));
    console.log('🧪 ACTUAL ROUTE GENERATION:\n');

    const route = await generateRoute('Kottayam');
    const routeInfo = await getRouteInfo(route);

    console.log('Generated Route:');
    routeInfo.forEach((hub, index) => {
      console.log(`${index + 1}. ${hub.name} (${hub.type}) - District: ${hub.district}, Order: ${hub.order}`);
    });

    console.log('\n─'.repeat(80));
    console.log('💡 ANALYSIS:\n');

    if (routeInfo.length === 2) {
      console.log('✅ CORRECT: Route is [Kottayam → Ernakulam]');
      console.log('   The code correctly handles same source/destination district.');
    } else if (routeInfo.length === 3) {
      console.log('❌ ISSUE: Route is [Kottayam → Ernakulam → Kottayam]');
      console.log('   The code adds Kottayam twice (as source and destination).');
      console.log('\n🔧 FIX NEEDED:');
      console.log('   Add check: if (sourceDistrict === destDistrict) → Skip final destination');
    } else {
      console.log(`⚠️  UNEXPECTED: Route has ${routeInfo.length} hubs`);
    }

    console.log('\n═'.repeat(80));

    // Test other districts for comparison
    console.log('\n📊 COMPARISON WITH OTHER DISTRICTS:\n');

    const testDistricts = ['Ernakulam', 'Thiruvananthapuram', 'Kozhikode', 'Kannur'];

    for (const district of testDistricts) {
      console.log(`\n📍 ${district}:`);
      try {
        const testRoute = await generateRoute(district);
        const testRouteInfo = await getRouteInfo(testRoute);
        console.log(`   Route: ${testRouteInfo.map(h => h.district).join(' → ')}`);
        console.log(`   Hubs: ${testRouteInfo.length}`);
      } catch (error) {
        console.log(`   Error: ${error.message}`);
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB\n');
  }
}

testKottayamRoute();
