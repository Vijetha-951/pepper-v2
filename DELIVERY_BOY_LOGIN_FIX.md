# 🔧 Delivery Boy Login Redirect Fix

## 🔍 Problem
When a delivery boy clicks "Update Status", they are redirected to the login page without any error messages.

## 🎯 Root Cause
The delivery boy's role is stored in **MongoDB** but not in **Firestore**. The authentication middleware checks Firestore first, and if the role is not found there, it defaults to 'user' instead of 'deliveryboy'. This causes the `requireDeliveryBoy` middleware to reject the request.

## ✅ Solution

### Option 1: Fix Specific Delivery Boy (Recommended)

1. **Open a terminal** in the backend directory
2. **Run the fix script** with the delivery boy's email:

```powershell
Set-Location "c:\xampp\htdocs\PEPPER\backend"
node scripts/fix-deliveryboy-role.js deliveryboy@example.com
```

Replace `deliveryboy@example.com` with the actual delivery boy's email address.

### Option 2: Fix All Delivery Boys

If you have multiple delivery boys, run the script without an email parameter:

```powershell
Set-Location "c:\xampp\htdocs\PEPPER\backend"
node scripts/fix-deliveryboy-role.js
```

This will automatically find all users with role='deliveryboy' in MongoDB and sync them to Firestore.

## 📋 What the Script Does

1. ✅ Finds the user in MongoDB
2. ✅ Verifies the user exists in Firebase Auth
3. ✅ Checks current Firestore data
4. ✅ Updates Firestore with the correct role
5. ✅ Sets custom claims for faster authentication
6. ✅ Verifies the update was successful

## 🔍 Debugging Steps

### Step 1: Check Backend Logs

After the delivery boy tries to update status, check the backend terminal for logs like:

```
🔍 Role Resolution for deliveryboy@example.com: {
  uid: 'abc123...',
  firestoreRole: null,
  mongoRole: 'deliveryboy',
  resolved: 'deliveryboy'
}
```

- If `firestoreRole` is `null` → Run the fix script
- If `mongoRole` is `null` → The user doesn't exist in MongoDB
- If `resolved` is `'user'` → The role is not being recognized

### Step 2: Verify MongoDB

Check if the delivery boy exists in MongoDB with the correct role:

```javascript
// In MongoDB Compass or shell
db.users.findOne({ email: "deliveryboy@example.com" })
```

Expected output:
```json
{
  "_id": "...",
  "email": "deliveryboy@example.com",
  "role": "deliveryboy",
  "firebaseUid": "abc123...",
  "isActive": true
}
```

### Step 3: Verify Firestore

Check if the delivery boy exists in Firestore with the correct role:

1. Go to Firebase Console → Firestore Database
2. Navigate to `users` collection
3. Find the document with the delivery boy's UID
4. Check if `role` field is set to `'deliveryboy'`

## 🚀 After Running the Fix

1. **The delivery boy must logout and login again** for the changes to take effect
2. **Clear browser cache** if the issue persists
3. **Test the status update** by clicking one of the status buttons

## 🔐 How Authentication Works

```
User clicks "Update Status"
    ↓
Frontend gets Firebase ID token
    ↓
Backend verifies token with Firebase
    ↓
Backend checks Firestore for role (PRIORITY)
    ↓
If not in Firestore, checks MongoDB (FALLBACK)
    ↓
If role = 'deliveryboy' → Allow access
If role = 'user' → Reject with 403 Forbidden
```

## 📝 Prevention

To prevent this issue in the future, ensure that when creating delivery boy accounts:

1. **The role is set in MongoDB** during registration
2. **The role is synced to Firestore** via `/api/auth/sync-profile`
3. **The user logs in** to trigger the authentication flow

## 🆘 Still Not Working?

If the issue persists after running the fix script:

1. **Check if the delivery boy is active:**
   ```javascript
   db.users.findOne({ email: "deliveryboy@example.com" }, { isActive: 1 })
   ```
   If `isActive` is `null` or `false`, update it:
   ```javascript
   db.users.updateOne(
     { email: "deliveryboy@example.com" },
     { $set: { isActive: true } }
   )
   ```

2. **Check browser console** for any JavaScript errors

3. **Check network tab** to see the actual API response:
   - Open DevTools → Network tab
   - Click "Update Status"
   - Look for the `/api/delivery/status` request
   - Check the response status code and body

4. **Verify Firebase token** is being sent:
   - In Network tab, check the request headers
   - Look for `Authorization: Bearer <token>`
   - If missing, the token refresh logic failed

## 🎉 Success Indicators

After the fix is applied successfully, you should see:

✅ No redirect to login page when clicking "Update Status"
✅ Status updates successfully with a green success message
✅ Current status badge updates immediately
✅ Backend logs show `firestoreRole: 'deliveryboy'`

---

**Need more help?** Check the backend terminal logs for detailed error messages.