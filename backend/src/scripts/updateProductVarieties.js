// Update existing products with variety information
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load env from backend root
dotenv.config({ path: join(__dirname, '../../.env') });

const productSchema = new mongoose.Schema({}, { strict: false });
const Product = mongoose.model('Product', productSchema);

async function updateProductVarieties() {
  try {
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/pepper_db';
    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✓ Connected to MongoDB\n');

    // Map product names to varieties (adjust based on your actual products)
    const varietyMapping = {
      'Panniyur 1': 'Panniyur 1',
      'Panniyur 5': 'Panniyur 5',
      'Karimunda': 'Karimunda',
      'Subhakara': 'Subhakara',
      'Pournami': 'Pournami',
      'IISR Shakthi': 'IISR Shakthi',
      'IISR Thevam': 'IISR Thevam',
      'Sreekara': 'Sreekara'
    };

    console.log('\nUpdating products with variety information...\n');

    const products = await Product.find({});
    console.log(`Found ${products.length} products\n`);

    let updated = 0;
    let skipped = 0;

    for (const product of products) {
      // Try to match product name with variety
      let variety = 'Karimunda'; // Default variety

      for (const [key, value] of Object.entries(varietyMapping)) {
        if (product.name && product.name.toLowerCase().includes(key.toLowerCase())) {
          variety = value;
          break;
        }
      }

      // Update the product
      await Product.updateOne(
        { _id: product._id },
        { $set: { variety: variety } }
      );

      console.log(`✓ Updated: ${product.name} → ${variety}`);
      updated++;
    }

    console.log(`\n${'='.repeat(60)}`);
    console.log(`Migration Complete!`);
    console.log(`${'='.repeat(60)}`);
    console.log(`Updated: ${updated} products`);
    console.log(`Skipped: ${skipped} products`);
    console.log(`Total: ${products.length} products\n`);

    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

updateProductVarieties();
