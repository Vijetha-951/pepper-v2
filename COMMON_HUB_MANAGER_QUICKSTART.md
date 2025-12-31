# Quick Start: Common Hub Manager System

## 🚀 Setup (One-Time)

Run this command to create the common hub manager account:

```bash
cd backend
node src/scripts/setupCommonHubManager.js
```

**Output will show:**
```
Email: hubmanager@pepper.com
Password: pepper123
Role: hubmanager
```

## 📋 Testing Steps

### 1. Login
1. Navigate to `http://localhost:3000/login`
2. Enter credentials:
   - **Email**: `hubmanager@pepper.com`
   - **Password**: `pepper123`
3. Click "Login"

### 2. Select District
- You'll see a grid of all available districts
- Each card shows:
  - District name
  - Number of hubs
  - Hub types (WAREHOUSE, REGIONAL_HUB, etc.)
  - Active order count
- Click on any district card to select it

### 3. Manage District
- Dashboard loads with orders for that district
- See district name in the header (green badge)
- "Switch District" button to change districts
- All normal hub manager operations work

### 4. Switch Districts
- Click "Switch District" button in header
- Returns to district selection page
- Select a different district
- Dashboard updates with new district's data

## ✅ What to Check

- [ ] Login with common credentials works
- [ ] District selection page shows all districts
- [ ] District selection redirects to dashboard
- [ ] Dashboard shows correct district name
- [ ] Orders are specific to selected district
- [ ] Switch District button works
- [ ] Can switch between multiple districts
- [ ] All hub operations (scan-in, dispatch) work

## 🔧 If Something Goes Wrong

**Districts not showing?**
```bash
# Check if hubs have district field
cd backend
node src/scripts/checkHubManagerAccounts.js
```

**Login fails?**
- Verify Firebase and MongoDB are running
- Check if common account was created successfully

**Orders not showing?**
- Check that the district has hubs with orders
- Verify hub is active in database

**API errors?**
- Check browser console for errors
- Verify backend server is running
- Check that X-Selected-District header is being sent

## 📁 Key Files Created/Modified

### Backend
- `backend/src/scripts/setupCommonHubManager.js`
- `backend/src/routes/hub.routes.js`

### Frontend
- `frontend/src/pages/DistrictSelection.jsx`
- `frontend/src/pages/DistrictSelection.css`
- `frontend/src/pages/RoleBasedDashboard.jsx`
- `frontend/src/pages/HubManagerDashboard.jsx`
- `frontend/src/pages/HubManagerDashboard.css`

## 💡 Benefits
- ✅ One login for all hub managers
- ✅ Easy district switching
- ✅ Visual district selection
- ✅ Works alongside traditional hub manager accounts
- ✅ Session-based (no database changes per selection)

## 🎯 Next Steps
1. Run the setup script
2. Test login and district selection
3. Verify all operations work correctly
4. Document any issues found
5. Optional: Change the common password for security
