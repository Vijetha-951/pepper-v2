# Hub Manager Notifications - Visual User Flow

## 📍 Notification Locations

Notifications are now available in **TWO locations**:

### 1. District Selection Page
✅ **When**: Hub manager first logs in or wants to switch districts  
✅ **Where**: Top-right corner, next to Logout button  
✅ **Action**: Click notification → Automatically select that district → Navigate to dashboard

### 2. Hub Manager Dashboard
✅ **When**: After selecting a district  
✅ **Where**: Top-right corner in header  
✅ **Action**: Click notification → Switch to that notification's district → Refresh dashboard

---

## 🔔 User Flow Scenarios

### Scenario 1: New Order at District Selection

```
1. Hub manager logs in
   ↓
2. Lands on "Select Your District" page
   ↓
3. Sees notification bell with red badge (e.g., "3")
   ↓
4. Clicks bell icon
   ↓
5. Notification panel opens showing:
   - "New Order Placed at Ernakulam"
   - "Order arrived at Idukki"
   - etc.
   ↓
6. Clicks "New Order Placed at Ernakulam" notification
   ↓
7. System:
   - Marks notification as read
   - Extracts district: "Ernakulam"
   - Selects Ernakulam district
   - Navigates to Hub Manager Dashboard
   ↓
8. Hub manager now viewing Ernakulam hub dashboard
   ↓
9. Can immediately see and manage the new order
```

### Scenario 2: Multiple Districts with Notifications

```
Hub Manager State:
- Currently viewing Kottayam district dashboard
- New order arrives at Thiruvananthapuram

Flow:
1. Notification badge appears/updates (count increases)
   ↓
2. Hub manager clicks bell icon
   ↓
3. Sees notification: "New Order Placed at Thiruvananthapuram"
   ↓
4. Clicks the notification
   ↓
5. Dashboard automatically switches to Thiruvananthapuram
   ↓
6. Can now manage the new order in Thiruvananthapuram
   ↓
7. Can switch back to Kottayam using "Switch District" button
```

### Scenario 3: Check All Notifications Before Selecting District

```
1. Hub manager logs in
   ↓
2. On District Selection page, sees badge: "5 notifications"
   ↓
3. Clicks bell to review all notifications first
   ↓
4. Reads through all 5 notifications:
   - 2 orders in Ernakulam
   - 1 order in Idukki
   - 2 orders in Kottayam
   ↓
5. Decides to handle Ernakulam first (most urgent)
   ↓
6. Clicks Ernakulam notification
   ↓
7. Navigates to Ernakulam dashboard
   ↓
8. After handling, clicks "Switch District"
   ↓
9. Returns to District Selection
   ↓
10. Notification badge now shows "3" (Ernakulam ones are read)
    ↓
11. Selects next district to manage
```

---

## 🎨 Visual Elements

### Notification Bell Button
```
┌─────────────────────────┐
│  🔔                     │  ← Bell icon
│     ⓿ 3                │  ← Red badge (when unread > 0)
└─────────────────────────┘
```

### Notification Panel
```
┌────────────────────────────────────────┐
│  Notifications          [Mark all read] [✕]  │
├────────────────────────────────────────┤
│  📦  New Order at Ernakulam            │ ← Unread (blue)
│      Order #abc123 from John           │
│      10 minutes ago               ⚫   │
├────────────────────────────────────────┤
│  🚚  Order Arrived at Idukki           │ ← Unread (blue)
│      Package arrived for scanning      │
│      25 minutes ago               ⚫   │
├────────────────────────────────────────┤
│  ✓  Order Dispatched                   │ ← Read (white)
│      Package sent to next hub          │
│      2 hours ago                       │
└────────────────────────────────────────┘
```

### Color Coding
- **Unread**: Light blue background (#eef2ff)
- **Read**: White background
- **Badge**: Red (#ef4444)
- **Dot**: Blue for unread (#667eea)

---

## 📱 Mobile Experience

### On Mobile Devices:
```
┌─────────────────────────┐
│  Select Your District   │
│  ──────────────────     │
│  [🔔 3]  [Logout]      │  ← Buttons stack horizontally
└─────────────────────────┘

Notification Panel:
- Full width (with margins)
- Scrollable list
- Touch-friendly tap targets
- Adaptive positioning
```

---

## 🔄 Notification States

### Badge Display Logic
| Unread Count | Badge Display |
|--------------|---------------|
| 0            | No badge      |
| 1-9          | Shows number  |
| 10+          | Shows number  |

### Notification Item States
| State   | Background | Indicator | Border |
|---------|------------|-----------|--------|
| Unread  | Blue       | Blue dot  | None   |
| Read    | White      | None      | None   |
| Hover   | Darker     | N/A       | None   |

---

## 🎯 Key User Actions

### At District Selection Page

| Action | Result |
|--------|--------|
| Click bell icon | Open/close notification panel |
| Click notification | Mark as read → Select district → Navigate |
| Click "Mark all read" | All notifications marked as read |
| Click X button | Close notification panel |
| Select district card | Navigate to that district (normal flow) |

### At Hub Manager Dashboard

| Action | Result |
|--------|--------|
| Click bell icon | Open/close notification panel |
| Click notification | Mark as read → Switch district → Refresh |
| Click "Mark all read" | All notifications marked as read |
| Click Refresh | Update notifications and orders |
| Click "Switch District" | Return to District Selection page |

---

## 💡 UX Benefits

### Quick Access
- ✅ No need to navigate to specific page
- ✅ Available at point of decision (district selection)
- ✅ One-click navigation to relevant district

### Clear Visual Feedback
- ✅ Badge shows unread count at a glance
- ✅ Blue highlight for unread items
- ✅ Icons indicate notification type
- ✅ Timestamps show recency

### Efficient Workflow
- ✅ Review all notifications before committing to a district
- ✅ Jump directly to district with new orders
- ✅ No manual district switching needed
- ✅ Context preserved during navigation

### Mobile-Friendly
- ✅ Responsive design
- ✅ Touch-optimized
- ✅ Full-width panels
- ✅ Easy to use on tablets

---

## 🔍 Technical Details

### Data Flow

```
Order Placed
    ↓
Notification Created (Backend)
    ↓
User Opens Page (District Selection/Dashboard)
    ↓
fetchNotifications() called
    ↓
GET /api/notifications
GET /api/notifications/unread-count
    ↓
State Updated (notifications, unreadCount)
    ↓
Badge Appears
    ↓
User Clicks Notification
    ↓
handleNotificationClick()
    ↓
PATCH /api/notifications/:id/read
    ↓
Extract district from metadata
    ↓
handleDistrictSelect(district) OR navigate
    ↓
Dashboard loads with selected district
```

### Session Storage

When notification is clicked:
```javascript
sessionStorage.setItem('selectedDistrict', 'Ernakulam');
sessionStorage.setItem('selectedHub', JSON.stringify(hubObject));
```

This ensures:
- District persists across page refreshes
- Hub data available immediately
- No extra API calls needed

---

## 🎨 Design Consistency

Both pages (District Selection & Dashboard) share:
- Same notification UI components
- Same color scheme
- Same interaction patterns
- Same notification types
- Same badge styling

This creates a **consistent user experience** across the application.

---

## 📊 Notification Priority

Notifications ordered by:
1. **Recency**: Newest first
2. **Status**: Unread before read
3. **Type**: ORDER_PLACED > ORDER_ARRIVED

---

## ✨ Best Practices for Hub Managers

1. **Check notifications first** before selecting a district
2. **Handle urgent orders** (newly placed) before others
3. **Mark all as read** periodically to keep panel clean
4. **Use district switching** efficiently via notifications
5. **Refresh regularly** during peak hours

---

## 🚀 Future Enhancements (Roadmap)

- [ ] Real-time updates via WebSocket
- [ ] Sound notifications for new alerts
- [ ] Filter notifications by type
- [ ] Notification history/archive
- [ ] Desktop push notifications
- [ ] Email digest of unread notifications
- [ ] Priority/urgency levels
- [ ] Bulk actions on notifications

---

**Last Updated**: January 11, 2026  
**Version**: 1.0.0
