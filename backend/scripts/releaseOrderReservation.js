import mongoose from 'mongoose';
import Order from '../src/models/Order.js';
import HubInventory from '../src/models/HubInventory.js';

async function releaseOrderReservation() {
  try {
    await mongoose.connect('mongodb://localhost:27017/pepper-delivery');
    console.log('✅ Connected to MongoDB\n');

    const orderId = process.argv[2];
    if (!orderId) {
      console.log('❌ Please provide an order ID');
      console.log('Usage: node scripts/releaseOrderReservation.js <orderId>');
      process.exit(1);
    }

    // Find the order
    const order = await Order.findById(orderId)
      .populate('collectionHub')
      .populate('items.product');

    if (!order) {
      console.log('❌ Order not found');
      process.exit(1);
    }

    console.log('📋 ORDER INFO:');
    console.log(`Order ID: ${order._id}`);
    console.log(`Status: ${order.status}`);
    console.log(`Hub: ${order.collectionHub.name}`);
    console.log('');

    // Release any reserved stock for this order
    let releasedAny = false;
    for (const item of order.items) {
      const hubInventory = await HubInventory.findOne({
        hub: order.collectionHub._id,
        product: item.product._id
      });

      if (hubInventory && hubInventory.reservedQuantity > 0) {
        const beforeReserved = hubInventory.reservedQuantity;
        const beforeAvailable = hubInventory.getAvailableQuantity();
        
        // Release the quantity (up to what's needed for this order)
        const toRelease = Math.min(item.quantity, hubInventory.reservedQuantity);
        hubInventory.releaseQuantity(toRelease);
        await hubInventory.save();
        
        const afterReserved = hubInventory.reservedQuantity;
        const afterAvailable = hubInventory.getAvailableQuantity();
        
        console.log(`✅ Released ${toRelease} units of ${item.name}`);
        console.log(`   Reserved: ${beforeReserved} → ${afterReserved}`);
        console.log(`   Available: ${beforeAvailable} → ${afterAvailable}`);
        releasedAny = true;
      }
    }

    if (!releasedAny) {
      console.log('ℹ️  No reserved stock found for this order');
    }

    console.log('\n✅ Done!');
    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error.message);
    await mongoose.disconnect();
    process.exit(1);
  }
}

releaseOrderReservation();
