import admin from '../src/config/firebase.js';
import dotenv from 'dotenv';

dotenv.config();

async function testFirebaseConnection() {
  try {
    console.log('🔥 Testing Firebase connection...');
    
    // Test Firebase Auth
    const listUsersResult = await admin.auth().listUsers(1);
    console.log('✅ Firebase Auth connection successful');
    console.log(`📊 Total users in Firebase Auth: ${listUsersResult.users.length > 0 ? 'At least 1' : '0'}`);
    
    // Test Firestore
    const db = admin.firestore();
    const snapshot = await db.collection('users').limit(1).get();
    console.log('✅ Firestore connection successful');
    console.log(`📊 Users in Firestore: ${snapshot.size > 0 ? 'At least 1' : '0'}`);
    
    console.log('\n🎉 Firebase is properly configured!');
    console.log('✨ You can now run the full cleanup script');
    
  } catch (error) {
    console.error('❌ Firebase connection failed:', error.message);
    
    if (error.message.includes('credential')) {
      console.log('\n🔧 Please configure Firebase credentials in .env file:');
      console.log('   FIREBASE_PROJECT_ID=your-project-id');
      console.log('   FIREBASE_CLIENT_EMAIL=your-service-account-email');
      console.log('   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----\\n"');
      console.log('\n📖 Get these from Firebase Console > Project Settings > Service Accounts');
    }
  }
}

testFirebaseConnection();