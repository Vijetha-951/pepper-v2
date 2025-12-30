import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Hub from '../src/models/Hub.js';
import User from '../src/models/User.js';

dotenv.config();

async function fixDuplicateHubAssignments() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find hub managers with multiple hubs
    const hubManagers = await User.find({ role: 'hubmanager' });

    console.log('🔍 Checking for duplicate hub assignments:\n');

    for (const manager of hubManagers) {
      const hubs = await Hub.find({ managedBy: manager._id });
      
      if (hubs.length > 1) {
        console.log(`⚠️  ${manager.firstName} ${manager.lastName} manages ${hubs.length} hubs:`);
        hubs.forEach((hub, index) => {
          console.log(`   ${index + 1}. ${hub.name} (${hub.type}) - ID: ${hub._id}`);
        });

        // Prioritize WAREHOUSE over REGIONAL_HUB
        const warehouseHub = hubs.find(h => h.type === 'WAREHOUSE');
        const regionalHub = hubs.find(h => h.type === 'REGIONAL_HUB');

        if (warehouseHub && regionalHub) {
          console.log(`\n   ✅ Keeping: ${warehouseHub.name} (WAREHOUSE)`);
          console.log(`   ❌ Removing manager from: ${regionalHub.name} (REGIONAL_HUB)\n`);

          // Remove manager from REGIONAL_HUB
          await Hub.findByIdAndUpdate(regionalHub._id, {
            $pull: { managedBy: manager._id }
          });

          console.log(`   ✔️  Fixed!\n`);
        }
      } else if (hubs.length === 1) {
        console.log(`✅ ${manager.firstName} ${manager.lastName} - OK (manages 1 hub: ${hubs[0].name})`);
      } else {
        console.log(`⚠️  ${manager.firstName} ${manager.lastName} - NO HUB ASSIGNED!`);
      }
    }

    console.log('\n📊 Verification:\n');
    
    // Verify the fix
    for (const manager of hubManagers) {
      const hubs = await Hub.find({ managedBy: manager._id });
      console.log(`${manager.firstName} ${manager.lastName}: ${hubs.length} hub(s) - ${hubs.map(h => h.name).join(', ')}`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

fixDuplicateHubAssignments();
