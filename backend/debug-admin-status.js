/**
 * Debug script to check current admin status
 */

import admin from './src/config/firebase.js';
import { getFirestore } from 'firebase-admin/firestore';

const db = getFirestore();
const TARGET_EMAIL = 'vj.vijetha01@gmail.com';

async function debugAdminStatus() {
  console.log('🔍 DEBUGGING ADMIN STATUS');
  console.log('Target admin email:', TARGET_EMAIL);
  
  try {
    // Check Firestore users
    console.log('\n📋 1. Checking Firestore users collection...');
    const usersSnapshot = await db.collection('users').get();
    
    console.log(`Found ${usersSnapshot.size} users in Firestore`);
    
    let targetUserFound = false;
    
    usersSnapshot.forEach(doc => {
      const data = doc.data();
      const email = (data.email || '').toLowerCase();
      
      console.log(`User: ${email} | Role: ${data.role} | UID: ${data.uid || doc.id}`);
      
      if (email === TARGET_EMAIL) {
        targetUserFound = true;
        console.log(`  ✅ TARGET ADMIN FOUND - Role: ${data.role}`);
      }
    });
    
    if (!targetUserFound) {
      console.log(`  ❌ Target admin ${TARGET_EMAIL} NOT FOUND in Firestore`);
    }
    
    // Check Firebase Auth users
    console.log('\n📋 2. Checking Firebase Auth users...');
    
    try {
      const userRecord = await admin.auth().getUserByEmail(TARGET_EMAIL);
      console.log(`Firebase Auth user found:`);
      console.log(`  UID: ${userRecord.uid}`);
      console.log(`  Email: ${userRecord.email}`);
      console.log(`  Verified: ${userRecord.emailVerified}`);
      console.log(`  Created: ${userRecord.metadata.creationTime}`);
      console.log(`  Last login: ${userRecord.metadata.lastSignInTime}`);
      
      if (userRecord.customClaims) {
        console.log(`  Custom claims:`, userRecord.customClaims);
      } else {
        console.log(`  No custom claims`);
      }
      
      // Check if Firestore doc matches Firebase UID
      const firestoreDoc = await db.collection('users').doc(userRecord.uid).get();
      if (firestoreDoc.exists) {
        const firestoreData = firestoreDoc.data();
        console.log(`  Firestore doc exists for UID ${userRecord.uid}`);
        console.log(`    Email: ${firestoreData.email}`);
        console.log(`    Role: ${firestoreData.role}`);
      } else {
        console.log(`  ❌ No Firestore document found for UID ${userRecord.uid}`);
      }
      
    } catch (error) {
      console.log(`❌ Firebase Auth error: ${error.message}`);
    }
    
    // Test the auth middleware logic
    console.log('\n📋 3. Testing middleware logic simulation...');
    
    const testEmails = [TARGET_EMAIL, 'vijethajinu01@gmail.com'];
    
    for (const testEmail of testEmails) {
      console.log(`\n  Testing: ${testEmail}`);
      
      // Check hardcoded admin logic (from middleware)
      const isHardcodedAdmin = testEmail === TARGET_EMAIL;
      console.log(`    Hardcoded admin check: ${isHardcodedAdmin}`);
      
      if (isHardcodedAdmin) {
        console.log(`    Expected role: admin (hardcoded)`);
      } else {
        // Check Firestore role
        const userDoc = await db.collection('users')
          .where('email', '==', testEmail)
          .limit(1)
          .get();
          
        if (userDoc.empty) {
          console.log(`    Firestore role: user (default - no document)`);
        } else {
          const userData = userDoc.docs[0].data();
          const firestoreRole = userData.role;
          console.log(`    Firestore role: ${firestoreRole}`);
          
          // Apply middleware logic
          if (firestoreRole === 'admin') {
            console.log(`    Final role: user (blocked unauthorized admin)`);
          } else {
            console.log(`    Final role: ${firestoreRole || 'user'}`);
          }
        }
      }
    }
    
    // Test token generation
    console.log('\n📋 4. Testing token generation...');
    
    try {
      const userRecord = await admin.auth().getUserByEmail(TARGET_EMAIL);
      
      // Create a custom token for testing
      const customToken = await admin.auth().createCustomToken(userRecord.uid, { role: 'admin' });
      console.log(`✅ Custom token created successfully (${customToken.length} characters)`);
      
    } catch (error) {
      console.log(`❌ Token generation error: ${error.message}`);
    }
    
    console.log('\n🎯 SUMMARY:');
    console.log('1. Run the lockdown script if admin role is not set correctly');
    console.log('2. Make sure the user logs out and logs back in to refresh tokens');
    console.log('3. Check browser localStorage and Firebase authentication state');
    console.log('4. Verify the frontend is sending proper Authorization headers');
    
  } catch (error) {
    console.error('❌ Debug script error:', error);
  }
}

debugAdminStatus().then(() => {
  console.log('\n🏁 Debug complete');
  process.exit(0);
}).catch(console.error);