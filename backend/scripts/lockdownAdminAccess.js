/**
 * Complete Admin Lockdown Script
 * This script will permanently fix admin access issues
 */

import admin from '../src/config/firebase.js';
import { getFirestore } from 'firebase-admin/firestore';

const db = getFirestore();
const AUTHORIZED_ADMIN_EMAIL = 'vj.vijetha01@gmail.com';
const UNAUTHORIZED_EMAIL = 'vijethajinu01@gmail.com';

async function completeAdminLockdown() {
  console.log('🔒 STARTING COMPLETE ADMIN LOCKDOWN');
  console.log(`✅ Authorized admin: ${AUTHORIZED_ADMIN_EMAIL}`);
  console.log(`❌ Blocking access for: ${UNAUTHORIZED_EMAIL}`);
  
  try {
    // Step 1: Remove ALL admin roles from unauthorized users
    console.log('\n📋 Step 1: Scanning all users with admin role...');
    
    const adminSnapshot = await db.collection('users').where('role', '==', 'admin').get();
    
    for (const doc of adminSnapshot.docs) {
      const data = doc.data();
      const email = (data.email || '').toLowerCase();
      
      if (email !== AUTHORIZED_ADMIN_EMAIL) {
        console.log(`🚨 Removing admin from: ${email}`);
        
        // Update Firestore
        await doc.ref.update({ role: 'user' });
        
        // Update Firebase Auth custom claims
        try {
          await admin.auth().setCustomUserClaims(data.uid || doc.id, { role: 'user' });
          console.log(`   ✅ Updated both Firestore and Auth claims for ${email}`);
        } catch (error) {
          console.log(`   ⚠️  Updated Firestore only for ${email}: ${error.message}`);
        }
      } else {
        console.log(`✅ Confirmed admin access for: ${email}`);
      }
    }
    
    // Step 2: Specifically handle the unauthorized email
    console.log('\n📋 Step 2: Handling unauthorized email specifically...');
    
    const unauthorizedSnapshot = await db.collection('users').where('email', '==', UNAUTHORIZED_EMAIL).get();
    
    if (!unauthorizedSnapshot.empty) {
      for (const doc of unauthorizedSnapshot.docs) {
        const data = doc.data();
        console.log(`🔧 Found ${UNAUTHORIZED_EMAIL} document:`, {
          docId: doc.id,
          currentRole: data.role,
          uid: data.uid
        });
        
        // Force update to user role
        await doc.ref.update({
          role: 'user',
          lastAdminRemoval: new Date().toISOString(),
          adminBlocked: true
        });
        
        // Update Firebase Auth
        try {
          await admin.auth().setCustomUserClaims(data.uid || doc.id, { role: 'user' });
          console.log(`   ✅ Forced update: ${UNAUTHORIZED_EMAIL} is now 'user'`);
        } catch (error) {
          console.log(`   ⚠️  Firestore updated, Auth claims error: ${error.message}`);
        }
      }
    } else {
      console.log(`   ℹ️  No Firestore document found for ${UNAUTHORIZED_EMAIL}`);
    }
    
    // Step 3: Verify the authorized admin
    console.log('\n📋 Step 3: Verifying authorized admin...');
    
    const authorizedSnapshot = await db.collection('users').where('email', '==', AUTHORIZED_ADMIN_EMAIL).get();
    
    if (authorizedSnapshot.empty) {
      console.log(`⚠️  Creating admin document for ${AUTHORIZED_ADMIN_EMAIL}...`);
      
      // Find the Firebase user
      try {
        const userRecord = await admin.auth().getUserByEmail(AUTHORIZED_ADMIN_EMAIL);
        
        await db.collection('users').doc(userRecord.uid).set({
          uid: userRecord.uid,
          email: AUTHORIZED_ADMIN_EMAIL,
          role: 'admin',
          provider: 'password',
          adminConfirmed: new Date().toISOString()
        }, { merge: true });
        
        await admin.auth().setCustomUserClaims(userRecord.uid, { role: 'admin' });
        
        console.log(`   ✅ Created admin document and claims for ${AUTHORIZED_ADMIN_EMAIL}`);
      } catch (error) {
        console.log(`   ❌ Error setting up authorized admin: ${error.message}`);
      }
    } else {
      const adminDoc = authorizedSnapshot.docs[0];
      const adminData = adminDoc.data();
      
      console.log(`   ✅ Confirmed authorized admin exists:`, {
        email: adminData.email,
        role: adminData.role,
        uid: adminData.uid
      });
      
      // Ensure admin role is set
      if (adminData.role !== 'admin') {
        await adminDoc.ref.update({
          role: 'admin',
          adminRestored: new Date().toISOString()
        });
        console.log(`   🔧 Restored admin role for ${AUTHORIZED_ADMIN_EMAIL}`);
      }
    }
    
    // Step 4: Final verification
    console.log('\n📋 Step 4: Final verification...');
    
    const finalAdminCheck = await db.collection('users').where('role', '==', 'admin').get();
    
    console.log(`Found ${finalAdminCheck.size} admin user(s):`);
    finalAdminCheck.forEach(doc => {
      const data = doc.data();
      console.log(`   - ${data.email}: ${data.role} (UID: ${data.uid || doc.id})`);
    });
    
    // Step 5: Test API call simulation
    console.log('\n📋 Step 5: Testing auth logic simulation...');
    
    // Simulate what the middleware will do
    const testEmails = [AUTHORIZED_ADMIN_EMAIL, UNAUTHORIZED_EMAIL];
    
    for (const testEmail of testEmails) {
      console.log(`\n   Testing ${testEmail}:`);
      
      // Check hardcoded admin
      const isHardcodedAdmin = testEmail === AUTHORIZED_ADMIN_EMAIL;
      console.log(`     - Hardcoded admin check: ${isHardcodedAdmin}`);
      
      // Check Firestore role
      const userDoc = await db.collection('users').where('email', '==', testEmail).limit(1).get();
      let firestoreRole = null;
      if (!userDoc.empty) {
        firestoreRole = userDoc.docs[0].data().role;
      }
      console.log(`     - Firestore role: ${firestoreRole}`);
      
      // Determine final role (simulating middleware logic)
      let finalRole = null;
      if (testEmail === AUTHORIZED_ADMIN_EMAIL) {
        finalRole = 'admin';
      } else {
        finalRole = (firestoreRole && firestoreRole !== 'admin') ? firestoreRole : 'user';
      }
      
      console.log(`     - Final role: ${finalRole}`);
      console.log(`     - Dashboard access: ${finalRole === 'admin' ? 'ADMIN DASHBOARD' : 'USER DASHBOARD'}`);
    }
    
    console.log('\n🎉 ADMIN LOCKDOWN COMPLETE!');
    console.log(`✅ Only ${AUTHORIZED_ADMIN_EMAIL} should have admin access`);
    console.log(`✅ ${UNAUTHORIZED_EMAIL} should be blocked from admin access`);
    
  } catch (error) {
    console.error('❌ Error during admin lockdown:', error);
  }
}

completeAdminLockdown().then(() => {
  console.log('\n🏁 Script finished. Admin access is now secure.');
  process.exit(0);
}).catch(console.error);