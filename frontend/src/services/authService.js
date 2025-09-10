import firebaseAuthService from './firebaseAuthService';
import { apiFetch } from './api';

class AuthService {
  constructor() {
    this.firebaseAuth = firebaseAuthService;
    this.user = this.firebaseAuth.getStoredUserData();
  }

  async syncProfile(optionalProfile = {}) {
    try {
      await apiFetch('/api/auth/sync-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile: optionalProfile })
      });
    } catch (e) {
      console.warn('Profile sync failed (non-fatal):', e?.message || e);
    }
  }

  // Regular email/password login
  async login(formData) {
    try {
      const email = formData.email || formData;
      const password = formData.password || arguments[1];

      const result = await this.firebaseAuth.signInWithEmailAndPassword(email, password);
      if (result.success) {
        this.user = result.user;

        // Notify backend for role redirect logic (optional)
        const firebaseUser = this.firebaseAuth.getCurrentUser();
        const idToken = firebaseUser ? await firebaseUser.getIdToken(true) : null;
        if (idToken) {
          await fetch('/api/auth/email-login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idToken })
          }).catch(() => {});
        }

        // Ensure MongoDB has this profile
        await this.syncProfile();
      }
      return result;
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Network error. Please try again.' };
    }
  }

  // Regular email/password registration (Firebase first)
  async register(userData) {
    try {
      const firebaseResult = await this.firebaseAuth.registerWithEmailAndPassword(userData);
      if (!firebaseResult.success) return firebaseResult;

      this.user = firebaseResult.user;

      // Sync profile to MongoDB with available details
      await this.syncProfile({
        firstName: userData.firstName,
        lastName: userData.lastName,
        phone: userData.phone,
        place: userData.place,
        district: userData.district,
        pincode: userData.pincode,
      });

      return firebaseResult;
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, error: 'Network error. Please try again.' };
    }
  }

  // Google OAuth Sign In
  async googleSignIn() {
    try {
      const result = await this.firebaseAuth.signInWithGoogle();
      if (result.success) {
        this.user = result.user;

        const firebaseUser = this.firebaseAuth.getCurrentUser();
        const idToken = firebaseUser ? await firebaseUser.getIdToken(true) : null;
        if (idToken) {
          await fetch('/api/auth/google-login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idToken })
          }).catch(() => {});
        }

        await this.syncProfile();
      }
      return result;
    } catch (error) {
      console.error('Google Sign In error:', error);
      return { success: false, error: 'Google Sign In failed. Please try again.' };
    }
  }

  // Google OAuth Sign Up
  async googleSignUp() {
    try {
      const result = await this.firebaseAuth.signUpWithGoogle();
      if (result.success) {
        this.user = result.user;

        const firebaseUser = this.firebaseAuth.getCurrentUser();
        const idToken = firebaseUser ? await firebaseUser.getIdToken(true) : null;
        if (idToken) {
          await fetch('/api/auth/google-login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idToken })
          }).catch(() => {});
        }

        await this.syncProfile();
      }
      return result;
    } catch (error) {
      console.error('Google Sign Up error:', error);
      return { success: false, error: 'Google Sign Up failed. Please try again.' };
    }
  }

  // Logout
  async logout() {
    try {
      const result = await this.firebaseAuth.signOut();
      if (result.success) {
        this.user = null;
      }
      return result;
    } catch (error) {
      console.error('Logout error:', error);
      return { success: false, error: 'Logout failed. Please try again.' };
    }
  }

  isAuthenticated() {
    return this.firebaseAuth.isAuthenticated() && !!this.user;
  }

  getCurrentUser() {
    return this.user || this.firebaseAuth.getStoredUserData();
  }

  getFirebaseUser() {
    return this.firebaseAuth.getCurrentUser();
  }

  async updateProfile(updateData) {
    try {
      const result = await this.firebaseAuth.updateUserProfile(updateData);
      if (result.success) {
        this.user = result.user;
        await this.syncProfile(updateData);
      }
      return result;
    } catch (error) {
      console.error('Profile update error:', error);
      return { success: false, error: 'Network error. Please try again.' };
    }
  }

  onAuthStateChange(callback) {
    this.firebaseAuth.onAuthStateChange(callback);
  }
}

export default new AuthService();
