import mongoose from 'mongoose';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import Order from '../models/Order.js';
import Hub from '../models/Hub.js';
import User from '../models/User.js';
import Product from '../models/Product.js';
import { generateRoute } from '../services/routeGenerationService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env from backend root (up 2 levels from src/scripts)
config({ path: join(__dirname, '../../.env') });

const TEST_DISTRICT = 'Thiruvananthapuram'; // Far from Kottayam (Order 13 vs 9)

async function simulateDeliveryFlow() {
  try {
    // 1. Connect to DB
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    if (!mongoUri) throw new Error('MONGO_URI not set');
    
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // 2. Setup Test Data
    // Find a user or create dummy
    let user = await User.findOne({ email: 'test@example.com' });
    if (!user) {
      user = await User.create({
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        phone: '9999999999',
        firebaseUid: 'test_uid_' + Date.now(),
        role: 'user'
      });
    }

    // Find a product
    let product = await Product.findOne({});
    if (!product) {
      console.log('❌ No products found. Please seed products first.');
      process.exit(1);
    }

    // 3. Create Order
    console.log(`\n📦 Creating Order for destination: ${TEST_DISTRICT}...`);
    
    // Generate Route first (normally done in logisticsService/Order creation)
    const routeHubs = await generateRoute(TEST_DISTRICT);
    const routeIds = routeHubs.map(h => h._id);
    
    console.log(`📍 Route Generated: ${routeHubs.map(h => h.name).join(' -> ')}`);

    const order = await Order.create({
      user: user._id,
      items: [{
        product: product._id,
        name: product.name,
        priceAtOrder: product.price,
        quantity: 1
      }],
      totalAmount: product.price,
      shippingAddress: {
        line1: 'Test Address',
        district: TEST_DISTRICT,
        state: 'Kerala',
        pincode: '695001'
      },
      payment: { method: 'COD' },
      status: 'APPROVED',
      route: routeIds,
      trackingTimeline: []
    });

    console.log(`✅ Order Created: ${order._id}`);

    // 4. Simulate Hub Movement
    console.log('\n🚚 Starting Hub Transit Simulation...');
    
    for (let i = 0; i < routeHubs.length; i++) {
      const currentHub = routeHubs[i];
      const isLastHub = i === routeHubs.length - 1;
      
      // Simulate Scan-In at Hub
      console.log(`\n[${currentHub.name}] 📥 Scanning In...`);
      
      // Validate Sequence (Logic from hub.routes.js)
      const hubIndex = order.route.findIndex(h => h.toString() === currentHub._id.toString());
      if (hubIndex > 0) {
        const previousHubId = order.route[hubIndex - 1].toString();
        // In a real scenario, we check if order.currentHub === previousHubId
        // Here we just update it
      }

      order.currentHub = currentHub._id;
      order.trackingTimeline.push({
        status: 'ARRIVED_AT_HUB',
        location: currentHub.name,
        hub: currentHub._id,
        description: `Package arrived at ${currentHub.name}`,
        timestamp: new Date()
      });
      await order.save();
      console.log(`   ✅ Arrived at ${currentHub.name}`);

      // Simulate Dispatch
      if (!isLastHub) {
        const nextHub = routeHubs[i + 1];
        console.log(`[${currentHub.name}] 📤 Dispatching to ${nextHub.name}...`);
        
        order.trackingTimeline.push({
          status: 'IN_TRANSIT',
          location: `In Transit to ${nextHub.name}`,
          hub: currentHub._id,
          description: `Package dispatched to ${nextHub.name}`,
          timestamp: new Date()
        });
        await order.save();
      } else {
        // Last Hub - Out for Delivery
        console.log(`[${currentHub.name}] 🚚 Marking Out for Delivery...`);
        
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        order.deliveryOtp = otp;
        order.status = 'OUT_FOR_DELIVERY';
        order.deliveryStatus = 'OUT_FOR_DELIVERY';
        
        order.trackingTimeline.push({
          status: 'OUT_FOR_DELIVERY',
          location: 'Out for Delivery',
          hub: currentHub._id,
          description: `Out for delivery from ${currentHub.name}`,
          timestamp: new Date()
        });
        
        await order.save();
        console.log(`   ✅ Order is OUT FOR DELIVERY`);
        console.log(`   🔐 OTP Generated: ${otp}`);
      }
      
      // Small delay to simulate time passing
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // 5. Simulate Delivery
    console.log('\n🏠 Simulating Delivery...');
    const finalOrder = await Order.findById(order._id);
    
    if (finalOrder.status === 'OUT_FOR_DELIVERY') {
      console.log(`   Delivery Boy asks for OTP...`);
      console.log(`   User provides: ${finalOrder.deliveryOtp}`);
      
      finalOrder.status = 'DELIVERED';
      finalOrder.deliveryStatus = 'DELIVERED';
      finalOrder.trackingTimeline.push({
        status: 'DELIVERED',
        location: 'Delivered',
        description: 'Package Delivered',
        timestamp: new Date()
      });
      
      await finalOrder.save();
      console.log('✅ Order DELIVERED successfully!');
    }

    console.log('\n✨ Simulation Completed Successfully!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Simulation Failed:', error);
    process.exit(1);
  }
}

simulateDeliveryFlow();