// middleware/auth.js - Protect routes with Firebase session cookie
const admin = require('../firebaseAdmin');

const requireAuth = async (req, res, next) => {
  try {
    const sessionCookie = req.cookies?.session || '';
    const decoded = await admin.auth().verifySessionCookie(sessionCookie, true);
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ success: false, error: 'Unauthorized' });
  }
};

module.exports = { requireAuth }; 