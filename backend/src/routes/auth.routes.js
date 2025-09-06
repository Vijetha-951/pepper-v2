import express from 'express';
import asyncHandler from 'express-async-handler';
import admin from '../config/firebase.js';
import User from '../models/User.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// ===== Sync user profile from Firebase to MongoDB =====
router.post(
  '/sync-profile',
  asyncHandler(async (req, res) => {
    const { idToken, additionalInfo } = req.body;

    if (!idToken) {
      return res.status(400).json({ 
        success: false, 
        error: 'Firebase ID token is required' 
      });
    }

    try {
      // Verify Firebase ID token
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      const firebaseUser = await admin.auth().getUser(decodedToken.uid);

      // Check if user already exists in MongoDB
      let user = await User.findOne({ firebaseUid: decodedToken.uid });

      if (user) {
        // Update existing user
        user.email = decodedToken.email || firebaseUser.email;
        user.firstName = firebaseUser.displayName?.split(' ')[0] || user.firstName;
        user.lastName = firebaseUser.displayName?.split(' ').slice(1).join(' ') || user.lastName;
        user.provider = decodedToken.firebase.sign_in_provider || 'firebase';
        user.profilePicture = firebaseUser.photoURL || user.profilePicture;

        // Update role from Firebase claims only (trust backend)
        user.role = decodedToken.role || user.role;

        // Update any additional frontend info except role
        if (additionalInfo) {
          const { role, ...safeInfo } = additionalInfo; // prevent frontend from overwriting role
          Object.assign(user, safeInfo);
        }

        await user.save();
      } else {
        // Create new user profile
        user = await User.create({
          firebaseUid: decodedToken.uid,
          email: decodedToken.email || firebaseUser.email,
          firstName: firebaseUser.displayName?.split(' ')[0] || additionalInfo?.firstName || '',
          lastName: firebaseUser.displayName?.split(' ').slice(1).join(' ') || additionalInfo?.lastName || '',
          phone: additionalInfo?.phone || '',
          place: additionalInfo?.place || '',
          district: additionalInfo?.district || '',
          pincode: additionalInfo?.pincode || '',
          provider: decodedToken.firebase.sign_in_provider || 'firebase',
          profilePicture: firebaseUser.photoURL || '',
          role: decodedToken.role || 'user' // trust Firebase claims
        });
      }

      res.json({
        success: true,
        message: 'Profile synced successfully',
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
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        }
      });
    } catch (error) {
      console.error('Profile sync error:', error);
      res.status(401).json({ 
        success: false, 
        error: 'Invalid Firebase token or sync failed' 
      });
    }
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
    if (!userId || !role || !['user', 'admin'].includes(role)) {
      return res.status(400).json({ success: false, error: 'Valid userId and role (user/admin) are required' });
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
