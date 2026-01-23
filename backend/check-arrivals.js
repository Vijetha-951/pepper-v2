import mongoose from 'mongoose';
import Order from './src/models/Order.js';

async function checkArrivals() {
  await mongoose.connect('mongodb://localhost:27017/pepper-delivery');
  
  const orders = await Order.find({ currentHub: { $exists: true } })
    .populate('currentHub')
    .lean();
  
  console.log('Current date/time:', new Date().toISOString());
  console.log('Today start (midnight):', new Date(new Date().setHours(0,0,0,0)).toISOString());
  console.log('\n=== ORDERS WITH ARRIVAL EVENTS ===\n');
  
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  
  orders.forEach(o => {
    const arrivals = o.trackingTimeline?.filter(t => t.status === 'ARRIVED_AT_HUB') || [];
    if (arrivals.length > 0) {
      console.log(`Order: ${o._id.toString().substring(0,8)}... | Current Hub: ${o.currentHub?.name || 'None'}`);
      arrivals.forEach(a => {
        const time = a.timestamp || a.createdAt;
        const date = new Date(time);
        const isToday = date >= todayStart;
        console.log(`  Hub: ${a.hub?.name || a.hub}`);
        console.log(`  Time: ${date.toISOString()}`);
        console.log(`  Is Today: ${isToday ? '✓ YES' : '✗ NO'}`);
      });
      console.log('');
    }
  });
  
  await mongoose.disconnect();
}

checkArrivals();
