import mongoose from 'mongoose';
import Order from './src/models/Order.js';

async function checkRoutes() {
  try {
    await mongoose.connect('mongodb://localhost:27017/pepper');
    console.log('Connected to MongoDB\n');
    
    const orders = await Order.find()
      .populate('route', 'district')
      .limit(10)
      .lean();
    
    console.log('📦 Sample Orders and Routes:\n');
    console.log('='.repeat(60));
    
    orders.forEach((order, index) => {
      const dest = order.shippingAddress?.district || 'Unknown';
      const route = order.route?.map(h => h.district).join(' → ') || 'No route';
      
      console.log(`${index + 1}. Order: ${order._id}`);
      console.log(`   Destination: ${dest}`);
      console.log(`   Route: ${route}`);
      console.log(`   Status: ${order.status}`);
      console.log('-'.repeat(60));
    });
    
    // Check if routes follow the rules
    console.log('\n✅ Route Verification:\n');
    
    const southCentralDistricts = ['Thiruvananthapuram', 'Kollam', 'Alappuzha', 'Pathanamthitta', 'Kottayam', 'Idukki', 'Ernakulam', 'Thrissur', 'Palakkad'];
    const northDistricts = ['Malappuram', 'Kozhikode', 'Wayanad', 'Kannur', 'Kasaragod'];
    
    orders.forEach((order, index) => {
      const dest = order.shippingAddress?.district;
      const route = order.route?.map(h => h.district) || [];
      
      if (!dest || route.length === 0) return;
      
      let expectedRoute = ['Kottayam'];
      
      // Rule 1: Start with source mega hub (Ernakulam)
      if (dest !== 'Kottayam') {
        expectedRoute.push('Ernakulam');
      }
      
      // Rule 2: If destination is in North zone, add Kozhikode
      if (northDistricts.includes(dest)) {
        expectedRoute.push('Kozhikode');
      }
      
      // Rule 3: Add destination if not already in route
      if (dest !== 'Kottayam' && dest !== 'Ernakulam' && dest !== 'Kozhikode') {
        expectedRoute.push(dest);
      } else if (dest === 'Kozhikode' && !expectedRoute.includes('Kozhikode')) {
        expectedRoute.push(dest);
      }
      
      const matches = JSON.stringify(route) === JSON.stringify(expectedRoute);
      
      console.log(`Order ${index + 1} (${dest}):`);
      console.log(`  Expected: ${expectedRoute.join(' → ')}`);
      console.log(`  Actual:   ${route.join(' → ')}`);
      console.log(`  ✓ ${matches ? 'CORRECT' : '❌ MISMATCH'}\n`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkRoutes();
