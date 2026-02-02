// Quick test for Seasonal Suitability API
const axios = require('axios');

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  reset: '\x1b[0m'
};

async function testAPI() {
  console.log('\n' + '='.repeat(60));
  console.log('Testing Seasonal Suitability API');
  console.log('='.repeat(60) + '\n');

  // Test 1: Health Check
  console.log(colors.yellow + '[1/3] Health Check...' + colors.reset);
  try {
    const health = await axios.get('http://127.0.0.1:5001/health');
    console.log(colors.green + '✓ API is healthy' + colors.reset);
    console.log('  Model loaded:', health.data.model_loaded);
    console.log('  Status:', health.data.status);
  } catch (error) {
    console.log(colors.red + '✗ Health check failed: ' + error.message + colors.reset);
    console.log(colors.yellow + '  Make sure Python API is running on port 5001' + colors.reset);
    process.exit(1);
  }

  // Test 2: Prediction (Good Conditions)
  console.log('\n' + colors.yellow + '[2/3] Testing Prediction - Good Conditions...' + colors.reset);
  try {
    const response = await axios.post('http://127.0.0.1:5001/predict', {
      month: 7,
      district: 'Idukki',
      pincode: 685501,
      variety: 'Panniyur 5',
      temperature: 24.5,
      rainfall: 320.0,
      humidity: 82.0,
      water_availability: 'High'
    });

    console.log(colors.green + '✓ Prediction successful' + colors.reset);
    console.log('\n  Input:');
    console.log('    Month: July');
    console.log('    District: Idukki');
    console.log('    Variety: Panniyur 5');
    console.log('    Temperature: 24.5°C');
    console.log('    Rainfall: 320mm');
    console.log('    Humidity: 82%');
    console.log('    Water: High\n');
    
    console.log(colors.blue + '  Prediction: ' + response.data.prediction + colors.reset);
    console.log('  Confidence: ' + (response.data.confidence * 100).toFixed(1) + '%');
    console.log('\n  Confidence Scores:');
    Object.entries(response.data.confidence_scores).forEach(([key, value]) => {
      console.log(`    ${key}: ${(value * 100).toFixed(1)}%`);
    });
  } catch (error) {
    console.log(colors.red + '✗ Prediction failed: ' + error.message + colors.reset);
  }

  // Test 3: Prediction (Poor Conditions)
  console.log('\n' + colors.yellow + '[3/3] Testing Prediction - Poor Conditions...' + colors.reset);
  try {
    const response = await axios.post('http://127.0.0.1:5001/predict', {
      month: 4,
      district: 'Thiruvananthapuram',
      pincode: 695001,
      variety: 'Karimunda',
      temperature: 35.0,
      rainfall: 50.0,
      humidity: 45.0,
      water_availability: 'Low'
    });

    console.log(colors.green + '✓ Prediction successful' + colors.reset);
    console.log('\n  Input:');
    console.log('    Month: April (Summer)');
    console.log('    District: Thiruvananthapuram');
    console.log('    Variety: Karimunda');
    console.log('    Temperature: 35°C (Hot!)');
    console.log('    Rainfall: 50mm (Low)');
    console.log('    Humidity: 45%');
    console.log('    Water: Low\n');
    
    console.log(colors.blue + '  Prediction: ' + response.data.prediction + colors.reset);
    console.log('  Confidence: ' + (response.data.confidence * 100).toFixed(1) + '%');
  } catch (error) {
    console.log(colors.red + '✗ Prediction failed: ' + error.message + colors.reset);
  }

  console.log('\n' + '='.repeat(60));
  console.log(colors.green + 'All Tests Complete!' + colors.reset);
  console.log('='.repeat(60));
  console.log('\nNext Steps:');
  console.log('1. Start Node.js backend: cd backend && npm start');
  console.log('2. Test full integration: node test-seasonal-suitability.js');
  console.log('3. Try API: http://localhost:5000/api/seasonal-suitability/health\n');
}

testAPI().catch(console.error);
