
import mongoose from 'mongoose';
import User from '../src/models/User.js';
import connectDB from '../src/config/db.js';
import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

const db = getFirestore();
const auth = admin.auth();

async function fixHubManagerRoles() {
    try {
        console.log('Connecting to MongoDB...');
        await connectDB();
        console.log('✅ Connected to MongoDB');

        const hubManagers = await User.find({ role: 'hubmanager' });
        console.log(`Found ${hubManagers.length} Hub Managers in MongoDB.`);

        for (const user of hubManagers) {
            console.log(`\nProcessing ${user.email} (${user.firebaseUid})...`);

            // 1. Set Custom Claims
            try {
                await auth.setCustomUserClaims(user.firebaseUid, { role: 'hubmanager' });
                console.log('✅ Set Firebase Custom Claims');
            } catch (e) {
                console.error('❌ Failed to set custom claims:', e.message);
            }

            // 2. Set Firestore Document
            try {
                await db.collection('users').doc(user.firebaseUid).set({
                    uid: user.firebaseUid,
                    email: user.email,
                    role: 'hubmanager',
                    firstName: user.firstName,
                    lastName: user.lastName,
                    provider: 'firebase' // Assuming email/password
                }, { merge: true });
                console.log('✅ Synced to Firestore users collection');
            } catch (e) {
                console.error('❌ Failed to sync to Firestore:', e.message);
            }
        }

        console.log('\n✅ Role Fix Complete!');
    } catch (error) {
        console.error('❌ Script failed:', error);
        process.exit(1);
    } finally {
        await mongoose.connection.close();
    }
}

fixHubManagerRoles();
