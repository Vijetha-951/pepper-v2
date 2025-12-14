import mongoose from 'mongoose';
import Hub from '../models/Hub.js';
import { config } from 'dotenv';

config();

const KERALA_HUBS = [
  { district: 'Kannur', order: 1, type: 'REGIONAL_HUB' },
  { district: 'Kasaragod', order: 2, type: 'REGIONAL_HUB' },
  { district: 'Wayanad', order: 3, type: 'REGIONAL_HUB' },
  { district: 'Kozhikode', order: 4, type: 'REGIONAL_HUB' },
  { district: 'Malappuram', order: 5, type: 'REGIONAL_HUB' },
  { district: 'Palakkad', order: 6, type: 'REGIONAL_HUB' },
  { district: 'Thrissur', order: 7, type: 'REGIONAL_HUB' },
  { district: 'Ernakulam', order: 8, type: 'REGIONAL_HUB' },
  { district: 'Kottayam', order: 9, type: 'WAREHOUSE' },
  { district: 'Pathanamthitta', order: 10, type: 'REGIONAL_HUB' },
  { district: 'Alappuzha', order: 11, type: 'REGIONAL_HUB' },
  { district: 'Kollam', order: 12, type: 'REGIONAL_HUB' },
  { district: 'Thiruvananthapuram', order: 13, type: 'REGIONAL_HUB' },
  { district: 'Idukki', order: 14, type: 'REGIONAL_HUB' }
];

async function seedHubs() {
  try {
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI or MONGO_URI not set in environment variables');
    }
    
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log('Connected to MongoDB');

    for (const hubData of KERALA_HUBS) {
      const existingHub = await Hub.findOne({ district: hubData.district });
      if (existingHub) {
        console.log(`Hub for ${hubData.district} already exists. Skipping...`);
        continue;
      }

      const hub = new Hub({
        name: `${hubData.district} Hub`,
        district: hubData.district,
        order: hubData.order,
        type: hubData.type,
        location: {
          city: hubData.district,
          state: 'Kerala',
          pincode: '000000'
        },
        isActive: true
      });

      await hub.save();
      console.log(`✅ Created hub for ${hubData.district} (Order: ${hubData.order})`);
    }

    console.log('✅ Hub seeding completed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding hubs:', error);
    process.exit(1);
  }
}

seedHubs();
