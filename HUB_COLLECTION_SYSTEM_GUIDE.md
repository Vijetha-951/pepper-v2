# Hub Collection System - Implementation Guide

## 🎯 Overview

The Hub Collection System allows users to select a hub from where they want to collect their orders instead of home delivery. All hubs have all products in their inventory, with Kottayam Hub serving as the main hub. When stock is unavailable at a hub, a restock request is automatically sent to the admin, who can fulfill it from the main hub. Once an order is ready, an OTP is generated and sent to the user for secure collection.

## 📋 Features

### 1. **Hub Selection**
- Users can choose from available hubs for order collection
- Real-time inventory availability checking
- Visual feedback on product availability at selected hub

### 2. **Inventory Management**
- Hub-specific inventory tracking
- Reserved quantity management for pending orders
- Automatic restock requests when items are unavailable

### 3. **Restock System**
- Automatic restock request generation
- Admin approval workflow
- Stock transfer from main hub (Kottayam) to requesting hub
- Priority-based request handling

### 4. **OTP-Based Collection**
- 6-digit OTP generation when order is ready
- Email notification to customer
- Secure verification at hub
- 24-hour OTP validity

## 🏗️ Architecture

### Database Models

#### 1. **HubInventory Model**
```javascript
{
  hub: ObjectId,                    // Reference to Hub
  product: ObjectId,                // Reference to Product
  quantity: Number,                 // Total quantity available
  reservedQuantity: Number,         // Quantity reserved for orders
  lastRestocked: Date,
  restockHistory: [{
    quantity: Number,
    source: String,                 // 'MAIN_HUB', 'ADMIN', 'PURCHASE'
    timestamp: Date,
    notes: String
  }]
}
```

#### 2. **RestockRequest Model**
```javascript
{
  requestingHub: ObjectId,
  product: ObjectId,
  requestedQuantity: Number,
  requestedBy: ObjectId,
  status: String,                   // 'PENDING', 'APPROVED', 'FULFILLED', 'REJECTED'
  priority: String,                 // 'LOW', 'MEDIUM', 'HIGH', 'URGENT'
  reason: String,
  approvedBy: ObjectId,
  approvedAt: Date,
  fulfilledAt: Date
}
```

#### 3. **Order Model (Updated)**
```javascript
{
  // ... existing fields
  deliveryType: String,             // 'HOME_DELIVERY' or 'HUB_COLLECTION'
  collectionHub: ObjectId,          // Hub selected for collection
  collectionOtp: String,            // 6-digit OTP
  collectionOtpGeneratedAt: Date,
  collectedAt: Date
}
```

### API Endpoints

#### Hub Inventory APIs (`/api/hub-inventory`)

| Endpoint | Method | Description | Auth |
|----------|--------|-------------|------|
| `/hubs/available` | GET | Get all active hubs | Public |
| `/hubs/:hubId/inventory` | GET | Get hub inventory | User |
| `/hubs/:hubId/check-availability` | POST | Check product availability | Public |
| `/admin/hubs/:hubId/inventory/initialize` | POST | Initialize hub inventory | Admin |
| `/admin/hubs/:hubId/inventory/:productId` | PUT | Update hub inventory | Admin |
| `/admin/restock-requests` | GET | Get all restock requests | Admin |
| `/hub/restock-requests` | GET | Get hub's restock requests | Hub Manager |
| `/hub/restock-requests` | POST | Create restock request | Hub Manager |
| `/admin/restock-requests/:requestId` | PATCH | Approve/Reject request | Admin |

#### Hub Collection APIs (`/api/hub-collection`)

| Endpoint | Method | Description | Auth |
|----------|--------|-------------|------|
| `/orders/hub-collection` | POST | Create hub collection order | User |
| `/orders/:orderId/ready-for-collection` | PATCH | Mark order ready & send OTP | Hub Manager/Admin |
| `/orders/:orderId/verify-collection` | POST | Verify OTP & complete collection | Hub Staff |
| `/hub/:hubId/ready-for-collection` | GET | Get ready orders | Hub Manager |
| `/hub/:hubId/collection-orders` | GET | Get all collection orders | Hub Manager |

## 🚀 Setup Instructions

### 1. Backend Setup

#### Install Dependencies
```bash
cd backend
npm install
```

#### Initialize Hub Inventories
Run this script to set up initial inventory for all hubs:

```javascript
node backend/src/scripts/initializeHubInventory.js
```

Or use the API endpoint (Admin only):
```bash
POST /api/hub-inventory/admin/hubs/:hubId/inventory/initialize
```

### 2. Frontend Setup

The following pages are already created:
- `/hub-selection` - Hub selection page
- `/collection-verification/:orderId` - OTP verification page

### 3. Email Configuration

Ensure email service is configured in `.env`:
```env
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

## 📱 User Flow

### Customer Journey

1. **Add Items to Cart**
   - Browse products and add to cart

2. **Choose Delivery Method**
   - At cart page, select "Hub Collection" button
   - Alternatively, select "Home Delivery" for traditional delivery

3. **Select Hub**
   - View available hubs with location information
   - Click on a hub to check product availability
   - System shows which items are available and which need restocking

4. **Confirm Order**
   - Review availability status
   - If items need restocking, restock requests are auto-created
   - Order is created with status "PENDING"

5. **Wait for Ready Notification**
   - Admin fulfills restock requests
   - Hub manager marks order as "READY_FOR_COLLECTION"
   - Customer receives OTP via email

6. **Collect Order**
   - Visit the selected hub
   - Provide 6-digit OTP to hub staff
   - Hub staff verifies OTP via system
   - Order marked as "DELIVERED"
   - Payment completed (if COD)

### Admin Workflow

1. **Monitor Restock Requests**
   - View pending restock requests
   - Check priority and quantities

2. **Approve Requests**
   - Verify main hub (Kottayam) has sufficient stock
   - Approve request
   - System automatically transfers stock

3. **Inventory Management**
   - View inventory levels across all hubs
   - Manually adjust stock if needed
   - Track restock history

### Hub Manager Workflow

1. **Create Restock Requests**
   - View hub inventory
   - Create manual restock requests for low stock
   - Set priority level

2. **Manage Collection Orders**
   - View pending collection orders
   - Check if all items are available
   - Mark orders as ready for collection

3. **Verify Collections**
   - Customer provides OTP
   - Verify OTP in system
   - Complete collection process

## 🔧 Configuration

### Main Hub Configuration

Set Kottayam as the main hub in your database:
```javascript
db.hubs.updateOne(
  { district: 'Kottayam' },
  { $set: { type: 'WAREHOUSE', isMain: true } }
);
```

### Stock Initialization

Initialize inventory with appropriate quantities:
- **Kottayam (Main Hub)**: Full stock (100+ units per product)
- **Other Hubs**: Initial stock (20-30 units per product)

## 📊 Inventory Management

### Stock Flow

1. **Order Placement**
   - System checks hub inventory
   - Reserves quantity for order
   - Creates restock request if insufficient

2. **Restock Process**
   - Admin approves request
   - Stock reduced from main hub
   - Stock added to requesting hub
   - Reserved quantity maintained

3. **Order Fulfillment**
   - OTP verification
   - Reserved quantity released
   - Actual quantity deducted
   - Order marked complete

### Stock Formulas

```
Available Stock = Total Stock - Reserved Stock
Can Fulfill = Available Stock >= Order Quantity
```

## 🔐 Security Features

1. **OTP Generation**
   - 6-digit random OTP
   - One-time use
   - 24-hour validity
   - Email delivery

2. **Verification**
   - User authentication required
   - OTP must match exactly
   - Expiry check
   - Single use enforcement

3. **Authorization**
   - Hub managers can only access their hub's data
   - Admin can access all hubs
   - Customer can only verify their own orders

## 📧 Email Notifications

### Collection OTP Email
Sent when order is ready for collection:
- Order details
- 6-digit OTP (prominently displayed)
- Collection hub information
- Collection instructions
- Validity period

### Restock Notification (Optional)
Can be implemented to notify:
- Hub managers when request is approved
- Admin when new requests are created

## 🧪 Testing Guide

### 1. Test Hub Selection
```bash
# Create test order
POST /api/hub-collection/orders/hub-collection
{
  "items": [
    { "productId": "...", "quantity": 2 }
  ],
  "collectionHubId": "...",
  "payment": { "method": "COD" }
}
```

### 2. Test Availability Check
```bash
POST /api/hub-inventory/hubs/:hubId/check-availability
{
  "items": [
    { "productId": "...", "quantity": 5 }
  ]
}
```

### 3. Test Restock Flow
```bash
# Create restock request
POST /api/hub-inventory/hub/restock-requests
{
  "hubId": "...",
  "productId": "...",
  "quantity": 50,
  "priority": "HIGH"
}

# Approve request (Admin)
PATCH /api/hub-inventory/admin/restock-requests/:requestId
{
  "action": "APPROVE",
  "notes": "Stock transferred from main hub"
}
```

### 4. Test OTP Flow
```bash
# Mark ready (Hub Manager)
PATCH /api/hub-collection/orders/:orderId/ready-for-collection

# Verify OTP
POST /api/hub-collection/orders/:orderId/verify-collection
{
  "otp": "123456"
}
```

## 🐛 Troubleshooting

### Common Issues

1. **Restock Request Fails**
   - Check main hub stock availability
   - Verify product exists in main hub inventory
   - Ensure admin permissions

2. **OTP Not Received**
   - Check email configuration
   - Verify email service credentials
   - Check spam folder

3. **Inventory Sync Issues**
   - Run inventory initialization script
   - Check reserved quantities
   - Verify stock calculations

## 📈 Future Enhancements

1. **Real-time Notifications**
   - WebSocket integration for instant updates
   - Push notifications for mobile

2. **Smart Restocking**
   - Predictive analytics for stock levels
   - Automatic restock triggers
   - Demand-based forecasting

3. **Multi-Hub Orders**
   - Allow collection from multiple hubs
   - Split orders by availability
   - Optimized routing

4. **QR Code Integration**
   - QR code instead of OTP
   - Faster verification
   - Contactless collection

## 📝 Notes

- Always initialize hub inventories before going live
- Kottayam hub should maintain higher stock levels
- Regular monitoring of restock requests is essential
- OTP emails require proper SMTP configuration
- Test the complete flow in staging before production deployment

## 🔗 Related Documentation

- [Hub Manager Guide](./COMMON_HUB_MANAGER_GUIDE.md)
- [Stock Management Guide](./PEPPER_ML_SUMMARY.md)
- [Order Tracking Implementation](./HUB_TRACKING_IMPLEMENTATION.md)

---

**Last Updated**: January 2026
**Version**: 1.0.0
