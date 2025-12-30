import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Hub from '../src/models/Hub.js';
import User from '../src/models/User.js';
import Order from '../src/models/Order.js';

dotenv.config();

async function getAllHubDetails() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');
    console.log('═'.repeat(80));
    console.log('🏢 COMPLETE HUB DETAILS REPORT');
    console.log('═'.repeat(80));

    const hubs = await Hub.find().sort({ order: 1, name: 1 });
    
    console.log(`\n📊 Total Hubs in System: ${hubs.length}\n`);

    for (const hub of hubs) {
      console.log('\n' + '─'.repeat(80));
      console.log(`\n🏢 HUB: ${hub.name}`);
      console.log('─'.repeat(80));
      
      // Basic Info
      console.log(`\n📋 BASIC INFORMATION:`);
      console.log(`   ID: ${hub._id}`);
      console.log(`   Type: ${hub.type}`);
      console.log(`   District: ${hub.district || '❌ NOT SET'}`);
      console.log(`   Order: ${hub.order}`);
      console.log(`   Active: ${hub.isActive ? '✅ Yes' : '❌ No'}`);
      console.log(`   Created: ${new Date(hub.createdAt).toLocaleString()}`);
      
      // Location Details
      if (hub.location) {
        console.log(`\n📍 LOCATION:`);
        console.log(`   Address: ${hub.location.address || 'N/A'}`);
        console.log(`   City: ${hub.location.city || 'N/A'}`);
        console.log(`   State: ${hub.location.state || 'N/A'}`);
        console.log(`   Pincode: ${hub.location.pincode || 'N/A'}`);
        if (hub.location.coordinates?.lat && hub.location.coordinates?.lng) {
          console.log(`   Coordinates: ${hub.location.coordinates.lat}, ${hub.location.coordinates.lng}`);
        }
      }
      
      // Coverage Details
      if (hub.coverage) {
        if (hub.coverage.pincodes && hub.coverage.pincodes.length > 0) {
          console.log(`\n📮 COVERAGE (Pincodes): ${hub.coverage.pincodes.join(', ')}`);
        }
        if (hub.coverage.districts && hub.coverage.districts.length > 0) {
          console.log(`📮 COVERAGE (Districts): ${hub.coverage.districts.join(', ')}`);
        }
      }
      
      // Manager Details
      if (hub.managedBy && hub.managedBy.length > 0) {
        console.log(`\n👥 MANAGERS (${hub.managedBy.length}):`);
        for (const managerId of hub.managedBy) {
          const manager = await User.findById(managerId);
          if (manager) {
            console.log(`   • ${manager.firstName} ${manager.lastName}`);
            console.log(`     Email: ${manager.email}`);
            console.log(`     Phone: ${manager.phone || 'N/A'}`);
            console.log(`     Role: ${manager.role}`);
            console.log(`     Active: ${manager.isActive ? '✅' : '❌'}`);
          } else {
            console.log(`   • ⚠️  Manager ID ${managerId} not found in database`);
          }
        }
      } else {
        console.log(`\n👥 MANAGERS: ❌ No manager assigned`);
      }
      
      // Order Statistics
      const totalOrders = await Order.countDocuments({ currentHub: hub._id });
      const pendingOrders = await Order.countDocuments({ currentHub: hub._id, status: 'PENDING' });
      const approvedOrders = await Order.countDocuments({ currentHub: hub._id, status: 'APPROVED' });
      const inTransitOrders = await Order.countDocuments({ currentHub: hub._id, status: 'IN_TRANSIT' });
      const outForDeliveryOrders = await Order.countDocuments({ currentHub: hub._id, status: 'OUT_FOR_DELIVERY' });
      const deliveredOrders = await Order.countDocuments({ currentHub: hub._id, status: 'DELIVERED' });
      const cancelledOrders = await Order.countDocuments({ currentHub: hub._id, status: 'CANCELLED' });
      
      console.log(`\n📦 ORDER STATISTICS:`);
      console.log(`   Total Orders: ${totalOrders}`);
      if (totalOrders > 0) {
        console.log(`   ├─ PENDING: ${pendingOrders}`);
        console.log(`   ├─ APPROVED: ${approvedOrders}`);
        console.log(`   ├─ IN_TRANSIT: ${inTransitOrders}`);
        console.log(`   ├─ OUT_FOR_DELIVERY: ${outForDeliveryOrders}`);
        console.log(`   ├─ DELIVERED: ${deliveredOrders}`);
        console.log(`   └─ CANCELLED: ${cancelledOrders}`);
        
        // Active orders (not delivered/cancelled)
        const activeOrders = totalOrders - deliveredOrders - cancelledOrders;
        console.log(`\n   🔴 Active Orders: ${activeOrders}`);
      }
      
      // Orders in route (this hub is in the route but not current hub yet)
      const ordersInRoute = await Order.countDocuments({ 
        route: hub._id,
        currentHub: { $ne: hub._id }
      });
      if (ordersInRoute > 0) {
        console.log(`   🚚 Orders heading to this hub: ${ordersInRoute}`);
      }
    }
    
    console.log('\n' + '═'.repeat(80));
    console.log('📊 SUMMARY STATISTICS');
    console.log('═'.repeat(80));
    
    // Hub type distribution
    const hubTypes = await Hub.aggregate([
      { $group: { _id: '$type', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    console.log('\n🏢 Hubs by Type:');
    hubTypes.forEach(type => {
      console.log(`   ${type._id}: ${type.count}`);
    });
    
    // Hub district distribution
    const hubDistricts = await Hub.aggregate([
      { $match: { district: { $exists: true, $ne: null, $ne: '' } } },
      { $group: { _id: '$district', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);
    
    console.log('\n📍 Hubs by District:');
    hubDistricts.forEach(dist => {
      console.log(`   ${dist._id}: ${dist.count}`);
    });
    
    // Managed vs Unmanaged
    const managedHubs = await Hub.countDocuments({ 
      managedBy: { $exists: true, $ne: [], $ne: null }
    });
    const unmanagedHubs = hubs.length - managedHubs;
    
    console.log('\n👥 Hub Management Status:');
    console.log(`   Managed Hubs: ${managedHubs}`);
    console.log(`   Unmanaged Hubs: ${unmanagedHubs}`);
    
    // Active vs Inactive
    const activeHubs = await Hub.countDocuments({ isActive: true });
    const inactiveHubs = hubs.length - activeHubs;
    
    console.log('\n⚡ Hub Status:');
    console.log(`   Active: ${activeHubs}`);
    console.log(`   Inactive: ${inactiveHubs}`);
    
    // Total orders across all hubs
    const totalSystemOrders = await Order.countDocuments();
    const ordersWithHub = await Order.countDocuments({ currentHub: { $exists: true, $ne: null } });
    const ordersWithoutHub = totalSystemOrders - ordersWithHub;
    
    console.log('\n📦 Order Distribution:');
    console.log(`   Total Orders in System: ${totalSystemOrders}`);
    console.log(`   Orders assigned to hubs: ${ordersWithHub}`);
    console.log(`   Orders without hub: ${ordersWithoutHub}`);
    
    console.log('\n' + '═'.repeat(80));

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB\n');
  }
}

getAllHubDetails();
