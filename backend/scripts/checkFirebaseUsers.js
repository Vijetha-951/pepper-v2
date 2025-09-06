// Simple script to check if Firebase is accessible
// This will help identify if we can access Firebase users

console.log('🔍 Checking Firebase Configuration...\n');

// Check if Firebase Admin is configured
try {
  const admin = await import('../src/config/firebase.js');
  console.log('✅ Firebase Admin module loaded');
  
  // Try to access Firebase Auth
  const auth = admin.default.auth();
  console.log('✅ Firebase Auth service accessible');
  
  // Try to list users (this will fail if credentials are not configured)
  const listUsersResult = await auth.listUsers(10);
  console.log(`📊 Found ${listUsersResult.users.length} users in Firebase Auth`);
  
  if (listUsersResult.users.length > 0) {
    console.log('\n📋 Registered emails:');
    listUsersResult.users.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.email || 'No email'} (${user.uid.substring(0, 8)}...)`);
    });
    
    console.log('\n💡 To fix the "email already in use" error:');
    console.log('   1. Delete these users from Firebase Console');
    console.log('   2. Or use different email addresses for testing');
  } else {
    console.log('✅ No users found - Firebase Auth is clean');
  }
  
} catch (error) {
  console.log('❌ Firebase access failed:', error.message);
  
  if (error.message.includes('credential') || error.message.includes('project_id')) {
    console.log('\n🔧 Firebase credentials not configured.');
    console.log('📖 To check users manually:');
    console.log('   1. Go to https://console.firebase.google.com/');
    console.log('   2. Select your project');
    console.log('   3. Go to Authentication → Users');
    console.log('   4. Delete any existing users');
  }
}

console.log('\n🎯 Next Steps:');
console.log('   1. Fix CSS border conflicts in Register.js');
console.log('   2. Clear Firebase users (manually or with credentials)');
console.log('   3. Test registration with fresh email');