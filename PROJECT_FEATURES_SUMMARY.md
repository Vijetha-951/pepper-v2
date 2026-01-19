# 📊 PROJECT FEATURES BY DASHBOARD

---

## **1. 👥 CUSTOMER/USER DASHBOARD** (`/user/dashboard`)

**Shopping Features:**
- Browse products by category and district
- Add products to cart
- View cart with quantity adjustments
- Choose delivery method:
  - **Home Delivery** (standard logistics)
  - **Hub Collection** (automatic hub assignment by pincode)
- **Automatic Hub Assignment:**
  - Enter 6-digit pincode
  - System maps pincode to GPS coordinates (180+ Kerala pincodes supported)
  - Calculates real distance to all hubs using Haversine formula
  - Automatically assigns the closest hub
  - Shows distance information (e.g., "3.42 km away")
- Checkout with payment options:
  - Cash on Delivery (COD)
  - Online Payment (Razorpay integration)
- Track orders in real-time
- View order history
- Review and rate products
- View order details with tracking timeline
- OTP verification for hub collection pickup

**Profile Management:**
- Complete user profile
- Manage delivery addresses
- View account information
- Password reset via email

---

## **2. 🏢 HUB MANAGER DASHBOARD** (`/hub-manager/dashboard`)

**Hub Collection Management:**
- **Two-Step Hub Collection Process:**
  1. **Mark Arrived** - Confirm package at hub
     - Validates hub inventory
     - Reserves stock
     - Sends email notification to customer
  2. **Generate OTP** - Ready for collection
     - Creates 6-digit OTP
     - Sends OTP email to customer
  3. **Verify OTP** - Complete collection
     - Customer verification
     - Fulfills inventory
     - Marks as delivered

**Inventory Management:**
- View hub inventory levels
- Track available vs reserved stock
- Monitor low stock alerts

**Order Management:**
- View all hub collection orders
- Filter by status (Pending, Approved, Arrived, Ready)
- Search orders by ID or customer
- View order details

**Notifications:**
- Real-time notifications for:
  - New orders assigned to hub
  - Restock approvals
  - Order updates
- Mark notifications as read
- Delete notifications

---

## **3. 🚚 DELIVERY BOY DASHBOARD** (`/deliveryboy/dashboard`)

**Order Delivery:**
- View assigned delivery orders
- Update delivery status
- Mark orders as delivered
- View delivery route on map
- Track current location

**Status Management:**
- Set availability status (Available/Busy/Offline)
- View assigned hub
- View delivery history

---

## **4. ⚙️ ADMIN DASHBOARD** (Multiple specialized pages)

### **A. User Management** (`/admin/dashboard`, `/admin-users`)
- View all users (customers, hub managers, delivery boys)
- Filter by role
- Search users
- View user details
- Manage user accounts

### **B. Product Management** (`/admin-products`)
- Add new pepper products
- Edit existing products
- Update product prices
- Manage product images
- Set product stock levels
- Categorize products
- Delete products

### **C. Stock Management** (`/admin-stock`)
- Monitor main warehouse inventory
- View stock levels across all products
- Update stock quantities
- Track stock movements
- Low stock alerts

### **D. Hub Inventory Management** (`/admin/hub-inventory`)
- **Hub Inventory Tab:**
  - Select hub to manage
  - View inventory for each hub
  - Monitor available vs reserved stock
  
- **Restock Requests Tab:**
  - View all restock requests from hubs
  - Filter by status (Pending, Fulfilled, Rejected)
  - **Approve/Reject requests** with custom modal
  - Transfer stock from Kottayam Hub to requesting hub
  - Track restock history
  - Priority levels (Urgent, High, Medium, Low)
  - Auto-notification to requesting hub manager
  - **Auto-update orders** when restock fulfilled

### **E. All Orders Management** (`/admin/orders`)
- View all orders across the system
- Filter by:
  - Order status
  - Payment status (Paid/Pending)
  - Delivery type (Home/Hub Collection)
  - Date range
- Search by order ID or customer name
- View order details
- **Delete orders** (admin only)
- Export order data
- Dashboard summary:
  - Today's orders count
  - Monthly revenue
  - Pending orders count
  - Pending payment amount

### **F. Order Details** (`/admin/orders/:id`)
- Complete order information
- Customer details
- Product items
- Payment information
- Delivery address
- Tracking timeline
- Hub collection details (if applicable)
- Update order status

### **G. Delivery Status Tracking** (`/admin-delivery-status`)
- Monitor all deliveries in real-time
- Track delivery boy locations
- View delivery routes
- Delivery performance metrics
- Assign orders to delivery boys

### **H. Machine Learning Dashboards:**

**Demand Prediction** (`/admin-demand-predictions`)
- Predict future product demand
- Forecast sales trends
- Optimize stock levels based on predictions
- View prediction accuracy
- Historical demand analysis

**Customer Segmentation** (`/admin-customer-segmentation`)
- Segment customers by behavior
- RFM analysis (Recency, Frequency, Monetary)
- Customer lifetime value
- Targeted marketing insights

**Review Sentiment Analysis** (`/admin/reviews`)
- Analyze customer review sentiments
- Positive/Negative sentiment classification
- Product satisfaction scores
- Trend analysis
- Customer feedback insights

**Cancellation Prediction (SVM)** 
- Predict order cancellation probability
- Identify at-risk orders
- Take preventive actions
- Cancellation pattern analysis

---

## **5. 📦 COMMON FEATURES (All Roles)**

**Authentication:**
- Email/Password login
- Google OAuth integration
- Firebase authentication
- Password reset via email
- Complete profile after registration

**Notifications System:**
- Real-time notifications
- Role-specific notifications
- Unread count badge
- Mark as read/unread
- Delete notifications
- Notification types:
  - Order placed
  - Order status updates
  - Restock requests
  - Delivery assignments
  - Hub arrivals

**Maps Integration:**
- Hub locations on map
- Delivery routes
- GPS coordinates
- District-based filtering

---

## **6. 🔧 SPECIAL WORKFLOWS**

**Hub Collection Flow:**
1. Customer selects "Hub Collection" in cart
2. **Enter pincode (6 digits)**
3. **System automatically assigns nearest hub** using:
   - Local pincode-to-GPS coordinates database (180+ Kerala pincodes)
   - Haversine formula for accurate distance calculation
   - Real-time distance measurement to all active hubs
4. View assigned hub details with distance at checkout
5. Place order (COD or Online Payment)
6. Order created with inventory check
7. If stock unavailable → Restock request created automatically
8. Admin approves restock → Order auto-updates to APPROVED
9. Hub Manager marks as "Arrived at Hub"
10. Hub Manager generates OTP when ready
11. Customer receives OTP via email
12. Customer verifies OTP at assigned hub
13. Order marked as delivered

**Payment Verification:**
- Razorpay payment gateway integration
- Signature verification for security
- Automatic order creation after payment
- Payment failure handling
- Hub collection payment support

**Stock Reservation System:**
- Automatic stock reservation on order
- Release reservation on cancellation
- Hub-specific inventory tracking
- Available vs Reserved quantities
- Prevents overselling

---

## **7. 📧 EMAIL NOTIFICATIONS**

- Order confirmation emails
- Payment success emails
- Hub arrival notifications
- OTP for collection
- Restock request alerts
- Delivery updates

---

## **8. 🛡️ ADMIN-ONLY FEATURES**

- Delete any order from system
- Approve/reject restock requests
- Manage all users
- Access all dashboards
- View system-wide analytics
- ML model predictions
- Hub inventory transfers

---

**Total Dashboards:** 10+ specialized dashboards
**Total Features:** 100+ features across all roles
**User Roles:** 4 (Customer, Hub Manager, Delivery Boy, Admin)
**Payment Methods:** 2 (COD, Online via Razorpay)
**Delivery Types:** 2 (Home Delivery, Hub Collection)
**ML Models:** 4 (Demand Prediction, Customer Segmentation, Sentiment Analysis, Cancellation Prediction)
