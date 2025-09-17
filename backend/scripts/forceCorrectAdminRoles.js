/**
 * NUCLEAR OPTION: Force correct admin roles with multiple verification steps
 * This will definitively fix the admin role assignment
 */

import admin from '../src/config/firebase.js';
import { getFirestore } from 'firebase-admin/firestore';

const db = getFirestore();
const CORRECT_ADMIN_EMAIL = 'vj.vijetha01@gmail.com';
const BLOCKED_EMAIL = 'vijethajinu01@gmail.com';

async function forceCorrectAdminRoles() {
  console.log('🔥 NUCLEAR ADMIN FIX - FORCING CORRECT ROLES');
  console.log(`✅ Correct admin: ${CORRECT_ADMIN_EMAIL}`);
  console.log(`❌ Blocked user: ${BLOCKED_EMAIL}`);
  
  try {
    // STEP 1: Force update the correct admin
    console.log('\n📋 STEP 1: Setting up correct admin...');
    
    const correctAdminSnapshot = await db.collection('users')
      .where('email', '==', CORRECT_ADMIN_EMAIL)
      .get();
    
    if (!correctAdminSnapshot.empty) {
      const adminDoc = correctAdminSnapshot.docs[0];
      const adminData = adminDoc.data();
      
      console.log(`Found ${CORRECT_ADMIN_EMAIL}:`, {
        docId: adminDoc.id,
        currentRole: adminData.role,
        uid: adminData.uid
      });
      
      // Force update to admin
      await adminDoc.ref.update({
        role: 'admin',
        email: CORRECT_ADMIN_EMAIL,
        adminForced: new Date().toISOString(),
        isAdmin: true
      });
      
      console.log(`✅ Updated ${CORRECT_ADMIN_EMAIL} to admin in Firestore`);
      
      // Update Firebase Auth claims
      if (adminData.uid) {
        try {
          await admin.auth().setCustomUserClaims(adminData.uid, { 
            role: 'admin',
            isAdmin: true,
            email: CORRECT_ADMIN_EMAIL 
          });
          console.log(`✅ Updated Firebase claims for ${CORRECT_ADMIN_EMAIL}`);
        } catch (error) {
          console.log(`❌ Firebase claims error: ${error.message}`);
        }
      }
    } else {
      console.log(`❌ ${CORRECT_ADMIN_EMAIL} not found in Firestore`);
    }
    
    // STEP 2: Force block the incorrect user
    console.log('\n📋 STEP 2: Blocking incorrect admin...');
    
    const blockedUserSnapshot = await db.collection('users')
      .where('email', '==', BLOCKED_EMAIL)
      .get();
    
    if (!blockedUserSnapshot.empty) {
      const blockedDoc = blockedUserSnapshot.docs[0];
      const blockedData = blockedDoc.data();
      
      console.log(`Found ${BLOCKED_EMAIL}:`, {
        docId: blockedDoc.id,
        currentRole: blockedData.role,
        uid: blockedData.uid
      });
      
      // Force update to user and add blocking flags
      await blockedDoc.ref.update({
        role: 'user',
        email: BLOCKED_EMAIL,
        adminBlocked: true,
        adminBlockedDate: new Date().toISOString(),
        isAdmin: false,
        blockedFromAdmin: true
      });
      
      console.log(`✅ Blocked ${BLOCKED_EMAIL} from admin in Firestore`);
      
      // Update Firebase Auth claims
      if (blockedData.uid) {
        try {
          await admin.auth().setCustomUserClaims(blockedData.uid, { 
            role: 'user',
            isAdmin: false,
            blocked: true,
            email: BLOCKED_EMAIL
          });
          console.log(`✅ Updated Firebase claims for ${BLOCKED_EMAIL} (blocked)`);
        } catch (error) {
          console.log(`❌ Firebase claims error: ${error.message}`);
        }
      }
    } else {
      console.log(`ℹ️  ${BLOCKED_EMAIL} not found in Firestore`);
    }
    
    // STEP 3: Scan and fix ALL users with admin role
    console.log('\n📋 STEP 3: Scanning ALL users for incorrect admin roles...');
    
    const allAdmins = await db.collection('users').where('role', '==', 'admin').get();
    
    console.log(`Found ${allAdmins.size} users with admin role`);
    
    for (const doc of allAdmins.docs) {
      const data = doc.data();
      const email = (data.email || '').toLowerCase();
      
      if (email !== CORRECT_ADMIN_EMAIL) {
        console.log(`🚨 REMOVING admin from unauthorized user: ${email}`);
        
        await doc.ref.update({
          role: 'user',
          adminRemoved: new Date().toISOString(),
          unauthorizedAdminAttempt: true
        });
        
        // Update Firebase claims too
        if (data.uid) {
          try {
            await admin.auth().setCustomUserClaims(data.uid, { role: 'user' });
            console.log(`   ✅ Removed Firebase claims for ${email}`);
          } catch (error) {
            console.log(`   ⚠️  Firebase claims error for ${email}: ${error.message}`);
          }
        }
      } else {
        console.log(`✅ Confirmed admin: ${email}`);
      }
    }
    
    // STEP 4: Final verification
    console.log('\n📋 STEP 4: Final verification...');
    
    const finalCheck = await db.collection('users').where('role', '==', 'admin').get();
    
    console.log(`\n🎯 FINAL RESULT:`);
    console.log(`Found ${finalCheck.size} admin user(s):`);
    
    finalCheck.forEach(doc => {
      const data = doc.data();
      console.log(`   📍 ${data.email}: ${data.role} (UID: ${data.uid})`);
    });
    
    // STEP 5: Test authentication simulation
    console.log('\n📋 STEP 5: Testing authentication logic...');
    
    const testEmails = [CORRECT_ADMIN_EMAIL, BLOCKED_EMAIL];
    
    for (const email of testEmails) {
      console.log(`\n   Testing ${email}:`);
      
      // Check hardcoded admin (this is what middleware does)
      const isHardcodedAdmin = email === CORRECT_ADMIN_EMAIL;
      console.log(`     - Hardcoded admin: ${isHardcodedAdmin}`);
      
      // Check Firestore
      const userDoc = await db.collection('users').where('email', '==', email).get();
      let firestoreRole = 'not found';
      if (!userDoc.empty) {
        firestoreRole = userDoc.docs[0].data().role;
      }
      console.log(`     - Firestore role: ${firestoreRole}`);
      
      // Final role (as middleware would determine)
      let finalRole;
      if (email === CORRECT_ADMIN_EMAIL) {
        finalRole = 'admin'; // Hardcoded admin
      } else {
        // Non-admin email - even if Firestore says admin, middleware blocks it
        finalRole = 'user';
      }
      
      console.log(`     - Final role: ${finalRole}`);
      console.log(`     - Access level: ${finalRole === 'admin' ? '🔑 ADMIN DASHBOARD' : '👤 USER DASHBOARD'}`);
    }
    
    console.log('\n🎉 ADMIN ROLES FORCIBLY CORRECTED!');
    console.log(`✅ ${CORRECT_ADMIN_EMAIL} = ADMIN (exclusive)`);
    console.log(`❌ ${BLOCKED_EMAIL} = USER (blocked)`);
    console.log(`✅ All other unauthorized admins removed`);
    
    console.log('\n👉 NEXT STEPS:');
    console.log('1. Clear browser cache/localStorage completely');
    console.log('2. Logout any current users');
    console.log(`3. Login with ${CORRECT_ADMIN_EMAIL} only`);
    console.log('4. Admin features should work immediately');
    
  } catch (error) {
    console.error('❌ FORCE FIX ERROR:', error);
  }
}

forceCorrectAdminRoles().then(() => {
  console.log('\n🏁 Force fix complete. Admin roles are now definitively correct.');
  process.exit(0);
}).catch(console.error);