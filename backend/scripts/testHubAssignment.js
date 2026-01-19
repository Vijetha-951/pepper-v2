import mongoose from 'mongoose';
import Hub from '../src/models/Hub.js';
import dotenv from 'dotenv';

dotenv.config();

async function testHubAssignment() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected\n');

    // Test pincode 695001 (Thiruvananthapuram)
    const testPincode = '695001';
    console.log(`🔍 Testing hub assignment for pincode: ${testPincode}\n`);

    // Get all active hubs with coordinates
    const hubs = await Hub.find({
      isActive: true,
      'location.coordinates.lat': { $exists: true },
      'location.coordinates.lng': { $exists: true }
    });

    console.log(`Found ${hubs.length} active hubs with coordinates:\n`);
    
    hubs.forEach(hub => {
      console.log(`📍 ${hub.name}`);
      console.log(`   Address: ${hub.location?.address || 'N/A'}`);
      console.log(`   Pincode: ${hub.location?.pincode || 'N/A'}`);
      console.log(`   Coordinates: (${hub.location?.coordinates?.lat}, ${hub.location?.coordinates?.lng})`);
      console.log('');
    });

    // Test distance calculation (simulate what API does)
    const pincodeCoords = { lat: 8.5241, lng: 76.9366 }; // Thiruvananthapuram center
    
    console.log('\n🗺️  Distance calculations from pincode location:\n');
    
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

    const hubsWithDistance = hubs.map(hub => {
      const distance = calculateDistance(
        pincodeCoords.lat,
        pincodeCoords.lng,
        hub.location.coordinates.lat,
        hub.location.coordinates.lng
      );
      return { hub, distance };
    });

    hubsWithDistance.sort((a, b) => a.distance - b.distance);

    hubsWithDistance.forEach(({ hub, distance }) => {
      console.log(`   ${distance.toFixed(2)} km - ${hub.name}`);
    });

    console.log(`\n✅ Nearest hub: ${hubsWithDistance[0].hub.name} (${hubsWithDistance[0].distance.toFixed(2)} km away)`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testHubAssignment();
