import mongoose from 'mongoose';
import { config } from 'dotenv';
import User from '../models/User.js';
import Hub from '../models/Hub.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
config({ path: path.join(__dirname, '../../.env') });

const listManagers = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        // Find users with role 'hubmanager'
        const managers = await User.find({ role: 'hubmanager' });
        console.log(`Found ${managers.length} Hub Managers:`);

        for (const m of managers) {
            // Check if they are already managing a hub
            const hub = await Hub.findOne({ managedBy: m._id });
            console.log(`- ${m.firstName} ${m.lastName} (${m.email}) -> Managing: ${hub ? hub.name : 'NONE'}`);
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

listManagers();
