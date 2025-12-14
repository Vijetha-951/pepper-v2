import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Hub from '../src/models/Hub.js';
import User from '../src/models/User.js';
import connectDB from '../src/config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from backend root (one level up from scripts/)
dotenv.config({ path: path.join(__dirname, '../.env') });

const seedHubs = async () => {
  try {
    await connectDB();

    // Clear existing hubs
    await Hub.deleteMany({});
    console.log('Cleared existing hubs');

    // Create Warehouse
    const warehouse = await Hub.create({
      name: 'Central Warehouse',
      type: 'WAREHOUSE',
      location: {
        address: '123 Main St, Industrial Zone',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400001'
      },
      coverage: {
        pincodes: [],
        districts: []
      }
    });
    console.log('Created Warehouse:', warehouse.name);

    // Create Regional Hub
    const regionalHub = await Hub.create({
      name: 'North Region Hub',
      type: 'REGIONAL_HUB',
      location: {
        address: '456 Highway Rd',
        city: 'Delhi',
        state: 'Delhi',
        pincode: '110001'
      },
      coverage: {
        pincodes: [],
        districts: ['Delhi', 'Gurgaon', 'Noida']
      }
    });
    console.log('Created Regional Hub:', regionalHub.name);

    // Create Local Hub
    const localHub = await Hub.create({
      name: 'South Delhi Local Hub',
      type: 'LOCAL_HUB',
      location: {
        address: '789 Local St',
        city: 'Delhi',
        state: 'Delhi',
        pincode: '110020'
      },
      coverage: {
        pincodes: ['110020', '110021', '110022'],
        districts: []
      }
    });
    console.log('Created Local Hub:', localHub.name);

    console.log('✅ Hubs seeded successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding hubs:', error);
    process.exit(1);
  }
};

seedHubs();
