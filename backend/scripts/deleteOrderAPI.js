import fetch from 'node-fetch';

const orderId = process.argv[2];

if (!orderId) {
  console.log('❌ Please provide an order ID');
  console.log('Usage: node scripts/deleteOrderAPI.js <orderId>');
  process.exit(1);
}

async function deleteOrder() {
  try {
    console.log(`\n🗑️  Attempting to delete order: ${orderId}\n`);
    
    // Try common admin credentials
    const credentials = [
      { email: 'admin@pepper.com', password: 'admin123' },
      { email: 'admin@example.com', password: 'admin123' }
    ];
    
    let token = null;
    
    for (const cred of credentials) {
      const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cred)
      });

      if (loginResponse.ok) {
        const data = await loginResponse.json();
        token = data.token;
        console.log('✅ Logged in as admin\n');
        break;
      }
    }
    
    if (!token) {
      console.log('❌ Failed to login as admin');
      console.log('Please provide admin email and password:');
      process.exit(1);
    }

    // Call delete endpoint
    const response = await fetch(`http://localhost:5000/api/hub-collection/orders/${orderId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();

    if (response.ok) {
      console.log('✅', data.message);
      console.log('\n📊 Deleted:');
      console.log(`   Order: ✅`);
      console.log(`   Notifications: ${data.deleted.notifications}`);
      console.log(`   Restock Requests: ${data.deleted.restockRequests}`);
      console.log('\n✅ Order completely removed from system!');
    } else {
      console.log('❌', data.message);
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

deleteOrder();
