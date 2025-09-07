import admin from '../src/config/firebase.js';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import readline from 'readline';

dotenv.config();

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

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
  updatedAt: { type: Date, default: Date.now },
});

const User = mongoose.model('User', UserSchema);

function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
}

async function showDatabaseStats() {
  console.log('📊 Current Database Statistics:\n');

  // Firebase Auth users
  try {
    const listUsersResult = await admin.auth().listUsers();
    console.log(`🔥 Firebase Auth Users: ${listUsersResult.users.length}`);

    if (listUsersResult.users.length > 0) {
      console.log('   Recent users:');
      listUsersResult.users.slice(0, 3).forEach((user) => {
        console.log(`   - ${user.email || 'No email'} (${user.uid.substring(0, 8)}...)`);
      });
    }
  } catch (err) {
    console.error('🔥 Firebase Auth Users: ❌ Cannot access (credentials not configured)', err);
  }

  // Firestore users
  try {
    const db = admin.firestore();
    const snapshot = await db.collection('users').get();
    console.log(`🔥 Firestore User Documents: ${snapshot.size}`);
  } catch (err) {
    console.error('🔥 Firestore User Documents: ❌ Cannot access', err);
  }

  // MongoDB users
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const userCount = await User.countDocuments();
    console.log(`🍃 MongoDB Users: ${userCount}`);
    await mongoose.disconnect();
  } catch (err) {
    console.error('🍃 MongoDB Users: ❌ Cannot access', err);
  }

  console.log('');
}

async function clearFirebaseAuth() {
  try {
    const listUsersResult = await admin.auth().listUsers();
    const users = listUsersResult.users;

    if (users.length === 0) {
      console.log('✅ No Firebase Auth users to delete');
      return;
    }

    console.log(`🗑️  Deleting ${users.length} Firebase Auth users...`);

    const batchSize = 10;
    for (let i = 0; i < users.length; i += batchSize) {
      const batch = users.slice(i, i + batchSize);
      const uids = batch.map((user) => user.uid);
      await admin.auth().deleteUsers(uids);
    }

    console.log('✅ Firebase Auth users cleared');
  } catch (err) {
    console.error('❌ Error clearing Firebase Auth:', err);
  }
}

async function clearFirestore() {
  try {
    const db = admin.firestore();
    const snapshot = await db.collection('users').get();

    if (snapshot.empty) {
      console.log('✅ No Firestore users to delete');
      return;
    }

    console.log(`🗑️  Deleting ${snapshot.size} Firestore user documents...`);

    const batch = db.batch();
    snapshot.forEach((doc) => {
      batch.delete(doc.ref);
    });
    await batch.commit();

    console.log('✅ Firestore users cleared');
  } catch (err) {
    console.error('❌ Error clearing Firestore:', err);
  }
}

async function clearMongoDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const userCount = await User.countDocuments();

    if (userCount === 0) {
      console.log('✅ No MongoDB users to delete');
      await mongoose.disconnect();
      return;
    }

    console.log(`🗑️  Deleting ${userCount} MongoDB users...`);
    const result = await User.deleteMany({});
    console.log(`✅ MongoDB users cleared (${result.deletedCount} deleted)`);

    await mongoose.disconnect();
  } catch (err) {
    console.error('❌ Error clearing MongoDB:', err);
  }
}

async function main() {
  console.log('🧹 Safe Database Cleanup Tool\n');
  console.log('⚠️  WARNING: This will permanently delete all user data!\n');

  await showDatabaseStats();

  const confirm1 = await askQuestion(
    '❓ Are you sure you want to clear ALL user data? (type "yes" to continue): '
  );
  if (confirm1.toLowerCase() !== 'yes') {
    console.log('❌ Operation cancelled');
    rl.close();
    return;
  }

  const confirm2 = await askQuestion(
    '❓ This action cannot be undone. Type "DELETE ALL USERS" to proceed: '
  );
  if (confirm2 !== 'DELETE ALL USERS') {
    console.log('❌ Operation cancelled');
    rl.close();
    return;
  }

  console.log('\n🚀 Starting cleanup process...\n');

  await clearFirebaseAuth();
  await clearFirestore();
  await clearMongoDB();

  console.log('\n🎉 Cleanup completed!');
  console.log('✨ All user databases are now empty');
  console.log('🔄 You can now start fresh with user registration\n');

  rl.close();
}

process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled rejection:', err);
  rl.close();
  process.exit(1);
});

process.on('SIGINT', () => {
  console.log('\n❌ Operation cancelled by user');
  rl.close();
  process.exit(0);
});

main().catch((err) => {
  console.error('❌ Error:', err);
  rl.close();
  process.exit(1);
});
