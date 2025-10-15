# Razorpay Automatic Refund Feature

## Overview
This feature automatically processes refunds through Razorpay when users cancel their orders from the My Orders page in the user dashboard.

## How It Works

### 1. Order Cancellation Flow
When a user clicks "Cancel" on an order:
1. **Custom Modal** appears asking for confirmation
2. User confirms cancellation
3. **Backend processes**:
   - Validates order can be cancelled (PENDING or APPROVED status only)
   - Restores product stock automatically
   - **Initiates Razorpay refund** (for ONLINE payments)
   - Updates order status to CANCELLED
   - Updates payment status to REFUNDED
4. **Frontend displays** success message with refund information

### 2. Refund Processing Logic

#### Eligible for Automatic Refund:
- ✅ Payment method: **ONLINE** (Razorpay)
- ✅ Payment status: **PAID**
- ✅ Order status: **PENDING** or **APPROVED**
- ✅ Valid transaction ID exists

#### Not Eligible for Automatic Refund:
- ❌ Payment method: **COD** (Cash on Delivery - no refund needed)
- ❌ Payment status: Not PAID
- ❌ Order status: DELIVERED, OUT_FOR_DELIVERY, or already CANCELLED

### 3. Refund Timeline
- **Initiation**: Immediate (when order is cancelled)
- **Processing**: Handled by Razorpay
- **Credit to Account**: **5-7 business days** (standard Razorpay timeline)

## Technical Implementation

### Backend Components

#### 1. Refund Service (`src/services/refundService.js`)
```javascript
// Main functions:
- processRefund(paymentId, amount, reason)
- checkRefundStatus(refundId)
- processOrderRefund(order)
```

**Features:**
- Razorpay API integration
- Error handling for common scenarios
- Refund status tracking
- Amount conversion (rupees ↔ paise)

#### 2. Updated Order Model (`src/models/Order.js`)
New payment fields added:
```javascript
payment: {
  method: String,
  status: String,
  transactionId: String,
  refundId: String,           // NEW
  refundAmount: Number,       // NEW
  refundStatus: String,       // NEW: PENDING, PROCESSED, FAILED
  refundInitiatedAt: Date     // NEW
}
```

#### 3. Updated Cancel Order Endpoint (`src/routes/user.routes.js`)
- Route: `DELETE /api/user/orders/:id`
- Authentication: Required (requireCustomer middleware)
- Authorization: Users can only cancel their own orders

**Process:**
1. Validate order ownership
2. Check order status (PENDING/APPROVED only)
3. Restore product stock
4. **Process refund** (if ONLINE payment)
5. Update order status to CANCELLED
6. Return success message with refund details

### Frontend Components

#### 1. Orders Page (`src/pages/Orders.jsx`)
**Updates:**
- Displays refund ID in order table
- Shows "✓ Refunded" badge for refunded orders
- Success message includes refund information

#### 2. Styling (`src/pages/Orders.css`)
**New styles:**
- `.refund-id` - Green badge showing refund ID
- `.refund-status-badge` - "✓ Refunded" indicator

## API Response Examples

### Successful Refund
```json
{
  "message": "Order cancelled successfully. Stock has been restored. Refund initiated successfully. Amount will be credited to your account in 5-7 business days.",
  "order": {
    "_id": "...",
    "status": "CANCELLED",
    "payment": {
      "method": "ONLINE",
      "status": "REFUNDED",
      "transactionId": "pay_xxxxx",
      "refundId": "rfnd_xxxxx",
      "refundAmount": 1500,
      "refundStatus": "PROCESSED",
      "refundInitiatedAt": "2024-01-15T10:30:00.000Z"
    }
  },
  "refund": {
    "success": true,
    "refundId": "rfnd_xxxxx",
    "amount": 1500,
    "status": "processed",
    "message": "Refund initiated successfully. Amount will be credited to your account in 5-7 business days."
  }
}
```

### COD Order (No Refund Needed)
```json
{
  "message": "Order cancelled successfully. Stock has been restored. No refund needed for Cash on Delivery orders.",
  "order": {
    "status": "CANCELLED",
    "payment": {
      "method": "COD",
      "status": "PENDING"
    }
  },
  "refund": null
}
```

### Refund Failed (Manual Processing Required)
```json
{
  "message": "Order cancelled successfully. Stock has been restored. Note: Automatic refund failed. Please contact support for manual refund processing.",
  "order": {
    "status": "CANCELLED",
    "payment": {
      "status": "PAID",
      "refundStatus": "FAILED"
    }
  }
}
```

## Error Handling

### Common Scenarios

1. **Payment Already Refunded**
   - Error: "This payment has already been refunded"
   - Action: Order still cancelled, user notified

2. **Payment Not Captured**
   - Error: "Payment is not yet captured and cannot be refunded"
   - Action: Order cancelled, manual refund required

3. **Invalid Payment ID**
   - Error: "Invalid payment ID"
   - Action: Order cancelled, manual refund required

4. **Razorpay API Error**
   - Error: Generic error message
   - Action: Order cancelled, refund status set to FAILED
   - User Message: "Please contact support for manual refund processing"

## User Experience

### What Users See:

1. **Before Cancellation:**
   - Order shows PENDING or APPROVED status
   - "Cancel" button is visible

2. **During Cancellation:**
   - Custom modal with confirmation
   - Warning: "This action cannot be undone"

3. **After Cancellation:**
   - Success message: "Order cancelled successfully. Stock has been restored. Refund initiated successfully. Amount will be credited to your account in 5-7 business days."
   - Order status changes to CANCELLED
   - "✓ Refunded" badge appears
   - Refund ID displayed in order details

4. **In Order Table:**
   ```
   Order ID: #ABC12345
   Pay ID: pay_xxxxx
   Refund ID: rfnd_xxxxx  [Green badge]
   Status: CANCELLED
   [✓ Refunded]  [Green badge below status]
   ```

## Testing

### Test Scenarios

#### 1. Test Successful Refund (ONLINE Payment)
```bash
# Prerequisites:
- Order with ONLINE payment method
- Payment status: PAID
- Order status: PENDING or APPROVED
- Valid Razorpay transaction ID

# Steps:
1. Login as customer
2. Go to My Orders
3. Click "Cancel" on an eligible order
4. Confirm cancellation in modal
5. Verify success message includes refund information
6. Check order shows "✓ Refunded" badge
7. Verify refund ID is displayed
```

#### 2. Test COD Order Cancellation
```bash
# Prerequisites:
- Order with COD payment method
- Order status: PENDING or APPROVED

# Steps:
1. Cancel COD order
2. Verify message: "No refund needed for Cash on Delivery orders"
3. Verify no refund ID displayed
4. Verify order status is CANCELLED
```

#### 3. Test Invalid Order Status
```bash
# Prerequisites:
- Order with status: DELIVERED or OUT_FOR_DELIVERY

# Steps:
1. Try to cancel order
2. Verify "Cancel" button is not visible
3. Order cannot be cancelled
```

## Configuration

### Environment Variables Required
```env
RAZORPAY_KEY_ID=rzp_test_xxxxx
RAZORPAY_KEY_SECRET=xxxxx
```

### Razorpay Dashboard
- Login to: https://dashboard.razorpay.com
- Navigate to: Payments → Refunds
- View all refund transactions
- Track refund status

## Monitoring & Logs

### Backend Logs
```
🔄 Initiating refund for order: 67890...
✅ Refund processed successfully: rfnd_xxxxx
```

### Error Logs
```
⚠️ Refund failed: This payment has already been refunded
❌ Refund error: [Error details]
```

## Security Considerations

1. **Authentication**: User must be logged in
2. **Authorization**: Users can only cancel their own orders
3. **Validation**: Order status checked before cancellation
4. **Idempotency**: Prevents duplicate refunds
5. **Signature Verification**: All Razorpay responses verified

## Future Enhancements

1. **Partial Refunds**: Allow refunding specific items
2. **Refund Reasons**: Capture why user cancelled
3. **Email Notifications**: Send refund confirmation emails
4. **Refund History**: Dedicated refund tracking page
5. **Instant Refunds**: Use Razorpay's instant refund feature (requires approval)
6. **Webhook Integration**: Real-time refund status updates from Razorpay

## Support

### For Users:
- Refund timeline: 5-7 business days
- Contact support if refund not received after 7 days
- Provide Order ID and Refund ID for faster resolution

### For Developers:
- Check backend logs for refund processing errors
- Verify Razorpay credentials in .env
- Test in Razorpay test mode before production
- Monitor Razorpay dashboard for refund status

## Important Notes

1. **Stock Restoration**: Always happens, even if refund fails
2. **Order Status**: Always updated to CANCELLED
3. **Refund Failure**: Order still cancelled, manual refund required
4. **COD Orders**: No refund processing needed
5. **Razorpay Limits**: Check your account limits for refunds
6. **Test Mode**: Use test credentials for development
7. **Production**: Switch to live credentials for production

## Troubleshooting

### Issue: Refund not initiated
**Check:**
- Payment method is ONLINE
- Payment status is PAID
- Transaction ID exists
- Razorpay credentials are correct

### Issue: Refund failed
**Check:**
- Payment is captured in Razorpay
- Payment not already refunded
- Razorpay account has sufficient balance
- API credentials are valid

### Issue: Refund ID not showing
**Check:**
- Order was cancelled after refund feature deployment
- Payment method was ONLINE
- Refund was successful
- Frontend is displaying payment.refundId field

## Version History

- **v1.0** (Current): Automatic refunds for ONLINE payments
- Future: Partial refunds, instant refunds, webhook integration