import express from 'express';
import asyncHandler from 'express-async-handler';
import admin from '../config/firebase.js';
import { getFirestore } from 'firebase-admin/firestore';
import { requireAuth } from '../middleware/auth.js';
import { validateMeaningfulEmailMiddleware } from '../middleware/emailValidation.js';
import User from '../models/User.js'; // ✅ Added missing import

const db = getFirestore();
const router = express.Router();

// ===== Sync Firebase user into MongoDB profile (idempotent) =====
router.post(
  '/sync-profile',
  requireAuth,
  validateMeaningfulEmailMiddleware,
  asyncHandler(async (req, res) => {
    // req.user and req.firebaseUid populated by requireAuth
    const { uid, email, role, provider } = {
      uid: req.firebaseUid,
      email: req.user?.email,
      role: req.userRole,
      provider: req.user?.provider || 'firebase',
    };

    const { firstName = '', lastName = '', phone = '', place = '', district = '', pincode = '' } = req.body?.profile || {};

    // Check if user exists first
    let user = await User.findOne({ firebaseUid: uid });
    
    if (user) {
      // Update existing user (don't change isActive status)
      user = await User.findOneAndUpdate(
        { firebaseUid: uid },
        {
          email,
          role,
          provider,
          ...(firstName ? { firstName } : {}),
          ...(lastName ? { lastName } : {}),
          ...(phone ? { phone } : {}),
          ...(place ? { place } : {}),
          ...(district ? { district } : {}),
          ...(pincode ? { pincode } : {}),
        },
        { new: true }
      );
    } else {
      // Create new user with pending status (null isActive)
      user = await User.create({
        firebaseUid: uid,
        email,
        role,
        provider,
        firstName: firstName || '',
        lastName: lastName || '',
        phone: phone || '',
        place: place || '',
        district: district || '',
        pincode: pincode || '',
        isActive: null, // Pending approval
      });
    }

    return res.json({ success: true, user });
  })
);

// ===== Admin-only login via Firebase ID token (Email/Password) =====
router.post(
  '/admin/email-login',
  asyncHandler(async (req, res) => {
    const { idToken } = req.body;
    const ADMIN_EMAIL = 'vj.vijetha01@gmail.com';

    if (!idToken) {
      return res.status(400).json({ success: false, error: 'idToken is required' });
    }

    try {
      const decoded = await admin.auth().verifyIdToken(idToken);
      const email = (decoded.email || '').toLowerCase();

      if (email !== ADMIN_EMAIL) {
        return res.status(403).json({ success: false, error: 'Admin access denied' });
      }

      const provider = decoded.firebase?.sign_in_provider;
      if (provider !== 'password') {
        return res.status(403).json({ success: false, error: 'Use email/password to login here' });
      }

      await db.collection('users').doc(decoded.uid).set(
        { uid: decoded.uid, email, role: 'admin', provider },
        { merge: true }
      );

      try {
        await admin.auth().setCustomUserClaims(decoded.uid, { role: 'admin' });
      } catch (err) {
        console.error('Failed to set custom claims for admin:', err);
      }

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
    const { idToken } = req.body;
    const ADMIN_EMAIL = 'vj.vijetha01@gmail.com';

    if (!idToken) {
      return res.status(400).json({ success: false, error: 'idToken is required' });
    }

    try {
      const decoded = await admin.auth().verifyIdToken(idToken);
      const isGoogle = decoded.firebase?.sign_in_provider === 'google.com';
      const email = (decoded.email || '').toLowerCase();
      if (!isGoogle) return res.status(403).json({ success: false, error: 'Only Google sign-in allowed here' });

      let role = null;
      if (email === ADMIN_EMAIL) {
        role = 'admin';
        try {
          await admin.auth().setCustomUserClaims(decoded.uid, { role: 'admin' });
        } catch (err) {
          console.error('Failed to set admin custom claims for Google login:', err);
        }
      } else {
        // STRICT: Non-admin emails can NEVER get admin role
        const doc = await db.collection('users').doc(decoded.uid).get();
        if (doc.exists && doc.data()?.role) {
          const firestoreRole = String(doc.data().role);
          role = firestoreRole === 'admin' ? 'user' : firestoreRole; // Block unauthorized admin
        }
        if (!role) {
          const snap = await db.collection('users').where('email', '==', email).limit(1).get();
          if (!snap.empty) {
            const firestoreRole = String(snap.docs[0].data().role || '');
            role = firestoreRole === 'admin' ? 'user' : firestoreRole; // Block unauthorized admin
          }
        }
        if (!role) role = 'user'; // Default to user for authenticated users
      }

      if (!role) {
        return res.status(403).json({ success: false, error: 'Unauthorized or unregistered email' });
      }

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
    const { idToken } = req.body;
    if (!idToken) return res.status(400).json({ success: false, error: 'idToken is required' });

    try {
      const decoded = await admin.auth().verifyIdToken(idToken);
      const email = (decoded.email || '').toLowerCase();
      const provider = decoded.firebase?.sign_in_provider;
      if (provider !== 'password') {
        return res.status(403).json({ success: false, error: 'Use email/password to login here' });
      }

      let role = null;
      
      // STRICT ADMIN CHECK: Only vj.vijetha01@gmail.com can be admin
      if (email === 'vj.vijetha01@gmail.com') {
        role = 'admin';
      } else {
        // For other users, get role but NEVER allow admin
        const doc = await db.collection('users').doc(decoded.uid).get();
        if (doc.exists && doc.data()?.role) {
          const firestoreRole = String(doc.data().role);
          role = firestoreRole === 'admin' ? 'user' : firestoreRole; // Block unauthorized admin
        }
        if (!role) {
          const snap = await db.collection('users').where('email', '==', email).limit(1).get();
          if (!snap.empty) {
            const firestoreRole = String(snap.docs[0].data().role || '');
            role = firestoreRole === 'admin' ? 'user' : firestoreRole; // Block unauthorized admin
          }
        }
        if (!role) role = 'user'; // Default to user for authenticated users
      }

      if (!role) return res.status(403).json({ success: false, error: 'Role not assigned in Firestore' });

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
    // Get the most up-to-date user info from MongoDB (not just req.user)
    try {
      const mongoUser = await User.findOne({ 
        $or: [
          { firebaseUid: req.firebaseUid },
          { email: req.user.email }
        ]
      }).select('-__v');

      if (mongoUser) {
        // Return the MongoDB user data which has the latest role
        res.json({ 
          success: true, 
          user: {
            ...req.user,
            ...mongoUser.toObject(),
            uid: req.user.uid,
            firebaseUid: req.firebaseUid
          }
        });
      } else {
        // Fallback to req.user if no MongoDB record
        res.json({ success: true, user: req.user });
      }
    } catch (error) {
      console.error('Profile fetch error:', error);
      // Fallback to req.user on error
      res.json({ success: true, user: req.user });
    }
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

    if (!user) return res.status(404).json({ success: false, error: 'User not found' });

    res.json({ success: true, message: 'Profile updated successfully', user });
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
      return res
        .status(400)
        .json({ success: false, error: 'Valid userId and role (user/admin/deliveryboy) are required' });
    }

    const user = await User.findByIdAndUpdate(userId, { role }, { new: true });
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });

    try {
      await admin.auth().setCustomUserClaims(user.firebaseUid, { role });
    } catch (err) {
      console.error('Failed to update Firebase custom claims:', err);
    }

    res.json({ success: true, message: 'User role updated successfully', user });
  })
);

// ===== Get all users (admin only) =====
router.get(
  '/users',
  requireAuth,
  asyncHandler(async (req, res) => {
    if (req.userRole !== 'admin') return res.status(403).json({ success: false, error: 'Admin access required' });

    const { page = 1, limit = 10, search = '' } = req.query;
    const skip = (page - 1) * limit;

    const searchQuery = search
      ? {
          $or: [
            { firstName: { $regex: search, $options: 'i' } },
            { lastName: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } },
          ],
        }
      : {};

    const users = await User.find(searchQuery).select('-__v').sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit));
    const total = await User.countDocuments(searchQuery);

    res.json({ success: true, users, pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) } });
  })
);

// ===== Deactivate user (admin only) =====
router.put(
  '/deactivate/:userId',
  requireAuth,
  asyncHandler(async (req, res) => {
    if (req.userRole !== 'admin') return res.status(403).json({ success: false, error: 'Admin access required' });

    const user = await User.findByIdAndUpdate(req.params.userId, { isActive: false }, { new: true });
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });

    try {
      await admin.auth().updateUser(user.firebaseUid, { disabled: true });
    } catch (err) {
      console.error('Failed to disable Firebase user:', err);
    }

    res.json({ success: true, message: 'User deactivated successfully' });
  })
);

export default router;
