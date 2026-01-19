import mongoose from 'mongoose';
import Hub from '../src/models/Hub.js';
import dotenv from 'dotenv';

dotenv.config();

async function checkHubs() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    const hubs = await Hub.find({ isActive: true });
    console.log(`Found ${hubs.length} active hubs:\n`);

    hubs.forEach(hub => {
      console.log(`\n🏢 ${hub.name}`);
      console.log(`   District: ${hub.district}`);
      console.log(`   Location:`);
      console.log(`     Address: ${hub.location?.address || 'NOT SET'}`);
      console.log(`     City: ${hub.location?.city || 'NOT SET'}`);
      console.log(`     Pincode: ${hub.location?.pincode || 'NOT SET'}`);
      console.log(`     Landmark: ${hub.location?.landmark || 'NOT SET'}`);
      console.log(`     Coordinates: lat=${hub.location?.coordinates?.lat || 'NOT SET'}, lng=${hub.location?.coordinates?.lng || 'NOT SET'}`);
      console.log(`     Latitude: ${hub.location?.coordinates?.latitude || 'NOT SET'}`);
      console.log(`     Longitude: ${hub.location?.coordinates?.longitude || 'NOT SET'}`);
      console.log(`   Phone: ${hub.phone || 'NOT SET'}`);
      console.log(`   Email: ${hub.email || 'NOT SET'}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkHubs();
