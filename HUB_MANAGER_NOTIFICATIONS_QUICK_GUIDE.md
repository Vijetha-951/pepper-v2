# Hub Manager Notifications - Quick Reference

## 🚀 Quick Start

### For Hub Managers
1. Log in to Hub Manager Dashboard
2. Look for the bell icon (🔔) in the top-right header
3. Click the bell icon to view notifications
4. Click any notification to jump to that district's dashboard
5. Click "Mark all as read" to clear all notifications

## 📋 Notification Types

| Type | When It Appears | What To Do |
|------|----------------|------------|
| **ORDER_PLACED** 📦 | Customer places new order to your hub | Review order and prepare for arrival |
| **ORDER_ARRIVED** 🚚 | Package arrives at your hub | Scan in the package to process |

## 🔑 Key Features

### Notification Badge
- **Red badge** shows count of unread notifications
- Updates automatically when viewing notifications
- Disappears when all notifications are read

### Notification Panel
- Click bell icon to open/close
- Unread notifications have **blue background**
- Shows most recent 10 notifications
- Timestamp shows when notification was created

### District Navigation
- **Clicking a notification** automatically switches to that district
- Dashboard reloads with the selected district's orders
- You can manage orders for that district immediately
- Use "Switch District" to change back

## 🎯 Common Actions

### View Notifications
```
1. Click bell icon (🔔)
2. Panel opens showing all notifications
3. Unread ones are highlighted in blue
```

### Respond to New Order
```
1. See notification badge on bell icon
2. Click bell to open notifications
3. Click "New Order Placed" notification
4. Dashboard switches to that district
5. View order in "Orders Left to Scan" section
```

### Mark Notification as Read
```
Option 1: Click the notification (auto-marks as read)
Option 2: Click "Mark all as read" button
```

### Navigate to District from Notification
```
1. Click any notification
2. System extracts district information
3. Dashboard automatically switches to that district
4. You can now manage orders for that district
```

## 🔄 Refresh Notifications

Click the **Refresh** button in the header to:
- Update order list
- Fetch new notifications
- Update unread count

## 📱 Mobile Experience

On mobile devices:
- Bell icon remains accessible
- Notification panel adapts to screen size
- Swipe-friendly interface
- All features work the same

## ⚙️ API Endpoints (For Developers)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/notifications` | GET | Get all notifications |
| `/api/notifications/unread-count` | GET | Get unread count |
| `/api/notifications/:id/read` | PATCH | Mark as read |
| `/api/notifications/read-all` | PATCH | Mark all as read |

## 🐛 Troubleshooting

### "No notifications appear"
- Verify you're logged in as hub manager
- Check if any orders have been placed
- Click Refresh button
- Check browser console for errors

### "Badge count doesn't update"
- Click Refresh button
- Close and reopen notification panel
- Refresh the page

### "Clicking notification doesn't navigate"
- Verify notification has district information
- Check if hub exists for that district
- Try manually selecting district via "Switch District"

### "Notifications show but orders don't"
- Verify you're viewing correct tab (Active/Dispatched)
- Check order status filters
- Search for specific order ID

## 💡 Tips

1. **Check notifications regularly** to stay updated on new orders
2. **Use district navigation** to quickly jump between hubs
3. **Mark all as read** periodically to keep notifications clean
4. **Refresh frequently** during busy periods for latest updates
5. **Mobile-friendly** - works great on tablets and phones

## 🎨 Visual Indicators

| Indicator | Meaning |
|-----------|---------|
| Red badge on bell | Unread notifications exist |
| Blue background | Notification is unread |
| White background | Notification is read |
| Blue dot | Unread indicator |
| No badge | All notifications read |

## 📊 Notification Data Included

Each notification contains:
- **Title**: Brief summary
- **Message**: Detailed information
- **Timestamp**: When it was created
- **District**: Which hub/district
- **Order ID**: Related order
- **Customer**: Who placed the order
- **Amount**: Order total

## 🔐 Security

- All notifications are user-specific
- Only hub managers can see notifications
- Authentication required via Firebase
- District switching respects permissions

## 📞 Support

If notifications aren't working:
1. Check your hub manager permissions
2. Verify hub assignment in database
3. Contact system administrator
4. Check server logs for errors

---

**Last Updated:** January 2026  
**Version:** 1.0.0
