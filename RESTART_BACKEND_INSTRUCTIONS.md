# How to Restart Backend Server

## Why Restart is Needed
The backend code has been updated to fix the out-of-stock filter, but Node.js servers need to be restarted to load the new code changes.

## Steps to Restart

### Option 1: Using Terminal (Recommended)
1. **Stop the current backend server:**
   - Go to the terminal/command prompt where the backend is running
   - Press `Ctrl + C` to stop the server
   - Wait for it to fully stop

2. **Start the backend server again:**
   ```powershell
   cd c:\xampp\htdocs\PEPPER\backend
   npm start
   ```
   OR if using nodemon:
   ```powershell
   cd c:\xampp\htdocs\PEPPER\backend
   npm run dev
   ```

### Option 2: Kill All Node Processes (If you can't find the terminal)
1. **Stop all Node processes:**
   ```powershell
   Get-Process node | Stop-Process -Force
   ```

2. **Start the backend server:**
   ```powershell
   cd c:\xampp\htdocs\PEPPER\backend
   npm start
   ```

## Verify the Fix Works

After restarting:

1. **Open browser and go to user dashboard**
2. **Navigate to Products page**
3. **Open Developer Tools (F12) → Network tab**
4. **Refresh the page**
5. **Look for the API call to `/api/products?available=true`**
6. **Check the response - you should now see 22 products instead of 13**

## What Changed

### Before (Old Code):
```javascript
if (available === 'true') filter.stock = { $gt: 0 };
```
- Filtered by `stock` field (legacy field)
- Some products with `stock > 0` but `available_stock = 0` were shown
- This caused 13 products to appear (incorrect)

### After (New Code):
```javascript
if (available === 'true') filter.available_stock = { $gt: 0 };
```
- Filters by `available_stock` field (accurate field)
- Only products with actual available inventory are shown
- This will show 22 products (correct)

## Expected Results

| Metric | Before Fix | After Fix |
|--------|-----------|-----------|
| Total Products in DB | 23 | 23 |
| Products with available_stock > 0 | 22 | 22 |
| Products shown to users | 13 ❌ | 22 ✅ |
| Out-of-stock products hidden | No ❌ | Yes ✅ |

## Troubleshooting

### Still seeing 13 products after restart?
1. Clear browser cache (Ctrl + Shift + Delete)
2. Hard refresh the page (Ctrl + F5)
3. Check if backend server actually restarted (look for startup logs)
4. Verify the file was saved correctly: `backend/src/routes/products.routes.js` line 16

### Backend won't start?
1. Check if port is already in use
2. Look at error messages in terminal
3. Verify `.env` file exists with correct MongoDB connection string
4. Check if MongoDB is running

## Need Help?
If you're still having issues after restarting, let me know and I can help debug further!