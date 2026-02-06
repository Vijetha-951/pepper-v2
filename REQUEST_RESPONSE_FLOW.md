# Request-Response Flow in PEPPER Project

This document explains how requests and responses work in the PEPPER e-commerce application.

## Architecture Overview

This is a **MERN + Firebase** stack application with the following architecture:
- **Frontend**: React.js (SPA)
- **Backend**: Node.js + Express.js
- **Database**: MongoDB (via Mongoose)
- **Authentication**: Firebase Authentication
- **User Management**: Firebase Firestore + MongoDB

---

## Complete Request-Response Flow

### 1. **Client Initiates Request** (Frontend)

When a user interacts with the UI (like adding to wishlist), the frontend makes an API call.

**Example from** `frontend/src/pages/Dashboard.jsx`:
```javascript
const response = await fetch('/api/wishlist/add', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ productId })
});
```

### 2. **API Wrapper Adds Authentication** (Frontend)

The `frontend/src/services/api.js` service automatically:
- Gets Firebase ID token from authenticated user via `getIdToken()`
- Adds `Authorization: Bearer <token>` header to all requests
- Handles credentials and CORS settings
- Proxies requests to backend (configured in `package.json`)

**Key code from** `api.js`:
```javascript
export async function apiFetch(input, init = {}) {
  let token = localStorage.getItem('token');
  
  if (!token) {
    token = await getFirebaseIdTokenWithWait();
  }
  
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  
  return fetch(input, finalInit);
}
```

### 3. **Request Reaches Express Server** (Backend)

`backend/src/server.js` receives the request and:
- Applies global middleware (CORS, JSON parsing, Morgan logging)
- Routes to appropriate handler based on URL pattern
- Example: `/api/wishlist/*` routes to `wishlistRouter`

**Route registration in** `server.js`:
```javascript
app.use('/api/wishlist', wishlistRouter);
```

### 4. **Authentication Middleware Runs**

Before reaching the route handler, `backend/src/middleware/auth.js` executes:

1. Extracts Bearer token from `Authorization` header
2. Verifies token with Firebase Admin SDK
3. Decodes user information (uid, email, etc.)
4. Fetches user role from Firestore or MongoDB
5. Attaches `req.user` and `req.userRole` to request object
6. Returns **401 Unauthorized** if authentication fails

**Key code from** `auth.js`:
```javascript
export async function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');
  
  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  }
  
  // Verify token with Firebase Admin
  const decoded = await admin.auth().verifyIdToken(token);
  
  // Attach user info to request
  req.user = { uid: decoded.uid, email: decoded.email };
  req.userRole = await getRoleFromFirestore({ uid: decoded.uid });
  
  next();
}
```

### 5. **Route Handler Executes**

`backend/src/routes/wishlist.routes.js` handler processes the request:

```javascript
router.post('/add', requireAuth, asyncHandler(async (req, res) => {
  const { productId } = req.body;
  const userId = req.user.uid; // From auth middleware
  
  // Validate product exists
  const product = await Product.findById(productId);
  if (!product) {
    return res.status(404).json({ message: 'Product not found' });
  }
  
  // Find or create wishlist
  let wishlist = await Wishlist.findOne({ user: userId });
  if (!wishlist) {
    wishlist = await Wishlist.create({ user: userId, items: [] });
  }
  
  // Add item using model method
  await wishlist.addItem(productId);
  await wishlist.populate('items.product');
  
  // Send response
  res.json(wishlist);
}));
```

**Handler responsibilities:**
- Extract request data (body, params, query)
- Validate inputs
- Perform business logic
- Interact with database
- Send appropriate response

### 6. **Database Operations** (MongoDB)

`backend/src/models/Wishlist.js` model interacts with MongoDB:

```javascript
const WishlistSchema = new mongoose.Schema({
  user: { type: String, required: true, unique: true }, // Firebase UID
  items: [{ 
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    addedAt: { type: Date, default: Date.now }
  }]
});

// Instance method
WishlistSchema.methods.addItem = function(productId) {
  const exists = this.items.find(item => 
    item.product.toString() === productId.toString()
  );
  
  if (!exists) {
    this.items.push({ product: productId });
  }
  
  return this.save();
};
```

**Model responsibilities:**
- Define data schema and validation rules
- Provide instance and static methods
- Handle database queries (CRUD operations)
- Manage relationships (refs, population)

### 7. **Response Sent Back**

The handler sends the response:
- `res.json(data)` - Sends JSON response with 200 status
- `res.status(404).json(error)` - Sends error with specific status code
- Express serializes JavaScript objects to JSON
- Sets appropriate headers (`Content-Type: application/json`)

### 8. **Frontend Receives Response**

Frontend processes the response:
```javascript
const response = await fetch('/api/wishlist/add', { ... });

if (response.ok) {
  const data = await response.json();
  setWishlist(data); // Update React state
  showSuccessMessage();
} else {
  const error = await response.json();
  showErrorMessage(error.message);
}
```

**Frontend responsibilities:**
- Check response status (`response.ok`)
- Parse JSON data
- Update UI state (React state management)
- Show success/error messages to user
- Re-render affected components

---

## Flow Diagram

```
┌─────────────┐
│ User Click  │
└──────┬──────┘
       │
       ▼
┌──────────────────────┐
│ Frontend Component   │ (e.g., Dashboard.jsx)
│ - onClick handler    │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│ api.js Wrapper       │
│ - Get Firebase token │
│ - Add Auth header    │
└──────┬───────────────┘
       │
       ▼ HTTP Request
┌──────────────────────┐
│ Express Server       │ (server.js)
│ - CORS middleware    │
│ - JSON parser        │
│ - Route matcher      │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│ Auth Middleware      │ (auth.js)
│ - Verify token       │
│ - Get user role      │
│ - Attach req.user    │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│ Route Handler        │ (wishlist.routes.js)
│ - Extract data       │
│ - Validate inputs    │
│ - Business logic     │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│ Mongoose Model       │ (Wishlist.js)
│ - Query MongoDB      │
│ - Execute methods    │
│ - Return data        │
└──────┬───────────────┘
       │
       ▼ Response
┌──────────────────────┐
│ JSON Response        │
│ - Status code        │
│ - Response body      │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│ Frontend Receives    │
│ - Parse JSON         │
│ - Update state       │
│ - Re-render UI       │
└──────────────────────┘
```

---

## Key Technologies Used

### Backend
- **Express.js**: Web framework for routing and middleware
- **Mongoose**: MongoDB ODM for data modeling
- **Firebase Admin SDK**: Token verification and user management
- **express-async-handler**: Async error handling wrapper

### Frontend
- **React.js**: UI component library
- **Firebase SDK**: Client-side authentication
- **Fetch API**: HTTP requests

### Authentication Flow
1. User signs in via Firebase (Google/Email)
2. Frontend receives Firebase ID token
3. Token stored in localStorage
4. Token sent with every API request
5. Backend verifies token with Firebase Admin SDK
6. User identity attached to request object

---

## Error Handling

### Frontend
```javascript
try {
  const response = await fetch('/api/endpoint', { ... });
  
  if (!response.ok) {
    throw new Error('Request failed');
  }
  
  const data = await response.json();
  // Success handling
} catch (error) {
  console.error('Error:', error);
  setErrorMessage(error.message);
}
```

### Backend
```javascript
// Using asyncHandler wrapper
router.post('/endpoint', requireAuth, asyncHandler(async (req, res) => {
  // If any error is thrown, asyncHandler catches it
  const result = await someAsyncOperation();
  res.json(result);
}));

// Manual error handling
router.post('/endpoint', requireAuth, async (req, res) => {
  try {
    const result = await someAsyncOperation();
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
```

---

## Common HTTP Status Codes Used

| Code | Meaning | Usage Example |
|------|---------|---------------|
| 200 | OK | Successful GET, PUT, PATCH, DELETE |
| 201 | Created | Successful POST (resource created) |
| 400 | Bad Request | Invalid input data |
| 401 | Unauthorized | Missing or invalid token |
| 403 | Forbidden | Valid token but insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 500 | Internal Server Error | Server-side error |

---

## Example: Complete Add to Wishlist Flow

1. **User clicks heart icon** on product card
2. **Frontend component** calls `toggleWishlist(productId)`
3. **api.js** fetches Firebase token and adds to headers
4. **HTTP POST** request sent to `/api/wishlist/add`
5. **Express** receives request, applies CORS and JSON parsing
6. **Auth middleware** verifies Firebase token, attaches user info
7. **Route handler** receives authenticated request
8. **Mongoose** queries MongoDB for user's wishlist
9. **Model method** adds product to wishlist items
10. **MongoDB** saves updated document
11. **Response** sent back with updated wishlist
12. **Frontend** receives response, updates state
13. **React** re-renders component with filled heart icon

---

## Notes

- All routes are prefixed with `/api` in the backend
- Frontend uses React hooks for state management
- Async/await pattern used throughout for cleaner code
- Express middleware chains process requests sequentially
- MongoDB operations return Promises
- Authentication is stateless (JWT-based via Firebase)
