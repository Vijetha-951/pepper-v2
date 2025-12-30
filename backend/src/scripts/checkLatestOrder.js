import '../config/env.js';
import mongoose from 'mongoose';
import Order from '../models/Order.js';
import User from '../models/User.js';
import Hub from '../models/Hub.js';
import connectDB from '../config/db.js';

const checkLatestOrder = async () => {
    try {
        await connectDB();
        console.log('✅ Connected to MongoDB');

        // Get the most recent order
        const latestOrder = await Order.findOne()
            .sort({ createdAt: -1 })
            .populate('user', 'firstName lastName email')
            .populate('currentHub', 'name district type')
            .populate('route', 'name district order type');
        
        if (!latestOrder) {
            console.log('❌ No orders found');
            process.exit(0);
        }

        console.log('\n📦 Latest Order:');
        console.log(`Order ID: ${latestOrder._id}`);
        console.log(`Created: ${latestOrder.createdAt}`);
        console.log(`Status: ${latestOrder.status}`);
        console.log(`Customer: ${latestOrder.user?.firstName} ${latestOrder.user?.lastName} (${latestOrder.user?.email})`);
        console.log(`Total Amount: ₹${latestOrder.totalAmount}`);
        console.log(`Payment Method: ${latestOrder.payment?.method}`);
        console.log(`\nShipping Address:`);
        console.log(`  District: ${latestOrder.shippingAddress?.district || 'N/A'}`);
        console.log(`  Pincode: ${latestOrder.shippingAddress?.pincode || 'N/A'}`);
        
        console.log(`\n🚚 Hub Assignment:`);
        if (latestOrder.currentHub) {
            console.log(`  Current Hub: ${latestOrder.currentHub.name} (${latestOrder.currentHub.district})`);
            console.log(`  Hub Type: ${latestOrder.currentHub.type}`);
            console.log(`  Hub ID: ${latestOrder.currentHub._id}`);
        } else {
            console.log(`  ❌ NO HUB ASSIGNED!`);
        }

        console.log(`\n📍 Route (${latestOrder.route?.length || 0} hubs):`);
        if (latestOrder.route && latestOrder.route.length > 0) {
            latestOrder.route.forEach((hub, index) => {
                console.log(`  ${index + 1}. ${hub.name} (${hub.district}) - ${hub.type}`);
            });
        } else {
            console.log(`  ❌ NO ROUTE PLANNED!`);
        }

        console.log(`\n📋 Tracking Timeline (${latestOrder.trackingTimeline?.length || 0} events):`);
        if (latestOrder.trackingTimeline && latestOrder.trackingTimeline.length > 0) {
            latestOrder.trackingTimeline.forEach((event, index) => {
                console.log(`  ${index + 1}. ${event.status} - ${event.location} (${event.timestamp})`);
            });
        } else {
            console.log(`  ❌ NO TRACKING EVENTS!`);
        }

        process.exit(0);
    } catch (err) {
        console.error('❌ Error:', err);
        process.exit(1);
    }
};

checkLatestOrder();
