import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { sendHubArrivalEmail } from '../src/services/emailService.js';

// Load environment variables
dotenv.config();

/**
 * Test script to verify hub arrival email notifications work correctly
 */
async function testHubArrivalEmail() {
  try {
    console.log('🧪 Testing Hub Arrival Email Notification...\n');

    // Test email data
    const testData = {
      to: process.env.TEST_EMAIL || 'test@example.com', // Use TEST_EMAIL from .env or default
      userName: 'John Doe',
      order: {
        _id: new mongoose.Types.ObjectId('507f1f77bcf86cd799439011'),
        items: [
          { name: 'Premium Black Pepper', quantity: 2, priceAtOrder: 299 },
          { name: 'White Pepper Powder', quantity: 1, priceAtOrder: 249 }
        ],
        totalAmount: 847,
        shippingAddress: {
          line1: '123 Main Street',
          line2: 'Apartment 4B',
          district: 'Thiruvananthapuram',
          state: 'Kerala',
          pincode: '695001'
        }
      },
      hub: {
        name: 'Kochi Regional Hub',
        district: 'Ernakulam',
        type: 'REGIONAL_HUB'
      },
      arrivedAt: new Date()
    };

    console.log('📧 Sending test email to:', testData.to);
    console.log('📦 Hub:', testData.hub.name);
    console.log('⏰ Arrival Time:', testData.arrivedAt.toLocaleString('en-IN'));
    console.log();

    // Send test email
    const result = await sendHubArrivalEmail(testData);

    if (result.success) {
      console.log('✅ Test email sent successfully!');
      console.log('📨 Message ID:', result.messageId);
      console.log('\n📬 Check your inbox at:', testData.to);
      console.log('\nNote: If using Gmail, check your spam folder if you don\'t see the email.');
    } else {
      console.log('❌ Test email failed to send');
      console.log('Error:', result.message || result.error);
      
      if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.log('\n⚠️  EMAIL CONFIGURATION MISSING!');
        console.log('Please set the following in your .env file:');
        console.log('  EMAIL_USER=your-email@gmail.com');
        console.log('  EMAIL_PASS=your-app-password');
        console.log('  EMAIL_SERVICE=gmail (optional, defaults to gmail)');
        console.log('  TEST_EMAIL=recipient@example.com (optional, for testing)');
      }
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

// Run the test
testHubArrivalEmail()
  .then(() => {
    console.log('\n✅ Test completed');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Test failed:', err);
    process.exit(1);
  });
