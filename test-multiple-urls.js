/**
 * Test with multiple image URLs to find one that works
 */

const testUrls = [
  // Simpler image hosts that typically allow downloads
  'https://i.imgur.com/vQeB8Za.jpg', // Example pepper leaf
  'https://images.unsplash.com/photo-1588421383025-da45c10e9a9f?w=800', // Bell pepper
  
  // Original problematic URL (likely blocked)
  'https://www.researchgate.net/publication/358987628/figure/fig1/AS:1129596795793410@1646328271744/Sample-bell-pepper-leaves-for-healthy-left-and-bacteria-spot-disease-right.jpg',
  
  // Try a direct GitHub raw URL (usually open)
  'https://raw.githubusercontent.com/spMohanty/PlantVillage-Dataset/master/raw/color/Pepper__bell___Bacterial_spot/0a8ac464-a7c9-4b14-82ad-b10cf8ea3e2f___BREC_Bact.Sp%203109.JPG'
];

async function testUrl(url, index) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`🧪 Test ${index + 1}: ${url.substring(0, 80)}${url.length > 80 ? '...' : ''}`);
  console.log('='.repeat(80));
  
  try {
    const response = await fetch('http://localhost:5001/predict-url', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ image_url: url })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ SUCCESS!');
      console.log('Disease:', data.prediction?.disease_info?.name);
      console.log('Confidence:', data.prediction?.confidence + '%');
      return true;
    } else {
      console.log(`❌ FAILED (${response.status})`);
      console.log('Error:', data.error);
      if (data.hint) {
        console.log('Hint:', data.hint);
      }
      return false;
    }
  } catch (error) {
    console.log('❌ REQUEST ERROR:', error.message);
    return false;
  }
}

async function runTests() {
  console.log('\n🌿 PEPPER DISEASE DETECTION - URL PREDICTION TESTS');
  console.log('='.repeat(80));
  console.log('Testing multiple image URLs to find working sources...\n');
  
  for (let i = 0; i < testUrls.length; i++) {
    await testUrl(testUrls[i], i);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait between requests
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('✅ Tests complete!');
  console.log('='.repeat(80));
}

runTests();
