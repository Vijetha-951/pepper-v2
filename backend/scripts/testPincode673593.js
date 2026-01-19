import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function testPincode() {
  try {
    // Test the pincode 673593
    const testPincode = '673593';
    console.log(`\n🔍 Testing pincode: ${testPincode}\n`);

    // Import the function
    const { getCoordinatesForPincode } = await import('../src/data/pincodeCoordinates.js');
    
    const coords = getCoordinatesForPincode(testPincode);
    
    if (coords) {
      console.log('✅ Pincode found in database:');
      console.log(`   District: ${coords.district}`);
      console.log(`   State: ${coords.state}`);
      console.log(`   Coordinates: (${coords.lat}, ${coords.lng})\n`);
    } else {
      console.log('❌ Pincode not found in database\n');
    }

    // Now test hub assignment
    console.log('🗺️ Testing hub assignment...\n');
    
    await mongoose.connect(process.env.MONGO_URI);
    
    const Hub = (await import('../src/models/Hub.js')).default;
    
    const hubs = await Hub.find({
      isActive: true,
      'location.coordinates.lat': { $exists: true },
      'location.coordinates.lng': { $exists: true }
    });

    console.log(`Found ${hubs.length} active hubs with coordinates\n`);

    // Calculate distance to each hub
    const calculateDistance = (lat1, lon1, lat2, lon2) => {
      const R = 6371;
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;
      const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    };

    if (coords) {
      const distances = hubs.map(hub => {
        const distance = calculateDistance(
          coords.lat,
          coords.lng,
          hub.location.coordinates.lat,
          hub.location.coordinates.lng
        );
        return { hub, distance };
      });

      distances.sort((a, b) => a.distance - b.distance);

      console.log('📏 Distance from pincode to all hubs:\n');
      distances.forEach(({ hub, distance }) => {
        const marker = distance === distances[0].distance ? '✅' : '  ';
        console.log(`${marker} ${distance.toFixed(2)} km - ${hub.name} (${hub.district})`);
      });

      console.log(`\n✅ Nearest hub: ${distances[0].hub.name} (${distances[0].distance.toFixed(2)} km away)`);
      console.log(`   Address: ${distances[0].hub.location?.address || 'N/A'}`);
      console.log(`   City: ${distances[0].hub.location?.city || 'N/A'}`);
      console.log(`   Pincode: ${distances[0].hub.location?.pincode || 'N/A'}`);
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testPincode();
