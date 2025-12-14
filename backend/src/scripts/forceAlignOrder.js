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

const fix = async () => {
    await mongoose.connect(process.env.MONGO_URI);

    // 1. Get User and Hub
    const user = await User.findOne({ email: { $regex: 'kottayam', $options: 'i' } });
    const hub = await Hub.findOne({ managedBy: user._id });

    if (!hub) {
        console.log("User has no hub!");
        process.exit(1);
    }
    console.log(`Target Hub: ${hub.name} (${hub._id})`);

    // 2. Get Order
    // Find checking last 8 chars of stringified ID
    const allOrders = await Order.find({});
    const order = allOrders.find(o => o._id.toString().toLowerCase().endsWith('304dfbe7'));

    if (!order) {
        console.log("Order not found!");
        process.exit(1);
    }

    console.log(`Order ${order._id} was at: ${order.currentHub}`);

    // 3. Update
    order.currentHub = hub._id;
    // Also update route[0] to ensure consistency if it's there
    if (order.route && order.route.length > 0) {
        order.route[0] = hub._id;
    }

    await order.save();
    console.log(`✅ Order moved to ${hub.name} (${hub._id})`);

    process.exit(0);
};
fix();
