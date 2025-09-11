// Simple API test script - no complex test framework needed
import fetch from 'node-fetch';

const API_URL = 'http://localhost:54112';

// Simple test helper
const test = async (name, fn) => {
  try {
    console.log(`🧪 Testing: ${name}`);
    await fn();
    console.log(`✅ ${name} - PASSED\n`);
  } catch (error) {
    console.log(`❌ ${name} - FAILED: ${error.message}\n`);
  }
};

// Test functions
const testGetProducts = async () => {
  const response = await fetch(`${API_URL}/api/products`);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const products = await response.json();
  console.log(`   Found ${products.length} products`);
};

const testSearchProducts = async () => {
  const response = await fetch(`${API_URL}/api/products?q=Karimunda`);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const products = await response.json();
  console.log(`   Search found ${products.length} products`);
};

const testFilterByType = async () => {
  const response = await fetch(`${API_URL}/api/products?type=Bush`);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const products = await response.json();
  console.log(`   Found ${products.length} Bush type products`);
};

// Run tests
console.log('🚀 Quick API Tests\n');

await test('Get all products', testGetProducts);
await test('Search products', testSearchProducts);
await test('Filter by type', testFilterByType);

console.log('🎉 Quick tests completed!');
process.exit(0);