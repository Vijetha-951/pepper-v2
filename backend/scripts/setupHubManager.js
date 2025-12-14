import './config/env.js';
import mongoose from 'mongoose';
import User from '../src/models/User.js';
import Hub from '../src/models/Hub.js';
import Order from '../src/models/Order.js';
import connectDB from '../src/config/db.js';
import admin from 'firebase-admin';

const serviceAccountKey = {
  type: 'service_account',
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_CLIENT_ID,
  auth_uri: 'https://accounts.google.com/o/oauth2/auth',
  token_uri: 'https://oauth2.googleapis.com/token',
};

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccountKey),
  });
}

const auth = admin.auth();

async function setupHubManager() {
  try {
    console.log('Connecting to MongoDB...');
    await connectDB();
    console.log('✅ Connected to MongoDB');

    // Create Firebase user for hub manager
    const email = 'hubmanager@pepper.local';
    const password = 'HubManager@123';

    let firebaseUser;
    try {
      firebaseUser = await auth.getUserByEmail(email);
      console.log('✅ Firebase user already exists:', email);
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        firebaseUser = await auth.createUser({
          email,
          password,
          displayName: 'Hub Manager',
        });
        console.log('✅ Created Firebase user:', email);
      } else {
        throw error;
      }
    }

    // Create MongoDB user
    let dbUser = await User.findOne({ firebaseUid: firebaseUser.uid });
    if (!dbUser) {
      dbUser = await User.create({
        firebaseUid: firebaseUser.uid,
        email,
        firstName: 'Hub',
        lastName: 'Manager',
        role: 'hubmanager',
        phone: '9876543210',
        isActive: true,
      });
      console.log('✅ Created MongoDB user:', dbUser._id);
    } else {
      // Update role if needed
      if (dbUser.role !== 'hubmanager') {
        dbUser.role = 'hubmanager';
        dbUser.isActive = true;
        await dbUser.save();
        console.log('✅ Updated user role to hubmanager');
      }
    }

    // Check if hubs exist
    const hubCount = await Hub.countDocuments();
    if (hubCount === 0) {
      console.log('⚠️ No hubs found. Creating sample hubs...');
      
      const sampleHubs = await Hub.insertMany([
        {
          name: 'Central Warehouse',
          type: 'WAREHOUSE',
          location: {
            address: '123 Port Road',
            city: 'Cochin',
            state: 'Kerala',
            pincode: '682001',
            coordinates: { lat: 9.9312, lng: 76.2673 }
          },
          managedBy: [dbUser._id],
          coverage: { pincodes: [], districts: [] },
          isActive: true
        },
        {
          name: 'North Regional Hub',
          type: 'REGIONAL_HUB',
          location: {
            address: '456 MG Road',
            city: 'Ernakulathappan',
            state: 'Kerala',
            pincode: '682018',
            coordinates: { lat: 10.0092, lng: 76.3405 }
          },
          managedBy: [],
          coverage: { districts: ['Ernakulam'] },
          isActive: true
        },
        {
          name: 'Fort Kochi Local Hub',
          type: 'LOCAL_HUB',
          location: {
            address: '789 Fort Road',
            city: 'Fort Kochi',
            state: 'Kerala',
            pincode: '682001',
            coordinates: { lat: 9.9629, lng: 76.2427 }
          },
          managedBy: [],
          coverage: { pincodes: ['682001', '682018', '682002'] },
          isActive: true
        }
      ]);
      
      console.log('✅ Created sample hubs');

      // Assign manager to warehouse
      dbUser.hubId = sampleHubs[0]._id;
      await dbUser.save();
      console.log('✅ Assigned hub manager to Central Warehouse');
    } else {
      // Assign manager to first warehouse or create assignment
      const warehouse = await Hub.findOne({ type: 'WAREHOUSE' });
      if (warehouse) {
        if (!warehouse.managedBy.includes(dbUser._id)) {
          warehouse.managedBy.push(dbUser._id);
          await warehouse.save();
          console.log('✅ Assigned hub manager to warehouse:', warehouse.name);
        }
        dbUser.hubId = warehouse._id;
        await dbUser.save();
      }
    }

    // Create sample orders for testing
    const orders = await Order.find({ status: { $in: ['PENDING', 'APPROVED'] } }).limit(3);
    if (orders.length === 0) {
      console.log('⚠️ No pending orders found for testing');
      console.log('💡 Create orders through the frontend to test the dashboard');
    } else {
      console.log(`ℹ️ Found ${orders.length} pending orders for testing`);
    }

    console.log('\n========================================');
    console.log('✅ Setup Complete!');
    console.log('========================================');
    console.log('\n📝 Hub Manager Credentials:');
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
    console.log('\n🚀 Next steps:');
    console.log('1. Start backend: npm run dev');
    console.log('2. Start frontend: npm start');
    console.log('3. Go to http://localhost:3000');
    console.log('4. Click "Login"');
    console.log('5. Enter the credentials above');
    console.log('6. You will see the Hub Manager Dashboard');
    console.log('\n');

  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
  }
}

setupHubManager();
