import mongoose from 'mongoose';
import { config } from 'dotenv';
import User from '../models/User.js';
import Hub from '../models/Hub.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
config({ path: path.join(__dirname, '../../.env') });

const findUser = async () => {
    await mongoose.connect(process.env.MONGO_URI);
    const users = await User.find({ email: { $regex: 'kottayam', $options: 'i' } });
    console.log('Users found:', users.length);
    users.forEach(u => console.log(`${u._id} - ${u.email} (${u.role})`));

    // Also verify if assigned
    if (users.length > 0) {
        const hub = await Hub.findOne({ district: 'Kottayam' });
        if (hub) {
            console.log(`Assigning ${users[0].email} to Kottayam Hub...`);
            hub.managedBy = [users[0]._id];
            await hub.save();
            console.log("ASSIGNED!");
        }
    }
    process.exit(0);
};
findUser();
