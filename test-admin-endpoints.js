/**
 * Test admin endpoints to debug 500 errors
 */

import admin from './backend/src/config/firebase.js';

async function testAdminEndpoints() {
  console.log('🧪 TESTING ADMIN ENDPOINTS');
  
  try {
    // Get a valid token for the admin user
    console.log('\n📋 1. Getting admin token...');
    
    const adminEmail = 'vj.vijetha01@gmail.com';
    const userRecord = await admin.auth().getUserByEmail(adminEmail);
    const customToken = await admin.auth().createCustomToken(userRecord.uid, { role: 'admin' });
    
    console.log(`✅ Token created for ${adminEmail}`);
    
    // Test endpoints
    const baseUrl = 'http://localhost:54112';
    const endpoints = [
      '/api/health',
      '/api/admin/products',
      '/api/admin/users', 
      '/api/admin/stock',
      '/api/admin/orders'
    ];
    
    console.log('\n📋 2. Testing endpoints...');
    
    for (const endpoint of endpoints) {
      try {
        const headers = {
          'Content-Type': 'application/json'
        };
        
        // Add auth header for admin endpoints
        if (endpoint.includes('/admin')) {
          // For testing, we'll use the dev bypass since custom tokens need client-side exchange
          headers['Authorization'] = 'Bearer dev-admin-bypass';
        }
        
        const response = await fetch(baseUrl + endpoint, {
          method: 'GET',
          headers
        });
        
        const status = response.status;
        const statusText = response.statusText;
        
        console.log(`${endpoint}: ${status} ${statusText}`);
        
        if (!response.ok && response.status !== 404) {
          const errorText = await response.text();
          console.log(`  Error: ${errorText.substring(0, 200)}...`);
        } else if (response.ok) {
          const data = await response.json();
          if (Array.isArray(data)) {
            console.log(`  Success: Array with ${data.length} items`);
          } else if (typeof data === 'object') {
            console.log(`  Success: Object with keys: ${Object.keys(data).join(', ')}`);
          } else {
            console.log(`  Success: ${JSON.stringify(data).substring(0, 100)}...`);
          }
        }
        
      } catch (error) {
        console.log(`${endpoint}: ❌ Network error - ${error.message}`);
      }
    }
    
    console.log('\n📋 3. Testing specific product operations...');
    
    // Test product creation
    try {
      const createResponse = await fetch(baseUrl + '/api/admin/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer dev-admin-bypass'
        },
        body: JSON.stringify({
          name: 'Test Pepper',
          type: 'Climber', 
          category: 'Bush Pepper',
          description: 'Test product for debugging',
          price: 100,
          stock: 10,
          isActive: true
        })
      });
      
      console.log(`Create product: ${createResponse.status} ${createResponse.statusText}`);
      
      if (createResponse.ok) {
        const productData = await createResponse.json();
        console.log(`  Created product: ${productData.name} (ID: ${productData._id})`);
        
        // Test updating the product
        const updateResponse = await fetch(baseUrl + '/api/admin/products/' + productData._id, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer dev-admin-bypass'
          },
          body: JSON.stringify({
            ...productData,
            stock: 20
          })
        });
        
        console.log(`Update product: ${updateResponse.status} ${updateResponse.statusText}`);
        
        // Clean up - delete the test product
        const deleteResponse = await fetch(baseUrl + '/api/admin/products/' + productData._id, {
          method: 'DELETE',
          headers: {
            'Authorization': 'Bearer dev-admin-bypass'
          }
        });
        
        console.log(`Delete product: ${deleteResponse.status} ${deleteResponse.statusText}`);
        
      } else {
        const errorText = await createResponse.text();
        console.log(`  Create error: ${errorText}`);
      }
      
    } catch (error) {
      console.log(`Product operations error: ${error.message}`);
    }
    
    console.log('\n✅ Endpoint testing complete');
    
  } catch (error) {
    console.error('❌ Test error:', error);
  }
}

testAdminEndpoints().then(() => {
  console.log('\n🏁 Test complete');
  process.exit(0);
}).catch(console.error);