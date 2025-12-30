import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Hub from '../src/models/Hub.js';

dotenv.config();

async function fixHubDistricts() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Map hub names to their districts
    const hubDistrictMap = {
      'Thiruvananthapuram Hub': 'Thiruvananthapuram',
      'Kollam Hub': 'Kollam',
      'Pathanamthitta Hub': 'Pathanamthitta',
      'Alappuzha Hub': 'Alappuzha',
      'Kottayam Hub': 'Kottayam',
      'Idukki Hub': 'Idukki',
      'Ernakulam Hub': 'Ernakulam',
      'Thrissur Hub': 'Thrissur',
      'Palakkad Hub': 'Palakkad',
      'Malappuram Hub': 'Malappuram',
      'Kozhikode Hub': 'Kozhikode',
      'Wayanad Hub': 'Wayanad',
      'Kannur Hub': 'Kannur',
      'Kasaragod Hub': 'Kasaragod',
      'Central Warehouse': 'Kottayam',
      'North Region Hub': 'Ernakulam',
      'South Delhi Local Hub': 'Delhi'
    };

    let updated = 0;
    let skipped = 0;

    for (const [hubName, district] of Object.entries(hubDistrictMap)) {
      const hubs = await Hub.find({ name: hubName });
      
      if (hubs.length === 0) {
        console.log(`⚠️  Hub not found: ${hubName}`);
        continue;
      }

      for (const hub of hubs) {
        if (!hub.district || hub.district === '' || hub.district === 'undefined') {
          // Update using findByIdAndUpdate to avoid validation issues
          await Hub.findByIdAndUpdate(hub._id, { district: district });
          console.log(`✅ Updated: ${hub.name} → District: ${district}`);
          updated++;
        } else {
          console.log(`⏭️  Skipped: ${hub.name} (already has district: ${hub.district})`);
          skipped++;
        }
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`   ✅ Updated: ${updated} hubs`);
    console.log(`   ⏭️  Skipped: ${skipped} hubs`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

fixHubDistricts();
