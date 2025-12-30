import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { generateRoute, getRouteInfo } from '../src/services/routeGenerationService.js';

dotenv.config();

async function testAllRoutes() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');
    console.log('═'.repeat(80));
    console.log('🗺️  COMPLETE ROUTE TESTING - ALL 14 DISTRICTS');
    console.log('═'.repeat(80) + '\n');

    const allDistricts = [
      'Kottayam',          // Source (SPECIAL CASE)
      'Ernakulam',         // Ernakulam Mega Hub
      'Kozhikode',         // Kozhikode Mega Hub
      'Thiruvananthapuram',
      'Kollam',
      'Alappuzha',
      'Pathanamthitta',
      'Idukki',
      'Thrissur',
      'Palakkad',
      'Malappuram',
      'Wayanad',
      'Kannur',
      'Kasaragod'
    ];

    console.log('📦 Source: Kottayam Hub (WAREHOUSE)\n');

    for (const district of allDistricts) {
      console.log(`\n${'─'.repeat(80)}`);
      console.log(`📍 DESTINATION: ${district.toUpperCase()}`);
      console.log('─'.repeat(80));

      try {
        const route = await generateRoute(district);
        const routeInfo = await getRouteInfo(route);

        console.log(`\n🗺️  Route (${routeInfo.length} hubs):`);
        routeInfo.forEach((hub, index) => {
          const arrow = index < routeInfo.length - 1 ? ' →' : '';
          console.log(`   ${index + 1}. ${hub.name} (${hub.type})${arrow}`);
        });

        console.log(`\n📋 Path: ${routeInfo.map(h => h.district).join(' → ')}`);

        // Determine who assigns delivery boy
        const finalHub = routeInfo[routeInfo.length - 1];
        console.log(`\n👤 Delivery Assignment: ${finalHub.name} Manager`);

        // Special notes
        if (district === 'Kottayam') {
          console.log(`\n✅ LOCAL DELIVERY: Order stays at source hub`);
          console.log(`   No inter-hub transit needed`);
        } else if (routeInfo.length === 2) {
          console.log(`\n✅ SINGLE MEGA HUB: Direct route through Ernakulam`);
        } else if (routeInfo.length === 3 && routeInfo[1].district === 'Ernakulam') {
          console.log(`\n✅ SOUTH/CENTRAL ZONE: Via Ernakulam Mega Hub`);
        } else if (routeInfo.length === 4) {
          console.log(`\n✅ NORTH ZONE: Requires zone jump (Ernakulam → Kozhikode)`);
        }

      } catch (error) {
        console.log(`\n❌ Error: ${error.message}`);
      }
    }

    console.log('\n\n' + '═'.repeat(80));
    console.log('📊 SUMMARY BY ROUTE LENGTH');
    console.log('═'.repeat(80) + '\n');

    // Group by route length
    const routesByLength = {};
    
    for (const district of allDistricts) {
      try {
        const route = await generateRoute(district);
        const length = route.length;
        
        if (!routesByLength[length]) {
          routesByLength[length] = [];
        }
        routesByLength[length].push(district);
      } catch (error) {
        // Skip errors
      }
    }

    Object.keys(routesByLength).sort().forEach(length => {
      console.log(`${length} Hub${length > 1 ? 's' : ''}:`);
      routesByLength[length].forEach(district => {
        console.log(`   • ${district}`);
      });
      console.log('');
    });

    console.log('═'.repeat(80));
    console.log('🎯 KEY INSIGHTS');
    console.log('═'.repeat(80) + '\n');

    console.log('1️⃣  LOCAL DELIVERY (1 hub):');
    console.log('   • Kottayam orders stay at Kottayam Hub');
    console.log('   • Kottayam Hub Manager assigns delivery boy directly\n');

    console.log('2️⃣  MEGA HUB DELIVERY (2 hubs):');
    console.log('   • Ernakulam orders: Kottayam → Ernakulam');
    console.log('   • Kozhikode orders: Kottayam → Ernakulam → Kozhikode');
    console.log('   • Mega Hub Manager assigns delivery boy\n');

    console.log('3️⃣  SOUTH/CENTRAL ZONE (3 hubs):');
    console.log('   • Route: Kottayam → Ernakulam → Destination');
    console.log('   • Destination Hub Manager assigns delivery boy\n');

    console.log('4️⃣  NORTH ZONE (4 hubs):');
    console.log('   • Route: Kottayam → Ernakulam → Kozhikode → Destination');
    console.log('   • Requires zone jump between mega hubs');
    console.log('   • Destination Hub Manager assigns delivery boy\n');

    console.log('═'.repeat(80));

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB\n');
  }
}

testAllRoutes();
