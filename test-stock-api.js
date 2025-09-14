// Test script to check stock management API endpoints
const API_BASE = 'http://localhost:54112/api';

async function testStockAPI() {
  console.log('🧪 Testing Stock Management API Endpoints...\n');

  try {
    // Test 1: Get stock overview
    console.log('1. Testing GET /api/admin/stock');
    const stockResponse = await fetch(`${API_BASE}/admin/stock`);
    const stockData = await stockResponse.json();
    console.log('Stock overview response:', stockResponse.status, stockData.success ? '✅' : '❌');
    if (!stockData.success) {
      console.log('Error:', stockData.message);
    } else {
      console.log(`Found ${stockData.products?.length || 0} products`);
    }
    console.log('');

    // Test 2: Get low stock alerts
    console.log('2. Testing GET /api/admin/low-stock-alerts');
    const alertsResponse = await fetch(`${API_BASE}/admin/low-stock-alerts`);
    const alertsData = await alertsResponse.json();
    console.log('Low stock alerts response:', alertsResponse.status, alertsData.success ? '✅' : '❌');
    if (!alertsData.success) {
      console.log('Error:', alertsData.message);
    } else {
      console.log(`Found ${alertsData.alerts?.length || 0} low stock alerts`);
    }
    console.log('');

    // Test 3: Get a product for restock testing
    if (stockData.success && stockData.products?.length > 0) {
      const testProduct = stockData.products[0];
      console.log(`3. Testing restock for product: ${testProduct.name} (ID: ${testProduct._id})`);
      
      const restockPayload = {
        quantity: 10,
        reason: 'API Test Restock'
      };

      const restockResponse = await fetch(`${API_BASE}/products/restock/${testProduct._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(restockPayload)
      });

      const restockData = await restockResponse.json();
      console.log('Restock response:', restockResponse.status, restockData.success ? '✅' : '❌');
      if (!restockData.success) {
        console.log('Error:', restockData.message);
      } else {
        console.log('Restock successful:', restockData.message);
      }
    } else {
      console.log('3. ⚠️  No products available for restock testing');
    }

  } catch (error) {
    console.error('❌ API Test Error:', error.message);
  }
}

// Run the test
testStockAPI();