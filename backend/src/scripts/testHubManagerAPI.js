import '../config/env.js';
import mongoose from 'mongoose';
import Order from '../models/Order.js';
import Hub from '../models/Hub.js';
import User from '../models/User.js';
import connectDB from '../config/db.js';

const testAPI = async () => {
    try {
        await connectDB();
        console.log('✅ Connected to MongoDB');

        // Find Kottayam hub
        const kottayamHub = await Hub.findOne({ district: 'Kottayam' })
            .populate('managedBy', 'firstName lastName email');
        
        if (!kottayamHub) {
            console.log('❌ Kottayam hub not found!');
            process.exit(1);
        }

        console.log('\n📍 Hub Details:');
        console.log(`Name: ${kottayamHub.name}`);
        console.log(`ID: ${kottayamHub._id}`);
        console.log(`Type: ${kottayamHub.type}`);

        // Simulate the exact query the hub manager API does
        const filter = { currentHub: kottayamHub._id };
        const orders = await Order.find(filter)
            .sort({ updatedAt: -1 })
            .populate('route', 'name district order type location')
            .populate('currentHub', 'name district type');

        console.log(`\n📦 Orders Query Result: ${orders.length} orders`);
        console.log('\n--- First 3 Orders ---');
        
        orders.slice(0, 3).forEach((order, idx) => {
            console.log(`\n${idx + 1}. Order ID: ${order._id}`);
            console.log(`   Status: ${order.status}`);
            console.log(`   Created: ${order.createdAt}`);
            console.log(`   Updated: ${order.updatedAt}`);
            console.log(`   Current Hub: ${order.currentHub?.name} (${order.currentHub?.district})`);
            console.log(`   Route Length: ${order.route?.length || 0}`);
            
            if (order.route && order.route.length > 0) {
                console.log(`   Route Details:`);
                order.route.forEach((hub, i) => {
                    console.log(`     ${i + 1}. ${hub.name} - ${hub.district} (${hub.type})`);
                    console.log(`        Order: ${hub.order}, Location: ${hub.location ? 'Yes' : 'No'}`);
                });
            } else {
                console.log(`   ⚠️ No route data!`);
            }
        });

        // Check what the raw data looks like
        console.log('\n--- Raw Route Data for Latest Order ---');
        if (orders.length > 0) {
            const latestOrder = orders[0];
            console.log('Route field exists:', !!latestOrder.route);
            console.log('Route is array:', Array.isArray(latestOrder.route));
            console.log('Route populated:', latestOrder.route && latestOrder.route.length > 0 && latestOrder.route[0].name ? 'Yes' : 'No');
            
            if (latestOrder.route && latestOrder.route[0]) {
                console.log('\nFirst hub in route:');
                console.log(JSON.stringify(latestOrder.route[0], null, 2));
            }
        }

        process.exit(0);
    } catch (err) {
        console.error('❌ Error:', err);
        process.exit(1);
    }
};

testAPI();
