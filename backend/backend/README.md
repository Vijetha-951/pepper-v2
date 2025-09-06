# Backend (Express + Firebase Admin)

## Setup
1. Create `.env` from `.env.example` and fill Firebase Admin credentials.
2. Install deps in project root (already installed from frontend):
   - express, cors, cookie-parser, zod, dotenv, firebase-admin
3. Start server: `npm run server` from frontend folder.

## Endpoints
- POST `/api/auth/register` — Validates input, creates Firebase user, stores profile in Firestore.
- POST `/api/auth/sessionLogin` — Exchanges Firebase ID token for a secure session cookie.
- POST `/api/auth/logout` — Clears session cookie.
- GET `/api/profile` — Protected example; requires session cookie.

## Notes
- CORS origin taken from `CLIENT_ORIGIN` env.
- Session cookie name: `session`.
- Adjust `SESSION_MAX_DAYS` in env for cookie duration.