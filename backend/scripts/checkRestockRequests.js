import '../src/config/env.js';
import mongoose from 'mongoose';
import connectDB from '../src/config/db.js';
import RestockRequest from '../src/models/RestockRequest.js';
import Hub from '../src/models/Hub.js';
import Product from '../src/models/Product.js';

const checkRestockRequests = async () => {
  try {
    await connectDB();
    console.log('✅ Connected to MongoDB\n');

    const orderId = '69675e3bded7d118a9e42de8';
    
    const restockRequests = await RestockRequest.find({
      reason: new RegExp(`Order #${orderId}`, 'i')
    }).populate('product', 'name')
      .populate('requestingHub', 'name district');

    console.log(`📋 RESTOCK REQUESTS FOR ORDER #${orderId}:`);
    console.log('='.repeat(50));
    
    if (restockRequests.length === 0) {
      console.log('❌ No restock requests found for this order');
    } else {
      restockRequests.forEach((req, idx) => {
        console.log(`\n${idx + 1}. Request ID: ${req._id}`);
        console.log(`   Product: ${req.product?.name}`);
        console.log(`   Hub: ${req.requestingHub?.name} (${req.requestingHub?.district})`);
        console.log(`   Quantity: ${req.requestedQuantity}`);
        console.log(`   Priority: ${req.priority}`);
        console.log(`   Status: ${req.status}`);
        console.log(`   Reason: ${req.reason}`);
        console.log(`   Created: ${new Date(req.createdAt).toLocaleString()}`);
      });
    }

    console.log('\n✅ Done!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

checkRestockRequests();
