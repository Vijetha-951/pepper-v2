import '../config/env.js';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Hub from '../models/Hub.js';
import connectDB from '../config/db.js';

const checkHubManagerAccount = async () => {
    try {
        await connectDB();
        console.log('✅ Connected to MongoDB');

        // Find all hub manager accounts
        const hubManagers = await User.find({ role: 'hubmanager' })
            .select('firstName lastName email firebaseUid hubId');
        
        console.log(`\n👥 Found ${hubManagers.length} Hub Manager account(s):\n`);

        for (const manager of hubManagers) {
            console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
            console.log(`Name: ${manager.firstName} ${manager.lastName}`);
            console.log(`Email: ${manager.email}`);
            console.log(`Firebase UID: ${manager.firebaseUid || 'NOT SET'}`);
            console.log(`Hub ID: ${manager.hubId || 'NOT ASSIGNED'}`);

            // Find which hub(s) they manage
            const managedHubs = await Hub.find({ managedBy: manager._id })
                .select('name district type _id');
            
            console.log(`\nManaging ${managedHubs.length} hub(s):`);
            managedHubs.forEach(hub => {
                console.log(`  - ${hub.name} (${hub.district}) - ${hub.type}`);
                console.log(`    Hub ID: ${hub._id}`);
            });
            console.log();
        }

        // Check Kottayam hub specifically
        console.log(`\n🎯 Kottayam Hub Details:`);
        const kottayamHub = await Hub.findOne({ district: 'Kottayam' })
            .populate('managedBy', 'firstName lastName email');
        
        if (kottayamHub) {
            console.log(`Name: ${kottayamHub.name}`);
            console.log(`ID: ${kottayamHub._id}`);
            console.log(`Managers (${kottayamHub.managedBy.length}):`);
            kottayamHub.managedBy.forEach(m => {
                console.log(`  - ${m.firstName} ${m.lastName} (${m.email})`);
            });
        }

        process.exit(0);
    } catch (err) {
        console.error('❌ Error:', err);
        process.exit(1);
    }
};

checkHubManagerAccount();
