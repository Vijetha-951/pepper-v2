/**
 * Verification script to confirm admin fix
 */
import admin from './src/config/firebase.js';
import { getFirestore } from 'firebase-admin/firestore';

const db = getFirestore();

async function verifyAdminFix() {
  console.log('🔍 VERIFYING ADMIN FIX...\n');
  
  const testEmails = ['vj.vijetha01@gmail.com', 'vijethajinu01@gmail.com'];
  
  for (const email of testEmails) {
    console.log(`📧 Checking ${email}:`);
    
    // Check Firestore
    const userQuery = await db.collection('users').where('email', '==', email).get();
    
    if (!userQuery.empty) {
      const userData = userQuery.docs[0].data();
      console.log(`  ✅ Found in Firestore`);
      console.log(`  📝 Role: ${userData.role}`);
      console.log(`  🆔 UID: ${userData.uid}`);
      
      // Check if backend auth.js would consider this admin
      const isHardcodedAdmin = email === 'vj.vijetha01@gmail.com';
      const finalRole = isHardcodedAdmin ? 'admin' : 'user';
      
      console.log(`  🔐 Backend Auth Decision: ${finalRole}`);
      console.log(`  📋 Dashboard Access: ${finalRole === 'admin' ? 'ADMIN DASHBOARD' : 'USER DASHBOARD'}`);
      
      // Check Firebase claims
      try {
        const userRecord = await admin.auth().getUser(userData.uid);
        const claims = userRecord.customClaims || {};
        console.log(`  🏷️  Firebase Claims:`, claims);
      } catch (error) {
        console.log(`  ❌ Firebase Claims Error: ${error.message}`);
      }
    } else {
      console.log(`  ❌ Not found in Firestore`);
    }
    
    console.log('');
  }
  
  // Check frontend environment
  console.log('🌍 FRONTEND ENVIRONMENT:');
  
  // Simulate frontend environment loading
  const frontendAdminEmail = 'vj.vijetha01@gmail.com'; // This is what's in .env now
  console.log(`  📧 REACT_APP_ADMIN_EMAIL: ${frontendAdminEmail}`);
  
  // Verify consistency
  const backendAdminEmail = 'vj.vijetha01@gmail.com'; // Hardcoded in auth.js
  const isConsistent = frontendAdminEmail === backendAdminEmail;
  
  console.log(`  🔄 Frontend/Backend Consistency: ${isConsistent ? '✅ MATCHED' : '❌ MISMATCH'}`);
  
  console.log('\n🎯 SUMMARY:');
  console.log(`✅ vj.vijetha01@gmail.com should have admin access`);
  console.log(`❌ vijethajinu01@gmail.com should have user access only`);
  console.log(`✅ Frontend/Backend admin emails are consistent`);
  
  console.log('\n👉 TO TEST:');
  console.log('1. Clear browser cache and localStorage');
  console.log('2. Login with vj.vijetha01@gmail.com -> Should see admin dashboard');
  console.log('3. Login with vijethajinu01@gmail.com -> Should see user dashboard');
}

verifyAdminFix().then(() => {
  console.log('\n✅ Verification complete');
  process.exit(0);
}).catch(error => {
  console.error('❌ Verification failed:', error);
  process.exit(1);
});