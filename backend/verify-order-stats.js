import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

// Import models
const OrderSchema = new mongoose.Schema({}, { strict: false, collection: 'orders' });
const Order = mongoose.model('Order', OrderSchema);

async function verifyOrderStats() {
  try {
    console.log('\n🔍 Verifying Order Statistics\n');
    console.log('═══════════════════════════════════════\n');

    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    console.log(`📅 Today's Date: ${today.toLocaleDateString()}`);
    console.log(`📅 Checking orders from: ${today.toISOString()}`);
    console.log(`📅 To: ${tomorrow.toISOString()}\n`);

    // 1. Total Orders Today
    const todayOrders = await Order.find({
      createdAt: {
        $gte: today,
        $lt: tomorrow
      }
    });

    console.log('📦 TOTAL ORDERS (TODAY)');
    console.log('─────────────────────────');
    console.log(`Count: ${todayOrders.length}`);
    if (todayOrders.length > 0) {
      console.log('Orders:');
      todayOrders.forEach(order => {
        console.log(`  - ${order._id.toString().slice(-8)} | ${order.status} | ₹${order.totalAmount} | ${new Date(order.createdAt).toLocaleString()}`);
      });
    }
    console.log('');

    // 2. This Month's Revenue (PAID orders only)
    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);

    const monthOrders = await Order.find({
      createdAt: { $gte: thisMonth },
      'payment.status': 'PAID'
    });

    const monthRevenue = monthOrders.reduce((sum, order) => sum + order.totalAmount, 0);

    console.log('💰 TOTAL REVENUE (THIS MONTH - PAID ONLY)');
    console.log('─────────────────────────────────────────');
    console.log(`Month Start: ${thisMonth.toLocaleDateString()}`);
    console.log(`Paid Orders: ${monthOrders.length}`);
    console.log(`Total Revenue: ₹${monthRevenue.toLocaleString()}`);
    if (monthOrders.length > 0) {
      console.log('Paid Orders:');
      monthOrders.forEach(order => {
        console.log(`  - ${order._id.toString().slice(-8)} | ${order.status} | ₹${order.totalAmount} | ${new Date(order.createdAt).toLocaleDateString()}`);
      });
    }
    console.log('');

    // 3. Pending Orders
    const pendingOrders = await Order.find({
      status: 'PENDING'
    });

    const pendingAmount = pendingOrders.reduce((sum, order) => sum + order.totalAmount, 0);

    console.log('⏳ PENDING ORDERS');
    console.log('─────────────────');
    console.log(`Count: ${pendingOrders.length}`);
    console.log(`Total Amount: ₹${pendingAmount.toLocaleString()}`);
    if (pendingOrders.length > 0) {
      console.log('Pending Orders:');
      pendingOrders.forEach(order => {
        console.log(`  - ${order._id.toString().slice(-8)} | Payment: ${order.payment?.status || 'N/A'} | ₹${order.totalAmount} | ${new Date(order.createdAt).toLocaleDateString()}`);
      });
    }
    console.log('');

    // 4. All Orders Summary
    const allOrders = await Order.find({});
    console.log('📊 DATABASE SUMMARY');
    console.log('───────────────────');
    console.log(`Total Orders in DB: ${allOrders.length}`);
    
    // Count by status
    const statusCounts = {};
    allOrders.forEach(order => {
      statusCounts[order.status] = (statusCounts[order.status] || 0) + 1;
    });
    console.log('\nOrders by Status:');
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`  ${status}: ${count}`);
    });

    // Count by payment status
    const paymentCounts = {};
    allOrders.forEach(order => {
      const payStatus = order.payment?.status || 'NO_PAYMENT';
      paymentCounts[payStatus] = (paymentCounts[payStatus] || 0) + 1;
    });
    console.log('\nOrders by Payment Status:');
    Object.entries(paymentCounts).forEach(([status, count]) => {
      console.log(`  ${status}: ${count}`);
    });

    console.log('\n═══════════════════════════════════════');
    console.log('✅ Verification Complete\n');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

verifyOrderStats();
