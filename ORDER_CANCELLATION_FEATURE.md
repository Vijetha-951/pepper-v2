# Order Cancellation Feature Implementation

## Overview
Users can now cancel their orders from the "My Orders" page in the user dashboard. When an order is cancelled, the stock is automatically restored, and the admin can see the cancelled status in the admin dashboard.

## Features Implemented

### 1. Backend API Endpoint
**File**: `backend/src/routes/orders.routes.js`

#### New DELETE Endpoint: `/api/user/orders/:order_id`
- **Method**: DELETE
- **Authentication**: Required (user must be logged in)
- **Authorization**: Users can only cancel their own orders
- **Functionality**:
  - Validates that the order belongs to the authenticated user
  - Only allows cancellation of orders with status `PENDING` or `APPROVED`
  - Automatically restores stock for all items in the cancelled order
  - Updates order status to `CANCELLED`
  - Returns success message with updated order data

#### Stock Restoration Logic
When an order is cancelled:
1. For each item in the order, the system finds the corresponding product
2. Restores the `available_stock` by adding back the ordered quantity
3. Syncs the legacy `stock` field for backward compatibility
4. Saves the updated product

#### Error Handling
- Returns 404 if user or order not found
- Returns 400 if order status doesn't allow cancellation (e.g., already DELIVERED or CANCELLED)
- Returns appropriate error messages for all failure scenarios

### 2. Frontend - User Orders Page
**File**: `frontend/src/pages/Orders.jsx`

#### Updated `handleDeleteOrder` Function
- Shows confirmation dialog before cancelling
- Sends DELETE request to the backend API
- Displays success/error messages from the API response
- Automatically refreshes the orders list after successful cancellation

#### Cancel Button Visibility
- Cancel button is shown for orders with status:
  - `PENDING`
  - `APPROVED`
- Cancel button is hidden for orders with status:
  - `OUT_FOR_DELIVERY`
  - `DELIVERED`
  - `CANCELLED`

#### User Experience Improvements
- Clear confirmation message: "Are you sure you want to cancel this order? This action cannot be undone."
- Success message shows: "Order cancelled successfully. Stock has been restored."
- Error messages display specific reasons for failure
- Button includes both icon (Trash2) and text label "Cancel"

### 3. Admin Dashboard Integration
**File**: `frontend/src/pages/AdminAllOrders.jsx`

#### Cancelled Order Display
- Admin can view all cancelled orders
- Filter dropdown includes "Cancelled" option
- Cancelled orders display with red badge styling
- Status badge shows "CANCELLED" clearly

#### Status Badge Styling
- **CANCELLED**: Red background (#fee2e2), dark red text (#991b1b)
- Consistent styling across both user and admin interfaces

### 4. CSS Styling
**Files**: 
- `frontend/src/pages/Orders.css`
- `frontend/src/pages/AdminAllOrders.css`

Both files include proper styling for cancelled status:
```css
.status-cancelled {
  background: #fee2e2;
  color: #991b1b;
  border: 1px solid #fecaca;
}
```

## User Flow

### Cancelling an Order
1. User navigates to "My Orders" page (`/orders`)
2. User sees their order history with status badges
3. For orders with PENDING or APPROVED status, a "Cancel" button is visible
4. User clicks the "Cancel" button
5. Confirmation dialog appears: "Are you sure you want to cancel this order? This action cannot be undone."
6. User confirms cancellation
7. System processes the cancellation:
   - Updates order status to CANCELLED
   - Restores product stock
   - Refreshes the orders list
8. Success message appears: "Order cancelled successfully. Stock has been restored."
9. Order now shows with CANCELLED status badge (red)

### Admin Viewing Cancelled Orders
1. Admin navigates to "All Orders" page in admin dashboard
2. Admin can filter orders by status, selecting "Cancelled"
3. Cancelled orders appear with red CANCELLED badge
4. Admin can view all order details including:
   - Order ID
   - Customer information
   - Products ordered
   - Total amount
   - Payment status
   - Order status (CANCELLED)

## Technical Details

### Order Status Flow
```
PENDING → APPROVED → OUT_FOR_DELIVERY → DELIVERED
   ↓          ↓
CANCELLED  CANCELLED
```

**Cancellable Statuses**: PENDING, APPROVED
**Non-Cancellable Statuses**: OUT_FOR_DELIVERY, DELIVERED, CANCELLED

### Stock Management
- **Before Cancellation**: `available_stock = X`
- **After Cancellation**: `available_stock = X + ordered_quantity`
- Both `available_stock` and legacy `stock` fields are updated

### API Response Format

#### Success Response (200)
```json
{
  "message": "Order cancelled successfully. Stock has been restored.",
  "order": {
    "_id": "order_id",
    "status": "CANCELLED",
    "items": [...],
    "totalAmount": 1500,
    ...
  }
}
```

#### Error Response (400)
```json
{
  "message": "Cannot cancel order with status: DELIVERED. Only PENDING or APPROVED orders can be cancelled."
}
```

#### Error Response (404)
```json
{
  "message": "Order not found"
}
```

## Security Considerations

1. **Authentication**: All endpoints require valid Firebase authentication token
2. **Authorization**: Users can only cancel their own orders (verified by Firebase UID → MongoDB user ID mapping)
3. **Status Validation**: Backend validates order status before allowing cancellation
4. **Stock Integrity**: Stock restoration is atomic and happens within the same transaction

## Testing Checklist

### User Testing
- [ ] User can see "Cancel" button for PENDING orders
- [ ] User can see "Cancel" button for APPROVED orders
- [ ] User cannot see "Cancel" button for OUT_FOR_DELIVERY orders
- [ ] User cannot see "Cancel" button for DELIVERED orders
- [ ] User cannot see "Cancel" button for already CANCELLED orders
- [ ] Confirmation dialog appears when clicking "Cancel"
- [ ] Order status changes to CANCELLED after confirmation
- [ ] Success message displays after cancellation
- [ ] Orders list refreshes automatically
- [ ] Cancelled order shows with red badge

### Admin Testing
- [ ] Admin can view all cancelled orders
- [ ] Admin can filter by "Cancelled" status
- [ ] Cancelled orders display with proper styling
- [ ] Order details are accurate for cancelled orders

### Stock Testing
- [ ] Product stock increases after order cancellation
- [ ] Stock increase matches the ordered quantity
- [ ] Multiple items in order all have stock restored
- [ ] Stock is visible in admin stock management

### Error Testing
- [ ] Cannot cancel already cancelled order
- [ ] Cannot cancel delivered order
- [ ] Cannot cancel other user's orders
- [ ] Proper error messages display for all error cases

## Files Modified

### Backend
1. `backend/src/routes/orders.routes.js`
   - Added Product model import
   - Added DELETE endpoint for order cancellation
   - Implemented stock restoration logic

### Frontend
1. `frontend/src/pages/Orders.jsx`
   - Updated `handleDeleteOrder` function
   - Updated cancel button visibility logic
   - Added better error handling and user feedback

## Database Impact

### Orders Collection
- Order documents have `status` field updated to "CANCELLED"
- No orders are deleted (soft delete approach)

### Products Collection
- `available_stock` field is incremented
- `stock` field is synced with `available_stock`

## Future Enhancements

1. **Refund Processing**: Integrate with payment gateway for automatic refunds
2. **Email Notifications**: Send cancellation confirmation emails to users
3. **Cancellation Reason**: Allow users to provide reason for cancellation
4. **Partial Cancellation**: Allow cancelling specific items from an order
5. **Admin Override**: Allow admin to cancel any order regardless of status
6. **Cancellation History**: Track who cancelled the order and when
7. **Undo Cancellation**: Allow reversing cancellation within a time window

## Notes

- Orders are never deleted from the database, only marked as CANCELLED
- Stock restoration happens immediately upon cancellation
- Admin cannot change CANCELLED status back to active status (one-way operation)
- Payment refunds must be processed manually (not automated in this version)