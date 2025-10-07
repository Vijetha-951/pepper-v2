# Out-of-Stock Products Filter Fix

## Issue
Out-of-stock products were still appearing on the user dashboard's Products page, even though they should be hidden from customers.

## Root Cause
The backend API endpoint `/api/products` was filtering products using the wrong field:
- **Before**: Checked `stock > 0` when `available=true` parameter was passed
- **Problem**: The `stock` field is a legacy field that may not accurately reflect current availability

## Solution
Changed the filter to use the correct field that tracks actual available inventory:
- **After**: Now checks `available_stock > 0` when `available=true` parameter is passed
- **Result**: Products with `available_stock <= 0` are now properly hidden from users

## Technical Details

### File Changed
`backend/src/routes/products.routes.js` (Line 16)

### Code Change
```javascript
// BEFORE (Bug):
if (available === 'true') filter.stock = { $gt: 0 };

// AFTER (Fixed):
if (available === 'true') filter.available_stock = { $gt: 0 };
```

### How It Works
1. User opens Products page in their dashboard
2. Frontend calls `customerProductService.getProducts({ available: true })`
3. Backend receives `available=true` query parameter
4. Backend filters products where `available_stock > 0`
5. Only in-stock products are returned to the user
6. Out-of-stock products are hidden from the user interface

## Stock Field Reference
The system uses three stock-related fields:
- **`available_stock`**: Current available inventory (decreases with sales) ✅ Used for filtering
- **`stock`**: Legacy field (may be out of sync)
- **`total_stock`**: Total inventory ever added (doesn't decrease)

## Testing
To verify the fix:
1. Set a product's `available_stock` to 0 in the database or admin panel
2. Open the user dashboard and navigate to Products page
3. The product should NOT appear in the list
4. Set `available_stock` back to a positive number
5. Refresh the Products page
6. The product should now appear in the list

## Related Fixes
This fix complements the stock synchronization fix implemented earlier:
- Payment route now updates both `stock` and `available_stock` fields
- Stock sync script ensures field consistency
- This filter ensures users only see products they can actually purchase

## Impact
✅ Users can no longer see or attempt to purchase out-of-stock products
✅ Improves user experience by showing only available items
✅ Prevents confusion and failed purchase attempts
✅ Aligns with e-commerce best practices