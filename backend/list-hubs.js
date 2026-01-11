
import mongoose from 'mongoose';
import Hub from './src/models/Hub.js';
import dotenv from 'dotenv';

dotenv.config();

async function listHubs() {
  await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
  const hubs = await Hub.find().sort({ district: 1, order: 1 });
  console.log('District'.padEnd(20), '| Name'.padEnd(25), '| Order', '| Type');
  console.log('-'.repeat(70));
  hubs.forEach(h => {
    console.log(
      (h.district || 'N/A').padEnd(20), 
      '| ' + (h.name || 'N/A').padEnd(25), 
      '| ' + (h.order || 0), 
      '| ' + h.type
    );
  });
  process.exit(0);
}

listHubs();
