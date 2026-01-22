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

const ProductSchema = new mongoose.Schema({}, { strict: false, collection: 'products' });
const Product = mongoose.model('Product', ProductSchema);

const UserSchema = new mongoose.Schema({}, { strict: false, collection: 'users' });
const User = mongoose.model('User', UserSchema);

async function testAdminStats() {
  try {
    console.log('\n🧪 Testing Admin Dashboard Stats Endpoint\n');
    console.log('═══════════════════════════════════════════\n');

    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Date ranges
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrowStart = new Date(today);
    tomorrowStart.setDate(tomorrowStart.getDate() + 1);
    
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    console.log('📅 Date Ranges:');
    console.log(`   Today: ${today.toLocaleDateString()}`);
    console.log(`   Week Start: ${weekAgo.toLocaleDateString()}`);
    console.log(`   Month Start: ${monthStart.toLocaleDateString()}\n`);

    // 1. Total Orders
    const totalOrders = await Order.countDocuments({});
    console.log(`📦 Total Orders: ${totalOrders}`);

    // 2. Pending Deliveries (PENDING or APPROVED)
    const pendingDeliveries = await Order.countDocuments({ 
      status: { $in: ['PENDING', 'APPROVED'] } 
    });
    console.log(`⏳ Pending Deliveries: ${pendingDeliveries}`);

    // 3. Available Products
    const totalProducts = await Product.countDocuments({ available_stock: { $gt: 0 } });
    console.log(`📦 Available Products: ${totalProducts}`);

    // 4. Low Stock Products
    const lowStockProducts = await Product.countDocuments({ 
      available_stock: { $gt: 0, $lt: 10 } 
    });
    console.log(`⚠️  Low Stock Products: ${lowStockProducts}\n`);

    // 5. Today's Orders
    const todayOrders = await Order.countDocuments({
      createdAt: { $gte: today, $lt: tomorrowStart }
    });
    console.log(`📅 Today's Orders: ${todayOrders}`);

    // 6. Week's Orders
    const weekOrders = await Order.countDocuments({
      createdAt: { $gte: weekAgo }
    });
    console.log(`📅 This Week's Orders: ${weekOrders}`);

    // 7. Month's Orders
    const monthOrders = await Order.countDocuments({
      createdAt: { $gte: monthStart }
    });
    console.log(`📅 This Month's Orders: ${monthOrders}\n`);

    // 8. Today's Revenue (PAID orders only)
    const todayRevenueData = await Order.aggregate([
      {
        $match: {
          'payment.status': 'PAID',
          createdAt: { $gte: today, $lt: tomorrowStart }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$totalAmount' },
          count: { $sum: 1 }
        }
      }
    ]);
    const todayRevenue = todayRevenueData.length > 0 ? todayRevenueData[0].total : 0;
    const todayPaidOrders = todayRevenueData.length > 0 ? todayRevenueData[0].count : 0;
    console.log(`💰 Today's Revenue: ₹${todayRevenue.toLocaleString()} (${todayPaidOrders} paid orders)`);

    // 9. Week's Revenue
    const weekRevenueData = await Order.aggregate([
      {
        $match: {
          'payment.status': 'PAID',
          createdAt: { $gte: weekAgo }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$totalAmount' },
          count: { $sum: 1 }
        }
      }
    ]);
    const weekRevenue = weekRevenueData.length > 0 ? weekRevenueData[0].total : 0;
    const weekPaidOrders = weekRevenueData.length > 0 ? weekRevenueData[0].count : 0;
    console.log(`💰 This Week's Revenue: ₹${weekRevenue.toLocaleString()} (${weekPaidOrders} paid orders)`);

    // 10. Month's Revenue
    const monthRevenueData = await Order.aggregate([
      {
        $match: {
          'payment.status': 'PAID',
          createdAt: { $gte: monthStart }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$totalAmount' },
          count: { $sum: 1 }
        }
      }
    ]);
    const monthRevenue = monthRevenueData.length > 0 ? monthRevenueData[0].total : 0;
    const monthPaidOrders = monthRevenueData.length > 0 ? monthRevenueData[0].count : 0;
    console.log(`💰 This Month's Revenue: ₹${monthRevenue.toLocaleString()} (${monthPaidOrders} paid orders)\n`);

    // 11. All-Time Revenue (DELIVERED orders)
    const allTimeRevenueData = await Order.aggregate([
      {
        $match: { status: 'DELIVERED' }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$totalAmount' },
          averageOrderValue: { $avg: '$totalAmount' },
          completedOrders: { $sum: 1 }
        }
      }
    ]);
    if (allTimeRevenueData.length > 0) {
      console.log(`💎 All-Time Revenue: ₹${allTimeRevenueData[0].totalRevenue.toLocaleString()}`);
      console.log(`📊 Average Order Value: ₹${allTimeRevenueData[0].averageOrderValue.toFixed(2)}`);
      console.log(`✅ Completed Orders: ${allTimeRevenueData[0].completedOrders}\n`);
    }

    // 12. Pending Amount
    const pendingAmountData = await Order.aggregate([
      {
        $match: { status: 'PENDING' }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$totalAmount' }
        }
      }
    ]);
    const pendingAmount = pendingAmountData.length > 0 ? pendingAmountData[0].total : 0;
    console.log(`⏳ Pending Amount: ₹${pendingAmount.toLocaleString()}\n`);

    // 13. Customers
    const totalCustomers = await User.countDocuments({ role: 'user' });
    const activeCustomers = await Order.distinct('user').then(users => users.length);
    console.log(`👥 Total Customers: ${totalCustomers}`);
    console.log(`✅ Active Customers: ${activeCustomers}\n`);

    // 14. Order Status Breakdown
    const statusBreakdown = await Order.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);
    
    console.log('📊 Order Status Breakdown:');
    statusBreakdown.forEach(item => {
      console.log(`   ${item._id}: ${item.count}`);
    });

    console.log('\n═══════════════════════════════════════════');
    console.log('✅ All Statistics Calculated Successfully\n');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

testAdminStats();
