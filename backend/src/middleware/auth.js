// src/middleware/auth.js
import admin from '../config/firebase.js';
import { getFirestore } from 'firebase-admin/firestore';

const db = getFirestore();

// Helper to resolve role from Firestore/users by uid or email
async function getRoleFromFirestore({ uid, email }) {
  // Prefer users collection by uid document
  if (uid) {
    const doc = await db.collection('users').doc(uid).get();
    if (doc.exists) {
      const data = doc.data();
      if (data?.role) return String(data.role);
    }
  }
  // Fallback: search by email (lowercased)
  if (email) {
    const snap = await db.collection('users').where('email', '==', String(email).toLowerCase()).limit(1).get();
    if (!snap.empty) {
      const data = snap.docs[0].data();
      if (data?.role) return String(data.role);
    }
  }
  return null;
}

export async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const [scheme, token] = header.split(' ');

    if (scheme !== 'Bearer' || !token) {
      return res.status(401).json({ success: false, error: 'Missing or invalid Authorization header' });
    }

    // Check for admin bypass token (for development/testing)
    if (token === 'admin-bypass-token') {
      console.log('Admin bypass token detected - granting admin access');
      req.user = {
        uid: 'bypass-admin-uid',
        email: 'admin@bypass.local',
        role: 'admin',
        provider: 'bypass'
      };
      req.firebaseUid = 'bypass-admin-uid';
      req.userRole = 'admin';
      return next();
    }

    // Verify Firebase ID token
    const decodedToken = await admin.auth().verifyIdToken(token);

    const email = (decodedToken.email || '').toLowerCase();

    // Determine role: admin hardcoded email OR Firestore role; reject if missing
    let role = email === 'vj.vijetha01@gmail.com' ? 'admin' : null;
    if (!role) role = await getRoleFromFirestore({ uid: decodedToken.uid, email });

    if (!role) {
      return res.status(403).json({ success: false, error: 'Unauthorized or unassigned role' });
    }

    // Attach user info to request (no MongoDB usage for roles/auth)
    req.user = {
      uid: decodedToken.uid,
      email,
      role,
      provider: decodedToken.firebase?.sign_in_provider || 'firebase'
    };
    req.firebaseUid = decodedToken.uid;
    req.userRole = role;

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
