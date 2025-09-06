import admin from '../config/firebase.js'; // adjust path if needed

const setAdminClaim = async () => {
  const adminUid = "oSyBm1OTFyg17WJE80JBA8UWvo62"; // replace with actual UID
  try {
    await admin.auth().setCustomUserClaims(adminUid, { role: 'admin' });
    console.log('✅ Admin claim set successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error setting admin claim:', error);
    process.exit(1);
  }
};

setAdminClaim();
