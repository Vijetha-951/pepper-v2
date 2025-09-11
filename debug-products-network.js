// Debug script to test product management network issues
// Run this in browser console on the admin product management page

async function debugProductsNetwork() {
  console.log('🔍 Debugging Products Network Issues...\n');
  
  // 1. Check environment variables
  console.log('1. Environment Check:');
  console.log('   API_URL:', process.env.REACT_APP_API_URL);
  console.log('   Environment:', process.env.NODE_ENV);
  console.log();
  
  // 2. Check Firebase Auth
  console.log('2. Firebase Auth Check:');
  try {
    const { getAuth } = await import('firebase/auth');
    const auth = getAuth();
    console.log('   Current user:', auth.currentUser ? 'Logged in' : 'Not logged in');
    if (auth.currentUser) {
      console.log('   User ID:', auth.currentUser.uid);
      console.log('   Email:', auth.currentUser.email);
      
      // Get token
      try {
        const token = await auth.currentUser.getIdToken();
        console.log('   Token length:', token ? token.length : 'No token');
        console.log('   Token starts with:', token ? token.substring(0, 20) + '...' : 'N/A');
      } catch (tokenError) {
        console.log('   ❌ Token error:', tokenError.message);
      }
    }
  } catch (authError) {
    console.log('   ❌ Firebase auth error:', authError.message);
  }
  console.log();
  
  // 3. Test API calls
  console.log('3. API Test:');
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
  
  try {
    // Test without auth
    console.log('   Testing public products endpoint...');
    const response1 = await fetch(`${API_URL}/products`);
    console.log('   Public products status:', response1.status, response1.statusText);
    
    // Test with auth
    console.log('   Testing admin products endpoint...');
    const { getAuth } = await import('firebase/auth');
    const auth = getAuth();
    const token = auth.currentUser ? await auth.currentUser.getIdToken() : null;
    
    if (!token) {
      console.log('   ❌ No auth token available');
      return;
    }
    
    const response2 = await fetch(`${API_URL}/admin/products`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('   Admin products status:', response2.status, response2.statusText);
    
    if (response2.ok) {
      const products = await response2.json();
      console.log('   ✅ Got products:', Array.isArray(products) ? products.length : typeof products);
    } else {
      const error = await response2.text();
      console.log('   ❌ Error response:', error);
    }
    
  } catch (networkError) {
    console.log('   ❌ Network error:', networkError.message);
    console.log('   Stack:', networkError.stack);
  }
  
  console.log('\n4. Browser Network Tab:');
  console.log('   - Open DevTools > Network tab');
  console.log('   - Filter by "admin/products"');
  console.log('   - Look for failed requests with status codes');
  console.log('   - Check request headers for Authorization');
  
  console.log('\n5. Common Issues:');
  console.log('   - User not logged in');
  console.log('   - User not admin role');
  console.log('   - Server not running on port 5000');
  console.log('   - CORS issues');
  console.log('   - Firebase token expired');
}

// Auto-run if in browser
if (typeof window !== 'undefined') {
  debugProductsNetwork();
}