import mongoose from 'mongoose';
import { config } from 'dotenv';
import admin from '../config/firebase.js';
import User from '../models/User.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
config({ path: path.join(__dirname, '../../.env') });

const db = admin.firestore();

const syncUsers = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const users = await User.find({});
        console.log(`Syncing ${users.length} users to Firestore...`);

        for (const user of users) {
            if (!user.firebaseUid) {
                console.log(`Skipping ${user.email} (No Firebase UID)`);
                continue;
            }

            try {
                await db.collection('users').doc(user.firebaseUid).set({
                    role: user.role,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    isApproved: true,
                    updatedAt: new Date()
                }, { merge: true });

                // Also set Custom Claims for immediate effect
                await admin.auth().setCustomUserClaims(user.firebaseUid, { role: user.role });

                console.log(`✅ Synced ${user.email} -> ${user.role}`);
            } catch (err) {
                console.error(`❌ Failed to sync ${user.email}:`, err.message);
            }
        }

        console.log('Done!');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

syncUsers();
