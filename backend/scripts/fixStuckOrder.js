import '../src/config/env.js';
import mongoose from 'mongoose';
import connectDB from '../src/config/db.js';
import Order from '../src/models/Order.js';
import RestockRequest from '../src/models/RestockRequest.js';
import HubInventory from '../src/models/HubInventory.js';
import Hub from '../src/models/Hub.js';
import Product from '../src/models/Product.js';
import User from '../src/models/User.js';
import { createRestockRequestNotification } from '../src/services/notificationService.js';

const fixStuckOrder = async () => {
  try {
    await connectDB();
    console.log('✅ Connected to MongoDB\n');

    const orderId = '69675e3bded7d118a9e42de8';
    
    const order = await Order.findById(orderId)
      .populate('collectionHub', 'name district')
      .populate('items.product', 'name')
      .populate('user', 'firstName');

    if (!order) {
      console.log('❌ Order not found');
      process.exit(1);
    }

    console.log(`📋 Order: ${orderId}`);
    console.log(`   Status: ${order.status}`);
    console.log(`   Hub: ${order.collectionHub.name}`);
    console.log(`   Items: ${order.items.map(i => `${i.name} x${i.quantity}`).join(', ')}`);

    // Check inventory gaps
    for (const item of order.items) {
      const hubInv = await HubInventory.findOne({
        hub: order.collectionHub._id,
        product: item.product._id
      });

      if (!hubInv || hubInv.quantity < item.quantity) {
        const available = hubInv ? hubInv.quantity : 0;
        const needed = item.quantity - available;
        
        console.log(`\n⚠️ Insufficient stock for ${item.name}:`);
        console.log(`   Available: ${available}`);
        console.log(`   Required: ${item.quantity}`);
        console.log(`   Need to restock: ${needed}`);

        // Create restock request
        const restockRequest = await RestockRequest.create({
          requestingHub: order.collectionHub._id,
          product: item.product._id,
          requestedQuantity: needed,
          requestedBy: order.user._id,
          reason: `Order #${orderId} - Insufficient stock (Manual Fix)`,
          priority: 'HIGH',
          status: 'PENDING'
        });

        console.log(`✅ Created restock request: ${restockRequest._id}`);

        // Notify admins
        const product = await Product.findById(item.product._id);
        if (product) {
          await createRestockRequestNotification(restockRequest, order.collectionHub, product);
          console.log(`✅ Notified admins about restock need`);
        }

        // Update order status back to PENDING since it needs restocking
        if (order.status === 'ARRIVED_AT_HUB') {
          order.status = 'PENDING';
          order.trackingTimeline.push({
            status: 'PENDING',
            location: order.collectionHub.name,
            hub: order.collectionHub._id,
            timestamp: new Date(),
            description: `Order reverted to pending - awaiting restock of ${item.name}`
          });
          await order.save();
          console.log(`✅ Updated order status to PENDING`);
        }
      }
    }

    console.log('\n✅ Fix complete! Admin needs to approve restock request.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

fixStuckOrder();
