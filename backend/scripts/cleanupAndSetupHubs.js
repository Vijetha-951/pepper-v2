import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Hub from '../src/models/Hub.js';
import User from '../src/models/User.js';
import Order from '../src/models/Order.js';

dotenv.config();

async function cleanupAndSetupHubs() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');
    console.log('═'.repeat(80));
    console.log('🧹 HUB CLEANUP & SETUP - 14 KERALA HUBS');
    console.log('═'.repeat(80));

    // Define the 14 hubs we want to keep (based on the routing logic)
    const correctHubs = [
      { name: 'Kottayam Hub', district: 'Kottayam', type: 'WAREHOUSE', order: 0 },
      { name: 'Ernakulam Hub', district: 'Ernakulam', type: 'MEGA_HUB', order: 1 },
      { name: 'Kozhikode Hub', district: 'Kozhikode', type: 'MEGA_HUB', order: 2 },
      { name: 'Thiruvananthapuram Hub', district: 'Thiruvananthapuram', type: 'REGIONAL_HUB', order: 3 },
      { name: 'Kollam Hub', district: 'Kollam', type: 'REGIONAL_HUB', order: 4 },
      { name: 'Alappuzha Hub', district: 'Alappuzha', type: 'REGIONAL_HUB', order: 5 },
      { name: 'Pathanamthitta Hub', district: 'Pathanamthitta', type: 'REGIONAL_HUB', order: 6 },
      { name: 'Idukki Hub', district: 'Idukki', type: 'REGIONAL_HUB', order: 7 },
      { name: 'Thrissur Hub', district: 'Thrissur', type: 'REGIONAL_HUB', order: 8 },
      { name: 'Palakkad Hub', district: 'Palakkad', type: 'REGIONAL_HUB', order: 9 },
      { name: 'Malappuram Hub', district: 'Malappuram', type: 'REGIONAL_HUB', order: 10 },
      { name: 'Wayanad Hub', district: 'Wayanad', type: 'REGIONAL_HUB', order: 11 },
      { name: 'Kannur Hub', district: 'Kannur', type: 'REGIONAL_HUB', order: 12 },
      { name: 'Kasaragod Hub', district: 'Kasaragod', type: 'REGIONAL_HUB', order: 13 },
    ];

    console.log('\n📋 STEP 1: Identifying hubs to keep and remove\n');

    // Get all existing hubs
    const allHubs = await Hub.find();
    console.log(`Current total hubs: ${allHubs.length}\n`);

    // For each correct hub, find the best match (prefer newer ones with order field)
    const hubsToKeep = [];
    const hubsToDelete = [];

    for (const correctHub of correctHubs) {
      const matches = allHubs.filter(h => 
        h.name === correctHub.name && h.district === correctHub.district
      );

      if (matches.length === 0) {
        console.log(`⚠️  No match found for ${correctHub.name} - will create new`);
      } else if (matches.length === 1) {
        console.log(`✅ ${correctHub.name} - 1 hub found, keeping it`);
        hubsToKeep.push({ hub: matches[0], config: correctHub });
      } else {
        // Multiple matches - keep the one with order field set, or the newer one
        const withOrder = matches.find(h => h.order !== undefined && h.order !== null);
        const toKeep = withOrder || matches.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
        
        console.log(`🔄 ${correctHub.name} - ${matches.length} duplicates found`);
        console.log(`   Keeping: ${toKeep._id} (created: ${new Date(toKeep.createdAt).toLocaleDateString()})`);
        
        hubsToKeep.push({ hub: toKeep, config: correctHub });
        
        matches.forEach(m => {
          if (m._id.toString() !== toKeep._id.toString()) {
            console.log(`   Deleting: ${m._id} (created: ${new Date(m.createdAt).toLocaleDateString()})`);
            hubsToDelete.push(m);
          }
        });
      }
    }

    // Mark non-Kerala hubs for deletion
    const nonKeralaHubs = allHubs.filter(h => 
      !correctHubs.some(ch => ch.name === h.name && ch.district === h.district)
    );

    if (nonKeralaHubs.length > 0) {
      console.log(`\n🗑️  Non-Kerala hubs to delete: ${nonKeralaHubs.length}`);
      nonKeralaHubs.forEach(h => {
        console.log(`   - ${h.name} (${h.district || 'no district'})`);
        hubsToDelete.push(h);
      });
    }

    console.log(`\n📊 Summary:`);
    console.log(`   Hubs to keep: ${hubsToKeep.length}`);
    console.log(`   Hubs to delete: ${hubsToDelete.length}`);

    // STEP 2: Handle orders before deleting hubs
    console.log('\n📦 STEP 2: Reassigning orders from hubs to be deleted\n');

    for (const hubToDelete of hubsToDelete) {
      const ordersAtHub = await Order.find({ currentHub: hubToDelete._id });
      
      if (ordersAtHub.length > 0) {
        console.log(`⚠️  ${hubToDelete.name} has ${ordersAtHub.length} orders`);
        
        // Find the correct hub to reassign to (same district)
        const correctHub = hubsToKeep.find(h => h.config.district === hubToDelete.district);
        
        if (correctHub) {
          console.log(`   Reassigning to: ${correctHub.hub.name} (${correctHub.hub._id})`);
          
          await Order.updateMany(
            { currentHub: hubToDelete._id },
            { $set: { currentHub: correctHub.hub._id } }
          );
          
          console.log(`   ✅ Reassigned ${ordersAtHub.length} orders\n`);
        } else {
          console.log(`   ⚠️  No matching hub found, orders will need manual reassignment\n`);
        }
      }
    }

    // STEP 3: Delete duplicate and non-Kerala hubs
    console.log('\n🗑️  STEP 3: Deleting duplicate and non-Kerala hubs\n');

    for (const hub of hubsToDelete) {
      await Hub.findByIdAndDelete(hub._id);
      console.log(`✅ Deleted: ${hub.name} (${hub._id})`);
    }

    // STEP 4: Update hub configurations
    console.log('\n🔧 STEP 4: Updating hub configurations\n');

    for (const { hub, config } of hubsToKeep) {
      const updates = {
        type: config.type,
        order: config.order,
        district: config.district,
        isActive: true
      };

      await Hub.findByIdAndUpdate(hub._id, updates);
      console.log(`✅ Updated: ${config.name} - Type: ${config.type}, Order: ${config.order}`);
    }

    // STEP 5: Assign managers
    console.log('\n👥 STEP 5: Assigning hub managers\n');

    // Get all hub managers
    const hubManagers = await User.find({ role: 'hubmanager' });
    console.log(`Found ${hubManagers.length} hub managers\n`);

    // First, remove all current assignments
    await Hub.updateMany({}, { $set: { managedBy: [] } });

    // Assign each manager to their corresponding hub
    for (const manager of hubManagers) {
      // Extract district from email (e.g., hub.kollam@pepper.local -> kollam)
      const emailMatch = manager.email.match(/hub\.([a-z]+)@/);
      if (!emailMatch) {
        console.log(`⚠️  Could not extract district from ${manager.email}`);
        continue;
      }

      const district = emailMatch[1].charAt(0).toUpperCase() + emailMatch[1].slice(1);
      
      // Find the hub for this district
      const hubToAssign = hubsToKeep.find(h => 
        h.config.district.toLowerCase() === district.toLowerCase()
      );

      if (hubToAssign) {
        await Hub.findByIdAndUpdate(hubToAssign.hub._id, {
          $addToSet: { managedBy: manager._id }
        });
        console.log(`✅ Assigned ${manager.firstName} ${manager.lastName} to ${hubToAssign.config.name}`);
      } else {
        console.log(`⚠️  No hub found for ${district} (manager: ${manager.email})`);
      }
    }

    // Fix Thiruvananthapuram Hub Manager role
    const tvpmManager = await User.findOne({ email: 'hub.thiruvananthapuram@pepper.local' });
    if (tvpmManager && tvpmManager.role !== 'hubmanager') {
      await User.findByIdAndUpdate(tvpmManager._id, { role: 'hubmanager' });
      console.log(`\n🔧 Fixed Thiruvananthapuram Hub Manager role: user → hubmanager`);
    }

    // STEP 6: Verification
    console.log('\n' + '═'.repeat(80));
    console.log('✅ VERIFICATION');
    console.log('═'.repeat(80) + '\n');

    const finalHubs = await Hub.find().sort({ order: 1 });
    console.log(`Total hubs: ${finalHubs.length}\n`);

    for (const hub of finalHubs) {
      const manager = hub.managedBy && hub.managedBy.length > 0 
        ? await User.findById(hub.managedBy[0]) 
        : null;
      
      const orderCount = await Order.countDocuments({ currentHub: hub._id });
      
      console.log(`${hub.order}. ${hub.name} (${hub.type})`);
      console.log(`   District: ${hub.district}`);
      console.log(`   Manager: ${manager ? `${manager.firstName} ${manager.lastName}` : '❌ NONE'}`);
      console.log(`   Orders: ${orderCount}`);
      console.log(`   Active: ${hub.isActive ? '✅' : '❌'}`);
      console.log('');
    }

    console.log('═'.repeat(80));
    console.log('🎉 HUB CLEANUP COMPLETE!');
    console.log('═'.repeat(80));

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB\n');
  }
}

cleanupAndSetupHubs();
