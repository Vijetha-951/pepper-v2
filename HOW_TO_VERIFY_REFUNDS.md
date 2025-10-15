# 💰 How to Verify Razorpay Refunds

This guide explains all the ways to check if money has been refunded through Razorpay.

---

## 🎯 Quick Answer

**Refund Timeline**: 5-7 business days for standard refunds  
**Status Check**: Razorpay Dashboard is the most reliable source

---

## 📍 Method 1: User Dashboard (Your Application)

### What Users See:

When an order with online payment is cancelled, the user will see:

1. **Order Status**: Changed to "CANCELLED"
2. **Refund ID Badge**: Green badge showing `rfnd_xxxxx`
3. **Refunded Badge**: "✓ Refunded" indicator below status
4. **Success Message**: "Refund of ₹XXX has been initiated and will be processed in 5-7 business days"

### Visual Indicators:

```
Order ID: #12345
Status: CANCELLED
         ✓ Refunded
Refund ID: rfnd_abc123xyz
```

---

## 📍 Method 2: Database Check (MongoDB)

### Query the Order:

```javascript
db.orders.findOne({ _id: ObjectId("order_id") })
```

### Check These Fields:

```javascript
{
  payment: {
    method: "ONLINE",
    status: "REFUNDED",              // ✅ Key indicator
    transactionId: "pay_abc123",
    refundId: "rfnd_xyz789",         // ✅ Razorpay refund ID
    refundAmount: 1500,              // ✅ Amount in rupees
    refundStatus: "PROCESSED",       // ✅ PENDING/PROCESSED/FAILED
    refundInitiatedAt: "2024-01-15T10:30:00Z"
  }
}
```

### Status Values:

- **PENDING**: Refund initiated, waiting for Razorpay to process
- **PROCESSED**: Refund successfully processed by Razorpay
- **FAILED**: Refund failed (rare, contact support)

---

## 📍 Method 3: Razorpay Dashboard (Most Reliable) ⭐

This is the **official source of truth** for refund status.

### Steps:

1. **Login**: https://dashboard.razorpay.com/
   - Use your Razorpay account credentials

2. **Navigate to Refunds**:
   ```
   Dashboard → Transactions → Refunds
   ```

3. **Search Options**:
   - By Refund ID: `rfnd_xxxxx`
   - By Payment ID: `pay_xxxxx`
   - By Order ID: Your order number
   - By Customer: Email or phone
   - By Date Range: Select date range

4. **View Refund Details**:
   - Status (Pending/Processed/Failed)
   - Amount refunded
   - Refund method (original payment method)
   - Timeline and processing date
   - Customer details

### Dashboard Status Meanings:

| Status | Meaning | Action Required |
|--------|---------|-----------------|
| **Pending** | Refund initiated, being processed | Wait 5-7 business days |
| **Processed** | Money sent to customer | None - Complete ✅ |
| **Failed** | Refund failed | Contact Razorpay support |

---

## 📍 Method 4: Razorpay API (Programmatic)

### Using the Check Script:

We've created a script to check refund status programmatically.

#### Check Specific Refund:

```bash
node backend/src/scripts/checkRefundStatus.js pay_abc123 rfnd_xyz789
```

**Output:**
```
🔍 Checking refund status...

Payment ID: pay_abc123
Refund ID: rfnd_xyz789

✅ Refund Details:

Status: processed
Amount: ₹1500
Currency: INR
Created At: 1/15/2024, 10:30:00 AM
Speed: normal

📊 Status Meanings:
  - pending: Refund initiated, processing in progress
  - processed: Money successfully refunded to customer
  - failed: Refund failed (will be auto-retried by Razorpay)

⏱️  Timeline:
  - Normal refunds: 5-7 business days
  - Instant refunds: Within 30 minutes (if enabled)
```

#### List All Refunds for a Payment:

```bash
node backend/src/scripts/checkRefundStatus.js pay_abc123
```

**Output:**
```
📋 Fetching all refunds for payment...

Payment ID: pay_abc123

✅ Found 1 refund(s):

1. Refund ID: rfnd_xyz789
   Status: processed
   Amount: ₹1500
   Created: 1/15/2024, 10:30:00 AM
```

---

## 📍 Method 5: Customer's Bank Statement

### What Customers See:

After 5-7 business days, customers will see:

1. **Bank Statement Entry**: Credit transaction
2. **Description**: Usually mentions "Razorpay" or your business name
3. **Amount**: Original payment amount
4. **Date**: Within 5-7 business days of refund initiation

### Example Bank Entry:
```
Date: 20/01/2024
Description: RAZORPAY-PEPPER STORE
Credit: ₹1,500.00
```

---

## 🔄 Refund Status Flow

```
Order Cancelled
      ↓
Refund Initiated (API Call)
      ↓
Status: PENDING
      ↓
Razorpay Processing (1-2 days)
      ↓
Status: PROCESSED
      ↓
Bank Processing (3-5 days)
      ↓
Money in Customer Account ✅
```

**Total Time**: 5-7 business days

---

## ❓ Common Questions

### Q1: How long does a refund take?
**A**: 5-7 business days for standard refunds. Instant refunds (if enabled) take 30 minutes.

### Q2: Where does the money go?
**A**: Back to the original payment method:
- **Credit Card**: Refunded to the same card
- **Debit Card**: Refunded to the same card
- **UPI**: Refunded to the same UPI ID
- **Net Banking**: Refunded to the same bank account
- **Wallet**: Refunded to the same wallet

### Q3: What if refund status is "Pending" for more than 7 days?
**A**: 
1. Check Razorpay Dashboard for any errors
2. Contact Razorpay support with Payment ID and Refund ID
3. They can investigate and expedite if needed

### Q4: Can I cancel a refund?
**A**: No, once initiated, refunds cannot be cancelled. However, you can create a new order/payment link for the customer.

### Q5: What if refund fails?
**A**: 
1. Razorpay automatically retries failed refunds
2. If it continues to fail, process manual refund from Razorpay Dashboard
3. Contact Razorpay support for assistance

### Q6: How to verify refund for testing?
**A**: In test mode:
1. Refunds are instant (no 5-7 day wait)
2. Check Razorpay Test Dashboard
3. No real money is involved
4. Status changes to "processed" immediately

---

## 🛠️ Troubleshooting

### Issue: Refund ID not showing in application

**Check:**
1. Database: Does order have `payment.refundId`?
2. Frontend: Is Orders.jsx displaying refund badges?
3. Backend: Did refund API call succeed?

**Solution:**
```bash
# Check order in database
mongo
use pepper_db
db.orders.findOne({ _id: ObjectId("order_id") })
```

### Issue: Refund status stuck on "Pending"

**Check:**
1. Razorpay Dashboard for actual status
2. Payment was captured (not just authorized)
3. Sufficient balance in Razorpay account

**Solution:**
```bash
# Check refund status via script
node backend/src/scripts/checkRefundStatus.js pay_xxx rfnd_xxx
```

### Issue: Customer says money not received

**Steps:**
1. Verify refund status in Razorpay Dashboard is "Processed"
2. Check if 5-7 business days have passed
3. Ask customer to check bank statement (may show different description)
4. If processed but not received after 7 days, contact Razorpay support

---

## 📞 Support Contacts

### Razorpay Support:
- **Email**: support@razorpay.com
- **Phone**: 1800-120-020-020
- **Dashboard**: Help section in Razorpay Dashboard
- **Docs**: https://razorpay.com/docs/refunds/

### Information to Provide:
- Payment ID: `pay_xxxxx`
- Refund ID: `rfnd_xxxxx`
- Order ID: Your internal order ID
- Customer details: Email/Phone
- Issue description

---

## 🔐 Security Notes

1. **Never share** Razorpay Key Secret with customers
2. **Refund IDs** are safe to share with customers
3. **Payment IDs** can be shared for support purposes
4. **Dashboard access** should be restricted to authorized personnel only

---

## 📊 Monitoring Refunds

### Daily Checks:
```bash
# List all refunds from today
# In Razorpay Dashboard: Transactions → Refunds → Filter by date
```

### Weekly Reports:
- Total refunds processed
- Total refund amount
- Failed refunds (if any)
- Average processing time

### Database Query for Refund Report:
```javascript
// All refunded orders this month
db.orders.find({
  "payment.refundStatus": "PROCESSED",
  "payment.refundInitiatedAt": {
    $gte: new Date("2024-01-01"),
    $lt: new Date("2024-02-01")
  }
})
```

---

## ✅ Best Practices

1. **Always check Razorpay Dashboard** for definitive refund status
2. **Keep refund IDs** in your database for audit trail
3. **Inform customers** about 5-7 day timeline upfront
4. **Monitor failed refunds** and retry manually if needed
5. **Test refunds** in test mode before going live
6. **Document refund reasons** for analytics (future enhancement)

---

## 🚀 Quick Reference

| Need | Method | Reliability |
|------|--------|-------------|
| Quick check | Application UI | ⭐⭐⭐ |
| Detailed info | Razorpay Dashboard | ⭐⭐⭐⭐⭐ |
| Programmatic | API Script | ⭐⭐⭐⭐ |
| Audit trail | Database | ⭐⭐⭐⭐ |
| Customer proof | Bank statement | ⭐⭐⭐⭐⭐ |

---

**Last Updated**: January 2024  
**Version**: 1.0