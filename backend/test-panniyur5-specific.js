import axios from 'axios';

async function testPanniyur5() {
  console.log('\n═══════════════════════════════════════════════════');
  console.log('  Testing Panniyur 5 with Default Frontend Params');
  console.log('═══════════════════════════════════════════════════\n');

  try {
    // Test 1: With explicit good parameters (like my test)
    console.log('TEST 1: With optimal parameters');
    const test1 = await axios.post('http://localhost:5000/api/seasonal-suitability/predict', {
      variety: 'Panniyur 5',
      month: 2,
      district: 'Kottayam',
      pincode: 686001,
      temperature: 28,
      rainfall: 50,
      humidity: 75,
      waterAvailability: 'Medium'
    });
    console.log('Result:', test1.data.data.suitability);
    console.log('Confidence:', test1.data.data.confidence);
    console.log('Recommendation:', test1.data.data.recommendation);
    console.log('');

    // Test 2: With frontend default parameters (check seasonalSuitability.js)
    console.log('TEST 2: With frontend default parameters');
    
    const currentDate = new Date();
    const month = currentDate.getMonth() + 1; // February = 2
    
    // Default temperature for February from seasonalSuitability.js
    const defaultTemp = month <= 2 || month === 12 ? 25 : 
                        month >= 3 && month <= 5 ? 32 : 
                        month >= 6 && month <= 9 ? 26 : 27;
    
    const defaultRainfall = month >= 6 && month <= 9 ? 300 :
                           month >= 3 && month <= 5 ? 100 :
                           month >= 10 && month <= 11 ? 200 : 50;

    const test2 = await axios.post('http://localhost:5000/api/seasonal-suitability/predict', {
      variety: 'Panniyur 5',
      month: month,
      district: 'Kottayam',
      pincode: 686001,
      temperature: defaultTemp,
      rainfall: defaultRainfall,
      humidity: 75,
      waterAvailability: 'Medium'
    });
    console.log('Month:', month);
    console.log('Default Temperature:', defaultTemp);
    console.log('Default Rainfall:', defaultRainfall);
    console.log('Result:', test2.data.data.suitability);
    console.log('Confidence:', test2.data.data.confidence);
    console.log('Recommendation:', test2.data.data.recommendation);
    console.log('');

    // Test 3: Check what product actually has in database
    console.log('TEST 3: Checking database product data');
    const product = await axios.get('http://localhost:5000/api/user/products');
    const panniyur5 = product.data.find(p => p.name === 'Panniyur 5');
    console.log('Product found:', panniyur5 ? 'Yes' : 'No');
    if (panniyur5) {
      console.log('Product ID:', panniyur5._id);
      console.log('Product variety:', panniyur5.variety);
      console.log('Product name:', panniyur5.name);
    }
    console.log('');

    // Test 4: Using actual product ID
    if (panniyur5) {
      console.log('TEST 4: With product ID included');
      const test4 = await axios.post('http://localhost:5000/api/seasonal-suitability/predict', {
        variety: panniyur5.variety || 'Panniyur 5',
        month: month,
        district: 'Kottayam',
        pincode: 686001,
        temperature: defaultTemp,
        rainfall: defaultRainfall,
        humidity: 75,
        waterAvailability: 'Medium',
        productId: panniyur5._id
      });
      console.log('Result:', test4.data.data.suitability);
      console.log('Confidence:', test4.data.data.confidence);
      console.log('');
    }

  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

testPanniyur5();
