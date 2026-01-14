# Hub Manager Notification System

## Overview
This system sends real-time notifications to hub managers when orders are placed or arrive at their hub. Hub managers can view notifications, mark them as read, and click on them to navigate to the respective district hub manager dashboard.

## Features
- 🔔 **Real-time Notifications**: Hub managers receive notifications when orders are placed or arrive at their hub
- 📱 **Notification Badge**: Visual indicator showing unread notification count
- 🎯 **Smart Navigation**: Clicking a notification automatically switches to the relevant district's hub dashboard
- ✅ **Mark as Read**: Individual or bulk marking of notifications as read
- 🔄 **Auto-refresh**: Notifications update when refreshing the dashboard

## Architecture

### Backend Components

#### 1. Notification Model (`backend/src/models/Notification.js`)
```javascript
{
  recipient: ObjectId,        // Hub manager user
  type: String,               // ORDER_PLACED, ORDER_ARRIVED, etc.
  title: String,              // Notification title
  message: String,            // Detailed message
  order: ObjectId,            // Related order
  hub: ObjectId,              // Related hub
  isRead: Boolean,            // Read status
  readAt: Date,               // When marked as read
  metadata: {
    district: String,         // For navigation
    orderStatus: String,
    customerName: String,
    orderId: String
  }
}
```

#### 2. Notification Service (`backend/src/services/notificationService.js`)
**Functions:**
- `createOrderPlacedNotification(order, hub)` - Creates notification when order is placed
- `createOrderArrivedNotification(order, hub)` - Creates notification when order arrives at hub
- `getUserNotifications(userId, options)` - Fetches user notifications
- `getUnreadCount(userId)` - Gets count of unread notifications
- `markNotificationAsRead(notificationId, userId)` - Marks single notification as read
- `markAllAsRead(userId)` - Marks all notifications as read
- `deleteOldNotifications(daysOld)` - Cleanup old read notifications

#### 3. Notification Routes (`backend/src/routes/notification.routes.js`)
**Endpoints:**
- `GET /api/notifications` - Get all notifications for logged-in user
  - Query params: `limit`, `skip`, `unreadOnly`
- `GET /api/notifications/unread-count` - Get unread count
- `PATCH /api/notifications/:notificationId/read` - Mark specific notification as read
- `PATCH /api/notifications/read-all` - Mark all as read

### Frontend Components

#### Hub Manager Dashboard Integration
**Location:** `frontend/src/pages/HubManagerDashboard.jsx`

**State:**
```javascript
const [notifications, setNotifications] = useState([]);
const [unreadCount, setUnreadCount] = useState(0);
const [showNotifications, setShowNotifications] = useState(false);
```

**Functions:**
- `fetchNotifications(firebaseUser)` - Fetches notifications and unread count
- `handleNotificationClick(notification)` - Handles click, marks as read, and navigates
- `handleMarkAllAsRead()` - Marks all notifications as read

**UI Components:**
- Notification bell button with badge in header
- Notification panel with list of notifications
- Clickable notification items
- "Mark all as read" functionality

#### District Selection Integration
**Location:** `frontend/src/pages/DistrictSelection.jsx`

Notifications are also available on the District Selection page, allowing hub managers to see notifications before selecting a district.

**Features:**
- Same notification UI as Hub Manager Dashboard
- Click notification to automatically select and navigate to that district
- Seamless integration with district selection flow
- Shows unread count badge on bell icon

**Functions:**
- `fetchNotifications()` - Fetches notifications when page loads
- `handleNotificationClick(notification)` - Marks as read and selects district
- `handleMarkAllAsRead()` - Marks all as read
- Calls `handleDistrictSelect(district)` to navigate to district dashboard

## Integration Points

### 1. Order Placement
**File:** `backend/src/routes/user.routes.js`

When a customer places an order:
```javascript
if (initialHub) {
  const populatedOrder = await Order.findById(order._id).populate('user', 'firstName lastName email');
  createOrderPlacedNotification(populatedOrder, initialHub).catch(err => {
    console.error('Failed to create hub notification:', err);
  });
}
```

### 2. Hub Scan-In
**File:** `backend/src/routes/hub.routes.js`

When a hub manager scans in a package:
```javascript
createOrderArrivedNotification(populatedOrder, hub).catch(err => {
  console.error('Failed to create hub arrival notification:', err);
});
```

## How It Works

### Notification Flow

1. **Order Placed**
   ```
   Customer places order
   → Order assigned to initial hub
   → createOrderPlacedNotification() called
   → Notification created for hub managers
   → Hub managers see notification badge
   ```

2. **Order Arrives at Hub**
   ```
   Order scanned in at hub
   → createOrderArrivedNotification() called
   → Notification created for hub managers
   → Hub managers get arrival notification
   ```

3. **Hub Manager Views Notification**
   ```
   Hub manager clicks bell icon
   → Notification panel opens
   → Shows all notifications (unread highlighted)
   → Unread count displayed
   ```

4. **Hub Manager Clicks Notification**
   ```
   Click notification
   → Mark as read via API
   → Extract district from metadata
   → Set selected district in sessionStorage
   → Refresh dashboard with selected district
   → Notification panel closes
   → Dashboard shows selected district's data
   ```

## District Navigation

When a notification is clicked:
1. Notification is marked as read
2. District is extracted from `notification.metadata.district`
3. District is stored in `sessionStorage.setItem('selectedDistrict', district)`
4. Hub data is stored in `sessionStorage.setItem('selectedHub', JSON.stringify(hub))`
5. Dashboard refreshes to show the selected district's orders
6. Hub manager can now manage orders for that district

## Notification Types

### ORDER_PLACED
- **Trigger**: Customer places an order
- **Recipients**: Hub managers of the initial hub
- **Message**: "A new order #XXXX from [Customer] has been placed to [Hub Name]"
- **Icon**: Package 📦

### ORDER_ARRIVED
- **Trigger**: Hub manager scans in a package
- **Recipients**: Hub managers of the destination hub
- **Message**: "Order #XXXX from [Customer] has arrived at [Hub Name]. Please scan to process."
- **Icon**: Truck 🚚

## Styling

**CSS File:** `frontend/src/pages/HubManagerDashboard.css`

Key styles:
- `.notification-btn` - Bell button with badge
- `.notification-badge` - Red badge showing unread count
- `.notification-panel` - Dropdown panel
- `.notification-item` - Individual notification
- `.notification-item.unread` - Highlighted unread style
- Responsive design for mobile devices

## API Authentication

All notification endpoints require authentication:
```javascript
headers: {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
}
```

Token obtained via Firebase: `await firebaseUser.getIdToken()`

## Error Handling

- Notifications are created asynchronously (non-blocking)
- Errors are logged but don't break the main flow
- Failed notification creation doesn't prevent order processing

## Testing

### Test Order Placement Notification
1. Place an order as a customer
2. Check hub manager dashboard
3. Verify notification appears with badge
4. Click notification to verify navigation

### Test Order Arrival Notification
1. Log in as hub manager
2. Scan in an order
3. Verify other hub managers see arrival notification
4. Click to navigate to district

### Test Mark as Read
1. View notifications
2. Click a notification (should mark as read)
3. Verify badge count decreases
4. Verify notification style changes

## Database Indexes

Efficient querying with indexes on:
- `recipient + isRead + createdAt` (compound index)
- `recipient`
- `type`
- `order`
- `hub`
- `isRead`

## Future Enhancements

1. **WebSocket/SSE Integration**
   - Real-time push notifications
   - No need to refresh for new notifications

2. **Email Notifications**
   - Send email when critical orders arrive
   - Daily summary emails

3. **SMS Notifications**
   - Urgent order notifications via SMS
   - Integration with Twilio or similar

4. **Push Notifications**
   - Browser push notifications
   - Mobile app push notifications

5. **Notification Preferences**
   - Let hub managers choose which notifications to receive
   - Set notification frequency preferences

6. **Notification History**
   - Archive old notifications
   - Search through notification history

## Configuration

No configuration required. The system works out of the box with:
- Firebase authentication
- MongoDB database
- Existing hub and order management system

## Files Created/Modified

### Created
- `backend/src/models/Notification.js` - Notification model schema
- `backend/src/services/notificationService.js` - Notification service functions
- `backend/src/routes/notification.routes.js` - Notification API routes

### Modified
- `backend/src/server.js` - Register notification routes
- `backend/src/routes/user.routes.js` - Add notification on order placement
- `backend/src/routes/hub.routes.js` - Add notification on hub scan-in
- `frontend/src/pages/HubManagerDashboard.jsx` - Add notification UI and logic
- `frontend/src/pages/HubManagerDashboard.css` - Add notification styles
- `frontend/src/pages/DistrictSelection.jsx` - Add notification UI and logic
- `frontend/src/pages/DistrictSelection.css` - Add notification styles

## Troubleshooting

### Notifications Not Appearing
1. Check if hub managers exist in the database
2. Verify hub has `managedBy` field or common hub manager exists
3. Check browser console for API errors
4. Verify notification routes are registered in server

### Notification Badge Not Updating
1. Click refresh button to manually update
2. Check API response for `/api/notifications/unread-count`
3. Verify token is valid

### Navigation Not Working
1. Verify `metadata.district` is set in notification
2. Check sessionStorage for `selectedDistrict`
3. Verify hub exists for that district

## Support

For issues or questions, check:
- Server logs for API errors
- Browser console for frontend errors
- Database for notification documents
- Network tab for API request/response details
