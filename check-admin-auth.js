// Quick admin auth checker - paste this in browser console on the admin page

console.log('🔍 Checking Admin Authentication...\n');

// Check if user is logged in
const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
console.log('1. Current User from localStorage:', currentUser);

// Check if Firebase user exists
if (typeof firebase !== 'undefined' && firebase.auth) {
  const user = firebase.auth().currentUser;
  console.log('2. Firebase Auth User:', user ? {
    uid: user.uid,
    email: user.email,
    emailVerified: user.emailVerified
  } : 'Not logged in');
  
  if (user) {
    user.getIdToken().then(token => {
      console.log('3. Firebase Token (first 50 chars):', token.substring(0, 50) + '...');
    }).catch(err => {
      console.log('3. ❌ Token error:', err.message);
    });
  }
} else {
  console.log('2. Firebase not available in this context');
}

// Check admin role
if (currentUser) {
  console.log('4. User Role:', currentUser.role);
  console.log('5. Is Admin?', currentUser.role === 'admin');
  console.log('6. Admin Email Check:', currentUser.email === 'vj.vijetha01@gmail.com');
} else {
  console.log('4-6. No user data found - please log in first');
}

console.log('\n🔧 Next Steps:');
if (!currentUser) {
  console.log('- You need to log in first');
  console.log('- Go to /login page');
} else if (currentUser.role !== 'admin') {
  console.log('- Your role is:', currentUser.role);
  console.log('- You need admin role to access product management');
  console.log('- Make sure you\'re using the admin email: vj.vijetha01@gmail.com');
} else {
  console.log('- Authentication looks good');
  console.log('- The issue might be network/server related');
  console.log('- Check if backend server is running');
}