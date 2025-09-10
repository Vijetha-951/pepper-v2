// Minimal fetch wrapper that adds Authorization header if token exists
// Falls back to Firebase ID token when available and ensures credentials are included

import firebaseAuthService from './firebaseAuthService';
import { auth } from '../config/firebase';
import { onAuthStateChanged } from 'firebase/auth';

async function getFirebaseIdTokenWithWait(timeoutMs = 2000) {
  // If we already have a signed-in user, get a fresh token
  const current = firebaseAuthService.getCurrentUser?.() || auth.currentUser;
  if (current && typeof current.getIdToken === 'function') {
    try { return await current.getIdToken(true); } catch { /* ignore */ }
  }

  // Otherwise, wait briefly for auth to initialize
  return new Promise((resolve) => {
    let settled = false;
    const timer = setTimeout(() => {
      if (!settled) { settled = true; resolve(null); }
    }, timeoutMs);

    const unsub = onAuthStateChanged(auth, async (user) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      unsub();
      try { resolve(user ? await user.getIdToken(true) : null); }
      catch { resolve(null); }
    });
  });
}

export async function apiFetch(input, init = {}) {
  let token = null;
  try { token = localStorage.getItem('token'); } catch { token = null; }

  const headers = new Headers(init.headers || {});

  // If caller didn't set Authorization, attach stored token or Firebase ID token
  if (!headers.has('Authorization')) {
    if (!token) {
      token = await getFirebaseIdTokenWithWait();
    }
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  }

  const finalInit = {
    credentials: 'include',
    ...init,
    headers,
  };

  return fetch(input, finalInit);
}