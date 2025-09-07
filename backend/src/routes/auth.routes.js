import express from 'express';
import asyncHandler from 'express-async-handler';
import admin from '../config/firebase.js';
import { getFirestore } from 'firebase-admin/firestore';
import { requireAuth } from '../middleware/auth.js';

const db = getFirestore();

const router = express.Router();

// ===== Admin-only login via Firebase ID token (Email/Password) =====
router.post(
  '/admin/email-login',
  asyncHandler(async (req, res) => {
    const { idToken } = req.body; // ID token obtained after Firebase email/password sign-in on client
    const ADMIN_EMAIL = 'vj.vijetha01@gmail.com';

    if (!idToken) {
      return res.status(400).json({ success: false, error: 'idToken is required' });
    }

    try {
      const decoded = await admin.auth().verifyIdToken(idToken);
      const email = (decoded.email || '').toLowerCase();

      // Restrict to exact admin email
      if (email !== ADMIN_EMAIL) {
        return res.status(403).json({ success: false, error: 'Admin access denied' });
      }

      // Enforce email/password provider for this route
      const provider = decoded.firebase?.sign_in_provider;
      if (provider !== 'password') {
        return res.status(403).json({ success: false, error: 'Use email/password to login here' });
      }

      // Make sure Firestore has role=admin entry for this uid
      await db.collection('users').doc(decoded.uid).set(
        { uid: decoded.uid, email, role: 'admin', provider },
        { merge: true }
      );

      // Optionally ensure custom claims (non-blocking)
      try { await admin.auth().setCustomUserClaims(decoded.uid, { role: 'admin' }); } catch {}

      return res.json({ success: true, role: 'admin', redirectPath: '/admin/dashboard' });
    } catch (err) {
      console.error('Admin email-login failed:', err);
      return res.status(401).json({ success: false, error: 'Invalid token' });
    }
  })
);

// ===== Google Sign-In with role-based redirect =====
router.post(
  '/google-login',
  asyncHandler(async (req, res) => {
    const { idToken } = req.body; // ID token from Firebase Google sign-in
    const ADMIN_EMAIL = 'vj.vijetha01@gmail.com';

    if (!idToken) {
      return res.status(400).json({ success: false, error: 'idToken is required' });
    }

    try {
      const decoded = await admin.auth().verifyIdToken(idToken);
      const isGoogle = decoded.firebase?.sign_in_provider === 'google.com';
      const email = (decoded.email || '').toLowerCase();
      if (!isGoogle) return res.status(403).json({ success: false, error: 'Only Google sign-in allowed here' });

      // Role resolution priority
      let role = null;
      if (email === ADMIN_EMAIL) {
        // Admin allowed to sign in with Google too
        role = 'admin';
        try { await admin.auth().setCustomUserClaims(decoded.uid, { role: 'admin' }); } catch {}
      } else {
        // Users and deliveryboys must already exist in Firestore
        const doc = await db.collection('users').doc(decoded.uid).get();
        if (doc.exists && doc.data()?.role) role = String(doc.data().role);
        if (!role) {
          const snap = await db.collection('users').where('email', '==', email).limit(1).get();
          if (!snap.empty) role = String(snap.docs[0].data().role || '');
        }
      }

      if (!role) {
        return res.status(403).json({ success: false, error: 'Unauthorized or unregistered email' });
      }

      // Ensure Firestore has the user entry (merge)
      await db.collection('users').doc(decoded.uid).set(
        { uid: decoded.uid, email, role, provider: 'google.com' },
        { merge: true }
      );

      let redirectPath = '/user/dashboard';
      if (role === 'admin') redirectPath = '/admin/dashboard';
      else if (role === 'deliveryboy') redirectPath = '/deliveryboy/dashboard';

      return res.json({ success: true, role, redirectPath });
    } catch (err) {
      console.error('Google login failed:', err);
      return res.status(401).json({ success: false, error: 'Invalid token' });
    }
  })
);

// ===== Normal login via Firebase (email/password) with role-based redirect =====
router.post(
  '/email-login',
  asyncHandler(async (req, res) => {
    const { idToken } = req.body; // ID token from Firebase email/password sign-in
    if (!idToken) return res.status(400).json({ success: false, error: 'idToken is required' });

    try {
      const decoded = await admin.auth().verifyIdToken(idToken);
      const email = (decoded.email || '').toLowerCase();

      // Enforce email/password provider
      const provider = decoded.firebase?.sign_in_provider;
      if (provider !== 'password') {
        return res.status(403).json({ success: false, error: 'Use email/password to login here' });
      }

      // Check Firestore for role by uid first, then by email
      let role = null;
      const doc = await db.collection('users').doc(decoded.uid).get();
      if (doc.exists && doc.data()?.role) role = String(doc.data().role);
      if (!role) {
        const snap = await db.collection('users').where('email', '==', email).limit(1).get();
        if (!snap.empty) role = String(snap.docs[0].data().role || '');
      }

      // Admin email always maps to admin
      if (email === 'vj.vijetha01@gmail.com') role = 'admin';

      if (!role) {
        return res.status(403).json({ success: false, error: 'Role not assigned in Firestore' });
      }

      // Persist/merge minimal user record in Firestore
      await db.collection('users').doc(decoded.uid).set(
        { uid: decoded.uid, email, role, provider },
        { merge: true }
      );

      let redirectPath = '/user/dashboard';
      if (role === 'admin') redirectPath = '/admin/dashboard';
      else if (role === 'deliveryboy') redirectPath = '/deliveryboy/dashboard';

      return res.json({ success: true, role, redirectPath });
    } catch (err) {
      console.error('Email login failed:', err);
      return res.status(401).json({ success: false, error: 'Invalid token' });
    }
  })
);

// ===== Determine redirect after login based on role =====
router.get(
  '/route-after-login',
  requireAuth,
  asyncHandler(async (req, res) => {
    const role = req.userRole;
    let redirectPath = '/';
    if (role === 'admin') redirectPath = '/admin/dashboard';
    else if (role === 'deliveryboy') redirectPath = '/deliveryboy/dashboard';
    else redirectPath = '/user/dashboard';

    res.json({ success: true, role, redirectPath });
  })
);

// ===== Get current user profile =====
router.get(
  '/profile',
  requireAuth,
  asyncHandler(async (req, res) => {
    res.json({
      success: true,
      user: {
        id: req.user._id,
        firebaseUid: req.user.firebaseUid,
        email: req.user.email,
        firstName: req.user.firstName,
        lastName: req.user.lastName,
        phone: req.user.phone,
        role: req.user.role,
        place: req.user.place,
        district: req.user.district,
        pincode: req.user.pincode,
        provider: req.user.provider,
        profilePicture: req.user.profilePicture,
        isActive: req.user.isActive,
        createdAt: req.user.createdAt,
        updatedAt: req.user.updatedAt
      }
    });
  })
);

// ===== Update user profile =====
router.put(
  '/profile',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { firstName, lastName, phone, place, district, pincode } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { firstName, lastName, phone, place, district, pincode },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        firebaseUid: user.firebaseUid,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        role: user.role,
        place: user.place,
        district: user.district,
        pincode: user.pincode,
        provider: user.provider,
        profilePicture: user.profilePicture,
        isActive: user.isActive
      }
    });
  })
);

// ===== Set user role (admin only) =====
router.put(
  '/set-role',
  requireAuth,
  asyncHandler(async (req, res) => {
    if (req.userRole !== 'admin') {
      return res.status(403).json({ success: false, error: 'Admin access required' });
    }

    const { userId, role } = req.body;
    if (!userId || !role || !['user', 'admin', 'deliveryboy'].includes(role)) {
      return res.status(400).json({ success: false, error: 'Valid userId and role (user/admin/deliveryboy) are required' });
    }

    const user = await User.findByIdAndUpdate(userId, { role }, { new: true });
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });

    try {
      await admin.auth().setCustomUserClaims(user.firebaseUid, { role });
    } catch (error) {
      console.error('Failed to update Firebase custom claims:', error);
    }

    res.json({
      success: true,
      message: 'User role updated successfully',
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      }
    });
  })
);

// ===== Get all users (admin only) =====
router.get(
  '/users',
  requireAuth,
  asyncHandler(async (req, res) => {
    if (req.userRole !== 'admin') {
      return res.status(403).json({ success: false, error: 'Admin access required' });
    }

    const { page = 1, limit = 10, search = '' } = req.query;
    const skip = (page - 1) * limit;

    const searchQuery = search ? {
      $or: [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ]
    } : {};

    const users = await User.find(searchQuery)
      .select('-__v')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(searchQuery);

    res.json({
      success: true,
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  })
);

// ===== Deactivate user (admin only) =====
router.put(
  '/deactivate/:userId',
  requireAuth,
  asyncHandler(async (req, res) => {
    if (req.userRole !== 'admin') {
      return res.status(403).json({ success: false, error: 'Admin access required' });
    }

    const user = await User.findByIdAndUpdate(req.params.userId, { isActive: false }, { new: true });
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });

    try {
      await admin.auth().updateUser(user.firebaseUid, { disabled: true });
    } catch (error) {
      console.error('Failed to disable Firebase user:', error);
    }

    res.json({ success: true, message: 'User deactivated successfully' });
  })
);

export default router;
