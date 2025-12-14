import mongoose from 'mongoose';
import { config } from 'dotenv';
import Order from '../models/Order.js';
import { generateRoute } from '../services/routeGenerationService.js';
import path from 'path';
import { fileURLToPath } from 'url';

// Load env vars
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
config({ path: path.join(__dirname, '../../.env') });

const fixRoutes = async () => {
    try {
        const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
        if (!mongoUri) {
            throw new Error('MONGODB_URI not set');
        }
        await mongoose.connect(mongoUri);
        console.log('Connected to MongoDB');

        const orders = await Order.find({
            $or: [
                { route: { $exists: false } },
                { route: { $size: 0 } }
            ]
        });

        console.log(`Found ${orders.length} orders with missing routes.`);

        for (const order of orders) {
            const district = order.shippingAddress?.district;
            if (!district) {
                console.log(`Skipping order ${order._id}: No shipping district.`);
                continue;
            }

            try {
                console.log(`Generating route for Order ${order._id} (District: ${district})...`);
                const route = await generateRoute(district);

                if (route && route.length > 0) {
                    order.route = route.map(h => h._id);
                    // Set currentHub to the first hub if not set
                    if (!order.currentHub) {
                        order.currentHub = route[0]._id;
                    }
                    // Add initial tracking event if empty
                    if (order.trackingTimeline.length === 0) {
                        order.trackingTimeline.push({
                            status: 'ORDER_PLACED',
                            location: 'System',
                            description: 'Order placed'
                        })
                    }

                    await order.save();
                    console.log(`✅ Fixed route for Order ${order._id}`);
                } else {
                    console.log(`⚠️  Could not generate route for Order ${order._id} (District: ${district})`);
                }
            } catch (err) {
                console.error(`❌ Failed to generate route for Order ${order._id}:`, err.message);
            }
        }

        console.log('Done!');
        process.exit(0);

    } catch (err) {
        console.error('Script failed:', err);
        process.exit(1);
    }
};

fixRoutes();
