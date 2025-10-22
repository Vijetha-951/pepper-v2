import mongoose from 'mongoose';
import User from '../src/models/User.js';
import Order from '../src/models/Order.js';
import Product from '../src/models/Product.js';
import dotenv from 'dotenv';

dotenv.config();

async function checkData() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('\n📊 DASHBOARD DATA DIAGNOSTIC REPORT');
    console.log('='.repeat(50));

    // Check Users
    const totalUsers = await User.countDocuments({});
    const adminUsers = await User.countDocuments({ role: 'admin' });
    const users = await User.find({}, 'email firebaseUid role firstName').limit(5);
    
    console.log('\n👥 USERS:');
    console.log(`   Total Users: ${totalUsers}`);
    console.log(`   Admin Users: ${adminUsers}`);
    console.log(`   Sample Users:`);
    users.forEach(u => {
      console.log(`   - ${u.email} (${u.role || 'user'}) [UID: ${u.firebaseUid ? '✓' : '✗'}]`);
    });

    // Check Orders
    const totalOrders = await Order.countDocuments({});
    const pendingOrders = await Order.countDocuments({ status: { $nin: ['DELIVERED', 'CANCELLED'] } });
    const recentOrders = await Order.find({})
      .populate('user', 'email')
      .sort({ createdAt: -1 })
      .limit(3);

    console.log('\n📦 ORDERS:');
    console.log(`   Total Orders: ${totalOrders}`);
    console.log(`   Pending Deliveries: ${pendingOrders}`);
    if (recentOrders.length > 0) {
      console.log(`   Recent Orders:`);
      recentOrders.forEach(o => {
        console.log(`   - Order #${o._id} | Status: ${o.status} | User: ${o.user?.email || 'unknown'} | Amount: ${o.totalAmount}`);
      });
    } else {
      console.log(`   ⚠️  No orders found in database`);
    }

    // Check Products
    const totalProducts = await Product.countDocuments({});
    const availableProducts = await Product.countDocuments({ available_stock: { $gt: 0 } });
    const products = await Product.find({})
      .select('name available_stock total_stock stock')
      .limit(5);

    console.log('\n🌱 PRODUCTS:');
    console.log(`   Total Products: ${totalProducts}`);
    console.log(`   Available (stock > 0): ${availableProducts}`);
    if (products.length > 0) {
      console.log(`   Sample Products:`);
      products.forEach(p => {
        const stock = p.available_stock || p.stock || 0;
        console.log(`   - ${p.name} | Stock: ${stock}`);
      });
    } else {
      console.log(`   ⚠️  No products found in database`);
    }

    console.log('\n' + '='.repeat(50));
    console.log('\n💡 RECOMMENDATIONS:');
    
    if (totalUsers === 0) {
      console.log('   ❌ No users in database - Sign up first or run seed script');
    }
    if (totalOrders === 0) {
      console.log('   ❌ No orders found - Create test orders to populate dashboard');
    }
    if (totalProducts === 0) {
      console.log('   ❌ No products found - Run: npm run seed');
    }
    if (availableProducts === 0 && totalProducts > 0) {
      console.log('   ⚠️  Products exist but none have available stock');
    }

    console.log('\n');

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

checkData();