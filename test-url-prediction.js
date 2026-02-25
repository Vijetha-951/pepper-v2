/**
 * Test script to directly test the Flask disease detection URL prediction
 */

const testUrl = 'https://www.researchgate.net/publication/358987628/figure/fig1/AS:1129596795793410@1646328271744/Sample-bell-pepper-leaves-for-healthy-left-and-bacteria-spot-disease-right.jpg';

console.log('🧪 Testing Disease Detection URL Prediction');
console.log('='.repeat(60));

// Test 1: Check Flask health
console.log('\n📋 Test 1: Flask Health Check');
fetch('http://localhost:5001/health')
  .then(res => res.json())
  .then(data => {
    console.log('✅ Flask is healthy:', data);
  })
  .catch(err => {
    console.error('❌ Flask health check failed:', err.message);
  });

// Test 2: Direct Flask prediction
setTimeout(() => {
  console.log('\n📋 Test 2: Direct Flask URL Prediction');
  console.log('URL:', testUrl);
  
  fetch('http://localhost:5001/predict-url', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ image_url: testUrl })
  })
    .then(async res => {
      const text = await res.text();
      console.log('Status:', res.status);
      console.log('Response:', text);
      
      if (res.status === 500) {
        console.error('\n❌ 500 ERROR DETAILS:');
        try {
          const json = JSON.parse(text);
          console.error('Error:', json.error);
          if (json.traceback) {
            console.error('\nTraceback:');
            console.error(json.traceback);
          }
        } catch (e) {
          console.error('Raw response:', text);
        }
      } else {
        console.log('✅ Success!');
      }
    })
    .catch(err => {
      console.error('❌ Fetch error:', err.message);
    });
}, 2000);

// Test 3: Via Node.js backend
setTimeout(() => {
  console.log('\n📋 Test 3: Via Node.js Backend');
  
  fetch('http://localhost:5000/api/disease-detection/predict-url', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ imageUrl: testUrl })
  })
    .then(async res => {
      const text = await res.text();
      console.log('Status:', res.status);
      console.log('Response:', text);
    })
    .catch(err => {
      console.error('❌ Request failed:', err.message);
    });
}, 5000);
