import admin from '../src/config/firebase.js';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// MongoDB User model (assuming you have one)
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

async function clearFirebaseUsers() {
  try {
    console.log('🔥 Starting Firebase user cleanup...');
    
    // Get all users from Firebase
    const listUsersResult = await admin.auth().listUsers();
    const users = listUsersResult.users;
    
    if (users.length === 0) {
      console.log('✅ No Firebase users found to delete');
      return;
    }
    
    console.log(`📊 Found ${users.length} Firebase users to delete`);
    
    // Delete users in batches
    const batchSize = 10;
    for (let i = 0; i < users.length; i += batchSize) {
      const batch = users.slice(i, i + batchSize);
      const uids = batch.map(user => user.uid);
      
      try {
        await admin.auth().deleteUsers(uids);
        console.log(`✅ Deleted Firebase users batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(users.length/batchSize)}`);
      } catch (error) {
        console.error(`❌ Error deleting Firebase users batch:`, error.message);
      }
    }
    
    console.log('🎉 Firebase user cleanup completed!');
  } catch (error) {
    console.error('❌ Error clearing Firebase users:', error.message);
    
    if (error.message.includes('credential')) {
      console.log('\n🔧 Firebase credentials not configured. Please set up:');
      console.log('   FIREBASE_PROJECT_ID=your-project-id');
      console.log('   FIREBASE_CLIENT_EMAIL=your-service-account-email');
      console.log('   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----\\n"');
      console.log('\n📖 You can get these from Firebase Console > Project Settings > Service Accounts');
    }
  }
}

async function clearMongoDBUsers() {
  try {
    console.log('🍃 Starting MongoDB user cleanup...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Count existing users
    const userCount = await User.countDocuments();
    console.log(`📊 Found ${userCount} MongoDB users to delete`);
    
    if (userCount === 0) {
      console.log('✅ No MongoDB users found to delete');
      return;
    }
    
    // Delete all users
    const result = await User.deleteMany({});
    console.log(`🗑️  Deleted ${result.deletedCount} users from MongoDB`);
    
    console.log('🎉 MongoDB user cleanup completed!');
  } catch (error) {
    console.error('❌ Error clearing MongoDB users:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

async function clearFirestoreUsers() {
  try {
    console.log('🔥 Starting Firestore user cleanup...');
    
    const db = admin.firestore();
    const usersRef = db.collection('users');
    
    // Get all user documents
    const snapshot = await usersRef.get();
    
    if (snapshot.empty) {
      console.log('✅ No Firestore users found to delete');
      return;
    }
    
    console.log(`📊 Found ${snapshot.size} Firestore user documents to delete`);
    
    // Delete in batches
    const batch = db.batch();
    let count = 0;
    
    snapshot.forEach((doc) => {
      batch.delete(doc.ref);
      count++;
    });
    
    await batch.commit();
    console.log(`🗑️  Deleted ${count} user documents from Firestore`);
    console.log('🎉 Firestore user cleanup completed!');
  } catch (error) {
    console.error('❌ Error clearing Firestore users:', error.message);
  }
}

async function main() {
  console.log('🚀 Starting complete database cleanup...\n');
  
  // Clear all databases
  await clearFirebaseUsers();
  console.log('');
  await clearFirestoreUsers();
  console.log('');
  await clearMongoDBUsers();
  
  console.log('\n🎉 All database cleanup completed!');
  console.log('✨ You can now start fresh with user registration');
  
  process.exit(0);
}

// Handle errors
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled rejection:', error);
  process.exit(1);
});

// Run the cleanup
main().catch(console.error);