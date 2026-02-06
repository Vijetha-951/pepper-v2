import axios from 'axios';

const varieties = [
  'Panniyur 1',
  'Panniyur 5', 
  'Karimunda',
  'Subhakara',
  'Pournami',
  'IISR Shakthi',
  'IISR Thevam',
  'Sreekara'
];

async function testFebruaryPredictions() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║     FEBRUARY 2026 SEASONAL SUITABILITY PREDICTIONS       ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
  console.log('Testing all pepper varieties for current month...\n');
  console.log('Conditions: Month=February, District=Kottayam');
  console.log('Temperature=28°C, Rainfall=50mm, Humidity=75%\n');
  console.log('─'.repeat(60) + '\n');

  for (const variety of varieties) {
    try {
      const response = await axios.post('http://localhost:5000/api/seasonal-suitability/predict', {
        variety,
        month: 2,
        district: 'Kottayam',
        pincode: 686001,
        temperature: 28,
        rainfall: 50,
        humidity: 75,
        waterAvailability: 'Medium'
      });

      const result = response.data.data;
      const icon = result.suitability === 'Recommended' ? '✓' : 
                   result.suitability === 'Plant with Care' ? '⚠️' : '✗';
      const color = result.suitability === 'Recommended' ? '\x1b[32m' : 
                    result.suitability === 'Plant with Care' ? '\x1b[33m' : '\x1b[31m';
      
      console.log(`${color}${icon} ${variety}\x1b[0m`);
      console.log(`   Status: ${color}${result.suitability}\x1b[0m`);
      console.log(`   Confidence: ${result.confidence}%`);
      console.log(`   Recommendation: ${result.recommendation}`);
      console.log(`   Tips: ${result.tips.join(', ')}`);
      console.log('');

    } catch (error) {
      console.log(`\x1b[31m✗ ${variety}\x1b[0m`);
      console.log(`   ERROR: ${error.message}`);
      console.log('');
    }
  }

  console.log('─'.repeat(60) + '\n');
  console.log('✅ Test completed!\n');
}

testFebruaryPredictions().catch(console.error);
