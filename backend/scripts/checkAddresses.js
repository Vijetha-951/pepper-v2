import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

// Import User model
import User from '../src/models/User.js';

async function checkAddresses() {
  try {
    console.log('🔍 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get all users
    const users = await User.find({});
    console.log(`📊 Total users in database: ${users.length}\n`);

    if (users.length === 0) {
      console.log('⚠️  No users found in database!');
      return;
    }

    // Check each user for address data
    users.forEach((user, index) => {
      console.log(`\n👤 User ${index + 1}:`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Name: ${user.firstName} ${user.lastName}`);
      console.log(`   Firebase UID: ${user.firebaseUid}`);
      
      console.log(`\n   📍 Legacy Address Fields:`);
      console.log(`      Place: ${user.place || '(empty)'}`);
      console.log(`      District: ${user.district || '(empty)'}`);
      console.log(`      Pincode: ${user.pincode || '(empty)'}`);
      console.log(`      Phone: ${user.phone || '(empty)'}`);
      
      console.log(`\n   📍 Primary Structured Address:`);
      if (user.address) {
        console.log(`      Line 1: ${user.address.line1 || '(empty)'}`);
        console.log(`      Line 2: ${user.address.line2 || '(empty)'}`);
        console.log(`      District: ${user.address.district || '(empty)'}`);
        console.log(`      State: ${user.address.state || '(empty)'}`);
        console.log(`      Pincode: ${user.address.pincode || '(empty)'}`);
      } else {
        console.log(`      (No structured address)`);
      }
      
      console.log(`\n   📍 Address Book (${user.addresses?.length || 0} addresses):`);
      if (user.addresses && user.addresses.length > 0) {
        user.addresses.forEach((addr, i) => {
          console.log(`      Address ${i + 1} (ID: ${addr._id}):`);
          console.log(`         Line 1: ${addr.line1 || '(empty)'}`);
          console.log(`         Line 2: ${addr.line2 || '(empty)'}`);
          console.log(`         District: ${addr.district || '(empty)'}`);
          console.log(`         State: ${addr.state || '(empty)'}`);
          console.log(`         Pincode: ${addr.pincode || '(empty)'}`);
          console.log(`         Phone: ${addr.phone || '(empty)'}`);
        });
      } else {
        console.log(`      (No saved addresses)`);
      }
      
      console.log(`\n   ⏰ Created: ${user.createdAt}`);
      console.log(`   ⏰ Updated: ${user.updatedAt}`);
      console.log(`   ${'='.repeat(60)}`);
    });

    console.log('\n\n📋 Summary:');
    const usersWithLegacyAddress = users.filter(u => u.place || u.district || u.pincode);
    const usersWithStructuredAddress = users.filter(u => u.address);
    const usersWithAddressBook = users.filter(u => u.addresses && u.addresses.length > 0);
    
    console.log(`   Users with legacy address fields: ${usersWithLegacyAddress.length}`);
    console.log(`   Users with structured address: ${usersWithStructuredAddress.length}`);
    console.log(`   Users with address book entries: ${usersWithAddressBook.length}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
  }
}

checkAddresses();