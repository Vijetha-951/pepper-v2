import mongoose from 'mongoose';
import { config } from 'dotenv';
import Order from '../models/Order.js';
import '../models/Hub.js'; // Register model
import Hub from '../models/Hub.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
config({ path: path.join(__dirname, '../../.env') });

const debug = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected.');

        // Get Kottayam Hub ID
        const kottayam = await Hub.findOne({ district: 'Kottayam' });
        console.log(`KOTTAYAM_DB_ID: ${kottayam._id}`);

        const order = await Order.findOne({}).sort({ createdAt: -1 }).populate('currentHub');

        if (!order) {
            console.log("No orders found.");
        } else {
            console.log(`LATEST_ORDER_ID: ${order._id}`);
            console.log(`STATUS: ${order.status}`);
            console.log(`CURRENT_HUB_ID: ${order.currentHub ? order.currentHub._id : 'NULL'}`);

            if (order.currentHub && kottayam && order.currentHub._id.toString() === kottayam._id.toString()) {
                console.log("MATCH: Order is at Kottayam.");
            } else {
                console.log("MISMATCH: Order is NOT at Kottayam.");
            }
        }
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

debug();
