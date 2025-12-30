import '../config/env.js';
import mongoose from 'mongoose';
import Hub from '../models/Hub.js';
import connectDB from '../config/db.js';

const cleanupDuplicateHubs = async () => {
    try {
        await connectDB();
        console.log('✅ Connected to MongoDB');

        // Find hubs without proper district field
        const brokenHubs = await Hub.find({
            $or: [
                { district: null },
                { district: '' },
                { district: { $exists: false } },
                { district: 'undefined' }
            ]
        }).populate('managedBy', 'email');

        console.log(`\n🔍 Found ${brokenHubs.length} hub(s) with missing/invalid district field:`);
        
        brokenHubs.forEach(hub => {
            console.log(`\n  Hub ID: ${hub._id}`);
            console.log(`  Name: ${hub.name}`);
            console.log(`  District: ${hub.district}`);
            console.log(`  Type: ${hub.type}`);
            console.log(`  Managers: ${hub.managedBy.length}`);
        });

        if (brokenHubs.length > 0) {
            console.log(`\n⚠️  These hubs should be removed or fixed.`);
            console.log(`\nTo delete them, run:`);
            brokenHubs.forEach(hub => {
                console.log(`  Hub.findByIdAndDelete('${hub._id}')`);
            });
        }

        process.exit(0);
    } catch (err) {
        console.error('❌ Error:', err);
        process.exit(1);
    }
};

cleanupDuplicateHubs();
