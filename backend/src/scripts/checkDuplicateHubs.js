import mongoose from 'mongoose';
import { config } from 'dotenv';
import Hub from '../models/Hub.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
config({ path: path.join(__dirname, '../../.env') });

const checkHubs = async () => {
    await mongoose.connect(process.env.MONGO_URI);
    const hubs = await Hub.find({ district: 'Kottayam' });
    console.log(`Found ${hubs.length} Kottayam Hubs:`);
    hubs.forEach(h => {
        console.log(`- ID: ${h._id}, ManagedBy: ${h.managedBy}, Active: ${h.isActive}`);
    });
    process.exit(0);
};
checkHubs();
