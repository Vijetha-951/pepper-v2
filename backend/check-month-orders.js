import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Order from './src/models/Order.js';
import User from './src/models/User.js';

dotenv.config();

async function checkMonthOrders() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('\n✅ Connected to MongoDB\n');

    const monthStart = new Date('2026-02-01T00:00:00.000Z');
    const monthEnd = new Date('2026-03-01T00:00:00.000Z');

    const monthOrders = await Order.find({
      createdAt: { $gte: monthStart, $lt: monthEnd }
    })
    .populate('user', 'firstName lastName email')
    .sort({ createdAt: -1 });

    console.log('📅 ORDERS THIS MONTH (February 2026)');
    console.log('═'.repeat(80));
    console.log(`Total Orders: ${monthOrders.length}\n`);

    monthOrders.forEach((order, idx) => {
      console.log(`${idx + 1}. Order ID: ${order._id.toString().slice(-8)}`);
      console.log(`   Customer: ${order.user?.firstName} ${order.user?.lastName} (${order.user?.email})`);
      console.log(`   Amount: ₹${order.totalAmount}`);
      console.log(`   Status: ${order.status}`);
      console.log(`   Payment Method: ${order.payment?.method || 'NOT SET'}`);
      console.log(`   Payment Status: ${order.payment?.status || 'NOT SET'}`);
      console.log(`   Created: ${new Date(order.createdAt).toLocaleString()}`);
      console.log('');
    });

    console.log('═'.repeat(80));
    
    // Summary
    const paidOrders = monthOrders.filter(o => o.payment?.status === 'PAID');
    const pendingOrders = monthOrders.filter(o => o.payment?.status === 'PENDING');
    const codOrders = monthOrders.filter(o => o.payment?.method === 'COD');
    const onlineOrders = monthOrders.filter(o => o.payment?.method === 'ONLINE');
    
    console.log('\n📊 SUMMARY:');
    console.log(`   PAID Orders: ${paidOrders.length} (Revenue: ₹${paidOrders.reduce((sum, o) => sum + o.totalAmount, 0)})`);
    console.log(`   PENDING Orders: ${pendingOrders.length} (Amount: ₹${pendingOrders.reduce((sum, o) => sum + o.totalAmount, 0)})`);
    console.log(`   COD Orders: ${codOrders.length}`);
    console.log(`   ONLINE Orders: ${onlineOrders.length}`);
    console.log('');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkMonthOrders();
