import axios from 'axios';

async function testWithDetails() {
  try {
    console.log('Testing prediction with detailed error...\n');
    
    const response = await axios.post('http://localhost:5000/api/seasonal-suitability/predict', {
      variety: 'Karimunda',
      month: 2,
      district: 'Kottayam',
      temperature: 28,
      rainfall: 50,
      humidity: 75,
      waterAvailability: 'Medium'
    });

    console.log('Success!');
    console.log(JSON.stringify(response.data, null, 2));

  } catch (error) {
    console.error('Error details:');
    console.error('Status:', error.response?.status);
    console.error('Data:', JSON.stringify(error.response?.data, null, 2));
    console.error('Message:', error.message);
  }
}

testWithDetails();
