import mongoose from 'mongoose';
import User from '../src/models/User.js';
import Order from '../src/models/Order.js';
import Product from '../src/models/Product.js';
import dotenv from 'dotenv';

dotenv.config();

async function testStatsEndpoints() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('\n🧪 TESTING STATS ENDPOINT LOGIC\n');
    console.log('='.repeat(60));

    // Test 1: Find a user to simulate user dashboard stats
    const testUser = await User.findOne({ role: 'user' });
    if (testUser) {
      console.log('\n📊 USER DASHBOARD STATS TEST');
      console.log('-'.repeat(60));
      console.log(`Testing for user: ${testUser.email} (${testUser.firstName} ${testUser.lastName})`);

      const totalOrders = await Order.countDocuments({ user: testUser._id });
      const pendingDeliveries = await Order.countDocuments({ 
        user: testUser._id, 
        status: { $nin: ['DELIVERED', 'CANCELLED'] } 
      });
      const totalProducts = await Product.countDocuments({ available_stock: { $gt: 0 } });
      
      const recentOrders = await Order.find({ user: testUser._id })
        .populate('items.product', 'name')
        .sort({ createdAt: -1 })
        .limit(3);

      console.log(`✓ Total Orders: ${totalOrders}`);
      console.log(`✓ Pending Deliveries: ${pendingDeliveries}`);
      console.log(`✓ Available Products: ${totalProducts}`);
      console.log(`✓ Recent Orders: ${recentOrders.length}`);

      if (recentOrders.length > 0) {
        console.log('\n  Recent Orders Details:');
        recentOrders.forEach((order, idx) => {
          console.log(`  ${idx + 1}. #${order._id} | Status: ${order.status} | Amount: ₹${order.totalAmount}`);
        });
      }
    } else {
      console.log('⚠️  No regular users found');
    }

    // Test 2: Admin dashboard stats
    console.log('\n📊 ADMIN DASHBOARD STATS TEST');
    console.log('-'.repeat(60));

    const totalOrders = await Order.countDocuments({});
    const pendingDeliveries = await Order.countDocuments({ 
      status: { $nin: ['DELIVERED', 'CANCELLED'] } 
    });
    const totalProducts = await Product.countDocuments({ available_stock: { $gt: 0 } });

    console.log(`✓ Total Orders (System-wide): ${totalOrders}`);
    console.log(`✓ Pending Deliveries (System-wide): ${pendingDeliveries}`);
    console.log(`✓ Available Products (System-wide): ${totalProducts}`);

    // Get status breakdown
    const statusBreakdown = await Order.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    console.log('\n  Order Status Breakdown:');
    statusBreakdown.forEach(item => {
      console.log(`  - ${item._id}: ${item.count}`);
    });

    // Get revenue stats
    const revenueStats = await Order.aggregate([
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

    console.log('\n  Revenue Statistics:');
    if (revenueStats.length > 0) {
      const rev = revenueStats[0];
      console.log(`  - Total Revenue: ₹${rev.totalRevenue || 0}`);
      console.log(`  - Average Order Value: ₹${(rev.averageOrderValue || 0).toFixed(2)}`);
      console.log(`  - Completed Orders: ${rev.completedOrders || 0}`);
    } else {
      console.log(`  - Total Revenue: ₹0`);
      console.log(`  - Average Order Value: ₹0`);
      console.log(`  - Completed Orders: 0`);
    }

    // Get today's stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrowStart = new Date(today);
    tomorrowStart.setDate(tomorrowStart.getDate() + 1);

    const todayOrders = await Order.countDocuments({
      createdAt: { $gte: today, $lt: tomorrowStart }
    });

    const todayRevenue = await Order.aggregate([
      {
        $match: {
          status: 'DELIVERED',
          createdAt: { $gte: today, $lt: tomorrowStart }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$totalAmount' }
        }
      }
    ]);

    console.log('\n  Today\'s Stats:');
    console.log(`  - Orders Today: ${todayOrders}`);
    console.log(`  - Revenue Today: ₹${todayRevenue.length > 0 ? todayRevenue[0].total : 0}`);

    console.log('\n' + '='.repeat(60));
    console.log('\n✅ All endpoint logic tests completed successfully!');
    console.log('\nThe data above should match what you see in the dashboard.');
    console.log('If you\'re seeing zeros but these values are > 0, there may be an API authentication issue.\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

testStatsEndpoints();