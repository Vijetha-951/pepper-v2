import mongoose from 'mongoose';
import admin from '../config/firebase.js';
import User from '../models/User.js';

// Load environment variables from root .env
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const backendDir = resolve(__dirname, '../..');
dotenv.config({ path: resolve(backendDir, '.env') });

const COMMON_HUBMANAGER_EMAIL = 'hubmanager@pepper.com';
const COMMON_HUBMANAGER_PASSWORD = 'pepper123';

async function setupCommonHubManager() {
    try {
        // Connect to MongoDB
        const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/pepper';
        await mongoose.connect(mongoUri);
        console.log('✅ Connected to MongoDB');

        let firebaseUid;
        
        // Check if Firebase user already exists
        try {
            const existingUser = await admin.auth().getUserByEmail(COMMON_HUBMANAGER_EMAIL);
            firebaseUid = existingUser.uid;
            console.log('✅ Firebase user already exists:', firebaseUid);
        } catch (error) {
            // Create Firebase user if doesn't exist
            if (error.code === 'auth/user-not-found') {
                const firebaseUser = await admin.auth().createUser({
                    email: COMMON_HUBMANAGER_EMAIL,
                    password: COMMON_HUBMANAGER_PASSWORD,
                    displayName: 'Hub Manager',
                    emailVerified: true
                });
                firebaseUid = firebaseUser.uid;
                console.log('✅ Created new Firebase user:', firebaseUid);
            } else {
                throw error;
            }
        }

        // Check if MongoDB user already exists
        let mongoUser = await User.findOne({ firebaseUid });
        
        if (mongoUser) {
            // Update existing user
            mongoUser.email = COMMON_HUBMANAGER_EMAIL;
            mongoUser.role = 'hubmanager';
            mongoUser.firstName = 'Hub';
            mongoUser.lastName = 'Manager';
            mongoUser.isActive = true;
            mongoUser.hubId = undefined; // No specific hub assigned
            await mongoUser.save();
            console.log('✅ Updated existing MongoDB user');
        } else {
            // Create new MongoDB user
            mongoUser = await User.create({
                firebaseUid,
                email: COMMON_HUBMANAGER_EMAIL,
                role: 'hubmanager',
                firstName: 'Hub',
                lastName: 'Manager',
                phone: '0000000000',
                place: 'All Districts',
                district: 'All',
                pincode: '000000',
                isActive: true,
                provider: 'firebase'
                // hubId is intentionally not set - common account for all districts
            });
            console.log('✅ Created new MongoDB user');
        }

        // Update Firestore user document
        const db = admin.firestore();
        const userDocRef = db.collection('users').doc(firebaseUid);
        const userDoc = await userDocRef.get();

        const firestoreData = {
            uid: firebaseUid,
            email: COMMON_HUBMANAGER_EMAIL,
            role: 'hubmanager',
            firstName: 'Hub',
            lastName: 'Manager',
            displayName: 'Hub Manager',
            isActive: true,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        };

        if (!userDoc.exists) {
            firestoreData.createdAt = admin.firestore.FieldValue.serverTimestamp();
            await userDocRef.set(firestoreData);
            console.log('✅ Created new Firestore user document');
        } else {
            await userDocRef.update(firestoreData);
            console.log('✅ Updated existing Firestore user document');
        }

        console.log('\n📋 Common Hub Manager Account Details:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`Email: ${COMMON_HUBMANAGER_EMAIL}`);
        console.log(`Password: ${COMMON_HUBMANAGER_PASSWORD}`);
        console.log(`Role: ${mongoUser.role}`);
        console.log(`Active: ${mongoUser.isActive}`);
        console.log(`Hub Assigned: No (Common account)`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('\n✅ Setup completed successfully!');
        console.log('\n📌 Usage:');
        console.log('   1. Login with the above credentials');
        console.log('   2. Select your district from the dashboard');
        console.log('   3. Manage orders for the selected district');

    } catch (error) {
        console.error('❌ Error setting up common hub manager:', error);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
        console.log('\n✅ Disconnected from MongoDB');
        process.exit(0);
    }
}

setupCommonHubManager();
