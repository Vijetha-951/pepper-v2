
import mongoose from 'mongoose';
import User from '../src/models/User.js';
import Hub from '../src/models/Hub.js';
import connectDB from '../src/config/db.js';
import admin from 'firebase-admin';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from backend root (one level up from scripts/)
dotenv.config({ path: path.join(__dirname, '../.env') });

const serviceAccountKey = {
    type: 'service_account',
    project_id: process.env.FIREBASE_PROJECT_ID,
    private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
    private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    client_id: process.env.FIREBASE_CLIENT_ID,
    auth_uri: 'https://accounts.google.com/o/oauth2/auth',
    token_uri: 'https://oauth2.googleapis.com/token',
};

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccountKey),
    });
}

const auth = admin.auth();

const districts = [
    'Thiruvananthapuram',
    'Kollam',
    'Pathanamthitta',
    'Alappuzha',
    'Kottayam',
    'Idukki',
    'Ernakulam',
    'Thrissur',
    'Palakkad',
    'Malappuram',
    'Kozhikode',
    'Wayanad',
    'Kannur',
    'Kasaragod',
];

async function seedKeralaHubs() {
    try {
        console.log('Connecting to MongoDB...');
        await connectDB();
        console.log('✅ Connected to MongoDB');

        for (const district of districts) {
            console.log(`\nProcessing district: ${district}...`);

            const hubName = `${district} Hub`;
            const email = `hub.${district.toLowerCase().replace(/\s+/g, '')}@pepper.local`;
            const password = `${district}@123`; // Generating a predictable password

            // 1. Create or Find Hub
            let hub = await Hub.findOne({ name: hubName });
            if (!hub) {
                hub = await Hub.create({
                    name: hubName,
                    type: 'REGIONAL_HUB', // Assuming district hubs are regional
                    location: {
                        address: `${district} Center`,
                        city: district,
                        state: 'Kerala',
                        pincode: '600000', // Placeholder pincode
                    },
                    coverage: { districts: [district] },
                    isActive: true,
                });
                console.log(`✅ Created Hub: ${hubName}`);
            } else {
                console.log(`ℹ️ Hub already exists: ${hubName}`);
            }

            // 2. Create Firebase User
            let firebaseUser;
            try {
                firebaseUser = await auth.getUserByEmail(email);
                console.log(`ℹ️ Firebase user exists: ${email}`);
            } catch (error) {
                if (error.code === 'auth/user-not-found') {
                    firebaseUser = await auth.createUser({
                        email,
                        password,
                        displayName: `${district} Hub Manager`,
                    });
                    console.log(`✅ Created Firebase user: ${email}`);
                } else {
                    throw error;
                }
            }

            // 3. Create MongoDB User
            let dbUser = await User.findOne({ firebaseUid: firebaseUser.uid });
            if (!dbUser) {
                dbUser = await User.create({
                    firebaseUid: firebaseUser.uid,
                    email,
                    firstName: district,
                    lastName: 'Hub Manager',
                    role: 'hubmanager',
                    phone: '9876543210',
                    isActive: true,
                    hubId: hub._id
                });
                console.log(`✅ Created MongoDB user: ${dbUser._id}`);
            } else {
                if (dbUser.role !== 'hubmanager' || !dbUser.hubId) {
                    dbUser.role = 'hubmanager';
                    dbUser.hubId = hub._id;
                    await dbUser.save();
                    console.log(`✅ Updated MongoDB user role/hubId`);
                }
                console.log(`ℹ️ MongoDB user exists: ${dbUser._id}`);
            }

            // 4. Assign Manager to Hub
            if (!hub.managedBy.includes(dbUser._id)) {
                hub.managedBy.push(dbUser._id);
                await hub.save();
                console.log(`✅ Assigned manager to hub: ${hubName}`);
            }
        }

        console.log('\n========================================');
        console.log('✅ Kerala Hubs Seeding Complete!');
        console.log('========================================');
        console.log('Default Password format: {DistrictName}@123');

    } catch (error) {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    } finally {
        await mongoose.connection.close();
    }
}

seedKeralaHubs();
