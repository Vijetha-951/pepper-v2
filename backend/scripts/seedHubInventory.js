import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Hub from '../src/models/Hub.js';
import Product from '../src/models/Product.js';
import HubInventory from '../src/models/HubInventory.js';
import connectDB from '../src/config/db.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from backend root
dotenv.config({ path: path.join(__dirname, '../.env') });

async function seedHubInventory() {
    try {
        console.log('Connecting to MongoDB...');
        await connectDB();
        console.log('✅ Connected to MongoDB\n');

        // Get all products
        const products = await Product.find({});
        if (products.length === 0) {
            console.log('❌ No products found. Please run seed.js first to create products.');
            process.exit(1);
        }
        console.log(`📦 Found ${products.length} products\n`);

        // Get all hubs
        const hubs = await Hub.find({ isActive: true });
        if (hubs.length === 0) {
            console.log('❌ No hubs found. Please run seedKeralaHubs.js first to create hubs.');
            process.exit(1);
        }
        console.log(`🏢 Found ${hubs.length} active hubs\n`);

        // Find the main hub (Kottayam Hub)
        const mainHub = hubs.find(h => h.name === 'Kottayam Hub');
        if (!mainHub) {
            console.log('⚠️  Main hub (Kottayam Hub) not found. Using first hub as main hub.');
        }

        let createdCount = 0;
        let updatedCount = 0;
        let skippedCount = 0;

        console.log('========================================');
        console.log('Starting Inventory Seeding...');
        console.log('========================================\n');

        for (const hub of hubs) {
            console.log(`Processing: ${hub.name}...`);
            
            for (const product of products) {
                // Check if inventory already exists
                const existingInventory = await HubInventory.findOne({
                    hub: hub._id,
                    product: product._id
                });

                if (existingInventory) {
                    console.log(`  ℹ️  ${product.name}: Already exists (Qty: ${existingInventory.quantity})`);
                    skippedCount++;
                    continue;
                }

                // Determine initial stock based on hub type
                let initialStock = 0;
                if (hub.name === 'Kottayam Hub' || hub === mainHub) {
                    // Main hub gets larger stock
                    initialStock = Math.floor(Math.random() * 400) + 100; // 100-500 units
                } else {
                    // Regional hubs get smaller stock
                    initialStock = Math.floor(Math.random() * 80) + 20; // 20-100 units
                }

                // Create inventory record
                await HubInventory.create({
                    hub: hub._id,
                    product: product._id,
                    quantity: initialStock,
                    reservedQuantity: 0,
                    reorderLevel: 10,
                    reorderQuantity: 50
                });

                console.log(`  ✅ ${product.name}: Added ${initialStock} units`);
                createdCount++;
            }
            
            console.log(`  ✓ ${hub.name} inventory complete\n`);
        }

        console.log('========================================');
        console.log('✅ Hub Inventory Seeding Complete!');
        console.log('========================================');
        console.log(`Created: ${createdCount} records`);
        console.log(`Skipped: ${skippedCount} records (already exist)`);
        console.log(`Updated: ${updatedCount} records`);
        console.log('========================================\n');

    } catch (error) {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    } finally {
        await mongoose.connection.close();
    }
}

seedHubInventory();
