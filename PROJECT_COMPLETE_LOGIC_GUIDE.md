# 🌶️ PEPPER E-commerce Project - Complete Logic Guide

## 📋 Table of Contents
1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Database Models](#database-models)
4. [Authentication & User Management](#authentication--user-management)
5. [Product Management](#product-management)
6. [Stock Management](#stock-management)
7. [Shopping Cart](#shopping-cart)
8. [Order & Checkout Process](#order--checkout-process)
9. [Payment Processing](#payment-processing)
10. [Delivery Management](#delivery-management)
11. [Reviews & Ratings](#reviews--ratings)
12. [Recommendations Engine](#recommendations-engine)
13. [Demand Prediction](#demand-prediction)
14. [Admin Dashboard](#admin-dashboard)
15. [Email Notifications](#email-notifications)

---

## 📱 Project Overview

**PEPPER** is a full-stack e-commerce platform for pepper/spice products with:
- **Frontend**: React.js (Vite)
- **Backend**: Node.js + Express
- **Database**: MongoDB
- **Authentication**: Firebase Auth
- **Payment Gateway**: Razorpay
- **Email Service**: Nodemailer
- **User Roles**: Customer, Admin, Delivery Boy

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     FRONTEND (React)                        │
│  ├─ Home Page (Product Listing)                             │
│  ├─ Product Detail Page                                     │
│  ├─ Shopping Cart                                           │
│  ├─ Checkout (Payment)                                      │
│  ├─ User Dashboard                                          │
│  ├─ Order Tracking                                          │
│  ├─ Admin Dashboard                                         │
│  └─ Delivery Boy Dashboard                                  │
└─────────────────────────────────────────────────────────────┘
                          ↓ HTTP/REST API
┌─────────────────────────────────────────────────────────────┐
│              BACKEND (Express + Node.js)                     │
│                                                             │
│  ├─ Authentication Routes (Firebase)                        │
│  ├─ Product Routes                                          │
│  ├─ Cart Routes                                             │
│  ├─ Order Routes                                            │
│  ├─ Payment Routes (Razorpay)                               │
│  ├─ Delivery Routes                                         │
│  ├─ Reviews Routes                                          │
│  ├─ Recommendations Service                                 │
│  ├─ Demand Prediction Service                               │
│  ├─ Email Service                                           │
│  └─ Stock Management Routes                                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                          ↓ Queries/Commands
┌─────────────────────────────────────────────────────────────┐
│           MONGODB DATABASE (Cloud/Local)                    │
│  ├─ Users Collection                                        │
│  ├─ Products Collection                                     │
│  ├─ Orders Collection                                       │
│  ├─ Cart Collection                                         │
│  ├─ Reviews Collection                                      │
│  └─ BrowsingHistory Collection                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🗄️ Database Models

### 1. **User Model**
```javascript
{
  firebaseUid: String (unique, required),       // Firebase user ID
  email: String (unique, required),              // Email address
  firstName: String (required),                  // First name
  lastName: String (required),                   // Last name
  phone: String,                                 // Phone number
  role: String (enum: ['user', 'admin', 'deliveryboy']),
  addresses: Array,                              // Multiple addresses
  profilePicture: String,                        // URL to image
  isActive: Boolean (null = pending),            // Approval status
  
  // For Delivery Boys only:
  assignedAreas: {
    pincodes: [String],
    districts: [String]
  },
  deliveryStatus: String (enum: ['OFFLINE', 'OPEN_FOR_DELIVERY', 'OUT_FOR_DELIVERY']),
  lastStatusUpdate: Date
}
```

### 2. **Product Model**
```javascript
{
  name: String (required),                      // Product name
  type: String (enum: ['Climber', 'Bush']),     // Product type
  category: String,                              // Category (default: 'Bush Pepper')
  description: String,                           // Product description
  price: Number (required),                      // Selling price
  stock: Number,                                 // Legacy field (backward compatibility)
  total_stock: Number,                           // Total inventory received
  available_stock: Number,                       // Current available quantity
  image: String,                                 // Product image URL
  isActive: Boolean,                             // Is product available
  timestamps: {createdAt, updatedAt}
}
```

**Stock Status Logic:**
- **In Stock**: `available_stock > 5`
- **Low Stock**: `1 ≤ available_stock ≤ 5`
- **Out of Stock**: `available_stock < 1` (0 items)

### 3. **Cart Model**
```javascript
{
  user: String (unique),                        // Firebase UID
  items: [
    {
      product: ObjectId (ref: Product),
      quantity: Number
    }
  ],
  updatedAt: Date,
  timestamps: {createdAt}
}
```

**Methods:**
- `getCartTotal()` - Calculate total price
- `clearCart()` - Empty the cart

### 4. **Order Model**
```javascript
{
  user: ObjectId (ref: User, required),
  items: [
    {
      product: ObjectId (ref: Product),
      name: String,
      priceAtOrder: Number,
      quantity: Number
    }
  ],
  totalAmount: Number,
  status: String (enum: ['PENDING', 'APPROVED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED']),
  deliveryStatus: String (enum: ['ASSIGNED', 'ACCEPTED', 'OUT_FOR_DELIVERY', 'DELIVERED', null]),
  deliveryBoy: ObjectId (ref: User),
  shippingAddress: {line1, line2, district, state, pincode},
  payment: {
    method: String (enum: ['COD', 'ONLINE']),
    status: String (enum: ['PENDING', 'PAID', 'FAILED', 'REFUNDED']),
    transactionId: String,
    refundId: String,
    refundAmount: Number,
    refundStatus: String
  },
  notes: String,
  timestamps: {createdAt, updatedAt}
}
```

### 5. **Review Model**
```javascript
{
  user: ObjectId (ref: User, required),
  product: ObjectId (ref: Product, required),
  order: ObjectId (ref: Order, required),
  rating: Number (1-5, required),
  comment: String (max 1000 chars),
  complaintType: String (enum: ['None', 'Damaged', 'Wrong Variety', 'Delayed Delivery', 'Other']),
  complaintDescription: String,
  isPublished: Boolean (default: true),
  productSnapshot: {name, price, image},        // Snapshot at time of review
  editCount: Number,
  lastEditedAt: Date,
  canEdit: Boolean,                              // Allow edits for 30 days
  timestamps: {createdAt, updatedAt}
}
```

**Constraints:**
- One review per product per user (unique index)
- Can edit reviews within 30 days of creation

### 6. **BrowsingHistory Model**
```javascript
{
  user: ObjectId (ref: User),
  product: ObjectId (ref: Product),
  viewedAt: Date
}
```

---

## 🔐 Authentication & User Management

### Authentication Flow

```
┌─────────────────────────────────────────────────────────────┐
│  STEP 1: User Registration/Login                            │
├─────────────────────────────────────────────────────────────┤
│  Frontend → Firebase Auth                                   │
│  • Email/Password Registration                              │
│  • OR Google OAuth Sign-In                                  │
│  ✓ Returns: Firebase ID Token                               │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  STEP 2: Sync User to MongoDB                               │
├─────────────────────────────────────────────────────────────┤
│  Frontend → POST /api/auth/sync-profile                     │
│  • Sends: Firebase token + profile data                     │
│  Backend:                                                   │
│    ✓ Verifies Firebase token                                │
│    ✓ Checks if user exists in MongoDB                       │
│    ✓ Creates new user if first login                        │
│    ✓ Updates existing user                                  │
│    ✓ Returns: User profile object                           │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  STEP 3: Subsequent API Calls                               │
├─────────────────────────────────────────────────────────────┤
│  Frontend → Any Protected Route                             │
│  • Authorization Header: Bearer <Firebase-ID-Token>         │
│  Backend:                                                   │
│    ✓ Verifies token signature                               │
│    ✓ Extracts user info from token                          │
│    ✓ Loads user data from MongoDB                           │
│    ✓ Checks user role (user/admin/deliveryboy)              │
│    ✓ Grants/Denies access                                   │
└─────────────────────────────────────────────────────────────┘
```

### Key Authentication Endpoints

| Endpoint | Method | Protected | Description |
|----------|--------|-----------|-------------|
| `/api/auth/sync-profile` | POST | ✓ | Sync Firebase user to MongoDB |
| `/api/auth/profile` | GET | ✓ | Get current user profile |
| `/api/auth/profile` | PUT | ✓ | Update user profile |
| `/api/auth/set-role` | PUT | Admin | Set user role |
| `/api/auth/users` | GET | Admin | Get all users |
| `/api/auth/deactivate/:userId` | PUT | Admin | Deactivate user |

### User Roles & Permissions

**1. Regular User (user)**
- Browse products
- Add to cart, checkout
- Place orders (COD or Online)
- View own orders
- Track deliveries
- Submit reviews
- Get product recommendations

**2. Admin (admin)**
- Everything user can do, plus:
- Add/Edit/Delete products
- Manage stock levels
- View all orders
- View all users
- Approve/deactivate users
- View demand predictions
- View customer segmentation
- View delivery analytics
- Manage refunds

**3. Delivery Boy (deliveryboy)**
- View assigned orders
- Accept/Reject deliveries
- Mark order as "Out for Delivery"
- Mark order as "Delivered"
- Collect COD payments
- View assigned areas

---

## 📦 Product Management

### Product Endpoints

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/products` | GET | - | List all products |
| `/api/products/:id` | GET | - | Get product details |
| `/api/products` | POST | Admin | Create product |
| `/api/products/:id` | PUT | Admin | Update product |
| `/api/products/:id` | DELETE | Admin | Delete product |

### Product Creation Flow

```
Admin Dashboard
    ↓
POST /api/products
    ├─ Validate: name, type, price, total_stock, available_stock
    ├─ Create Product document
    ├─ Set status based on stock
    └─ Return: Created product with ID
```

### Product Status Determination

**Logic in `getStockStatus()` method:**

```javascript
const available = product.available_stock;

if (available > 5) return 'In Stock';        // Green ✓
if (available >= 1) return 'Low Stock';      // Yellow ⚠️
return 'Out of Stock';                       // Red ✗
```

---

## 📊 Stock Management

### Stock Levels Explanation

| Field | Purpose |
|-------|---------|
| `total_stock` | Total inventory ever received (cumulative) |
| `available_stock` | Current inventory available for purchase |
| `sold` | Calculated: `total_stock - available_stock` |

### Stock Update Scenarios

**1. When Product is Created**
```
total_stock = quantity_received
available_stock = total_stock (all available initially)
sold = 0
```

**2. When Order is Placed**
```
available_stock -= order_quantity
total_stock remains unchanged
sold = total_stock - available_stock
```

**3. When Order is Cancelled (Refunded)**
```
available_stock += refunded_quantity
total_stock remains unchanged
sold = total_stock - available_stock
```

**4. When Admin Restocks**
```
total_stock += restock_quantity
available_stock += restock_quantity
```

### Stock Management Endpoints

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/admin/stock` | GET | Admin | View stock dashboard |
| `/api/products/restock/:id` | PUT | Admin | Restock product |
| `/api/products/:id/stock-history` | GET | Admin | View stock history |

---

## 🛒 Shopping Cart

### Cart Operations

**1. Add to Cart**
```
POST /api/cart/add
{
  productId: String,
  quantity: Number
}

Logic:
├─ Check if product exists
├─ Check if product is active
├─ Check available stock
├─ Add/Update item in user's cart
└─ Return: Updated cart
```

**2. Get Cart**
```
GET /api/cart
Response:
{
  items: [
    {
      product: {_id, name, price, image, available_stock},
      quantity: Number
    }
  ],
  total: Number
}
```

**3. Update Cart Item Quantity**
```
PUT /api/cart/update
{
  productId: String,
  quantity: Number (0 to remove)
}

Logic:
├─ Find cart item
├─ Validate stock availability
├─ Update quantity
├─ If quantity = 0, remove item
└─ Recalculate total
```

**4. Clear Cart**
```
DELETE /api/cart

Logic:
├─ Empty all items
├─ Reset updatedAt timestamp
└─ Return: Empty cart
```

### Cart Validation

Before checkout, the system verifies:
- ✓ All items still exist (products not deleted)
- ✓ All items are still active
- ✓ Sufficient stock available for each item
- ✓ Cart is not empty

---

## 🛍️ Order & Checkout Process

### Complete Checkout Flow

```
USER ADDS TO CART
        ↓
USER NAVIGATES TO CHECKOUT
        ↓
┌─────────────────────────────────────────┐
│ CHECKOUT PAGE                           │
├─────────────────────────────────────────┤
│ Step 1: Review Cart Items               │
│  • Display product details              │
│  • Show prices & quantities             │
│  • Calculate subtotal                   │
└─────────────────────────────────────────┘
        ↓
┌─────────────────────────────────────────┐
│ Step 2: Enter Shipping Address          │
│  • Line 1, Line 2 (optional)            │
│  • District, State, Pincode             │
│  • Phone number                         │
└─────────────────────────────────────────┘
        ↓
┌─────────────────────────────────────────┐
│ Step 3: Select Payment Method           │
│  ├─ Cash on Delivery (COD)              │
│  └─ Online Payment (Razorpay)           │
└─────────────────────────────────────────┘
        ↓
    IF COD SELECTED:              IF ONLINE SELECTED:
         ↓                              ↓
    ┌──────────────────┐        ┌──────────────────────┐
    │ CREATE ORDER     │        │ REDIRECT TO RAZORPAY │
    │ (status: PENDING)│        │ PAYMENT GATEWAY      │
    │                  │        │                      │
    │ • Deduct stock   │        │ User enters card     │
    │ • Email sent     │        │ details & confirms   │
    │ • Order page     │        └──────────────────────┘
    └──────────────────┘                 ↓
         ↓                     ┌──────────────────────┐
    SUCCESS PAGE              │ VERIFY SIGNATURE     │
    (COD)                     │ & CREATE ORDER       │
                              │                      │
                              │ • Deduct stock       │
                              │ • Email sent         │
                              │ • Success page       │
                              └──────────────────────┘
```

### Order Placement Logic

**1. Validate Request**
```javascript
- Verify user is authenticated
- Check items array is not empty
- Validate shippingAddress structure
```

**2. Verify Stock Availability**
```javascript
for each item in cart:
  product = findProductById(item.productId)
  if !product: return error "Product not found"
  if product.available_stock < item.quantity:
    return error "Insufficient stock"
```

**3. Calculate Total**
```javascript
totalAmount = 0
for each item in cart:
  totalAmount += item.quantity * product.price
```

**4. Create Order Document**
```javascript
order = Order.create({
  user: user._id,
  items: [{product, priceAtOrder, quantity}, ...],
  totalAmount: totalAmount,
  status: 'PENDING',
  shippingAddress: {...},
  payment: {method, status},
  notes: notes
})
```

**5. Update Stock**
```javascript
for each item in order.items:
  product = findProductById(item.product)
  product.available_stock -= item.quantity
  product.stock = product.available_stock  // Keep legacy field in sync
  product.save()
```

**6. Clear Cart**
```javascript
cart = findCartByUserId(user._id)
cart.items = []
cart.save()
```

**7. Send Email Notification**
```javascript
sendOrderConfirmationEmail({
  to: user.email,
  orderId: order._id,
  items: order.items,
  totalAmount: order.totalAmount,
  paymentMethod: order.payment.method
})
```

---

## 💳 Payment Processing

### Payment Methods Supported

#### 1. **Cash on Delivery (COD)**

```
User selects COD at checkout
        ↓
Order created immediately
        ↓
Order Status: PENDING
Payment Status: PENDING
        ↓
Order email sent to user
        ↓
Email: "Order Confirmed - Cash on Delivery"
Content: Order details, keep ₹{amount} ready
        ↓
Delivery Boy receives order
        ↓
Upon delivery, Delivery Boy collects payment
        ↓
Delivery Boy marks: "Payment COD Accepted"
        ↓
Payment Status: PAID
Order Status: DELIVERED
```

#### 2. **Online Payment (Razorpay)**

```
User selects "Online Payment" at checkout
        ↓
POST /api/payment/create-order
├─ Get user's cart
├─ Validate all products still exist
├─ Check stock availability
├─ Calculate total amount
├─ Create Razorpay order
└─ Return: {order_id, amount, currency, razorpay_key}
        ↓
Frontend receives Razorpay order details
        ↓
Razorpay payment gateway opens
├─ User enters card details
├─ User authorizes payment
└─ Razorpay processes payment
        ↓
Payment successful (or failed)
        ↓
Frontend receives payment details:
{
  razorpay_payment_id,
  razorpay_order_id,
  razorpay_signature
}
        ↓
POST /api/payment/verify
├─ Generate signature: 
│   HMAC-SHA256(order_id + "|" + payment_id, secret)
├─ Compare with received signature
├─ IF match:
│   ├─ Create order in DB
│   ├─ Deduct stock
│   ├─ Clear cart
│   ├─ Send success email
│   └─ Return: success
├─ ELSE:
│   └─ Return: error "Payment verification failed"
└─ Update payment.transactionId
        ↓
Frontend shows success page
        ↓
Email: "Payment Successful - Order Confirmed"
```

### Razorpay Integration Details

**Environment Variables Required:**
```
RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx
```

**Payment Verification Algorithm:**

```javascript
const crypto = require('crypto');

function verifyPayment(orderId, paymentId, signature, secret) {
  // Create the message to verify
  const message = orderId + '|' + paymentId;
  
  // Generate HMAC SHA256
  const generated_signature = crypto
    .createHmac('sha256', secret)
    .update(message)
    .digest('hex');
  
  // Compare signatures
  return generated_signature === signature;
}
```

### Payment Status Lifecycle

```
Order Created:
  payment.method: 'ONLINE' or 'COD'
  payment.status: 'PENDING'
  
When Payment Received:
  payment.status: 'PAID'
  
When Refund Initiated:
  payment.status: 'REFUNDED'
  payment.refundId: 'rfnd_xxxxx'
  payment.refundStatus: 'PENDING'
  
When Refund Processed:
  payment.refundStatus: 'PROCESSED'
```

---

## 🚚 Delivery Management

### Delivery Boy Features

**1. View Assigned Orders**
```
GET /api/delivery/orders/assigned
Optional filters:
  ?status=PENDING
  ?deliveryStatus=ASSIGNED

Returns:
  [
    {
      _id: ObjectId,
      items: [{product, quantity, priceAtOrder}],
      shippingAddress: {line1, district, pincode},
      deliveryStatus: 'ASSIGNED',
      status: 'PENDING',
      ...
    }
  ]
```

**2. Accept Order**
```
PATCH /api/delivery/orders/:orderId/accept
Logic:
  ├─ Verify order belongs to delivery boy
  ├─ Update deliveryStatus: 'ASSIGNED' → 'ACCEPTED'
  ├─ Update order status: 'PENDING' → 'APPROVED'
  └─ Return: Updated order
```

**3. Mark Out for Delivery**
```
PATCH /api/delivery/orders/:orderId/out-for-delivery
Logic:
  ├─ Verify order belongs to delivery boy
  ├─ Update deliveryStatus: 'ACCEPTED' → 'OUT_FOR_DELIVERY'
  ├─ Update order status: 'APPROVED' → 'OUT_FOR_DELIVERY'
  └─ Return: Updated order
```

**4. Mark Delivered**
```
PATCH /api/delivery/orders/:orderId/delivered
Logic:
  ├─ Verify order belongs to delivery boy
  ├─ Update deliveryStatus: 'OUT_FOR_DELIVERY' → 'DELIVERED'
  ├─ Update order status: 'OUT_FOR_DELIVERY' → 'DELIVERED'
  └─ Return: Updated order
```

**5. Collect COD Payment**
```
PATCH /api/delivery/orders/:orderId/payment/cod-accepted
Logic:
  ├─ Verify order is COD
  ├─ Verify payment.status = 'PENDING'
  ├─ Update payment.status: 'PENDING' → 'PAID'
  └─ Return: Updated order

This endpoint is called when:
  ✓ Delivery boy receives cash from customer
  ✓ Payment is marked as collected
```

### Delivery Order Statuses

```
Order Status Flow:
PENDING → APPROVED → OUT_FOR_DELIVERY → DELIVERED

Delivery Status Flow:
ASSIGNED → ACCEPTED → OUT_FOR_DELIVERY → DELIVERED

COD Payment Collection:
When order status = DELIVERED and payment.method = 'COD':
  Delivery boy marks: payment/cod-accepted
  payment.status: PENDING → PAID
```

---

## ⭐ Reviews & Ratings

### Review Submission Logic

**Eligibility:**
- User must have purchased the product (order exists & DELIVERED)
- One review per product per user (unique constraint)
- Can review via: POST /api/reviews

**Review Creation:**
```javascript
POST /api/reviews
{
  productId: ObjectId,
  orderId: ObjectId,
  rating: Number (1-5),
  comment: String (optional, max 1000),
  complaintType: 'None|Damaged|Wrong Variety|Delayed Delivery|Other',
  complaintDescription: String (optional)
}

Backend Logic:
├─ Verify user owns the order
├─ Verify order contains this product
├─ Verify order status = 'DELIVERED'
├─ Check if review already exists (prevent duplicates)
├─ Store product snapshot (name, price, image at time of review)
├─ Create review document
├─ Return: Created review
```

### Review Display

**For Customers (My Reviews):**
```
GET /api/reviews/my
Returns: All reviews by current user
├─ Can filter by product
├─ Shows edit option for reviews < 30 days old
└─ Shows complaint status
```

**For Product Page (Public):**
```
GET /api/reviews/public/product/:productId
Returns: Published reviews only
├─ Can sort by: recent, helpful, rating_high, rating_low
├─ Shows average rating
├─ Shows rating breakdown (5★, 4★, 3★, etc.)
└─ Paginated results
```

### Review Editing

**Rules:**
- Can edit within 30 days of creation
- Edit count is tracked
- Previous version is not stored
- lastEditedAt is updated

```
PUT /api/reviews/:reviewId
{
  rating: Number,
  comment: String,
  complaintType: String,
  complaintDescription: String
}

Logic:
├─ Verify ownership
├─ Check if within 30 days
├─ Update fields
├─ Increment editCount
├─ Update lastEditedAt
└─ Return: Updated review
```

### Review Deletion

**Rules:**
- Admin can delete any review
- User can delete own review

```
DELETE /api/reviews/:reviewId
Logic:
├─ Verify ownership or admin
├─ Delete review document
└─ Return: success
```

---

## 🎯 Recommendations Engine

### Recommendation System

**Algorithm:** Content-Based + Collaborative Filtering

**Data Points Used:**
1. **Browsing History** - Products viewed by user
2. **Purchase History** - Products already bought
3. **User Similarity** - Similar users with similar interests
4. **Product Similarity** - Similar product features

### How It Works

**1. Track Browsing Activity**
```
POST /api/recommendations/track
{
  productId: ObjectId
}

Logic:
├─ Record product view with timestamp
├─ Store in BrowsingHistory collection
└─ Used for future recommendations
```

**2. Generate Recommendations**
```
GET /api/recommendations/products
Query params:
  ?k=5          (# of similar users to find)
  ?limit=5      (# of products to recommend)

Algorithm:
├─ Find users similar to current user
│   └─ Based on browsing/purchase patterns
├─ Identify products liked by similar users
│   └─ That current user hasn't viewed
├─ Rank by relevance & popularity
└─ Return: Top N recommendations
```

**3. Recommendation Ranking**

```
Score = 
  (View Count × 0.3) +
  (Purchase Count × 0.5) +
  (Similar Users Count × 0.2) +
  (Recency Boost) -
  (Already Purchased Penalty)
```

**Output:**
```json
[
  {
    _id: ObjectId,
    name: "Black Pepper Premium",
    price: 150,
    image: "...",
    type: "Bush",
    score: 8.5,
    reason: "Users like you also bought this"
  }
]
```

---

## 📈 Demand Prediction

### Decision Tree Prediction System

**Purpose:** Predict future product demand to help with inventory planning

**Features Used:**
1. **Month of Year** (seasonal demand)
2. **Historical Sales Trend** (last 6 months)
3. **Product Type** (Climber vs Bush)

### Prediction Algorithm

**Input Data:**
- Historical orders for past 6 months
- Aggregated by product and month
- Product type (Climber or Bush)

**Process:**

```
For each product:
├─ Get sales data by month
├─ Analyze trend (increasing/decreasing)
├─ Check current month seasonality
├─ Analyze product type patterns
├─ Calculate:
│   ├─ Average monthly sales
│   ├─ Sales trend slope
│   ├─ Predicted demand for next 3 months
│   ├─ Urgency score (0-100)
│   └─ Recommendation (STOCK_UP, MAINTAIN, REDUCE)
└─ Return: Prediction object
```

**Example Prediction Output:**
```json
{
  productId: ObjectId,
  name: "Black Pepper",
  type: "Bush",
  currentStock: 50,
  availableStock: 45,
  historicalAvg: 20,
  upcomingDemand: 35,
  trend: "INCREASING",
  seasonalFactor: 1.4,
  predictions: {
    nextMonth: 28,
    twoMonths: 32,
    threeMonths: 38
  },
  urgencyScore: 78,
  recommendation: "STOCK_UP",
  confidence: 0.82
}
```

**Urgency Score Calculation:**
```
if currentStock < averageDemand × 2:
  urgencyScore = 80-100 (HIGH - Stock immediately!)
else if currentStock < averageDemand:
  urgencyScore = 60-80 (MEDIUM - Consider stocking)
else:
  urgencyScore = 0-60 (LOW - Sufficient stock)
```

### Endpoint

```
GET /api/admin/predictions
Optional params:
  ?monthsBack=6  (Historical period to analyze)

Returns:
  [
    {prediction_1},
    {prediction_2},
    ...
  ]
  Sorted by urgencyScore (descending)
```

---

## 📊 Admin Dashboard

### Admin Capabilities

**1. User Management**
```
GET /api/auth/users
├─ View all users
├─ Filter by role, status
└─ Bulk actions: approve, reject, deactivate

PUT /api/auth/set-role
├─ Change user role
├─ user → admin, deliveryboy
└─ Validate role change
```

**2. Product Management**
```
POST /api/products - Create product
PUT /api/products/:id - Edit product
DELETE /api/products/:id - Delete product
GET /api/admin/stock - View stock dashboard
```

**3. Stock Management**
```
GET /api/admin/stock
├─ View all products with stock levels
├─ Filter by status (In Stock, Low Stock, Out of Stock)
├─ Sort by: name, price, available_stock, total_stock
└─ Pagination support

PUT /api/products/restock/:id
├─ Add inventory
├─ Reason tracking (audit log)
└─ Update available & total stock
```

**4. Order Management**
```
GET /api/admin/orders
├─ View all orders
├─ Filter by status
├─ Assign delivery boy
└─ View order timeline

PUT /api/admin/orders/:id/assign-delivery
├─ Assign delivery boy
├─ Verify delivery area coverage
└─ Update order
```

**5. Analytics**
```
GET /api/admin/analytics
├─ Total revenue
├─ Total orders
├─ Total customers
├─ Product performance
├─ Category breakdown
└─ Sales trends
```

**6. Demand Predictions**
```
GET /api/admin/predictions
├─ View predicted demand for all products
├─ Recommendations for stocking
└─ Urgency prioritization
```

**7. Customer Segmentation**
```
GET /api/admin/customer-segments
├─ High-value customers
├─ Frequent buyers
├─ At-risk customers
├─ New customers
└─ Each segment with metrics & recommendations
```

**8. Delivery Tracking**
```
GET /api/admin/deliveries
├─ View all deliveries
├─ Filter by status, delivery boy
├─ View map (optional)
└─ Performance metrics per delivery boy
```

---

## 📧 Email Notifications

### Email Service Architecture

**Service Used:** Nodemailer with Gmail/SMTP

**Configuration:**
```
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
```

### Email Triggers

**1. Order Confirmation (COD)**
```
When: Order created with COD payment
To: User's email
Subject: "Order Confirmed - Cash on Delivery"
Content:
  ├─ Order ID
  ├─ Items list (product, qty, price)
  ├─ Total amount
  ├─ Shipping address
  ├─ Instruction: "Keep ₹{amount} ready for delivery"
  └─ Order tracking link
```

**2. Payment Success (Online)**
```
When: Payment verified successfully via Razorpay
To: User's email
Subject: "Payment Successful - Order Confirmed"
Content:
  ├─ Order ID
  ├─ Payment ID (Razorpay reference)
  ├─ Items list
  ├─ Total amount paid
  ├─ Shipping address
  ├─ Order tracking info
  └─ Timeline
```

**3. Order Status Update (Future)**
```
When: Order status changes (APPROVED, OUT_FOR_DELIVERY, DELIVERED)
To: User's email
Subject: "Your Order is {status}"
Content:
  ├─ Current status
  ├─ Expected delivery date
  ├─ Delivery boy name & phone (if assigned)
  └─ Order details
```

### Email Template Structure

```html
╔════════════════════════════════════════════════════╗
║  HEADER (Company branding, logo)                   ║
╠════════════════════════════════════════════════════╣
║  MAIN CONTENT (Order details, items, total)        ║
╠════════════════════════════════════════════════════╣
║  CALL-TO-ACTION (Track order, view order)          ║
╠════════════════════════════════════════════════════╣
║  FOOTER (Company info, social media, support)      ║
╚════════════════════════════════════════════════════╝
```

### Email Service Methods

```javascript
// Send payment success email
sendPaymentSuccessEmail({
  to: user.email,
  orderId: order._id,
  paymentId: razorpay_payment_id,
  items: order.items,
  totalAmount: order.totalAmount,
  shippingAddress: order.shippingAddress
})

// Send order confirmation email (COD)
sendOrderConfirmationEmail({
  to: user.email,
  orderId: order._id,
  items: order.items,
  totalAmount: order.totalAmount,
  shippingAddress: order.shippingAddress,
  paymentMethod: 'COD'
})
```

---

## 🔄 Complete User Journey Example

### Scenario: Customer buys pepper online

```
┌─────────────────────────────────────────────────────┐
│ STEP 1: Registration                                │
├─────────────────────────────────────────────────────┤
│ • User visits /register                             │
│ • Fills: email, password, name, phone, address     │
│ • Firebase creates user account                     │
│ • POST /api/auth/sync-profile creates MongoDB user │
│ • User marked as "pending" (isActive: null)        │
│ • Admin approves user (isActive: true)             │
└─────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────┐
│ STEP 2: Browse Products                             │
├─────────────────────────────────────────────────────┤
│ • GET /api/products (view all)                      │
│ • Click product → shows details                     │
│ • POST /api/recommendations/track (browsing)       │
│ • View reviews (average rating, breakdown)          │
└─────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────┐
│ STEP 3: Add to Cart                                 │
├─────────────────────────────────────────────────────┤
│ • POST /api/cart/add {productId, quantity}         │
│ • Item added to Cart collection                     │
│ • Stock validated (available_stock ≥ quantity)     │
│ • Cart total recalculated                           │
└─────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────┐
│ STEP 4: Proceed to Checkout                         │
├─────────────────────────────────────────────────────┤
│ • GET /api/cart (view cart items)                  │
│ • Enter/select shipping address                     │
│ • Review order total                                │
└─────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────┐
│ STEP 5: Choose Payment Method                       │
├─────────────────────────────────────────────────────┤
│ Option A: ONLINE PAYMENT                            │
│ ├─ POST /api/payment/create-order                  │
│ ├─ Razorpay order created                          │
│ ├─ Frontend opens Razorpay modal                    │
│ ├─ User enters card details                         │
│ ├─ Payment processed                                │
│ ├─ POST /api/payment/verify                        │
│ ├─ Signature verified                               │
│ └─ Order created (payment.status: PAID)             │
│                                                     │
│ Option B: CASH ON DELIVERY                          │
│ ├─ POST /api/orders                                │
│ ├─ Order created (payment.status: PENDING)          │
│ └─ payment.method: COD                              │
└─────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────┐
│ STEP 6: Order Processing                            │
├─────────────────────────────────────────────────────┤
│ • Stock deducted for each product                   │
│ •   available_stock -= quantity                     │
│ •   stock status updated (In Stock → Low Stock)    │
│ • Cart cleared (items = [])                         │
│ • Email sent to user                                │
│ •   Subject: "Order Confirmed / Payment Successful" │
│ •   Contains: order ID, items, total, address      │
│ • User redirected to /payment-success page          │
└─────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────┐
│ STEP 7: Order Assignment                            │
├─────────────────────────────────────────────────────┤
│ • Admin views order in /admin/orders               │
│ • Admin assigns delivery boy                        │
│ • Order.deliveryBoy = delivery_boy_id               │
│ • Order.deliveryStatus = 'ASSIGNED'                 │
│ • Delivery boy gets notification                    │
└─────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────┐
│ STEP 8: Delivery Process                            │
├─────────────────────────────────────────────────────┤
│ • Delivery boy accepts order                        │
│ •   PATCH /delivery/orders/:id/accept              │
│ •   deliveryStatus: ASSIGNED → ACCEPTED             │
│ •   status: PENDING → APPROVED                      │
│ • Marks out for delivery                            │
│ •   PATCH /delivery/orders/:id/out-for-delivery    │
│ •   deliveryStatus: OUT_FOR_DELIVERY                │
│ • Delivers order                                    │
│ •   PATCH /delivery/orders/:id/delivered           │
│ •   deliveryStatus: DELIVERED                       │
│ •   status: DELIVERED                               │
│ • If COD, collects cash                             │
│ •   PATCH /delivery/orders/:id/payment/cod-accepted │
│ •   payment.status: PAID                            │
└─────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────┐
│ STEP 9: User Receives Order                         │
├─────────────────────────────────────────────────────┤
│ • Customer receives product                         │
│ • Sees order in /orders page (status: DELIVERED)   │
│ • Can leave review                                  │
│ •   POST /api/reviews {rating, comment, etc}       │
│ •   Complaint type if any                           │
└─────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────┐
│ STEP 10: Analytics & Recommendations                │
├─────────────────────────────────────────────────────┤
│ • Browsing history analyzed                         │
│ • GET /api/recommendations/products                 │
│ •   Returns similar products customer might like    │
│ • Admin views analytics                             │
│ •   Total orders, revenue, customer insights        │
│ • Demand prediction updated                         │
│ •   Black Pepper demand increased                   │
│ •   Admin considers restocking                      │
└─────────────────────────────────────────────────────┘
```

---

## 🔧 Additional Features

### 1. **Customer Segmentation**
```
Segments customers based on:
├─ Purchase frequency
├─ Total spent
├─ Last purchase date
├─ Product preferences
└─ Engagement level

Output:
├─ High-Value: Top 20% spenders
├─ Frequent: Buy regularly
├─ At-Risk: Inactive > 3 months
├─ New: Joined < 30 days
└─ One-Time: Only one purchase
```

### 2. **Refund Processing**
```
Refund Flow:
├─ Admin initiates refund
├─ Razorpay refund API called
├─ Amount reverted to customer card
├─ Takes 5-7 business days
├─ Stock is restored
└─ Order marked as CANCELLED

Refund Status Tracking:
├─ PENDING: Initiated but not processed
├─ PROCESSED: Money refunded to account
└─ FAILED: Error in refund (retry)
```

### 3. **Delivery Boy Areas**
```
Features:
├─ Assigned pincodes
├─ Assigned districts
├─ Status (OFFLINE, OPEN_FOR_DELIVERY, OUT_FOR_DELIVERY)
├─ Only see orders in assigned areas
└─ Performance tracking
```

### 4. **Product Filters**
```
Frontend can filter by:
├─ Type (Climber, Bush)
├─ Price range
├─ Stock status
├─ Rating
└─ Category
```

---

## 🎬 Summary

This PEPPER e-commerce platform is a comprehensive system that:

✅ **Manages Users** - Firebase auth + MongoDB profiles, multiple roles
✅ **Handles Products** - CRUD operations, stock management, inventory tracking
✅ **Processes Orders** - Multiple payment methods (COD, Online), complete order lifecycle
✅ **Integrates Payments** - Razorpay for online payments with signature verification
✅ **Coordinates Delivery** - Delivery boy assignment, status updates, COD collection
✅ **Collects Reviews** - Product ratings, complaints, editable reviews
✅ **Recommends Products** - Personalized suggestions based on browsing
✅ **Predicts Demand** - AI-based demand forecasting for inventory planning
✅ **Segments Customers** - Behavioral analysis for targeted marketing
✅ **Sends Emails** - Order confirmations, payment success notifications
✅ **Provides Analytics** - Comprehensive admin dashboard with insights

Every feature is built with security, scalability, and user experience in mind!
