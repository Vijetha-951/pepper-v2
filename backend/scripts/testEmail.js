/**
 * Test Email Service
 * 
 * This script tests the email service configuration
 * Run with: node scripts/testEmail.js
 */

import '../src/config/env.js';
import { sendPaymentSuccessEmail, sendOrderConfirmationEmail } from '../src/services/emailService.js';

// Test data
const testUser = {
  email: process.env.TEST_EMAIL || 'test@example.com',
  name: 'Test User'
};

const testOrder = {
  _id: 'TEST_ORDER_12345',
  createdAt: new Date(),
  items: [
    {
      name: 'Premium Black Pepper - 100g',
      quantity: 2,
      priceAtOrder: 150.00
    },
    {
      name: 'Organic White Pepper - 50g',
      quantity: 1,
      priceAtOrder: 200.00
    }
  ],
  totalAmount: 500.00,
  shippingAddress: {
    line1: '123 Test Street',
    line2: 'Apartment 4B',
    district: 'Test District',
    state: 'Kerala',
    pincode: '123456'
  }
};

const testPaymentId = 'pay_TEST123456789';

console.log('🧪 Testing Email Service...\n');

// Check if email is configured
if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
  console.error('❌ Email not configured!');
  console.log('\nPlease set the following in your .env file:');
  console.log('EMAIL_SERVICE=gmail');
  console.log('EMAIL_USER=your_email@gmail.com');
  console.log('EMAIL_PASS=your_app_password');
  console.log('\nSee backend/EMAIL_SETUP.md for detailed instructions.');
  process.exit(1);
}

console.log('✅ Email credentials found in .env');
console.log(`📧 Email Service: ${process.env.EMAIL_SERVICE || 'gmail'}`);
console.log(`📧 Email User: ${process.env.EMAIL_USER}`);
console.log(`📧 Test Recipient: ${testUser.email}\n`);

// Test 1: Payment Success Email
console.log('📨 Test 1: Sending Payment Success Email...');
sendPaymentSuccessEmail({
  to: testUser.email,
  userName: testUser.name,
  order: testOrder,
  paymentId: testPaymentId
})
  .then(result => {
    if (result.success) {
      console.log('✅ Payment success email sent successfully!');
      console.log(`   Message ID: ${result.messageId}\n`);
      
      // Test 2: Order Confirmation Email
      console.log('📨 Test 2: Sending Order Confirmation Email (COD)...');
      return sendOrderConfirmationEmail({
        to: testUser.email,
        userName: testUser.name,
        order: testOrder
      });
    } else {
      throw new Error(result.message || result.error);
    }
  })
  .then(result => {
    if (result.success) {
      console.log('✅ Order confirmation email sent successfully!');
      console.log(`   Message ID: ${result.messageId}\n`);
      
      console.log('🎉 All email tests passed!');
      console.log(`\n📬 Check the inbox of: ${testUser.email}`);
      console.log('   You should receive 2 test emails.');
      console.log('\n💡 Tip: Check spam/junk folder if emails are not in inbox.');
      process.exit(0);
    } else {
      throw new Error(result.message || result.error);
    }
  })
  .catch(error => {
    console.error('\n❌ Email test failed!');
    console.error('Error:', error.message);
    console.log('\n🔍 Troubleshooting:');
    console.log('1. Check if EMAIL_USER and EMAIL_PASS are correct in .env');
    console.log('2. For Gmail, make sure you are using App Password (not regular password)');
    console.log('3. Enable 2-Step Verification and generate App Password at:');
    console.log('   https://myaccount.google.com/apppasswords');
    console.log('4. Check if your email service allows SMTP access');
    console.log('\nSee backend/EMAIL_SETUP.md for detailed troubleshooting.');
    process.exit(1);
  });