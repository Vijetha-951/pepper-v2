import mongoose from 'mongoose';
import { config } from 'dotenv';
import Hub from '../models/Hub.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
config({ path: path.join(__dirname, '../../.env') });

const updateHubTypes = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected.');

        // 1. Update Ernakulam to MEGA_HUB
        const ernakulam = await Hub.findOne({ district: 'Ernakulam' });
        if (ernakulam) {
            ernakulam.type = 'MEGA_HUB';
            await ernakulam.save();
            console.log('✅ Updated Ernakulam to MEGA_HUB');
        }

        // 2. Update Kozhikode to MEGA_HUB
        const kozhikode = await Hub.findOne({ district: 'Kozhikode' });
        if (kozhikode) {
            kozhikode.type = 'MEGA_HUB';
            await kozhikode.save();
            console.log('✅ Updated Kozhikode to MEGA_HUB');
        }

        // 3. Ensure Kannur is LOCAL_HUB or DELIVERY_HUB? 
        // The user example says: "Kannur Delivery Hub".
        // Currently likely REGIONAL_HUB. Let's keep it (or rename for clarity).
        // The visualizer might depend on exact types. 
        // Let's verify existing types

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

updateHubTypes();
