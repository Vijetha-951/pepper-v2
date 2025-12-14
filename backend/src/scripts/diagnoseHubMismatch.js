import mongoose from 'mongoose';
import { config } from 'dotenv';
import Order from '../models/Order.js';
import Hub from '../models/Hub.js';
import User from '../models/User.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
config({ path: path.join(__dirname, '../../.env') });

const diagnose = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected.');

        // Get the user
        const user = await User.findOne({ email: { $regex: 'kottayam', $options: 'i' } });
        if (!user) {
            console.log("User 'hub.kottayam' not found.");
            process.exit();
        }
        console.log(`User: ${user.email} (${user._id})`);

        const hub = await Hub.findOne({ managedBy: user._id });
        if (!hub) {
            console.log("User has NO HUB assigned.");
            process.exit();
        }
        console.log(`User Hub: ${hub.name} (${hub._id})`);

        // Find the order
        const allOrders = await Order.find({});
        // Filter for one ending in 304dfbe7
        const targetOrder = allOrders.find(o => o._id.toString().toLowerCase().endsWith('304dfbe7'));

        if (!targetOrder) {
            console.log("Order ending in 304dfbe7 NOT FOUND.");
            // List recent orders to see what's there
            console.log("Recent Orders:");
            allOrders.slice(-3).forEach(o => console.log(`- ${o._id} (Hub: ${o.currentHub})`));
        } else {
            console.log(`Found Order: ${targetOrder._id}`);
            console.log(`Order Current Hub: ${targetOrder.currentHub}`);

            if (targetOrder.currentHub && targetOrder.currentHub.toString() === hub._id.toString()) {
                console.log("✅ MATCH! Order is officially at this hub.");
            } else {
                console.log("❌ MISMATCH! Order is elsewhere.");
            }
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

diagnose();
