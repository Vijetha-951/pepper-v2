// Sync all Firestore users into MongoDB Users collection so admin routes can act on Mongo _id
// - Upserts by firebaseUid
// - Preserves existing fields, sets minimal defaults when missing

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import admin from '../src/config/firebase.js';
import connectDB from '../src/config/db.js';
import User from '../src/models/User.js';
import { getFirestore } from 'firebase-admin/firestore';

dotenv.config();

async function run() {
  try {
    await connectDB();
    const db = getFirestore();

    const snap = await db.collection('users').get();
    console.log(`Found ${snap.size} Firestore user docs`);

    let upserts = 0;
    for (const doc of snap.docs) {
      const data = doc.data() || {};
      const uid = String(data.uid || doc.id || '').trim();
      const email = String(data.email || '').toLowerCase();
      if (!uid || !email) {
        console.warn(`Skipping doc ${doc.id} due to missing uid/email`);
        continue;
      }

      const firstName = String(data.firstName || '').trim();
      const lastName = String(data.lastName || '').trim();
      const phone = String(data.phone || '').trim();
      const role = String(data.role || 'user');
      const place = String(data.place || '').trim();
      const district = String(data.district || '').trim();
      const pincode = String(data.pincode || '').trim();

      await User.findOneAndUpdate(
        { firebaseUid: uid },
        {
          firebaseUid: uid,
          email,
          role,
          provider: data.provider || 'firebase',
          ...(firstName ? { firstName } : { firstName: '' }),
          ...(lastName ? { lastName } : { lastName: '' }),
          ...(phone ? { phone } : {}),
          ...(place ? { place } : {}),
          ...(district ? { district } : {}),
          ...(pincode ? { pincode } : {}),
          isActive: data.isActive !== undefined ? !!data.isActive : true,
        },
        { new: true, upsert: true, setDefaultsOnInsert: true }
      );
      upserts += 1;
    }

    console.log(`Upserted ${upserts} users into MongoDB`);
  } catch (err) {
    console.error('Sync failed:', err);
  } finally {
    await mongoose.connection.close().catch(() => {});
    process.exit(0);
  }
}

run();