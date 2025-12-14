import mongoose from 'mongoose';
import { config } from 'dotenv';
import Order from '../models/Order.js';
import Hub from '../models/Hub.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
config({ path: path.join(__dirname, '../../.env') });

const checkOrders = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // Find orders that SHOULD be at Kottayam (i.e. first hub in route is Kottayam)
        const kottayamHub = await Hub.findOne({ district: 'Kottayam' });
        if (!kottayamHub) {
            console.log("Kottayam Hub not found!");
            return;
        }
        console.log("Kottayam Hub ID:", kottayamHub._id);

        const orders = await Order.find({}).sort({ createdAt: -1 }).limit(5).populate('currentHub').populate('route');

        console.log(`Checking last 5 orders:`);
        orders.forEach(o => {
            console.log(`Order ${o._id}:`);
            console.log(`  Route Length: ${o.route ? o.route.length : 0}`);
            console.log(`  Current Hub: ${o.currentHub ? o.currentHub.name + ' (' + o.currentHub._id + ')' : 'NULL'}`);
            if (o.currentHub && o.currentHub._id.toString() === kottayamHub._id.toString()) {
                console.log("  MATCHES KOTTAYAM");
            } else {
                console.log("  DOES NOT MATCH KOTTAYAM");
            }
        });

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

checkOrders();
