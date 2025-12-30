import '../config/env.js';
import mongoose from 'mongoose';
import Hub from '../models/Hub.js';
import Order from '../models/Order.js';
import User from '../models/User.js';
import connectDB from '../config/db.js';

const checkKottayamHub = async () => {
    try {
        await connectDB();
        console.log('✅ Connected to MongoDB');

        // Find Kottayam hub
        const kottayamHubs = await Hub.find({ district: 'Kottayam' })
            .populate('managedBy', 'firstName lastName email');
        
        console.log(`\n📍 Found ${kottayamHubs.length} Kottayam Hub(s):`);
        kottayamHubs.forEach(hub => {
            console.log(`\nHub ID: ${hub._id}`);
            console.log(`Name: ${hub.name}`);
            console.log(`Type: ${hub.type}`);
            console.log(`District: ${hub.district}`);
            console.log(`Active: ${hub.isActive}`);
            console.log(`Managers: ${hub.managedBy.length}`);
            if (hub.managedBy.length > 0) {
                hub.managedBy.forEach(m => {
                    console.log(`  - ${m.firstName} ${m.lastName} (${m.email})`);
                });
            }
        });

        // Check orders at Kottayam hub
        if (kottayamHubs.length > 0) {
            const hubId = kottayamHubs[0]._id;
            const ordersAtHub = await Order.find({ currentHub: hubId })
                .populate('user', 'firstName lastName email')
                .sort({ createdAt: -1 })
                .limit(5);
            
            console.log(`\n📦 Orders currently at Kottayam hub: ${ordersAtHub.length}`);
            ordersAtHub.forEach(order => {
                console.log(`\n  Order ID: ${order._id}`);
                console.log(`  Status: ${order.status}`);
                console.log(`  Customer: ${order.user?.firstName} ${order.user?.lastName}`);
                console.log(`  Created: ${order.createdAt}`);
                console.log(`  Route length: ${order.route?.length || 0}`);
            });

            // Check recent orders without hub
            const ordersWithoutHub = await Order.find({ currentHub: null })
                .sort({ createdAt: -1 })
                .limit(3);
            console.log(`\n⚠️ Recent orders WITHOUT hub assignment: ${ordersWithoutHub.length}`);
            ordersWithoutHub.forEach(order => {
                console.log(`  - Order ${order._id} (${order.status}) created ${order.createdAt}`);
            });
        }

        process.exit(0);
    } catch (err) {
        console.error('❌ Error:', err);
        process.exit(1);
    }
};

checkKottayamHub();
