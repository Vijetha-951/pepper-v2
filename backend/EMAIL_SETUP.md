# Email Configuration Guide

This guide explains how to set up email notifications for payment success and order confirmations.

## Features

- ✅ **Payment Success Email**: Sent automatically when online payment is successful
- ✅ **Order Confirmation Email**: Sent automatically for Cash on Delivery (COD) orders
- ✅ **Professional HTML Templates**: Beautiful, responsive email templates
- ✅ **Order Details**: Includes complete order information, items, and shipping address

## Setup Instructions

### 1. Gmail Configuration (Recommended)

#### Step 1: Enable 2-Step Verification
1. Go to your Google Account: https://myaccount.google.com/
2. Navigate to **Security** → **2-Step Verification**
3. Follow the steps to enable 2-Step Verification

#### Step 2: Generate App Password
1. Go to: https://myaccount.google.com/apppasswords
2. Select **App**: Choose "Mail"
3. Select **Device**: Choose "Other (Custom name)" and enter "PEPPER Store"
4. Click **Generate**
5. Copy the 16-character password (remove spaces)

#### Step 3: Update .env File
```env
EMAIL_SERVICE=gmail
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_16_character_app_password
```

### 2. Other Email Services

#### Outlook/Hotmail
```env
EMAIL_SERVICE=hotmail
EMAIL_USER=your_email@outlook.com
EMAIL_PASS=your_password
```

#### Yahoo Mail
```env
EMAIL_SERVICE=yahoo
EMAIL_USER=your_email@yahoo.com
EMAIL_PASS=your_password
```

#### Custom SMTP Server
If you want to use a custom SMTP server, modify `src/services/emailService.js`:

```javascript
transporter = nodemailer.createTransport({
  host: 'smtp.example.com',
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});
```

## Testing Email Configuration

### Test 1: Check if Email Service is Initialized
When you start the backend server, you should see:
```
✅ Email service initialized
```

If you see a warning instead:
```
⚠️ Email service not configured. Set EMAIL_USER and EMAIL_PASS in .env
```
This means the email credentials are not set or incorrect.

### Test 2: Make a Test Payment
1. Add items to cart
2. Proceed to checkout
3. Complete payment (use Razorpay test mode)
4. Check the user's email inbox for payment success email

### Test 3: Make a COD Order
1. Add items to cart
2. Proceed to checkout
3. Select "Cash on Delivery"
4. Place order
5. Check the user's email inbox for order confirmation email

## Email Templates

### Payment Success Email
- **Subject**: ✅ Payment Successful - Order Confirmed
- **Content**:
  - Order ID and Payment ID
  - Order date and time
  - Complete list of items with quantities and prices
  - Total amount paid
  - Shipping address
  - Next steps information

### Order Confirmation Email (COD)
- **Subject**: ✅ Order Confirmed - Cash on Delivery
- **Content**:
  - Order ID
  - Order date and time
  - Complete list of items with quantities and prices
  - Total amount to be paid on delivery
  - Delivery address
  - Payment reminder

## Troubleshooting

### Email Not Sending

1. **Check Environment Variables**
   ```bash
   # Make sure these are set in .env
   EMAIL_SERVICE=gmail
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_app_password
   ```

2. **Check Server Logs**
   Look for error messages in the console:
   ```
   ❌ Failed to send payment success email: [error message]
   ```

3. **Common Issues**:
   - **"Invalid login"**: App password is incorrect or 2-Step Verification not enabled
   - **"Username and Password not accepted"**: Using regular password instead of App Password
   - **"Connection timeout"**: Firewall or network blocking SMTP ports
   - **"Self signed certificate"**: Add `tls: { rejectUnauthorized: false }` to transporter config (not recommended for production)

### Gmail Specific Issues

1. **"Less secure app access"**: This is deprecated. Use App Passwords instead.
2. **"Daily sending limit exceeded"**: Gmail has a limit of 500 emails per day for free accounts.
3. **"Suspicious activity"**: Google may temporarily block access. Check your email for security alerts.

## Email Service Behavior

- **Non-blocking**: Email sending doesn't block the payment/order process
- **Graceful Failure**: If email fails, the order/payment still succeeds
- **Logging**: All email attempts are logged to console
- **Optional**: The system works without email configuration (just logs warnings)

## Security Best Practices

1. ✅ **Never commit .env file** to version control
2. ✅ **Use App Passwords** instead of regular passwords
3. ✅ **Rotate credentials** periodically
4. ✅ **Use environment-specific credentials** (dev, staging, production)
5. ✅ **Monitor email logs** for suspicious activity

## Production Recommendations

For production environments, consider using:

1. **SendGrid**: Professional email service with high deliverability
2. **AWS SES**: Amazon's email service, cost-effective for high volume
3. **Mailgun**: Developer-friendly email API
4. **Postmark**: Transactional email service

These services offer:
- Higher sending limits
- Better deliverability
- Email analytics
- Template management
- Bounce handling

## Support

If you encounter issues:
1. Check the server console logs
2. Verify email credentials
3. Test with a simple email client first
4. Check spam/junk folders
5. Review Gmail security settings

## Future Enhancements

Potential improvements:
- [ ] Email templates with company branding
- [ ] Order status update emails
- [ ] Delivery tracking emails
- [ ] Email preferences for users
- [ ] Multi-language support
- [ ] Email queue for better reliability