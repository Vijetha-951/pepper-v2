import '../config/env.js';
import mongoose from 'mongoose';
import { generateRoute } from '../services/routeGenerationService.js';
import connectDB from '../config/db.js';

const allDistrictRoutes = async () => {
    try {
        await connectDB();
        console.log('✅ Connected to MongoDB\n');

        const allDistricts = [
            'Thiruvananthapuram',
            'Kollam',
            'Pathanamthitta',
            'Alappuzha',
            'Kottayam',
            'Idukki',
            'Ernakulam',
            'Thrissur',
            'Palakkad',
            'Malappuram',
            'Kozhikode',
            'Wayanad',
            'Kannur',
            'Kasaragod',
        ];

        console.log('🚚 DELIVERY ROUTES FOR ALL KERALA DISTRICTS');
        console.log('═══════════════════════════════════════════════════════════════════════\n');

        for (const district of allDistricts) {
            try {
                const route = await generateRoute(district);
                
                if (route && route.length > 0) {
                    const routePath = route.map(hub => {
                        // Shorten hub names for cleaner display
                        return hub.name.replace(' Hub', '');
                    }).join(' → ');
                    
                    const hops = route.length;
                    console.log(`To ${district.padEnd(20)}: ${routePath} (${hops} hops)`);
                }
            } catch (error) {
                console.log(`To ${district.padEnd(20)}: ❌ Error - ${error.message}`);
            }
        }

        console.log('\n═══════════════════════════════════════════════════════════════════════');
        console.log('\n📊 Route Summary:');
        console.log('─────────────────────────────────────────────────────────────────────');
        console.log('• 2-hop routes (direct to mega hub): Ernakulam, Kottayam');
        console.log('• 3-hop routes (same zone): South/Central districts via Ernakulam');
        console.log('• 4-hop routes (cross-zone): North districts via Ernakulam → Kozhikode\n');

        process.exit(0);
    } catch (err) {
        console.error('❌ Error:', err);
        process.exit(1);
    }
};

allDistrictRoutes();
