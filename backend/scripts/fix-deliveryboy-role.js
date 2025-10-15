/**
 * Fix Delivery Boy Role in Firestore
 * 
 * This script syncs delivery boy roles from MongoDB to Firestore.
 * Run this if delivery boys are getting redirected to login when updating status.
 * 
 * Usage: node scripts/fix-deliveryboy-role.js <email>
 * Example: node scripts/fix-deliveryboy-role.js deliveryboy@example.com
 */

import admin from '../src/config/firebase.js';
import { getFirestore } from 'firebase-admin/firestore';
import User from '../src/models/User.js';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const db = getFirestore();

async function fixDeliveryBoyRole(email) {
  try {
    console.log(`\n🔍 Looking up user: ${email}`);
    
    // 1. Find user in MongoDB
    const mongoUser = await User.findOne({ email: email.toLowerCase() });
    if (!mongoUser) {
      console.error(`❌ User not found in MongoDB: ${email}`);
      return false;
    }
    
    console.log(`✅ Found in MongoDB:`, {
      email: mongoUser.email,
      role: mongoUser.role,
      firebaseUid: mongoUser.firebaseUid,
      isActive: mongoUser.isActive
    });
    
    // 2. Check if user exists in Firebase Auth
    let firebaseUser;
    try {
      firebaseUser = await admin.auth().getUserByEmail(email);
      console.log(`✅ Found in Firebase Auth:`, {
        uid: firebaseUser.uid,
        email: firebaseUser.email
      });
    } catch (error) {
      console.error(`❌ User not found in Firebase Auth: ${email}`);
      return false;
    }
    
    // 3. Check current Firestore role
    const firestoreDoc = await db.collection('users').doc(firebaseUser.uid).get();
    if (firestoreDoc.exists) {
      const currentData = firestoreDoc.data();
      console.log(`📄 Current Firestore data:`, {
        role: currentData.role,
        email: currentData.email
      });
    } else {
      console.log(`⚠️  No Firestore document exists for this user`);
    }
    
    // 4. Update Firestore with correct role
    console.log(`\n🔧 Updating Firestore with role: ${mongoUser.role}`);
    await db.collection('users').doc(firebaseUser.uid).set({
      uid: firebaseUser.uid,
      email: mongoUser.email,
      role: mongoUser.role,
      firstName: mongoUser.firstName || '',
      lastName: mongoUser.lastName || '',
      updatedAt: new Date().toISOString()
    }, { merge: true });
    
    console.log(`✅ Firestore updated successfully!`);
    
    // 5. Set custom claims (optional, for faster role checks)
    try {
      await admin.auth().setCustomUserClaims(firebaseUser.uid, { 
        role: mongoUser.role 
      });
      console.log(`✅ Custom claims set successfully!`);
    } catch (error) {
      console.warn(`⚠️  Failed to set custom claims (non-critical):`, error.message);
    }
    
    // 6. Verify the update
    const verifyDoc = await db.collection('users').doc(firebaseUser.uid).get();
    const verifyData = verifyDoc.data();
    console.log(`\n✅ VERIFICATION - Firestore now has:`, {
      role: verifyData.role,
      email: verifyData.email
    });
    
    console.log(`\n🎉 SUCCESS! The delivery boy can now update their status.`);
    console.log(`📝 Note: The user may need to logout and login again for changes to take effect.`);
    
    return true;
  } catch (error) {
    console.error(`\n❌ Error fixing delivery boy role:`, error);
    return false;
  }
}

async function fixAllDeliveryBoys() {
  try {
    console.log(`\n🔍 Finding all delivery boys in MongoDB...`);
    
    const deliveryBoys = await User.find({ role: 'deliveryboy' });
    console.log(`✅ Found ${deliveryBoys.length} delivery boy(s)`);
    
    if (deliveryBoys.length === 0) {
      console.log(`⚠️  No delivery boys found in MongoDB`);
      return;
    }
    
    for (const deliveryBoy of deliveryBoys) {
      console.log(`\n${'='.repeat(60)}`);
      await fixDeliveryBoyRole(deliveryBoy.email);
    }
    
    console.log(`\n${'='.repeat(60)}`);
    console.log(`\n🎉 All delivery boys processed!`);
  } catch (error) {
    console.error(`\n❌ Error processing delivery boys:`, error);
  }
}

// Main execution
async function main() {
  try {
    // Connect to MongoDB
    console.log(`🔌 Connecting to MongoDB...`);
    await mongoose.connect(process.env.MONGO_URI);
    console.log(`✅ Connected to MongoDB`);
    
    const email = process.argv[2];
    
    if (email) {
      // Fix specific delivery boy
      await fixDeliveryBoyRole(email);
    } else {
      // Fix all delivery boys
      await fixAllDeliveryBoys();
    }
    
    await mongoose.disconnect();
    console.log(`\n👋 Disconnected from MongoDB`);
    process.exit(0);
  } catch (error) {
    console.error(`\n❌ Fatal error:`, error);
    process.exit(1);
  }
}

main();