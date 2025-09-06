// firebaseAdmin.js - Firebase Admin SDK initialization
// CommonJS import for Node
const admin = require('firebase-admin');

// Allow multi-line private key via env var with escaped newlines
const privateKey = process.env.FIREBASE_PRIVATE_KEY
  ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
  : undefined;

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey
    }),
  });
}

module.exports = admin;