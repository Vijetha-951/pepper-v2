import '../config/env.js';
import mongoose from 'mongoose';
import Hub from '../models/Hub.js';
import { generateRoute } from '../services/routeGenerationService.js';
import connectDB from '../config/db.js';

const testDistrictRoutes = async () => {
    try {
        await connectDB();
        console.log('✅ Connected to MongoDB\n');

        const testDistricts = [
            'Thiruvananthapuram',  // Far south, same zone as source
            'Kollam',              // South, same zone
            'Ernakulam',           // Mega hub, same zone
            'Kottayam',            // Source itself
            'Kannur',              // North zone (different mega hub)
            'Kozhikode',           // North mega hub
            'Malappuram',          // North zone
        ];

        console.log('🚚 Route Generation Examples\n');
        console.log('═══════════════════════════════════════════════════════════════════════');

        for (const district of testDistricts) {
            try {
                const route = await generateRoute(district);
                
                console.log(`\n📍 Order to ${district}:`);
                console.log('─────────────────────────────────────────────────────');
                
                if (route && route.length > 0) {
                    console.log('Route Path:');
                    route.forEach((hub, index) => {
                        const arrow = index < route.length - 1 ? '  ↓' : '';
                        console.log(`  ${index + 1}. ${hub.name.padEnd(25)} (Order: ${hub.order}, Type: ${hub.type})`);
                        if (arrow) console.log(arrow);
                    });
                    console.log(`\nTotal Hubs: ${route.length}`);
                    console.log(`Distance: ${route.length - 1} hop(s)`);
                } else {
                    console.log('⚠️  No route generated');
                }
            } catch (error) {
                console.log(`❌ Error: ${error.message}`);
            }
        }

        console.log('\n═══════════════════════════════════════════════════════════════════════');
        console.log('\n📊 Route Logic Explanation:');
        console.log('───────────────────────────────────────────────────────────────────────');
        console.log('1. Source: Always starts at Kottayam Hub (Order: 9, WAREHOUSE)');
        console.log('2. Same Zone: Kottayam → Ernakulam Mega Hub → Destination');
        console.log('3. Different Zone: Kottayam → Ernakulam → Kozhikode → Destination');
        console.log('4. To Mega Hub: Kottayam → Mega Hub (direct, no extra hop)');
        console.log('5. Local Delivery: Last hub in route → Customer\n');

        console.log('🔑 Hub Types & Their Roles:');
        console.log('───────────────────────────────────────────────────────────────────────');
        console.log('• WAREHOUSE (Order: 9) - Kottayam: Starting point for all orders');
        console.log('• MEGA_HUB (Orders: 4, 8) - Regional distribution centers');
        console.log('  - Ernakulam (8): Serves South/Central Kerala');
        console.log('  - Kozhikode (4): Serves North Kerala');
        console.log('• REGIONAL_HUB (Orders: 1-3, 5-7, 10-14) - District-level hubs');
        console.log('• LOCAL_HUB - Last-mile delivery points (future use)\n');

        process.exit(0);
    } catch (err) {
        console.error('❌ Error:', err);
        process.exit(1);
    }
};

testDistrictRoutes();
