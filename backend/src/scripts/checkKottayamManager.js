import mongoose from 'mongoose';
import { config } from 'dotenv';
import Hub from '../models/Hub.js';
import User from '../models/User.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
config({ path: path.join(__dirname, '../../.env') });

const checkManager = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const kottayam = await Hub.findOne({ district: 'Kottayam' }).populate('managedBy');
        if (!kottayam) {
            console.log('Kottayam Hub not found in DB!');
            process.exit(1);
        }

        console.log('--- Kottayam Hub ---');
        console.log(`ID: ${kottayam._id}`);
        console.log(`Name: ${kottayam.name}`);
        console.log(`Active: ${kottayam.isActive}`);

        if (!kottayam.managedBy || kottayam.managedBy.length === 0) {
            console.log('⚠️  NO MANAGER ASSIGNED to Kottayam Hub!');
        } else {
            console.log('Managers:');
            kottayam.managedBy.forEach(m => {
                console.log(` - ${m.firstName} ${m.lastName} (${m.email}) [Role: ${m.role}]`);
            });
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

checkManager();
