import '../config/env.js';
import mongoose from 'mongoose';
import Hub from '../models/Hub.js';
import connectDB from '../config/db.js';

const viewDistrictOrders = async () => {
    try {
        await connectDB();
        console.log('✅ Connected to MongoDB\n');

        // Get all hubs sorted by order
        const hubs = await Hub.find({ isActive: true })
            .sort({ order: 1, district: 1 })
            .select('name district order type location');

        console.log('📋 Current Hub Order Configuration:');
        console.log('═══════════════════════════════════════════════════════════════');
        console.log('Order | District            | Hub Name              | Type');
        console.log('───────────────────────────────────────────────────────────────');

        hubs.forEach(hub => {
            const order = hub.order ? hub.order.toString().padEnd(5) : 'N/A  ';
            const district = (hub.district || 'N/A').padEnd(18);
            const name = (hub.name || 'N/A').padEnd(20);
            const type = hub.type || 'N/A';
            console.log(`${order} | ${district} | ${name} | ${type}`);
        });

        console.log('═══════════════════════════════════════════════════════════════');
        console.log(`\nTotal Hubs: ${hubs.length}`);

        // Group by order value
        console.log('\n📊 Order Value Distribution:');
        const orderGroups = {};
        hubs.forEach(hub => {
            const order = hub.order || 'undefined';
            if (!orderGroups[order]) orderGroups[order] = [];
            orderGroups[order].push(hub.district);
        });

        Object.keys(orderGroups).sort((a, b) => Number(a) - Number(b)).forEach(order => {
            console.log(`  Order ${order}: ${orderGroups[order].join(', ')}`);
        });

        console.log('\n💡 The "order" field determines hub priority/sequence in routes.');
        console.log('   Lower numbers = processed first in the logistics chain');
        console.log('   Typically: 1-7 (Warehouse) → 8-10 (Mega Hub) → 11-14 (Regional)\n');

        process.exit(0);
    } catch (err) {
        console.error('❌ Error:', err);
        process.exit(1);
    }
};

viewDistrictOrders();
