import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Hub from '../src/models/Hub.js';

dotenv.config();

// Kerala district coordinates (approximate central points)
const districtCoordinates = {
  'Thiruvananthapuram': { lat: 8.5241, lng: 76.9366 },
  'Kollam': { lat: 8.8932, lng: 76.6141 },
  'Pathanamthitta': { lat: 9.2648, lng: 76.7870 },
  'Alappuzha': { lat: 9.4981, lng: 76.3388 },
  'Kottayam': { lat: 9.5916, lng: 76.5222 },
  'Idukki': { lat: 9.8612, lng: 77.0629 },
  'Ernakulam': { lat: 9.9312, lng: 76.2673 },
  'Thrissur': { lat: 10.5276, lng: 76.2144 },
  'Palakkad': { lat: 10.7867, lng: 76.6548 },
  'Malappuram': { lat: 11.0510, lng: 76.0711 },
  'Kozhikode': { lat: 11.2588, lng: 75.7804 },
  'Wayanad': { lat: 11.6854, lng: 76.1320 },
  'Kannur': { lat: 11.8745, lng: 75.3704 },
  'Kasaragod': { lat: 12.4996, lng: 74.9869 }
};

async function addCoordinatesToHubs() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get all hubs
    const hubs = await Hub.find({});
    console.log(`📦 Found ${hubs.length} hubs\n`);

    let updated = 0;
    let skipped = 0;
    let errors = 0;

    for (const hub of hubs) {
      try {
        // Check if hub already has coordinates
        if (hub.location?.coordinates?.lat && hub.location?.coordinates?.lng) {
          console.log(`⏭️  ${hub.name}: Already has coordinates`);
          skipped++;
          continue;
        }

        // Get coordinates for this district
        const coords = districtCoordinates[hub.district];
        
        if (!coords) {
          console.log(`⚠️  ${hub.name}: No coordinates found for district "${hub.district}"`);
          errors++;
          continue;
        }

        // Update hub with coordinates
        const updateData = {
          'location.coordinates.lat': coords.lat,
          'location.coordinates.lng': coords.lng
        };

        // If location doesn't exist, create it
        if (!hub.location) {
          updateData.location = {
            coordinates: coords,
            address: `${hub.name}, ${hub.district}`,
            city: hub.district,
            state: 'Kerala',
            pincode: hub.location?.pincode || '000000'
          };
        }

        await Hub.updateOne(
          { _id: hub._id },
          { $set: updateData }
        );

        console.log(`✅ ${hub.name}: Added coordinates (${coords.lat}, ${coords.lng})`);
        updated++;

      } catch (err) {
        console.error(`❌ Error updating ${hub.name}:`, err.message);
        errors++;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 SUMMARY:');
    console.log('='.repeat(60));
    console.log(`✅ Updated: ${updated}`);
    console.log(`⏭️  Skipped: ${skipped}`);
    console.log(`❌ Errors: ${errors}`);
    console.log(`📦 Total: ${hubs.length}`);
    console.log('='.repeat(60));

    // Show all hubs with their coordinates
    console.log('\n📍 ALL HUBS WITH COORDINATES:\n');
    const updatedHubs = await Hub.find({}).select('name district location.coordinates');
    
    for (const hub of updatedHubs) {
      const coords = hub.location?.coordinates;
      if (coords?.lat && coords?.lng) {
        console.log(`✅ ${hub.name.padEnd(30)} | ${hub.district.padEnd(20)} | ${coords.lat}, ${coords.lng}`);
      } else {
        console.log(`❌ ${hub.name.padEnd(30)} | ${hub.district.padEnd(20)} | NO COORDINATES`);
      }
    }

  } catch (error) {
    console.error('❌ Fatal error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run the script
addCoordinatesToHubs();
