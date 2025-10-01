# 🚀 Quick Start: Payment Success Emails

## ✅ What's Done

Your PEPPER Store now sends email notifications after successful payments!

## ⚡ 5-Minute Setup

### Step 1: Get Gmail App Password

1. Go to: https://myaccount.google.com/apppasswords
2. Enable 2-Step Verification (if not already)
3. Create App Password for "Mail"
4. Copy the 16-character password

### Step 2: Update .env

Edit `backend/.env` and add:

```env
EMAIL_SERVICE=gmail
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=abcdefghijklmnop
```

Replace with your actual email and app password.

### Step 3: Test It

```bash
cd backend
node scripts/testEmail.js
```

You should see: ✅ All email tests passed!

### Step 4: Restart Server

```bash
# Stop current server (Ctrl+C)
npm run dev
```

Look for: ✅ Email service initialized

## 🎉 Done!

Now when users complete a payment:
- ✅ They see "Payment Successful" on screen
- ✅ They receive an email with order details

## 📧 Test It

1. Add products to cart
2. Checkout with test card: 4111 1111 1111 1111
3. Complete payment
4. Check email inbox!

## ❓ Need Help?

- **Detailed Setup**: See `SETUP_PAYMENT_EMAILS.md`
- **Troubleshooting**: See `backend/EMAIL_SETUP.md`
- **Technical Details**: See `PAYMENT_SUCCESS_IMPLEMENTATION.md`

## 🔧 Troubleshooting

### Email not configured warning?
→ Check EMAIL_USER and EMAIL_PASS in .env

### Invalid login error?
→ Use App Password, not regular password
→ Enable 2-Step Verification first

### No email received?
→ Check spam/junk folder
→ Run: `node scripts/testEmail.js`

---

**That's it!** Your payment success emails are ready to go! 🎉