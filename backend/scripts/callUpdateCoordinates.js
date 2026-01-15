// Script to call the API endpoint to update hub coordinates
// Run this after starting the backend server

async function updateHubCoordinates() {
  try {
    // You'll need a valid admin token - get this from logging in as admin
    const adminToken = process.argv[2];
    
    if (!adminToken) {
      console.log('❌ Please provide admin token as argument');
      console.log('Usage: node callUpdateCoordinates.js YOUR_ADMIN_TOKEN');
      console.log('\nTo get admin token:');
      console.log('1. Login as admin in the frontend');
      console.log('2. Open browser console');
      console.log('3. Type: localStorage.getItem("pepper_token")');
      console.log('4. Copy the token (without quotes)');
      return;
    }

    const response = await fetch('http://localhost:5000/api/admin/update-hub-coordinates', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    
    if (data.success) {
      console.log('✅ Successfully updated hub coordinates');
      console.log(`\nUpdated ${data.updated} hubs`);
      console.log(`\nCoordinate details:`);
      data.results.forEach(hub => {
        console.log(`  - ${hub.hub} (${hub.type}) in ${hub.district}: ${hub.coordinates}`);
      });
    } else {
      console.log('❌ Error:', data.message);
    }

  } catch (error) {
    console.error('❌ Failed to call API:', error.message);
  }
}

updateHubCoordinates();
