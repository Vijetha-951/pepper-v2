import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// MongoDB User model
const UserSchema = new mongoose.Schema({
  firebaseUid: String,
  email: String,
  firstName: String,
  lastName: String,
  phone: String,
  role: String,
  place: String,
  district: String,
  pincode: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', UserSchema);

async function clearMongoDB() {
  try {
    console.log('🍃 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Count existing users
    const userCount = await User.countDocuments();
    console.log(`📊 Found ${userCount} users in MongoDB`);
    
    if (userCount === 0) {
      console.log('✅ No users found to delete');
      return;
    }
    
    // Show some sample users
    const sampleUsers = await User.find({}).limit(3).select('email firstName lastName');
    console.log('📋 Sample users:');
    sampleUsers.forEach(user => {
      console.log(`   - ${user.email} (${user.firstName} ${user.lastName})`);
    });
    
    // Delete all users
    console.log('\n🗑️  Deleting all users...');
    const result = await User.deleteMany({});
    console.log(`✅ Successfully deleted ${result.deletedCount} users from MongoDB`);
    
    // Verify deletion
    const remainingCount = await User.countDocuments();
    console.log(`📊 Remaining users: ${remainingCount}`);
    
    console.log('\n🎉 MongoDB cleanup completed!');
  } catch (error) {
    console.error('❌ Error clearing MongoDB:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

// Run the cleanup
console.log('🧹 MongoDB User Cleanup Tool\n');
clearMongoDB()
  .then(() => {
    console.log('\n✨ Ready for fresh user registrations!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Cleanup failed:', error);
    process.exit(1);
  });