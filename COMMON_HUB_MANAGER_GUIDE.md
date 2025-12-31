# Common Hub Manager Login System

## Overview
This system allows all hub managers to use a single set of credentials to log in. After logging in, they select their district from a visual district selection page, and then access their district-specific dashboard.

## Architecture Changes

### 1. Common Hub Manager Account
- **Email**: `hubmanager@pepper.com`
- **Password**: `pepper123`
- **Role**: `hubmanager`
- **Hub Assignment**: None (allows district selection)

### 2. Authentication Flow
```
Login (Common Credentials)
    ↓
RoleBasedDashboard (checks for district selection)
    ↓
DistrictSelection Page (if no district selected)
    ↓
Select District → Store in sessionStorage
    ↓
HubManagerDashboard (district-specific)
```

### 3. Key Components

#### Frontend Components
- **DistrictSelection.jsx**: Visual grid of all districts with hub counts and statistics
- **RoleBasedDashboard.jsx**: Updated to check for district selection before showing dashboard
- **HubManagerDashboard.jsx**: Modified to use selected district via headers

#### Backend Routes
- **GET /api/hub/districts**: Returns all districts with hub and order counts
- **POST /api/hub/select-district**: Validates and returns hub data for selected district
- **GET /api/hub/by-district/:district**: Fetches hub information by district name
- **Modified requireHubManager middleware**: Now checks for `X-Selected-District` header

### 4. Session Management
- Selected district stored in `sessionStorage.selectedDistrict`
- Hub data stored in `sessionStorage.selectedHub`
- District passed to backend via `X-Selected-District` header in API requests

## Setup Instructions

### Step 1: Create Common Hub Manager Account
Run the setup script to create the common hub manager account:

```bash
cd backend
node src/scripts/setupCommonHubManager.js
```

This will:
- Create a Firebase user with email `hubmanager@pepper.com`
- Create a MongoDB user with role `hubmanager`
- Set password as `pepper123`
- No specific hub assignment (allows district selection)

### Step 2: Test the Flow

1. **Login**
   - Navigate to `/login`
   - Use credentials:
     - Email: `hubmanager@pepper.com`
     - Password: `pepper123`
   - Click "Login"

2. **District Selection**
   - After successful login, you'll see the District Selection page
   - Browse available districts with their hub counts
   - Click on a district card to select it

3. **Hub Dashboard**
   - Automatically redirected to the hub manager dashboard
   - Dashboard shows orders for the selected district
   - District indicator shown in the header
   - "Switch District" button allows changing districts

4. **Switch Districts**
   - Click "Switch District" button in the dashboard header
   - Clears session storage and reloads to district selection page
   - Select a different district to manage

## Technical Details

### API Request Flow

All hub manager API requests now include the selected district:

```javascript
// Headers sent with each request
{
  'Authorization': 'Bearer <firebase-token>',
  'Content-Type': 'application/json',
  'X-Selected-District': 'Kottayam'  // From sessionStorage
}
```

### Backend Middleware Logic

The `requireHubManager` middleware now:
1. Checks for `X-Selected-District` header
2. If present, finds hub by district name (district-based)
3. If not present, finds hub by user's hubId (traditional assignment)
4. Allows both methods to coexist

```javascript
const selectedDistrict = req.headers['x-selected-district'];

if (selectedDistrict) {
  // District-based selection (common hub manager)
  hub = await Hub.findOne({ 
    district: { $regex: new RegExp(`^${selectedDistrict}$`, 'i') },
    isActive: true
  }).sort({ order: 1 });
} else {
  // Traditional hubId assignment
  hub = await Hub.findOne({ 
    managedBy: mongoUserId,
    district: { $exists: true, $ne: null, $ne: '' }
  }) || await Hub.findOne({ managedBy: mongoUserId });
}
```

### District Selection API

**Endpoint**: `GET /api/hub/districts`

**Response**:
```json
{
  "districts": [
    {
      "district": "Kottayam",
      "hubCount": 3,
      "hubTypes": ["WAREHOUSE", "REGIONAL_HUB", "LOCAL_HUB"],
      "orderCount": 15
    },
    {
      "district": "Ernakulam",
      "hubCount": 4,
      "hubTypes": ["MEGA_HUB", "REGIONAL_HUB", "LOCAL_HUB"],
      "orderCount": 28
    }
  ]
}
```

**Endpoint**: `POST /api/hub/select-district`

**Request**:
```json
{
  "district": "Kottayam"
}
```

**Response**:
```json
{
  "success": true,
  "hub": {
    "_id": "...",
    "name": "Kottayam Warehouse",
    "district": "Kottayam",
    "type": "WAREHOUSE",
    "order": 1
  },
  "district": "Kottayam"
}
```

## Security Considerations

1. **Common Password**: The common password is stored in the script and should be changed after first use or kept secure
2. **Role-Based Access**: Only users with role `hubmanager` or `admin` can access district selection
3. **Session Storage**: District selection is stored client-side but validated server-side on each request
4. **Hub Validation**: Backend always validates that the requested district has an active hub

## Benefits

1. **Simplified Management**: No need to create individual accounts for each hub manager
2. **Flexibility**: Hub managers can switch between districts easily
3. **Centralized Control**: Single account to manage instead of multiple accounts
4. **Better UX**: Visual district selection instead of being locked to one hub
5. **Backward Compatible**: Traditional hub manager accounts (with hubId assignment) still work

## Future Enhancements

1. **District Permissions**: Add granular permissions per district
2. **Multi-District Selection**: Allow managing multiple districts simultaneously
3. **District Analytics**: Show real-time statistics on district selection page
4. **Hub Selection**: Allow selecting specific hubs within a district
5. **Activity Logging**: Track which hub managers accessed which districts

## Troubleshooting

### Issue: District selection page not showing
- **Solution**: Check that sessionStorage is not blocked by browser
- **Solution**: Verify user role is `hubmanager` in database

### Issue: No districts shown
- **Solution**: Ensure hubs have `district` field populated
- **Solution**: Check that hubs are marked as `isActive: true`

### Issue: API calls failing after district selection
- **Solution**: Check that `X-Selected-District` header is being sent
- **Solution**: Verify district name matches exactly (case-insensitive)

### Issue: Can't switch districts
- **Solution**: Clear browser cache and sessionStorage
- **Solution**: Check browser console for JavaScript errors

## Files Modified/Created

### Backend
- `src/scripts/setupCommonHubManager.js` - New script to create common account
- `src/routes/hub.routes.js` - Added district endpoints and modified middleware

### Frontend
- `src/pages/DistrictSelection.jsx` - New district selection component
- `src/pages/DistrictSelection.css` - Styling for district selection
- `src/pages/RoleBasedDashboard.jsx` - Added district selection check
- `src/pages/HubManagerDashboard.jsx` - Added district header support and switch button
- `src/pages/HubManagerDashboard.css` - Added styling for district indicator

## Contact
For issues or questions, refer to the main project documentation.
