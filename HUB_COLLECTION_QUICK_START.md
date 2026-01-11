# Hub Collection System - Quick Start Guide

## 🚀 Quick Setup (5 Minutes)

### Step 1: Initialize Hub Inventories
Run this command to set up inventory for all hubs:

```bash
node backend/src/scripts/initializeHubInventory.js
```

This will:
- ✅ Create inventory entries for all products at all hubs
- ✅ Kottayam hub gets full stock (100+ units per product)
- ✅ Other hubs get 20% of available stock (max 50 units)

### Step 2: Restart Backend Server
```bash
cd backend
npm start
```

### Step 3: Test the Feature

#### A. Customer Flow
1. **Login as a customer**
   - Go to http://localhost:3000/login
   - Use any customer account

2. **Add products to cart**
   - Browse products at http://localhost:3000/add-products
   - Add items to cart

3. **Select Hub Collection**
   - Go to cart: http://localhost:3000/cart
   - Click **"📍 Hub Collection"** button
   - Choose a hub from the list
   - System checks availability
   - Complete checkout

4. **Wait for Ready Email**
   - Hub manager will mark order ready
   - You'll receive an OTP via email

5. **Collect Order**
   - Visit hub with OTP
   - Staff verifies OTP
   - Collect your order

#### B. Hub Manager Flow
1. **Login as hub manager**
   - Email: hubmanager@pepper.com
   - Password: pepper123

2. **View Collection Orders**
   - Go to hub dashboard
   - See orders waiting for collection

3. **Check Stock & Create Restock**
   - If stock is low, create restock request
   - Admin will fulfill from main hub

4. **Mark Order Ready**
   - Once stock is available
   - Mark order as ready for collection
   - OTP is auto-generated and sent

#### C. Admin Flow
1. **Monitor Restock Requests**
   - View pending requests in admin panel
   - See which hubs need stock

2. **Approve Requests**
   - Click approve
   - Stock automatically transferred from Kottayam hub
   - Requesting hub inventory updated

## 📋 Feature Checklist

### Backend Setup
- [x] HubInventory model created
- [x] RestockRequest model created
- [x] Order model updated (deliveryType, collectionHub, collectionOtp)
- [x] Hub inventory API routes added
- [x] Hub collection API routes added
- [x] Email service for collection OTP
- [x] Routes registered in server.js

### Frontend Setup
- [x] HubSelection page created
- [x] CollectionVerification page created
- [x] Cart page updated (hub collection button)
- [x] Routes added to App.jsx

### Database Setup
- [ ] Run initialization script (Do this now!)

## 🎯 Key Endpoints

### For Customers
```javascript
// Get available hubs
GET /api/hub-inventory/hubs/available

// Check product availability at hub
POST /api/hub-inventory/hubs/:hubId/check-availability
Body: { items: [{ productId, quantity }] }

// Create collection order
POST /api/hub-collection/orders/hub-collection
Body: { items, collectionHubId, payment }

// Verify collection OTP
POST /api/hub-collection/orders/:orderId/verify-collection
Body: { otp: "123456" }
```

### For Hub Managers
```javascript
// Get collection orders for hub
GET /api/hub-collection/hub/:hubId/collection-orders

// Mark order ready (generates OTP)
PATCH /api/hub-collection/orders/:orderId/ready-for-collection

// Create restock request
POST /api/hub-inventory/hub/restock-requests
Body: { hubId, productId, quantity, priority }
```

### For Admin
```javascript
// View all restock requests
GET /api/hub-inventory/admin/restock-requests

// Approve/Reject restock
PATCH /api/hub-inventory/admin/restock-requests/:requestId
Body: { action: "APPROVE" } // or "REJECT"

// Initialize hub inventory
POST /api/hub-inventory/admin/hubs/:hubId/inventory/initialize
```

## 🧪 Quick Test Scenario

### Test Case: Complete Hub Collection Flow

1. **Initialize** (Once)
   ```bash
   node backend/src/scripts/initializeHubInventory.js
   ```

2. **Create Order** (Customer)
   - Login as customer
   - Add products to cart
   - Click "Hub Collection"
   - Select "Ernakulam Hub"
   - Place order

3. **Handle Low Stock** (Hub Manager)
   - If any items unavailable
   - Restock request auto-created
   - Admin approves
   - Stock transferred

4. **Mark Ready** (Hub Manager)
   - Check all items available
   - Mark order ready
   - Customer receives OTP email

5. **Collect** (Customer)
   - Customer visits hub
   - Provides OTP: e.g., "123456"
   - Staff verifies in system
   - Order marked delivered

## ⚠️ Important Notes

1. **Email Configuration Required**
   ```env
   EMAIL_SERVICE=gmail
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-app-password
   ```

2. **Main Hub Stock**
   - Kottayam hub must always have sufficient stock
   - Automatically gets 100+ units per product
   - Other hubs restock from Kottayam

3. **OTP Validity**
   - OTPs are valid for 24 hours
   - One-time use only
   - Sent via email

4. **Stock Management**
   - Reserved stock is held for orders
   - Available = Total - Reserved
   - Restock increases both total and available

## 🔧 Troubleshooting

### Issue: Hub inventory not showing
```bash
# Re-run initialization
node backend/src/scripts/initializeHubInventory.js
```

### Issue: Restock fails
- Check if Kottayam hub has enough stock
- Verify product exists in main hub inventory
- Ensure admin permissions

### Issue: OTP not received
- Check EMAIL_USER and EMAIL_PASS in .env
- Verify email service is running
- Check spam folder

### Issue: Cannot select hub
- Ensure hubs are marked as active (isActive: true)
- Run: `db.hubs.updateMany({}, { $set: { isActive: true } })`

## 📊 Database Checks

```javascript
// Check hub inventories
db.hubinventories.find().count()
// Should be: (number of hubs) × (number of products)

// Check if Kottayam has stock
db.hubinventories.find({ 
  hub: ObjectId("...kottayam-hub-id..."),
  quantity: { $gt: 0 }
}).count()

// View restock requests
db.restockrequests.find({ status: "PENDING" })
```

## 🎉 Success Indicators

You know it's working when:
- ✅ Hub selection page shows all hubs
- ✅ Availability check shows product quantities
- ✅ Restock requests are auto-created for unavailable items
- ✅ Admin can approve/reject restock requests
- ✅ Customer receives OTP email when order is ready
- ✅ OTP verification works at collection

## 📚 Next Steps

1. **Customize Hub Locations**
   - Update hub addresses in database
   - Add maps/directions

2. **Set Business Hours**
   - Add opening/closing times to hubs
   - Display on hub selection page

3. **Add Analytics**
   - Track most popular collection hubs
   - Monitor restock patterns
   - Optimize inventory levels

4. **Mobile Optimization**
   - Test on mobile devices
   - Add QR code scanning (future)
   - Push notifications

## 📞 Support

For issues or questions:
1. Check the detailed guide: [HUB_COLLECTION_SYSTEM_GUIDE.md](./HUB_COLLECTION_SYSTEM_GUIDE.md)
2. Review API documentation
3. Check database schema
4. Test with curl/Postman

---

**Ready to go!** 🚀 Run the initialization script and start testing!
