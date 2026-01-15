import fetch from 'node-fetch';

const orderId = process.argv[2];

if (!orderId) {
  console.log('❌ Please provide an order ID');
  console.log('Usage: node scripts/releaseReservationAPI.js <orderId>');
  process.exit(1);
}

async function releaseReservation() {
  try {
    // Login as admin first (you'll need to replace with your admin credentials)
    const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@pepper.com',
        password: 'admin123'
      })
    });

    if (!loginResponse.ok) {
      console.log('❌ Failed to login as admin');
      process.exit(1);
    }

    const { token } = await loginResponse.json();

    // Call release reservation endpoint
    const response = await fetch(`http://localhost:5000/api/hub-collection/orders/${orderId}/release-reservation`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();

    if (response.ok) {
      console.log('✅', data.message);
      if (data.releasedItems && data.releasedItems.length > 0) {
        console.log('\n📦 Released Items:');
        data.releasedItems.forEach(item => {
          console.log(`\n  ${item.productName}:`);
          console.log(`    Released: ${item.released} units`);
          console.log(`    Reserved: ${item.reservedBefore} → ${item.reservedAfter}`);
          console.log(`    Available: ${item.availableBefore} → ${item.availableAfter}`);
        });
      }
      console.log(`\n📋 Order Status: ${data.order.status}`);
    } else {
      console.log('❌', data.message);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

releaseReservation();
