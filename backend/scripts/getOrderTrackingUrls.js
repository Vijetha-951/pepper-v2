import '../src/config/db.js';
import Order from '../src/models/Order.js';

async function getOrderTrackingUrls() {
  try {
    console.log('🔍 Fetching recent orders...\n');
    
    const orders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('_id status deliveryType currentHub createdAt')
      .populate('currentHub', 'name district');
    
    if (orders.length === 0) {
      console.log('❌ No orders found. Please place an order first.');
      process.exit(0);
    }
    
    console.log(`📦 Found ${orders.length} Recent Orders:\n`);
    console.log('=' .repeat(80));
    
    orders.forEach((order, index) => {
      console.log(`\n${index + 1}. Order ID: ${order._id}`);
      console.log(`   Status: ${order.status}`);
      console.log(`   Type: ${order.deliveryType || 'HOME_DELIVERY'}`);
      console.log(`   Current Hub: ${order.currentHub?.name || 'Not assigned'} (${order.currentHub?.district || 'N/A'})`);
      console.log(`   Created: ${order.createdAt.toLocaleString()}`);
      console.log(`   \n   🗺️  Track with Map: http://localhost:3000/order-tracking/${order._id}`);
      console.log('   ' + '-'.repeat(76));
    });
    
    console.log('\n\n✅ To view the map:');
    console.log('   1. Copy one of the URLs above');
    console.log('   2. Paste it in your browser');
    console.log('   3. Login if prompted');
    console.log('   4. Scroll down to see "Live Tracking Map"\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    process.exit(0);
  }
}

getOrderTrackingUrls();
