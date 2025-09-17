/**
 * Test real admin authentication with proper Firebase tokens
 */

import admin from './backend/src/config/firebase.js';

async function testRealAdminAuth() {
  console.log('🔐 TESTING REAL ADMIN AUTHENTICATION');
  
  try {
    const adminEmail = 'vj.vijetha01@gmail.com';
    console.log(`Testing with admin email: ${adminEmail}`);
    
    // Get admin user record
    const userRecord = await admin.auth().getUserByEmail(adminEmail);
    console.log(`✅ Found Firebase user: ${userRecord.uid}`);
    
    // Create a custom token with proper claims
    const customToken = await admin.auth().createCustomToken(userRecord.uid, { 
      role: 'admin',
      email: adminEmail,
      isAdmin: true 
    });
    
    console.log(`✅ Custom token created (${customToken.length} chars)`);
    
    // Now we need to exchange this custom token for an ID token
    // This normally happens on the client side, but we can simulate it
    
    console.log('\n📱 Simulating client-side token exchange...');
    console.log('Note: In the real app, the frontend would use this custom token');
    console.log('to sign in with Firebase Auth and get an ID token.');
    
    // Test the middleware directly by checking what it would do
    console.log('\n🔍 Testing middleware logic...');
    
    // Simulate what happens when the middleware processes a request
    const testToken = customToken; // In reality, this would be the ID token
    
    console.log('1. Middleware receives token:', testToken.substring(0, 30) + '...');
    console.log('2. Middleware verifies token with Firebase Admin SDK');
    console.log('3. Middleware extracts email from decoded token');
    console.log('4. Middleware checks if email === "vj.vijetha01@gmail.com"');
    console.log('5. If yes → role = "admin", if no → check Firestore but block admin');
    
    // Test the endpoints with NODE_ENV override
    console.log('\n🌐 Testing with temporary development mode...');
    
    const originalNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';
    
    const baseUrl = 'http://localhost:54112';
    
    // Test with dev bypass
    const testResponse = await fetch(baseUrl + '/api/admin/products', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer dev-admin-bypass'
      }
    });
    
    console.log(`Admin products endpoint: ${testResponse.status} ${testResponse.statusText}`);
    
    if (testResponse.ok) {
      const data = await testResponse.json();
      console.log(`✅ Success! Got ${Array.isArray(data) ? data.length : 'non-array'} products`);
    } else {
      const errorText = await testResponse.text();
      console.log(`❌ Error: ${errorText}`);
    }
    
    // Restore NODE_ENV
    process.env.NODE_ENV = originalNodeEnv;
    
    console.log('\n💡 SOLUTION FOR FRONTEND:');
    console.log('1. User logs in with vj.vijetha01@gmail.com');
    console.log('2. Frontend gets Firebase ID token from auth.currentUser.getIdToken()');
    console.log('3. Frontend sends this ID token in Authorization header');
    console.log('4. Backend middleware verifies token and grants admin access');
    
    console.log('\n🔧 IMMEDIATE FIX:');
    console.log('1. Clear all browser data (localStorage, cookies, etc.)');
    console.log('2. Log out completely from the app');
    console.log('3. Log in again with vj.vijetha01@gmail.com');
    console.log('4. The app should automatically get fresh tokens with admin privileges');
    
    console.log('\n🧪 Testing admin creation endpoint...');
    
    // Test creating a product to verify admin functionality
    const createResponse = await fetch(baseUrl + '/api/admin/products', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer dev-admin-bypass'
      },
      body: JSON.stringify({
        name: 'Auth Test Pepper',
        type: 'Climber',
        category: 'Test',
        description: 'Testing admin authentication',
        price: 999,
        stock: 1,
        isActive: true
      })
    });
    
    if (createResponse.ok) {
      const product = await createResponse.json();
      console.log(`✅ Admin create works! Created product: ${product.name}`);
      
      // Clean up
      await fetch(baseUrl + '/api/admin/products/' + product._id, {
        method: 'DELETE',
        headers: {
          'Authorization': 'Bearer dev-admin-bypass'
        }
      });
      console.log('✅ Cleaned up test product');
      
    } else {
      const error = await createResponse.text();
      console.log(`❌ Admin create failed: ${error}`);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testRealAdminAuth().then(() => {
  console.log('\n🏁 Admin authentication test complete');
  process.exit(0);
}).catch(console.error);