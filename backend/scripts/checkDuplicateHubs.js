import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Hub from '../src/models/Hub.js';
import User from '../src/models/User.js';

dotenv.config();

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/pepper';

async function checkHubs() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find all Ernakulam hubs
    const ernakulamHubs = await Hub.find({ 
      $or: [
        { name: /ernakulam/i },
        { district: /ernakulam/i }
      ]
    }).populate('managedBy', 'firstName lastName email');

    console.log(`Found ${ernakulamHubs.length} Ernakulam hub(s):\n`);
    
    ernakulamHubs.forEach((hub, index) => {
      console.log(`Hub #${index + 1}:`);
      console.log(`  ID: ${hub._id}`);
      console.log(`  Name: ${hub.name}`);
      console.log(`  District: ${hub.district}`);
      console.log(`  Type: ${hub.type}`);
      console.log(`  Manager: ${hub.managedBy?.email || 'None'}`);
      console.log(`  Order: ${hub.order}`);
      console.log('');
    });

    // Find the hub manager
    const hubManager = await User.findOne({ email: 'hub.ernakulam@pepper.local' });
    if (hubManager) {
      console.log(`Hub Manager (hub.ernakulam@pepper.local):`);
      console.log(`  User ID: ${hubManager._id}`);
      console.log(`  Name: ${hubManager.firstName} ${hubManager.lastName}`);
      
      const managedHub = await Hub.findOne({ managedBy: hubManager._id });
      console.log(`  Manages Hub: ${managedHub?.name} (${managedHub?._id})\n`);
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkHubs();
