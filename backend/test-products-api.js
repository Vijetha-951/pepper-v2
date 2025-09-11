const API_URL = 'http://localhost:5000/api';

async function testProductsAPI() {
  console.log('🔍 Testing Products API...\n');
  
  try {
    // Test basic products endpoint
    console.log('1. Testing GET /api/products');
    const response1 = await fetch(`${API_URL}/products`);
    console.log(`   Status: ${response1.status} ${response1.statusText}`);
    if (response1.ok) {
      const products = await response1.json();
      console.log(`   ✅ Got ${Array.isArray(products) ? products.length : 'non-array'} products`);
    } else {
      console.log(`   ❌ Error: ${await response1.text()}`);
    }
    console.log();
    
    // Test admin products endpoint (without auth)
    console.log('2. Testing GET /api/admin/products (no auth)');
    const response2 = await fetch(`${API_URL}/admin/products`);
    console.log(`   Status: ${response2.status} ${response2.statusText}`);
    if (!response2.ok) {
      console.log(`   Expected error (no auth): ${await response2.text()}`);
    } else {
      const products = await response2.json();
      console.log(`   Unexpectedly got ${Array.isArray(products) ? products.length : 'non-array'} products`);
    }
    console.log();
    
    // Test with search parameters
    console.log('3. Testing GET /api/products with search params');
    const response3 = await fetch(`${API_URL}/products?q=Karimunda&type=Climber&page=1&limit=10`);
    console.log(`   Status: ${response3.status} ${response3.statusText}`);
    if (response3.ok) {
      const products = await response3.json();
      console.log(`   ✅ Got ${Array.isArray(products) ? products.length : 'non-array'} products with search`);
    } else {
      console.log(`   ❌ Error: ${await response3.text()}`);
    }
    console.log();
    
    // Test OPTIONS request (CORS preflight)
    console.log('4. Testing OPTIONS /api/admin/products (CORS check)');
    const response4 = await fetch(`${API_URL}/admin/products`, { method: 'OPTIONS' });
    console.log(`   Status: ${response4.status} ${response4.statusText}`);
    console.log(`   CORS Headers: ${response4.headers.get('Access-Control-Allow-Origin')}`);
    console.log();
    
  } catch (error) {
    console.error('❌ Network error:', error.message);
    console.error('   This could be:');
    console.error('   - Server not running on port 5000');
    console.error('   - CORS blocking the request');
    console.error('   - Network connectivity issue');
  }
}

testProductsAPI();