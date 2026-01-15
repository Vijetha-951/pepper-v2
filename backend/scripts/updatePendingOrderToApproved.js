import '../src/config/env.js';
import mongoose from 'mongoose';
import connectDB from '../src/config/db.js';
import Order from '../src/models/Order.js';
import RestockRequest from '../src/models/RestockRequest.js';
import HubInventory from '../src/models/HubInventory.js';
import Hub from '../src/models/Hub.js';
import Product from '../src/models/Product.js';

const updatePendingOrders = async () => {
  try {
    await connectDB();
    console.log('✅ Connected to MongoDB');

    // Find all PENDING hub collection orders
    const pendingOrders = await Order.find({
      status: 'PENDING',
      deliveryType: 'HUB_COLLECTION'
    }).populate('collectionHub', 'name');

    console.log(`\n📋 Found ${pendingOrders.length} pending hub collection orders`);

    for (const order of pendingOrders) {
      console.log(`\n🔍 Checking order: ${order._id}`);
      
      // Find all restock requests for this order
      const restockRequests = await RestockRequest.find({
        reason: new RegExp(`Order #${order._id}`, 'i')
      }).populate('product', 'name');

      console.log(`   Found ${restockRequests.length} restock requests`);
      
      if (restockRequests.length === 0) {
        console.log(`   ⚠️ No restock requests found for this order`);
        continue;
      }

      // Check if all are fulfilled
      const allFulfilled = restockRequests.every(r => r.status === 'FULFILLED');
      console.log(`   Restock statuses:`, restockRequests.map(r => `${r.product?.name}: ${r.status}`).join(', '));

      if (allFulfilled) {
        console.log(`   ✅ All restocks fulfilled! Updating order to APPROVED...`);
        
        // Check hub inventory availability and reserve stock
        let canFulfill = true;
        for (const item of order.items) {
          const hubInv = await HubInventory.findOne({
            hub: order.collectionHub._id,
            product: item.product
          }).populate('product', 'name');
          
          if (!hubInv) {
            console.log(`   ⚠️ No hub inventory found for product ${item.product}`);
            canFulfill = false;
            break;
          }
          
          const available = hubInv.getAvailableQuantity();
          console.log(`   📦 ${hubInv.product?.name || item.product}: Available: ${available}, Need: ${item.quantity}`);
          
          if (available < item.quantity) {
            console.log(`   ⚠️ Insufficient stock for ${hubInv.product?.name}`);
            canFulfill = false;
            break;
          }
        }

        if (canFulfill) {
          // Update order status
          order.status = 'APPROVED';
          order.trackingTimeline.push({
            status: 'APPROVED',
            location: order.collectionHub?.name || 'Hub',
            hub: order.collectionHub?._id,
            timestamp: new Date(),
            description: 'All items restocked and available for collection'
          });
          await order.save();

          // Reserve stock
          for (const item of order.items) {
            const hubInv = await HubInventory.findOne({
              hub: order.collectionHub._id,
              product: item.product
            });
            
            if (hubInv) {
              await hubInv.reserveQuantity(item.quantity);
              console.log(`   ✅ Reserved ${item.quantity} units`);
            }
          }

          console.log(`   ✅ Order ${order._id} updated to APPROVED and stock reserved!`);
        } else {
          console.log(`   ❌ Cannot approve order - insufficient stock`);
        }
      } else {
        console.log(`   ⏳ Waiting for restocks to be fulfilled`);
      }
    }

    console.log('\n✅ Update complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

updatePendingOrders();
