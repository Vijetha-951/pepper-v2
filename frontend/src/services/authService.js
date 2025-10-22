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

  async refreshUserProfile() {
    try {
      const response = await apiFetch('/api/auth/profile', {
        method: 'GET'
      });
      const profileData = await response.json();
      
      if (response.ok && profileData && profileData.user) {
        // Update stored user data with fresh profile from backend
        this.user = { ...this.user, ...profileData.user };
        
        // Update Firebase stored data as well
        const firebaseUser = this.firebaseAuth.getCurrentUser();
        if (firebaseUser) {
          const updatedUserData = { ...this.user };
          localStorage.setItem('user', JSON.stringify(updatedUserData));
        }
        
        return this.user;
      }
      return null;
    } catch (e) {
      console.warn('Profile refresh failed (non-fatal):', e?.message || e);
      return null;
    }
  }

  // Force profile refresh and redirect if role changed
  async checkForRoleChange() {
    const currentRole = this.user?.role;
    const refreshedUser = await this.refreshUserProfile();
    
    if (refreshedUser && refreshedUser.role !== currentRole) {
      console.log(`Role changed from ${currentRole} to ${refreshedUser.role}, redirecting to dashboard`);
      window.location.href = '/dashboard';
      return true;
    }
    
    return false;
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

        // Fetch fresh user profile from backend to get latest role
        await this.refreshUserProfile();
      }
      return result;
    } catch (error) {
      console.error('Login error:', error);
      console.error('Error details:', error.code, error.message);
      return { success: false, error: 'Network error. Please try again.' };
    }
  }

  // Regular email/password registration (Firebase first)
  async register(userData) {
    try {
      const firebaseResult = await this.firebaseAuth.registerWithEmailAndPassword(userData);
      if (!firebaseResult.success) return firebaseResult;

      this.user = firebaseResult.user;

      // Sync profile to MongoDB with available details (include role to avoid Firestore timing issues)
      await this.syncProfile({
        role: userData.role,
        firstName: userData.firstName,
        lastName: userData.lastName,
        phone: userData.phone,
        place: userData.place,
        district: userData.district,
        pincode: userData.pincode,
      });

      // Sign out user after registration so they have to login manually
      await this.firebaseAuth.signOut();
      this.user = null;

      return { success: true, message: 'Registration successful! Please login to continue.' };
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
            body: JSON.stringify({ idToken, role: result.user?.role })
          }).catch(() => {});
        }

        // Use role as-is from Firestore (do not default to user on sign-in)
        if (result.user?.role) {
          await this.syncProfile({ role: result.user.role });
        } else {
          // Still sync to ensure Mongo creation with names if needed
          await this.syncProfile({});
        }
        
        // Fetch fresh user profile from backend to get latest role
        await this.refreshUserProfile();
      }
      return result;
    } catch (error) {
      console.error('Google Sign In error:', error);
      return { success: false, error: 'Google Sign In failed. Please try again.' };
    }
  }

  // Google OAuth Sign Up
  async googleSignUp(role = 'user') {
    try {
      // pass selected role to firebase signup so Firestore doc reflects it
      const result = await this.firebaseAuth.signUpWithGoogle(role);
      if (result.success) {
        this.user = result.user;

        const firebaseUser = this.firebaseAuth.getCurrentUser();
        const idToken = firebaseUser ? await firebaseUser.getIdToken(true) : null;
        if (idToken) {
          await fetch('/api/auth/google-login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idToken, role })
          }).catch(() => {});
        }

        // Sync to Mongo with explicit role, include names, and force Authorization with current ID token
        if (idToken) {
          try {
            await apiFetch('/api/auth/sync-profile', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
              body: JSON.stringify({ profile: {
                role,
                firstName: result.user?.firstName || '',
                lastName: result.user?.lastName || ''
              } })
            });
          } catch (e) {
            console.warn('Profile sync (Google SignUp) failed:', e?.message || e);
          }
        } else {
          await this.syncProfile({ role });
        }

        // Fetch fresh profile from backend so UI gets the resolved role
        await this.refreshUserProfile();

        // If this is not a new user (existing user), sign them out so they have to login manually
        if (!result.isNewUser) {
          await this.firebaseAuth.signOut();
          this.user = null;
        }
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
        // Clear any cached data
        localStorage.removeItem('user');
        // Redirect to login page
        window.location.href = '/login';
      }
      return result;
    } catch (error) {
      console.error('Logout error:', error);
      return { success: false, error: 'Logout failed. Please try again.' };
    }
  }

  // Logout without redirect (for showing inline message before navigating)
  async logoutNoRedirect() {
    try {
      const result = await this.firebaseAuth.signOut();
      if (result.success) {
        this.user = null;
        localStorage.removeItem('user');
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
    // First check if Firebase user is authenticated
    const firebaseUser = this.firebaseAuth.getCurrentUser();
    if (!firebaseUser) {
      // If no Firebase user, clear stored data and return null
      this.user = null;
      return null;
    }
    
    // Return stored user data if Firebase user exists
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
        
        // If this is completing profile (isNewUser: false), sign out so user has to login
        if (updateData.isNewUser === false) {
          await this.firebaseAuth.signOut();
          this.user = null;
        }
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

  // Get authentication token
  async getAuthToken() {
    const firebaseUser = this.firebaseAuth.getCurrentUser();
    if (!firebaseUser) {
      throw new Error('User not authenticated');
    }
    return await firebaseUser.getIdToken(true);
  }

  // Forgot password helper
  async forgotPassword(email) {
    if (!email) return { success: false, error: 'Please enter your email address.' };
    return this.firebaseAuth.sendPasswordReset(email);
  }
}

export default new AuthService();
