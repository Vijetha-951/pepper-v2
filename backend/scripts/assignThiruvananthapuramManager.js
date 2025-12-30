import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Hub from '../src/models/Hub.js';
import User from '../src/models/User.js';

dotenv.config();

async function assignThiruvananthapuramManager() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find Thiruvananthapuram hub manager
    const manager = await User.findOne({ email: 'hub.thiruvananthapuram@pepper.local' });
    
    if (!manager) {
      console.log('❌ Thiruvananthapuram Hub Manager not found');
      return;
    }

    console.log(`Found manager: ${manager.firstName} ${manager.lastName}`);
    console.log(`Email: ${manager.email}`);
    console.log(`Role: ${manager.role}\n`);

    // Find Thiruvananthapuram hub
    const hub = await Hub.findOne({ district: 'Thiruvananthapuram' });
    
    if (!hub) {
      console.log('❌ Thiruvananthapuram Hub not found');
      return;
    }

    console.log(`Found hub: ${hub.name}`);
    console.log(`Current managers: ${hub.managedBy}\n`);

    // Assign manager to hub
    await Hub.findByIdAndUpdate(hub._id, {
      $addToSet: { managedBy: manager._id }
    });

    console.log('✅ Successfully assigned Thiruvananthapuram Hub Manager to hub\n');

    // Verify
    const updatedHub = await Hub.findById(hub._id).populate('managedBy', 'firstName lastName email');
    console.log('Verification:');
    console.log(`Hub: ${updatedHub.name}`);
    console.log(`Managers: ${updatedHub.managedBy.map(m => `${m.firstName} ${m.lastName}`).join(', ')}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB\n');
  }
}

assignThiruvananthapuramManager();
