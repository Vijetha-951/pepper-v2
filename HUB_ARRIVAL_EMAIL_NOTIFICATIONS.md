# Hub Arrival Email Notifications

## Overview
This feature automatically sends email notifications to customers when their order reaches each hub during its delivery journey. The email includes:
- Current hub location and details
- Exact arrival date and time
- Order details
- Final delivery destination

## Implementation Details

### 1. Email Service Enhancement
**File:** `backend/src/services/emailService.js`

Added new function `sendHubArrivalEmail()` that sends a professionally formatted HTML email containing:
- Current hub name, district, and type
- Arrival timestamp (formatted in Indian locale)
- Order ID and amount
- Delivery destination address
- Branded PEPPER Store design matching existing emails

### 2. Hub Route Integration
**File:** `backend/src/routes/hub.routes.js`

Modified the `/scan-in` endpoint to:
- Capture the exact timestamp when order arrives at hub
- Populate user information (name, email) from database
- Send email notification asynchronously after successful scan-in
- Handle email failures gracefully without blocking the scan-in process

### 3. Email Trigger Flow
```
Order scanned at Hub (POST /api/hub/scan-in)
    ↓
Save to database (trackingTimeline updated)
    ↓
Populate order with user & hub details
    ↓
Send hub arrival email (async, non-blocking)
    ↓
Return success response to hub manager
```

## Email Template Features

### Design Elements
- ✅ Responsive HTML design for all devices
- 📱 Mobile-friendly layout
- 🎨 Branded PEPPER Store colors (green gradient)
- 📍 Clear visual hierarchy emphasizing current location
- ⏰ Localized date/time formatting (Indian Standard Time)

### Information Displayed
1. **Current Location Section** (highlighted in green)
   - Hub name
   - District
   - Hub type (Regional/Local)

2. **Arrival Time**
   - Full date and time in readable format
   - Example: "Saturday, 4 January 2026 at 2:30 PM"

3. **Order Details**
   - Order ID
   - Number of items
   - Total amount

4. **Delivery Destination**
   - Complete shipping address
   - Highlighted in yellow for visibility

## Configuration

### Environment Variables Required
```env
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_SERVICE=gmail
```

### For Gmail Users
1. Enable 2-Factor Authentication on your Google Account
2. Generate an App Password:
   - Go to Google Account → Security → 2-Step Verification
   - Scroll down to "App passwords"
   - Generate password for "Mail" app
3. Use the generated password in `EMAIL_PASS`

## Testing

### Manual Test Script
Run the test script to verify email functionality:
```bash
cd backend
node scripts/testHubArrivalEmail.js
```

The script will:
- Send a test email with sample data
- Display success/failure status
- Show message ID if successful
- Provide troubleshooting hints if configuration is missing

### Integration Testing
To test in production flow:
1. Place an order through the system
2. Have hub manager scan-in the order at first hub
3. Check customer email for notification
4. Repeat as order moves through subsequent hubs

## Error Handling

### Email Service Unavailable
- System logs warning but doesn't fail the scan-in operation
- Hub manager can still process orders
- Emails will be skipped silently

### Invalid User Email
- Checks for user email existence before attempting to send
- Logs error if email sending fails
- Scan-in operation completes successfully regardless

### Missing Environment Variables
- Service initializes with null transporter
- All email operations return gracefully with warnings
- Application continues functioning without email features

## User Experience

### Customer Perspective
1. **Transparency**: Customers know exactly where their package is
2. **Timely Updates**: Email sent immediately when package arrives
3. **Peace of Mind**: Regular updates throughout delivery journey
4. **Professional Communication**: Branded, well-designed emails

### Hub Manager Perspective
1. **No Extra Steps**: Emails sent automatically during normal scan-in
2. **Non-Blocking**: Email sending doesn't slow down operations
3. **Reliable**: Scan-in succeeds even if email fails

## Email Frequency

Emails are sent at each hub arrival:
- **Central Hub**: First notification when order enters distribution system
- **Regional Hub**: Notification when reaching regional distribution center
- **Local Hub**: Final hub notification before out-for-delivery

Customers receive multiple emails tracking the complete journey of their order.

## Technical Specifications

### Email Headers
- **From:** "PEPPER Store" <configured-email>
- **Subject:** "📍 Order Update - Package Arrived at [Hub Name]"
- **Content-Type:** text/html; charset=utf-8

### Async Operation
- Email sending uses `.catch()` pattern
- Errors logged to console but not thrown
- Main request returns immediately after database save

### Database Updates
- `trackingTimeline` array includes timestamp for each hub arrival
- `currentHub` field updated to reflect current location
- All updates saved before email is triggered

## Future Enhancements

Potential improvements:
1. SMS notifications for critical updates
2. Push notifications via mobile app
3. Estimated delivery time calculations
4. Real-time tracking dashboard link in email
5. User preferences for notification frequency
6. Multi-language email support

## Troubleshooting

### Email Not Received
1. Check spam/junk folder
2. Verify EMAIL_USER and EMAIL_PASS in .env
3. Check console logs for error messages
4. Run test script to verify configuration
5. Ensure user has valid email in database

### Gmail-Specific Issues
- Use App Password, not regular password
- Enable "Less secure app access" (if not using 2FA)
- Check Gmail sending limits (500 emails/day for free accounts)

### Other Email Providers
Configure `EMAIL_SERVICE` appropriately:
- Gmail: `gmail`
- Outlook: `outlook`
- Yahoo: `yahoo`
- Custom SMTP: Modify transporter configuration in emailService.js

## Code Locations

### Key Files Modified
1. `backend/src/services/emailService.js` - Email template and sending logic
2. `backend/src/routes/hub.routes.js` - Integration with scan-in endpoint
3. `backend/scripts/testHubArrivalEmail.js` - Test script

### Related Files
- `backend/src/models/Order.js` - Order schema with tracking fields
- `backend/src/models/Hub.js` - Hub information
- `backend/src/models/User.js` - User email details

## Support

For issues or questions:
1. Check console logs for detailed error messages
2. Verify environment configuration
3. Run test script for diagnostics
4. Review email service provider settings
