# Pepper Backend (Express + Firebase Auth + MongoDB)

## Architecture
- **Firebase Authentication**: Handles user login, registration, Google Sign-In
- **MongoDB**: Stores all application data (user profiles, products, orders, etc.)
- **Express Backend**: API server that verifies Firebase tokens and manages MongoDB data

## Setup
1. Copy `.env.example` to `.env` and configure:
   - Set `MONGODB_URI` to your MongoDB Atlas connection string
   - Set Firebase Admin SDK credentials from Firebase Console
   - Set `PORT=5000`
2. Install deps:
   ```bash
   npm install
   ```
3. Run dev server:
   ```bash
   npm run dev
   ```

## Authentication Flow
1. **Frontend**: User logs in with Firebase (email/password or Google)
2. **Frontend**: Gets Firebase ID token
3. **Frontend**: Sends token to `/api/auth/sync-profile` to create/update MongoDB profile
4. **Frontend**: Uses Firebase ID token for all subsequent API calls
5. **Backend**: Verifies Firebase token and loads user data from MongoDB

## Authentication Endpoints
- `POST /api/auth/sync-profile` → Sync Firebase user to MongoDB profile
- `GET /api/auth/profile` → Get current user profile (protected)
- `PUT /api/auth/profile` → Update user profile (protected)
- `PUT /api/auth/set-role` → Set user role (admin only)
- `GET /api/auth/users` → Get all users (admin only)
- `PUT /api/auth/deactivate/:userId` → Deactivate user (admin only)

## Product Endpoints
- `GET /api/health` → `{ status: 'ok' }`
- `GET /api/products` → List all products
- `GET /api/products/:id` → Get single product
- `POST /api/products` → Create product
- `PUT /api/products/:id` → Update product
- `DELETE /api/products/:id` → Delete product

## Authentication
- Uses Firebase ID tokens with Bearer authentication
- Include token in requests: `Authorization: Bearer <firebase-id-token>`
- Tokens are managed by Firebase (auto-refresh)
- User roles: 'user' (default) or 'admin'
- Supports Google Sign-In and email/password

## User Data Flow
- **Authentication**: Handled by Firebase
- **User Profiles**: Stored in MongoDB (synced from Firebase)
- **Application Data**: All stored in MongoDB
- **File Storage**: Can use Firebase Storage or other services

## Notes
- CORS allows http://localhost:3000 by default
- User profiles are automatically created in MongoDB on first login
- Firebase handles password security, email verification, etc.
- MongoDB stores extended user profile data and all application data
- Update frontend `.env` `REACT_APP_API_URL` to `http://localhost:5000/api`