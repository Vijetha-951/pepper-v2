// src/middleware/auth.js
import admin from '../config/firebase.js';
import User from '../models/User.js';

export async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const [scheme, token] = header.split(' ');

    if (scheme !== 'Bearer' || !token) {
      return res.status(401).json({ success: false, error: 'Missing or invalid Authorization header' });
    }

    // Verify Firebase ID token
    const decodedToken = await admin.auth().verifyIdToken(token);

    // 🔹 Check if Firebase has admin claim
    const roleFromClaims = decodedToken.admin === true ? 'admin' : 'user';

    // Get or create user in MongoDB
    let user = await User.findOne({ firebaseUid: decodedToken.uid });

    if (!user) {
      const firebaseUser = await admin.auth().getUser(decodedToken.uid);

      user = await User.create({
        firebaseUid: decodedToken.uid,
        email: decodedToken.email || firebaseUser.email,
        firstName: firebaseUser.displayName?.split(' ')[0] || '',
        lastName: firebaseUser.displayName?.split(' ').slice(1).join(' ') || '',
        provider: decodedToken.firebase.sign_in_provider || 'firebase',
        role: roleFromClaims
      });
    } else {
      // 🔹 Keep role in sync with Firebase claims
      if (user.role !== roleFromClaims) {
        user.role = roleFromClaims;
        await user.save();
      }
    }

    // Attach user info to request
    req.user = user;
    req.firebaseUid = decodedToken.uid;
    req.userRole = user.role;

    next();
  } catch (err) {
    console.error('Auth middleware error:', err);
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }
}

// 🔹 Special middleware for Admin-only routes
export function requireAdmin(req, res, next) {
  if (req.userRole === 'admin') {
    return next();
  }
  return res.status(403).json({ success: false, error: 'Admins only' });
}
