import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  onAuthStateChanged,
  sendPasswordResetEmail
} from "firebase/auth";

import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  serverTimestamp
} from "firebase/firestore";

import { auth, googleProvider, db } from '../config/firebase';
import { apiFetch } from './api';

const ADMIN_EMAIL = process.env.REACT_APP_ADMIN_EMAIL || '';
const ADMIN_PASSWORD = process.env.REACT_APP_ADMIN_PASSWORD || '';

class FirebaseAuthService {
  constructor() {
    this.currentUser = null;
    this.authStateCallback = null;

    onAuthStateChanged(auth, (user) => {
      this.currentUser = user;
      if (this.authStateCallback) this.authStateCallback(user);
    });
  }

  // Auth state callback setter
  onAuthStateChange(callback) {
    this.authStateCallback = callback;
  }

  // Register new user (email/password)
  async registerWithEmailAndPassword(userData) {
    try {
      const { email, password, firstName, lastName, phone, role, place, district, pincode } = userData;

      if (email === ADMIN_EMAIL) {
        return { success: false, error: 'Admin cannot register via UI. Use Login page.' };
      }

      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await updateProfile(user, { displayName: `${firstName} ${lastName}` });

      const userDoc = {
        uid: user.uid,
        email: user.email,
        firstName,
        lastName,
        phone,
        role: role || 'user',
        place,
        district,
        pincode,
        provider: 'email',
        displayName: `${firstName} ${lastName}`,
        photoURL: user.photoURL || null,
        emailVerified: user.emailVerified,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await setDoc(doc(db, 'users', user.uid), userDoc);

      const storedUserData = { ...userDoc };
      localStorage.setItem('user', JSON.stringify(storedUserData));

      return { success: true, user: storedUserData, message: 'Registration successful!' };

    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, error: this.getErrorMessage(error.code) || 'Registration failed' };
    }
  }

  // Google Sign up / Sign in (Admin included)
  async signUpWithGoogle(selectedRole) {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      // Determine role: admin email is forced admin; otherwise use selected role or default 'user'
      const role = user.email === ADMIN_EMAIL ? 'admin' : (selectedRole || 'user');
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);

      let userData;

      if (!userDoc.exists()) {
        const [firstName, ...lastNameParts] = (user.displayName || '').split(' ');
        const lastName = lastNameParts.join(' ');

        userData = {
          uid: user.uid,
          email: user.email,
          firstName: firstName || '',
          lastName: lastName || '',
          phone: '',
          role,
          place: '',
          district: '',
          pincode: '',
          provider: 'google',
          displayName: user.displayName || `${firstName} ${lastName}`,
          photoURL: user.photoURL || null,
          emailVerified: user.emailVerified,
          isNewUser: true,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };

        await setDoc(userDocRef, userData);

      } else {
        userData = userDoc.data();
        userData.isNewUser = false;

        // If an existing doc has different role and it's not admin-forced, update it
        if (user.email !== ADMIN_EMAIL && selectedRole && userData.role !== selectedRole) {
          await updateDoc(userDocRef, { role: selectedRole, updatedAt: serverTimestamp() });
          userData.role = selectedRole;
        }
        // Do NOT overwrite existing role when no selectedRole is provided (e.g., plain sign-in)

        await updateDoc(userDocRef, { lastLogin: serverTimestamp(), updatedAt: serverTimestamp() });
      }

      // Ensure MongoDB has this user so Admin panel can list them
      try {
        await apiFetch('/api/auth/sync-profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            profile: {
              role: userData.role || (user.email === ADMIN_EMAIL ? 'admin' : (selectedRole || 'user')),
              firstName: userData.firstName || '',
              lastName: userData.lastName || ''
            }
          })
        });
      } catch (e) {
        console.warn('Profile sync failed:', e?.message || e);
      }

      localStorage.setItem('user', JSON.stringify(userData));
      return { success: true, user: userData, isNewUser: !userDoc.exists(), message: 'Google sign in successful!' };

    } catch (error) {
      console.error('Google signup error:', error);
      return { success: false, error: this.getErrorMessage(error.code) };
    }
  }

  // Google Sign in (Admin included)
  async signInWithGoogle() {
    return this.signUpWithGoogle(); // reuse logic, since signUpWithGoogle handles both new and existing users
  }

  // Email/password Sign in (with Admin auto-create)
  async signInWithEmailAndPassword(email, password) {
    try {
      let loginPassword = password;

      if (email === ADMIN_EMAIL) {
        try {
          const adminCred = await signInWithEmailAndPassword(auth, email, password);
          const adminUser = adminCred.user;
          const adminDocRef = doc(db, 'users', adminUser.uid);
          const adminDoc = await getDoc(adminDocRef);

          if (!adminDoc.exists()) {
            await setDoc(adminDocRef, {
              uid: adminUser.uid,
              email: adminUser.email,
              firstName: 'Admin',
              lastName: '',
              phone: '',
              role: 'admin',
              place: '',
              district: '',
              pincode: '',
              provider: 'email',
              displayName: 'Admin',
              photoURL: adminUser.photoURL || null,
              emailVerified: adminUser.emailVerified,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp()
            });
          } else if (adminDoc.data().role !== 'admin') {
            await updateDoc(adminDocRef, { role: 'admin', updatedAt: serverTimestamp() });
          }

        } catch (e) {
          if (ADMIN_PASSWORD && e?.code === 'auth/user-not-found') {
            const created = await createUserWithEmailAndPassword(auth, email, ADMIN_PASSWORD);
            const newAdmin = created.user;
            await updateProfile(newAdmin, { displayName: 'Admin' });

            const adminDocRef = doc(db, 'users', newAdmin.uid);
            await setDoc(adminDocRef, {
              uid: newAdmin.uid,
              email: newAdmin.email,
              firstName: 'Admin',
              lastName: '',
              phone: '',
              role: 'admin',
              place: '',
              district: '',
              pincode: '',
              provider: 'email',
              displayName: 'Admin',
              photoURL: newAdmin.photoURL || null,
              emailVerified: newAdmin.emailVerified,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp()
            });

            loginPassword = ADMIN_PASSWORD;
          } else throw e;
        }
      }

      const userCredential = await signInWithEmailAndPassword(auth, email, loginPassword);
      const user = userCredential.user;
      const userDocRef = doc(db, 'users', user.uid);
      if (!(await getDoc(userDocRef)).exists()) {
        await setDoc(userDocRef, {
          uid: user.uid,
          email: user.email,
          role: email === ADMIN_EMAIL ? 'admin' : 'user',
          provider: 'email',
          displayName: user.displayName || (email === ADMIN_EMAIL ? 'Admin' : ''),
          photoURL: user.photoURL || null,
          emailVerified: user.emailVerified,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }

      const userData = (await getDoc(userDocRef)).data();
      if (email === ADMIN_EMAIL && userData.role !== 'admin') {
        await updateDoc(userDocRef, { role: 'admin', updatedAt: serverTimestamp() });
        userData.role = 'admin';
      }

      await updateDoc(userDocRef, { lastLogin: serverTimestamp(), updatedAt: serverTimestamp() });

      const idToken = await user.getIdToken(true);
      await fetch('/api/auth/sessionLogin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ idToken })
      });

      localStorage.setItem('user', JSON.stringify(userData));
      return { success: true, user: userData, message: 'Sign in successful!' };

    } catch (error) {
      console.error('Sign in error:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      
      const errorMessage = this.getErrorMessage(error.code);
      console.log('Translated error message:', errorMessage);
      
      return { success: false, error: errorMessage };
    }
  }

  // Update profile
  async updateUserProfile(updateData) {
    try {
      if (!this.currentUser) return { success: false, error: 'User not authenticated' };
      const userDocRef = doc(db, 'users', this.currentUser.uid);

      await updateDoc(userDocRef, { ...updateData, updatedAt: serverTimestamp() });

      if (updateData.firstName || updateData.lastName) {
        const displayName = `${updateData.firstName || ''} ${updateData.lastName || ''}`.trim();
        await updateProfile(this.currentUser, { displayName });
      }

      const currentUserData = JSON.parse(localStorage.getItem('user') || '{}');
      const updatedUserData = { ...currentUserData, ...updateData };
      localStorage.setItem('user', JSON.stringify(updatedUserData));

      return { success: true, user: updatedUserData, message: 'Profile updated successfully!' };
    } catch (error) {
      console.error('Profile update error:', error);
      return { success: false, error: 'Failed to update profile. Please try again.' };
    }
  }

  // Sign out
  async signOut() {
    try {
      await signOut(auth);
      localStorage.removeItem('user');
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
      return { success: true, message: 'Signed out successfully!' };
    } catch (error) {
      console.error('Sign out error:', error);
      return { success: false, error: 'Failed to sign out. Please try again.' };
    }
  }

  getCurrentUser() { return this.currentUser; }
  isAuthenticated() { return !!this.currentUser; }

  getStoredUserData() {
    try { return JSON.parse(localStorage.getItem('user') || 'null'); } catch { return null; }
  }

  // Trigger password reset email
  async sendPasswordReset(email) {
    try {
      await sendPasswordResetEmail(auth, email);
      return { success: true, message: 'Password reset email sent. Please check your inbox.' };
    } catch (error) {
      console.error('Password reset error:', error);
      return { success: false, error: this.getErrorMessage(error.code) };
    }
  }

  getErrorMessage(errorCode) {
    switch (errorCode) {
      case 'auth/user-disabled': return 'Your account has been disabled. Please contact support.';
      case 'auth/user-not-found': return 'No account found with this email address. Please check your email or register first.';
      case 'auth/wrong-password': return 'Incorrect password. Please try again.';
      case 'auth/invalid-credential': return 'Invalid email or password. Please check your credentials and try again.';
      case 'auth/email-already-in-use': return 'An account with this email already exists.';
      case 'auth/weak-password': return 'Password is too weak. Please choose a stronger password.';
      case 'auth/invalid-email': return 'Please enter a valid email address.';
      case 'auth/too-many-requests': return 'Too many failed attempts. Please try again later.';
      case 'auth/network-request-failed': return 'Network error. Please check your connection and try again.';
      default: return 'An error occurred during authentication. Please try again.';
    }
  }
}

export default new FirebaseAuthService();
