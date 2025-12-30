import '../config/env.js';
import mongoose from 'mongoose';
import Hub from '../models/Hub.js';
import connectDB from '../config/db.js';

// RECOMMENDED ORDER VALUES BY HUB TYPE:
// WAREHOUSE (Origin): 1-7
// MEGA_HUB (Regional Centers): 8-10
// REGIONAL_HUB (District Hubs): 11-20
// LOCAL_HUB (Last Mile): 21-30

const DISTRICT_ORDER_MAP = {
    // North Zone (Kozhikode Mega Hub)
    'Kannur': 1,
    'Kasaragod': 2,
    'Wayanad': 3,
    'Kozhikode': 4,        // MEGA_HUB for North
    'Malappuram': 5,
    
    // Central Zone (Ernakulam Mega Hub)
    'Palakkad': 6,
    'Thrissur': 7,
    'Ernakulam': 8,        // MEGA_HUB for South/Central
    'Kottayam': 9,         // WAREHOUSE (origin)
    'Idukki': 14,
    
    // South Zone
    'Pathanamthitta': 10,
    'Alappuzha': 11,
    'Kollam': 12,
    'Thiruvananthapuram': 13,
};

const updateDistrictOrders = async () => {
    try {
        await connectDB();
        console.log('✅ Connected to MongoDB\n');

        console.log('🔄 Updating hub order values...\n');

        let updated = 0;
        let skipped = 0;

        for (const [district, orderValue] of Object.entries(DISTRICT_ORDER_MAP)) {
            const hub = await Hub.findOne({ 
                district: district,
                isActive: true 
            });

            if (hub) {
                const oldOrder = hub.order;
                hub.order = orderValue;
                await hub.save();
                console.log(`✅ ${district.padEnd(20)} : ${oldOrder || 'N/A'} → ${orderValue}`);
                updated++;
            } else {
                console.log(`⚠️  ${district.padEnd(20)} : Hub not found`);
                skipped++;
            }
        }

        console.log('\n═══════════════════════════════════════');
        console.log(`✅ Updated: ${updated} hubs`);
        console.log(`⚠️  Skipped: ${skipped} hubs`);
        console.log('═══════════════════════════════════════\n');

        // Show final order
        const hubs = await Hub.find({ 
            isActive: true,
            district: { $exists: true, $ne: null, $ne: '' }
        })
            .sort({ order: 1 })
            .select('name district order type');

        console.log('📋 Final Hub Order:');
        console.log('─────────────────────────────────────────────');
        hubs.forEach(hub => {
            console.log(`${String(hub.order).padStart(2)} | ${hub.district.padEnd(20)} | ${hub.type}`);
        });

        console.log('\n💡 How Order Works in Routes:');
        console.log('   • Lower order = processed earlier in logistics flow');
        console.log('   • Kottayam (9) is your warehouse/origin');
        console.log('   • Ernakulam (8) & Kozhikode (4) are mega hubs');
        console.log('   • Other districts (1-3, 5-7, 10-14) are regional hubs');
        console.log('   • Route: Origin → Mega Hub(s) → Destination\n');

        process.exit(0);
    } catch (err) {
        console.error('❌ Error:', err);
        process.exit(1);
    }
};

updateDistrictOrders();
