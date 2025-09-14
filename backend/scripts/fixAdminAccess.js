/**
 * Script to fix admin access - Remove admin role from unauthorized users
 * Only vj.vijetha01@gmail.com should have admin access
 */

import admin from '../src/config/firebase.js';
import { getFirestore } from 'firebase-admin/firestore';

const db = getFirestore();

// The ONLY authorized admin email
const AUTHORIZED_ADMIN_EMAIL = 'vj.vijetha01@gmail.com';

async function fixAdminAccess() {
  console.log('🔍 Checking Firestore for unauthorized admin users...');
  
  try {
    // Get all users with admin role from Firestore
    const adminUsersSnapshot = await db.collection('users').where('role', '==', 'admin').get();
    
    if (adminUsersSnapshot.empty) {
      console.log('✅ No admin users found in Firestore collection');
      return;
    }
    
    console.log(`📋 Found ${adminUsersSnapshot.size} admin user(s) in Firestore:`);
    
    const unauthorizedAdmins = [];
    
    adminUsersSnapshot.forEach(doc => {
      const data = doc.data();
      const email = (data.email || '').toLowerCase();
      
      console.log(`   - UID: ${doc.id}, Email: ${email}, Role: ${data.role}`);
      
      if (email !== AUTHORIZED_ADMIN_EMAIL) {
        unauthorizedAdmins.push({
          docId: doc.id,
          email: email,
          uid: data.uid || doc.id,
          data: data
        });
      }
    });
    
    if (unauthorizedAdmins.length === 0) {
      console.log('✅ All admin users are authorized!');
      return;
    }
    
    console.log(`\n🚨 Found ${unauthorizedAdmins.length} UNAUTHORIZED admin user(s):`);
    unauthorizedAdmins.forEach(user => {
      console.log(`   ❌ ${user.email} (UID: ${user.uid})`);
    });
    
    // Remove admin role from unauthorized users
    console.log('\n🔧 Removing admin role from unauthorized users...');
    
    for (const user of unauthorizedAdmins) {
      try {
        // Update Firestore document - remove admin role
        await db.collection('users').doc(user.docId).update({
          role: 'user' // Change from admin to regular user
        });
        
        console.log(`✅ Updated Firestore: ${user.email} role changed from 'admin' to 'user'`);
        
        // Try to remove custom claims from Firebase Auth
        try {
          await admin.auth().setCustomUserClaims(user.uid, { role: 'user' });
          console.log(`✅ Updated Firebase Auth: ${user.email} custom claims updated`);
        } catch (claimsError) {
          console.log(`⚠️  Could not update Firebase Auth claims for ${user.email}: ${claimsError.message}`);
        }
        
      } catch (error) {
        console.error(`❌ Failed to update ${user.email}: ${error.message}`);
      }
    }
    
    console.log('\n✅ Admin access cleanup completed!');
    console.log(`✅ Only ${AUTHORIZED_ADMIN_EMAIL} should now have admin access.`);
    
  } catch (error) {
    console.error('❌ Error fixing admin access:', error);
  }
}

// Also check for the specific unauthorized email
async function checkSpecificUser(email) {
  console.log(`\n🔍 Checking specific user: ${email}`);
  
  try {
    // Search by email
    const userSnapshot = await db.collection('users').where('email', '==', email.toLowerCase()).get();
    
    if (userSnapshot.empty) {
      console.log(`✅ No Firestore document found for ${email}`);
      return;
    }
    
    userSnapshot.forEach(doc => {
      const data = doc.data();
      console.log(`📋 Found user:`, {
        docId: doc.id,
        email: data.email,
        role: data.role,
        uid: data.uid
      });
      
      if (data.role === 'admin') {
        console.log(`🚨 FOUND THE PROBLEM: ${email} has admin role in Firestore!`);
      }
    });
    
  } catch (error) {
    console.error(`❌ Error checking ${email}:`, error);
  }
}

// Main execution
async function main() {
  console.log('🚀 Starting Admin Access Fix Script');
  console.log(`📧 Authorized admin email: ${AUTHORIZED_ADMIN_EMAIL}`);
  
  // Check the specific problem user
  await checkSpecificUser('vijethajinu01@gmail.com');
  
  // Check all admin users and fix unauthorized ones
  await fixAdminAccess();
  
  console.log('\n🏁 Script completed. Please test login now.');
  process.exit(0);
}

main().catch(console.error);