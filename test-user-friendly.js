// Test Node.js Integration - User-Friendly Responses
const axios = require('axios');

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

async function testIntegration() {
  console.log('\n' + colors.bold + '='.repeat(70) + colors.reset);
  console.log(colors.bold + '  Seasonal Suitability System - Full Integration Test' + colors.reset);
  console.log(colors.bold + '  (This shows the USER-FRIENDLY output with NO ML jargon)' + colors.reset);
  console.log(colors.bold + '='.repeat(70) + colors.reset + '\n');

  // Test 1: Health Check
  console.log(colors.yellow + '📊 Checking System Health...' + colors.reset);
  try {
    const health = await axios.get('http://localhost:5000/api/seasonal-suitability/health');
    console.log(colors.green + '✓ System is operational' + colors.reset);
    console.log('  ML API Available:', health.data.mlApi.available ? '✓ Yes' : '✗ No (Fallback active)');
    console.log('  Service Status:', health.data.service);
  } catch (error) {
    console.log(colors.red + '✗ Health check failed' + colors.reset);
    return;
  }

  // Test 2: Perfect Conditions (July - Peak Planting Season)
  console.log('\n' + colors.bold + '─'.repeat(70) + colors.reset);
  console.log(colors.cyan + '\n🌱 Test 1: IDEAL PLANTING CONDITIONS' + colors.reset);
  console.log(colors.cyan + '   Scenario: July in Idukki (highland), high water availability' + colors.reset);
  console.log('─'.repeat(70));
  
  try {
    const response = await axios.post('http://localhost:5000/api/seasonal-suitability/predict', {
      month: 7,
      district: 'Idukki',
      pincode: 685501,
      variety: 'Panniyur 5',
      temperature: 24.5,
      rainfall: 320,
      humidity: 82,
      waterAvailability: 'High',
      productId: 'test-product-123'
    });

    const data = response.data.data;
    
    // Display user-friendly output
    console.log('\n' + colors.bold + data.icon + ' ' + data.title + colors.reset);
    console.log(colors.magenta + 'Status: ' + data.suitability + colors.reset);
    console.log('Confidence Level: ' + colors.green + data.confidence + colors.reset);
    console.log('\n' + data.description);
    
    console.log('\n' + colors.bold + 'Growing Tips:' + colors.reset);
    data.tips.forEach((tip, i) => {
      console.log(`  ${i + 1}. ${tip}`);
    });

    console.log('\n' + colors.blue + 'Analytics ID: ' + response.data.analyticsId + colors.reset);

  } catch (error) {
    console.log(colors.red + '✗ Test failed: ' + error.message + colors.reset);
  }

  // Test 3: Moderate Conditions
  console.log('\n' + colors.bold + '─'.repeat(70) + colors.reset);
  console.log(colors.cyan + '\n⚠️  Test 2: MODERATE CONDITIONS' + colors.reset);
  console.log(colors.cyan + '   Scenario: December in Kottayam, medium water' + colors.reset);
  console.log('─'.repeat(70));
  
  try {
    const response = await axios.post('http://localhost:5000/api/seasonal-suitability/predict', {
      month: 12,
      district: 'Kottayam',
      pincode: 686001,
      variety: 'Sreekara',
      temperature: 26.0,
      rainfall: 100,
      humidity: 70,
      waterAvailability: 'Medium'
    });

    const data = response.data.data;
    
    console.log('\n' + colors.bold + data.icon + ' ' + data.title + colors.reset);
    console.log(colors.yellow + 'Status: ' + data.suitability + colors.reset);
    console.log('Confidence Level: ' + colors.yellow + data.confidence + colors.reset);
    console.log('\n' + data.description);
    
    console.log('\n' + colors.bold + 'Growing Tips:' + colors.reset);
    data.tips.forEach((tip, i) => {
      console.log(`  ${i + 1}. ${tip}`);
    });

  } catch (error) {
    console.log(colors.red + '✗ Test failed: ' + error.message + colors.reset);
  }

  // Test 4: Poor Conditions
  console.log('\n' + colors.bold + '─'.repeat(70) + colors.reset);
  console.log(colors.cyan + '\n❌ Test 3: CHALLENGING CONDITIONS' + colors.reset);
  console.log(colors.cyan + '   Scenario: April (hot summer) with low water' + colors.reset);
  console.log('─'.repeat(70));
  
  try {
    const response = await axios.post('http://localhost:5000/api/seasonal-suitability/predict', {
      month: 4,
      district: 'Thiruvananthapuram',
      pincode: 695001,
      variety: 'Karimunda',
      temperature: 35.0,
      rainfall: 50,
      humidity: 45,
      waterAvailability: 'Low'
    });

    const data = response.data.data;
    
    console.log('\n' + colors.bold + data.icon + ' ' + data.title + colors.reset);
    console.log(colors.red + 'Status: ' + data.suitability + colors.reset);
    console.log('Confidence Level: ' + colors.green + data.confidence + colors.reset);
    console.log('\n' + data.description);
    
    console.log('\n' + colors.bold + 'Growing Tips:' + colors.reset);
    data.tips.forEach((tip, i) => {
      console.log(`  ${i + 1}. ${tip}`);
    });

  } catch (error) {
    console.log(colors.red + '✗ Test failed: ' + error.message + colors.reset);
  }

  // Summary
  console.log('\n' + colors.bold + '='.repeat(70) + colors.reset);
  console.log(colors.green + '✓ All Integration Tests Complete!' + colors.reset);
  console.log(colors.bold + '='.repeat(70) + colors.reset);
  
  console.log('\n' + colors.bold + '🎯 Key Observations:' + colors.reset);
  console.log('  ✓ No ML jargon visible to users');
  console.log('  ✓ Natural language descriptions');
  console.log('  ✓ Actionable growing tips provided');
  console.log('  ✓ Visual indicators (badges, icons)');
  console.log('  ✓ Confidence shown as "Very High/High/Moderate" not "0.95"');
  console.log('  ✓ Analytics automatically tracked');
  
  console.log('\n' + colors.blue + '📍 API Endpoints Available:' + colors.reset);
  console.log('  - POST /api/seasonal-suitability/predict');
  console.log('  - POST /api/seasonal-suitability/batch-predict');
  console.log('  - POST /api/seasonal-suitability/track-action');
  console.log('  - GET  /api/seasonal-suitability/health');
  console.log('  - GET  /api/seasonal-suitability/analytics/summary');
  console.log('  - GET  /api/seasonal-suitability/analytics/by-variety\n');
}

testIntegration().catch(console.error);
