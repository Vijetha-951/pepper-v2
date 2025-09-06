// routes/auth.js - Register and session login
const express = require('express');
const admin = require('../firebaseAdmin');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const { registerSchema, validate } = require('../validation/authSchemas');

const router = express.Router();
const db = getFirestore();

// Register: validate inputs, create Firebase user, mirror profile in Firestore
router.post('/register', validate(registerSchema), async (req, res) => {
  const data = req.validated;
  try {
    const userRecord = await admin.auth().createUser({
      email: data.email,
      password: data.password,
      displayName: `${data.firstName} ${data.lastName}`,
      emailVerified: false,
      disabled: false
    });

    await admin.auth().setCustomUserClaims(userRecord.uid, { role: data.role || 'user' });

    await db.collection('users').doc(userRecord.uid).set({
      uid: userRecord.uid,
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      role: data.role || 'user',
      place: data.place,
      district: data.district,
      pincode: data.pincode,
      provider: 'email',
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    });

    res.status(201).json({ success: true, uid: userRecord.uid, message: 'Registration successful' });
  } catch (e) {
    res.status(400).json({ success: false, error: e.message });
  }
});

// Create session cookie after client Firebase login
router.post('/sessionLogin', async (req, res) => {
  const { idToken } = req.body;
  const days = Number(process.env.SESSION_MAX_DAYS || 5);
  const expiresIn = days * 24 * 60 * 60 * 1000;

  try {
    const decoded = await admin.auth().verifyIdToken(idToken);
    const sessionCookie = await admin.auth().createSessionCookie(idToken, { expiresIn });

    res.cookie('session', sessionCookie, {
      maxAge: expiresIn,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/'
    });

    res.json({ success: true, uid: decoded.uid });
  } catch {
    res.status(401).json({ success: false, error: 'Invalid token' });
  }
});

// Logout: clear cookie
router.post('/logout', (req, res) => {
  res.clearCookie('session', { path: '/' });
  res.json({ success: true });
});

module.exports = router; 