import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Order from '../src/models/Order.js';

dotenv.config();

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/pepper';

async function fixOrder() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    const orderId = '690015e0cf5e78093f112b90';
    const correctErnakulamHubId = '693b99ca2be607d435a97120';
    
    const order = await Order.findById(orderId);
    if (!order) {
      console.error('Order not found');
      process.exit(1);
    }

    console.log('Before:');
    console.log('  currentHub:', order.currentHub);
    console.log('  route:', order.route);

    // Update currentHub and route to use the correct Ernakulam hub
    order.currentHub = correctErnakulamHubId;
    order.route[1] = correctErnakulamHubId; // Assuming Ernakulam is the second hub in route
    
    await order.save();

    console.log('\nAfter:');
    console.log('  currentHub:', order.currentHub);
    console.log('  route:', order.route);
    console.log('\n✅ Order fixed! It should now appear in Ernakulam hub manager dashboard');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixOrder();
