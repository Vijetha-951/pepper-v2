# Stock Synchronization Issue - Fixed

## Problem Summary

**Issue:** Stock values were showing differently in Stock Management page vs Product Management page:
- **Panniyur 6**: Stock Management showed `-1`, Product Management showed `45`
- **Panniyur 9**: Stock Management showed `-1`, Product Management showed `24`

## Root Cause

The system uses three stock fields:
1. `stock` - Legacy field (shown in Product Management)
2. `available_stock` - Current available stock (shown in Stock Management)
3. `total_stock` - Total inventory ever added

**The bug was in `payment.routes.js` (line 219-225):**
- When users purchased products, only `available_stock` was decremented
- The `stock` field was NOT updated
- This caused the two fields to become out of sync

```javascript
// BEFORE (BUGGY CODE):
await Product.findByIdAndUpdate(
  item.product._id,
  {
    $inc: { available_stock: -item.quantity }  // ❌ Only updates available_stock
  },
  { session }
);
```

## Solution Applied

### 1. Fixed Payment Route
**File:** `backend/src/routes/payment.routes.js` (lines 216-229)

```javascript
// AFTER (FIXED CODE):
await Product.findByIdAndUpdate(
  item.product._id,
  {
    $inc: { 
      available_stock: -item.quantity,
      stock: -item.quantity  // ✅ Now updates both fields
    }
  },
  { session }
);
```

### 2. Created Stock Sync Script
**File:** `backend/src/scripts/syncStockFields.js`

This script:
- Detects stock field mismatches
- Fixes negative stock values
- Ensures `stock` and `available_stock` are synchronized
- Uses the maximum value when there's a conflict

**Results from running the script:**
```
✅ Fixed: Panniyur 9
   Before: stock=24, available=-1, total=24
   After:  stock=24, available=24, total=24

✅ Fixed: Panniyur 6
   Before: stock=45, available=-1, total=45
   After:  stock=45, available=45, total=45

📊 Summary:
   Total products: 23
   Products fixed: 7
   Issues found: 9
```

## How Stock Updates Work Now

### Purchase Flow:
1. **User adds to cart** → Stock validation only (no deduction)
2. **User proceeds to checkout** → Stock re-validation (no deduction)
3. **Payment verified** → **BOTH `available_stock` AND `stock` are decremented**
4. **Order created** → Cart cleared

### Stock Deduction Code:
```javascript
// In payment.routes.js - /verify endpoint
for (const item of cart.items) {
  await Product.findByIdAndUpdate(
    item.product._id,
    {
      $inc: { 
        available_stock: -item.quantity,  // Decrements available stock
        stock: -item.quantity              // Decrements legacy stock field
      }
    },
    { session }  // Uses MongoDB transaction for safety
  );
}
```

### Admin Dashboard Updates:
- ✅ **Stock Management Page** displays `available_stock`
- ✅ **Product Management Page** displays `stock`
- ✅ Both fields are now kept in sync automatically
- ✅ Admin needs to refresh the page to see updated values

## Verification

After the fix, both pages now show consistent stock values:

| Product | Stock Management | Product Management | Status |
|---------|-----------------|-------------------|--------|
| Panniyur 6 | 45 | 45 | ✅ Synced |
| Panniyur 9 | 24 | 24 | ✅ Synced |
| All others | Synced | Synced | ✅ Synced |

## Running the Sync Script (If Needed)

If stock values become out of sync again in the future:

```bash
node backend/src/scripts/syncStockFields.js
```

This will:
1. Connect to MongoDB
2. Find all products with stock mismatches
3. Fix the inconsistencies
4. Report what was changed

## Prevention

The fix ensures this won't happen again because:
1. ✅ Payment verification now updates both fields atomically
2. ✅ MongoDB transactions ensure consistency
3. ✅ Pre-save middleware keeps fields in sync for manual updates
4. ✅ Sync script available for emergency fixes

## Files Modified

1. **backend/src/routes/payment.routes.js** - Fixed stock deduction logic
2. **backend/src/scripts/syncStockFields.js** - Created sync utility script

## Testing Recommendations

1. **Test Purchase Flow:**
   - Add product to cart
   - Complete payment
   - Verify both Stock Management and Product Management show same value

2. **Test Admin Updates:**
   - Update stock via Product Management
   - Check Stock Management shows same value
   - Update stock via Stock Management (restock)
   - Check Product Management shows same value

3. **Test Edge Cases:**
   - Purchase when stock is low (1-2 items)
   - Purchase multiple items at once
   - Concurrent purchases (if possible)

## Notes

- The system uses MongoDB transactions to prevent race conditions
- Stock validation happens at multiple points to prevent overselling
- The `total_stock` field tracks total inventory and doesn't decrease on sales
- The `sold` count is calculated as: `total_stock - available_stock`