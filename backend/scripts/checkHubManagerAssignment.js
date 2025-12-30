import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../src/models/User.js';
import Hub from '../src/models/Hub.js';

dotenv.config();

async function checkHubManagerAssignment() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Find all hub managers
    const hubManagers = await User.find({ role: 'hubmanager' });
    console.log(`\n📊 Found ${hubManagers.length} Hub Managers:\n`);

    for (const manager of hubManagers) {
      console.log(`\n👤 Manager: ${manager.firstName} ${manager.lastName} (${manager.email})`);
      console.log(`   Firebase UID: ${manager.firebaseUid}`);
      console.log(`   MongoDB ID: ${manager._id}`);

      // Find hubs managed by this user
      const hubs = await Hub.find({ managedBy: manager._id });
      
      if (hubs.length === 0) {
        console.log(`   ⚠️  NOT ASSIGNED TO ANY HUB`);
      } else {
        console.log(`   ✅ Manages ${hubs.length} hub(s):`);
        hubs.forEach(hub => {
          console.log(`      - ${hub.name} (${hub.type})`);
          console.log(`        District: ${hub.district || '❌ MISSING'}`);
          console.log(`        Active: ${hub.isActive}`);
        });
      }
    }

    // Check hubs without managers
    console.log('\n\n🏢 Checking Hubs without Managers:\n');
    const unassignedHubs = await Hub.find({
      $or: [
        { managedBy: { $exists: false } },
        { managedBy: { $size: 0 } },
        { managedBy: null }
      ]
    });

    if (unassignedHubs.length > 0) {
      console.log(`⚠️  Found ${unassignedHubs.length} unassigned hubs:`);
      unassignedHubs.forEach(hub => {
        console.log(`   - ${hub.name} (${hub.district})`);
      });
    } else {
      console.log('✅ All hubs have managers assigned');
    }

    // Check hubs without district
    const hubsWithoutDistrict = await Hub.find({
      $or: [
        { district: { $exists: false } },
        { district: null },
        { district: '' }
      ]
    });

    if (hubsWithoutDistrict.length > 0) {
      console.log(`\n⚠️  Found ${hubsWithoutDistrict.length} hubs without district:`);
      hubsWithoutDistrict.forEach(hub => {
        console.log(`   - ${hub.name} (ID: ${hub._id})`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

checkHubManagerAssignment();
