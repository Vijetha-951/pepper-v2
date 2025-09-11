/**
 * Quick Authentication Diagnosis Script
 * Run this in your browser console while on the product management page
 * to identify the root cause of the 401 error
 */

async function diagnoseAuthIssue() {
  console.log('🔍 Starting authentication diagnosis...\n');

  // Step 1: Check if authService is available
  try {
    const authService = window.authService || (await import('./src/services/authService.js')).default;
    console.log('✅ AuthService loaded');
    
    // Step 2: Check current user status
    const currentUser = authService.getCurrentUser();
    console.log('👤 Current User:', currentUser);
    
    if (!currentUser) {
      console.log('❌ ISSUE FOUND: No user is logged in');
      console.log('💡 SOLUTION: Please log in first');
      return;
    }

    // Step 3: Check user role
    console.log('🔐 User Role:', currentUser.role);
    if (currentUser.role !== 'admin') {
      console.log('❌ ISSUE FOUND: User is not an admin');
      console.log('💡 SOLUTION: User role must be "admin" to access product management');
      console.log('   - Check Firestore users collection');
      console.log('   - Ensure the document has role: "admin"');
      return;
    }

    // Step 4: Check Firebase authentication
    const { getAuth } = await import('firebase/auth');
    const auth = getAuth();
    const firebaseUser = auth.currentUser;
    
    if (!firebaseUser) {
      console.log('❌ ISSUE FOUND: No Firebase user authenticated');
      console.log('💡 SOLUTION: Firebase authentication failed');
      return;
    }

    console.log('✅ Firebase user authenticated:', firebaseUser.email);

    // Step 5: Test token retrieval
    try {
      const token = await firebaseUser.getIdToken();
      console.log('✅ Firebase ID token retrieved (length:', token.length, ')');
      
      // Step 6: Test backend connectivity
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
      console.log('🌐 Testing backend connectivity...');
      
      try {
        const healthResponse = await fetch(`${API_URL.replace('/api', '')}/api/health`);
        if (healthResponse.ok) {
          console.log('✅ Backend server is running');
        } else {
          console.log('❌ ISSUE FOUND: Backend server returned error:', healthResponse.status);
          console.log('💡 SOLUTION: Check if backend server is running on port 5000');
          return;
        }
      } catch (networkError) {
        console.log('❌ ISSUE FOUND: Cannot connect to backend server');
        console.log('💡 SOLUTION: Start the backend server:', networkError.message);
        return;
      }

      // Step 7: Test actual product API call
      console.log('🛒 Testing product API call...');
      try {
        const productResponse = await fetch(`${API_URL}/admin/products?page=1&limit=10`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (productResponse.ok) {
          const products = await productResponse.json();
          console.log('✅ SUCCESS: Products fetched successfully');
          console.log('📦 Products count:', Array.isArray(products) ? products.length : 'Unknown format');
        } else {
          const errorData = await productResponse.json().catch(() => null);
          console.log('❌ ISSUE FOUND: Product API returned error:', productResponse.status);
          console.log('📋 Error details:', errorData);
          
          if (productResponse.status === 401) {
            console.log('💡 POSSIBLE SOLUTIONS:');
            console.log('   1. Token might be expired - try logging out and back in');
            console.log('   2. Backend auth middleware might be rejecting the token');
            console.log('   3. Check backend logs for authentication errors');
          } else if (productResponse.status === 403) {
            console.log('💡 SOLUTION: User role is not admin in backend database');
            console.log('   - Check Firestore users collection for role field');
            console.log('   - Ensure email matches admin email in backend middleware');
          }
        }
      } catch (apiError) {
        console.log('❌ ISSUE FOUND: Product API call failed');
        console.log('💡 Error:', apiError.message);
      }

    } catch (tokenError) {
      console.log('❌ ISSUE FOUND: Cannot retrieve Firebase ID token');
      console.log('💡 SOLUTION: Token retrieval failed:', tokenError.message);
      console.log('   - Try logging out and back in');
      console.log('   - Check Firebase Auth configuration');
    }

  } catch (error) {
    console.log('❌ CRITICAL ERROR:', error.message);
    console.log('💡 Check if you\'re running this on the correct page with proper imports');
  }

  console.log('\n🎯 Diagnosis complete!');
}

// Auto-run if in browser environment
if (typeof window !== 'undefined') {
  diagnoseAuthIssue();
}

// Export for manual usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { diagnoseAuthIssue };
}