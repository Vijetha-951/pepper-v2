
import mongoose from 'mongoose';
import Hub from './src/models/Hub.js';
import { generateRoute } from './src/services/routeGenerationService.js';
import dotenv from 'dotenv';

dotenv.config();

async function testAllRoutes() {
  try {
    await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
    
    const hubs = await Hub.find({ isActive: true });
    const districts = [...new Set(hubs.map(h => h.district))];
    
    console.log(`Testing routes for ${districts.length} districts...\n`);
    
    for (const dist of districts) {
      try {
        const route = await generateRoute(dist);
        console.log(`✅ ${dist.padEnd(20)}: ${route.map(h => h.name).join(' -> ')}`);
      } catch (err) {
        console.log(`❌ ${dist.padEnd(20)}: ${err.message}`);
      }
    }
    
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

testAllRoutes();
