import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Product from '../src/models/Product.js';
import connectDB from '../src/config/db.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from backend root
dotenv.config({ path: path.join(__dirname, '../.env') });

async function migrateProductStock() {
    try {
        console.log('Connecting to MongoDB...');
        await connectDB();
        console.log('✅ Connected to MongoDB\n');

        // Get all products
        const products = await Product.find({});
        console.log(`📦 Found ${products.length} products\n`);

        if (products.length === 0) {
            console.log('❌ No products found. Please run seed.js first to create products.');
            process.exit(1);
        }

        let updatedCount = 0;
        let skippedCount = 0;

        console.log('========================================');
        console.log('Starting Product Stock Migration...');
        console.log('========================================\n');

        for (const product of products) {
            // Check if product already has total_stock and available_stock set correctly
            const needsUpdate = (
                product.total_stock === undefined || 
                product.total_stock === 0 ||
                product.available_stock === undefined ||
                product.available_stock === 0
            );

            if (!needsUpdate && product.total_stock > 0) {
                console.log(`  ℹ️  ${product.name}: Already migrated (Stock: ${product.available_stock}/${product.total_stock})`);
                skippedCount++;
                continue;
            }

            // Set total_stock and available_stock from stock field
            const stockValue = product.stock || 0;
            product.total_stock = stockValue;
            product.available_stock = stockValue;
            
            await product.save();
            
            console.log(`  ✅ ${product.name}: Updated stock fields (${stockValue} units)`);
            updatedCount++;
        }

        console.log('\n========================================');
        console.log('✅ Product Stock Migration Complete!');
        console.log('========================================');
        console.log(`Updated: ${updatedCount} products`);
        console.log(`Skipped: ${skippedCount} products (already migrated)`);
        console.log('========================================\n');

        console.log('Your Stock Management page should now show data!');

    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    } finally {
        await mongoose.connection.close();
    }
}

migrateProductStock();
