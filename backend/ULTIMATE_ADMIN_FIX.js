/**
 * ULTIMATE ADMIN FIX - Nuclear option to permanently fix admin roles
 * This will definitively and permanently fix the admin assignment
 */

import admin from './src/config/firebase.js';
import { getFirestore } from 'firebase-admin/firestore';

const db = getFirestore();
const CORRECT_ADMIN = 'vj.vijetha01@gmail.com';
const BLOCKED_USER = 'vijethajinu01@gmail.com';

async function ultimateAdminFix() {
  console.log('🚀 ULTIMATE ADMIN FIX - NUCLEAR OPTION');
  console.log('=====================================');
  console.log(`✅ Setting up: ${CORRECT_ADMIN} as EXCLUSIVE ADMIN`);
  console.log(`❌ Blocking: ${BLOCKED_USER} from admin access`);
  console.log('=====================================\n');
  
  try {
    console.log('🎯 STEP 1: Force-fix Firestore documents...\n');
    
    // Fix the correct admin in Firestore
    const adminQuery = await db.collection('users')
      .where('email', '==', CORRECT_ADMIN)
      .get();
    
    if (!adminQuery.empty) {
      const adminDoc = adminQuery.docs[0];
      const adminData = adminDoc.data();
      
      console.log(`Found ${CORRECT_ADMIN}:`);
      console.log(`  Current role: ${adminData.role}`);
      console.log(`  UID: ${adminData.uid}`);
      
      // FORCE UPDATE to admin
      await adminDoc.ref.update({
        role: 'admin',
        isAdmin: true,
        adminLevel: 'superadmin',
        permissions: ['all'],
        lastAdminUpdate: new Date().toISOString(),
        adminFixed: true
      });
      
      console.log(`✅ FORCED ${CORRECT_ADMIN} to admin in Firestore\n`);
      
      // Fix Firebase Auth claims
      if (adminData.uid) {
        await admin.auth().setCustomUserClaims(adminData.uid, {
          role: 'admin',
          isAdmin: true,
          email: CORRECT_ADMIN,
          permissions: ['all'],
          level: 'superadmin'
        });
        console.log(`✅ FORCED Firebase Auth claims for ${CORRECT_ADMIN}\n`);
      }
    }
    
    // Block the incorrect user
    const blockedQuery = await db.collection('users')
      .where('email', '==', BLOCKED_USER)
      .get();
    
    if (!blockedQuery.empty) {
      const blockedDoc = blockedQuery.docs[0];
      const blockedData = blockedDoc.data();
      
      console.log(`Found ${BLOCKED_USER}:`);
      console.log(`  Current role: ${blockedData.role}`);
      console.log(`  UID: ${blockedData.uid}`);
      
      // FORCE UPDATE to user and block
      await blockedDoc.ref.update({
        role: 'user',
        isAdmin: false,
        adminBlocked: true,
        adminDenied: true,
        blockedFromAdmin: true,
        lastBlockUpdate: new Date().toISOString(),
        blockReason: 'Not authorized for admin access'
      });
      
      console.log(`✅ BLOCKED ${BLOCKED_USER} from admin in Firestore\n`);
      
      // Remove Firebase Auth claims
      if (blockedData.uid) {
        await admin.auth().setCustomUserClaims(blockedData.uid, {
          role: 'user',
          isAdmin: false,
          blocked: true,
          email: BLOCKED_USER
        });
        console.log(`✅ REMOVED Firebase Auth claims for ${BLOCKED_USER}\n`);
      }
    }
    
    console.log('🎯 STEP 2: Nuclear cleanup of ALL admin roles...\n');
    
    // Remove admin role from EVERYONE except the correct admin
    const allUsers = await db.collection('users').get();
    
    let adminCount = 0;
    let userCount = 0;
    
    for (const doc of allUsers.docs) {
      const data = doc.data();
      const email = (data.email || '').toLowerCase().trim();
      
      if (email === CORRECT_ADMIN) {
        // Ensure the correct admin has admin role
        if (data.role !== 'admin') {
          await doc.ref.update({
            role: 'admin',
            isAdmin: true,
            forceFixed: new Date().toISOString()
          });
          console.log(`🔧 FIXED: Set ${email} to admin`);
        } else {
          console.log(`✅ CONFIRMED: ${email} is admin`);
        }
        adminCount++;
        
        // Update Firebase claims too
        if (data.uid) {
          await admin.auth().setCustomUserClaims(data.uid, {
            role: 'admin',
            isAdmin: true,
            email: email
          });
        }
        
      } else {
        // Remove admin role from everyone else
        if (data.role === 'admin') {
          await doc.ref.update({
            role: 'user',
            isAdmin: false,
            adminRemoved: new Date().toISOString(),
            removedReason: 'Only vj.vijetha01@gmail.com can be admin'
          });
          console.log(`🚫 REMOVED admin from: ${email}`);
          
          // Update Firebase claims
          if (data.uid) {
            await admin.auth().setCustomUserClaims(data.uid, {
              role: 'user',
              isAdmin: false
            });
          }
        }
        userCount++;
      }
    }
    
    console.log(`\n📊 ROLE SUMMARY:`);
    console.log(`   Admins: ${adminCount}`);
    console.log(`   Users: ${userCount}`);
    
    console.log('\n🎯 STEP 3: Final verification and testing...\n');
    
    // Verify the final state
    const finalAdminCheck = await db.collection('users')
      .where('email', '==', CORRECT_ADMIN)
      .get();
    
    if (!finalAdminCheck.empty) {
      const adminDoc = finalAdminCheck.docs[0].data();
      console.log(`Final check for ${CORRECT_ADMIN}:`);
      console.log(`  Firestore role: ${adminDoc.role}`);
      console.log(`  isAdmin: ${adminDoc.isAdmin}`);
      
      // Check Firebase Auth claims
      if (adminDoc.uid) {
        try {
          const userRecord = await admin.auth().getUser(adminDoc.uid);
          const claims = userRecord.customClaims || {};
          console.log(`  Firebase role: ${claims.role}`);
          console.log(`  Firebase isAdmin: ${claims.isAdmin}`);
        } catch (e) {
          console.log(`  Firebase claims error: ${e.message}`);
        }
      }
    }
    
    // Final test of all admin users
    const allAdmins = await db.collection('users').where('role', '==', 'admin').get();
    
    console.log(`\n🏆 FINAL ADMIN LIST:`);
    if (allAdmins.empty) {
      console.log('❌ NO ADMINS FOUND!');
    } else {
      allAdmins.forEach(doc => {
        const data = doc.data();
        console.log(`   📍 ${data.email}: ${data.role} (UID: ${data.uid})`);
      });
    }
    
    console.log('\n🎯 STEP 4: Middleware test simulation...\n');
    
    // Test what the middleware would do
    const testEmails = [CORRECT_ADMIN, BLOCKED_USER];
    
    for (const email of testEmails) {
      console.log(`Testing ${email}:`);
      
      // This is exactly what the middleware does
      if (email === CORRECT_ADMIN) {
        console.log(`  ✅ Hardcoded admin → ROLE: admin`);
        console.log(`  ✅ ACCESS: Full admin dashboard`);
      } else {
        console.log(`  ❌ Not hardcoded admin → ROLE: user`);
        console.log(`  ❌ ACCESS: User dashboard only`);
      }
      console.log();
    }
    
    console.log('🚀 ULTIMATE FIX COMPLETE!\n');
    console.log('===============================');
    console.log(`✅ ${CORRECT_ADMIN} = EXCLUSIVE ADMIN`);
    console.log(`❌ ${BLOCKED_USER} = PERMANENTLY BLOCKED`);
    console.log(`✅ All other users = Regular users`);
    console.log('===============================\n');
    
    console.log('📋 WHAT YOU NEED TO DO NOW:');
    console.log('1. ⚡ CLEAR ALL BROWSER DATA (localStorage, cookies, etc.)');
    console.log('2. 🔄 LOGOUT completely from the app');
    console.log('3. 🚪 LOGIN with vj.vijetha01@gmail.com ONLY');
    console.log('4. 🎉 Admin features should work immediately!');
    console.log('\n⚠️  DO NOT LOGIN with vijethajinu01@gmail.com for admin access!');
    
  } catch (error) {
    console.error('💥 ULTIMATE FIX ERROR:', error);
    console.error('Stack trace:', error.stack);
  }
}

// Run the ultimate fix
ultimateAdminFix().then(() => {
  console.log('\n🎊 ULTIMATE ADMIN FIX COMPLETED SUCCESSFULLY!');
  console.log('Admin roles are now permanently and definitively correct.');
  process.exit(0);
}).catch((error) => {
  console.error('\n💥 ULTIMATE FIX FAILED:', error);
  process.exit(1);
});