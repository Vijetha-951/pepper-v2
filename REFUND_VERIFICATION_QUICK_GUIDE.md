# 🚀 Quick Guide: Verify Razorpay Refunds

## 🎯 TL;DR - Fastest Ways to Check

### For Users:
✅ **Look at "My Orders" page** → See green "Refund ID" badge and "✓ Refunded" status

### For Admins/Developers:
✅ **Razorpay Dashboard** → Transactions → Refunds → Search by Refund ID

### For Support:
✅ **Run Script**: `node backend/src/scripts/checkRefundStatus.js pay_xxx rfnd_xxx`

---

## 📱 Visual Guide

### 1️⃣ In Your Application

```
┌─────────────────────────────────────────────────────┐
│ MY ORDERS                                           │
├─────────────────────────────────────────────────────┤
│                                                     │
│ Order #12345                                        │
│ Status: CANCELLED                                   │
│         ✓ Refunded  ← Look for this!               │
│                                                     │
│ Refund ID: rfnd_abc123xyz  ← Green badge           │
│ Amount: ₹1,500                                      │
│ Date: 15 Jan 2024                                   │
│                                                     │
│ "Refund will be processed in 5-7 business days"    │
└─────────────────────────────────────────────────────┘
```

### 2️⃣ In Razorpay Dashboard

```
┌─────────────────────────────────────────────────────┐
│ RAZORPAY DASHBOARD                                  │
├─────────────────────────────────────────────────────┤
│                                                     │
│ Transactions → Refunds                              │
│                                                     │
│ Search: rfnd_abc123xyz                              │
│                                                     │
│ ┌─────────────────────────────────────────────┐   │
│ │ Refund ID: rfnd_abc123xyz                   │   │
│ │ Status: PROCESSED ✅                         │   │
│ │ Amount: ₹1,500                              │   │
│ │ Payment ID: pay_xyz789                      │   │
│ │ Created: 15 Jan 2024, 10:30 AM             │   │
│ │ Method: Card ending in 1234                │   │
│ └─────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

### 3️⃣ Using Command Line

```bash
# Check specific refund
$ node backend/src/scripts/checkRefundStatus.js pay_xyz789 rfnd_abc123

🔍 Checking refund status...

✅ Refund Details:
Status: processed ✅
Amount: ₹1500
Created At: 1/15/2024, 10:30:00 AM

📊 Status: Money successfully refunded to customer
⏱️  Timeline: 5-7 business days
```

---

## 🔍 What Each Status Means

| Status | What It Means | What to Do |
|--------|---------------|------------|
| **PENDING** | Refund initiated, Razorpay is processing | ⏳ Wait 5-7 days |
| **PROCESSED** | Razorpay sent money to bank | ✅ Done! Customer will receive soon |
| **FAILED** | Something went wrong | ⚠️ Contact Razorpay support |

---

## ⏱️ Timeline Explained

```
Day 0: Order Cancelled
       ↓
       Refund Initiated ✅
       Status: PENDING
       
Day 1-2: Razorpay Processing
         ↓
         Status: PROCESSED ✅
         
Day 3-7: Bank Processing
         ↓
         Money in Customer Account ✅
```

**Total**: 5-7 business days (weekends don't count)

---

## 🎓 Real Example

### Scenario:
Customer cancels order #12345 for ₹1,500 paid via credit card

### What Happens:

**Immediately:**
```
✅ Order status → CANCELLED
✅ Stock restored
✅ Refund initiated
✅ Refund ID created: rfnd_abc123xyz
✅ Database updated with refund details
```

**In Application:**
```
Order #12345
Status: CANCELLED
        ✓ Refunded
Refund ID: rfnd_abc123xyz
Message: "Refund of ₹1,500 initiated. Will be processed in 5-7 business days."
```

**Day 1-2 (Razorpay Dashboard):**
```
Status: pending → processed
```

**Day 5-7 (Customer's Bank):**
```
Credit: ₹1,500.00
Description: RAZORPAY-PEPPER STORE
```

---

## 🛠️ Quick Troubleshooting

### ❌ Problem: "I don't see refund ID"

**Check:**
1. Was payment method ONLINE? (COD orders don't get refunds)
2. Was payment status PAID? (Pending payments can't be refunded)
3. Did cancellation succeed? (Check order status)

**Solution:**
```bash
# Check database
mongo
use pepper_db
db.orders.findOne({ _id: ObjectId("order_id") })
# Look for payment.refundId field
```

---

### ❌ Problem: "Status stuck on PENDING"

**Check:**
1. How many days has it been? (Normal: 5-7 days)
2. Razorpay Dashboard status?
3. Was payment captured? (Not just authorized)

**Solution:**
```bash
# Check actual status from Razorpay
node backend/src/scripts/checkRefundStatus.js pay_xxx rfnd_xxx
```

---

### ❌ Problem: "Customer says money not received"

**Check:**
1. Razorpay status = PROCESSED? ✅
2. Has 7 business days passed? ⏳
3. Customer checking correct bank account? 🏦

**Solution:**
1. Show customer the refund ID
2. Ask them to check bank statement (may show different name)
3. If 7+ days and processed, contact Razorpay support

---

## 📞 Need Help?

### For Technical Issues:
```bash
# Run diagnostic script
node backend/src/scripts/checkRefundStatus.js <payment_id> <refund_id>
```

### For Razorpay Issues:
- **Dashboard**: https://dashboard.razorpay.com/
- **Support**: support@razorpay.com
- **Phone**: 1800-120-020-020

### Information to Provide:
- Payment ID: `pay_xxxxx`
- Refund ID: `rfnd_xxxxx`
- Order ID: `#12345`
- Customer email/phone

---

## ✅ Checklist: Is Refund Working?

- [ ] Order status changed to CANCELLED
- [ ] Green "Refund ID" badge visible in UI
- [ ] "✓ Refunded" badge showing
- [ ] Database has `payment.refundId` field
- [ ] Database has `payment.refundStatus = "PROCESSED"`
- [ ] Razorpay Dashboard shows refund
- [ ] Razorpay status = "processed"
- [ ] Customer received money (after 5-7 days)

---

## 🎯 Key Takeaways

1. **Razorpay Dashboard = Source of Truth** 🏆
2. **5-7 business days is normal** ⏳
3. **PROCESSED = Razorpay done, bank processing** ✅
4. **Refund ID starts with `rfnd_`** 🔖
5. **Test mode refunds are instant** ⚡

---

## 📚 More Details

For comprehensive information, see:
- **Full Guide**: `HOW_TO_VERIFY_REFUNDS.md`
- **Feature Docs**: `backend/REFUND_FEATURE.md`
- **Implementation**: `REFUND_IMPLEMENTATION_SUMMARY.md`

---

**Quick Access Commands:**

```bash
# Check refund status
node backend/src/scripts/checkRefundStatus.js pay_xxx rfnd_xxx

# List all refunds for a payment
node backend/src/scripts/checkRefundStatus.js pay_xxx

# Check database
mongo pepper_db --eval "db.orders.findOne({_id: ObjectId('order_id')})"
```

---

**Last Updated**: January 2024