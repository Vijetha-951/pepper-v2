/**
 * Script to check refund status from Razorpay
 * 
 * Usage:
 * node backend/src/scripts/checkRefundStatus.js <payment_id> <refund_id>
 * 
 * Example:
 * node backend/src/scripts/checkRefundStatus.js pay_abc123 rfnd_xyz789
 */

require('dotenv').config();
const Razorpay = require('razorpay');

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

async function checkRefundStatus(paymentId, refundId) {
  try {
    console.log('\n🔍 Checking refund status...\n');
    console.log(`Payment ID: ${paymentId}`);
    console.log(`Refund ID: ${refundId}\n`);

    // Fetch refund details from Razorpay
    const refund = await razorpay.payments.fetchRefund(paymentId, refundId);

    console.log('✅ Refund Details:\n');
    console.log(`Status: ${refund.status}`);
    console.log(`Amount: ₹${refund.amount / 100}`);
    console.log(`Currency: ${refund.currency}`);
    console.log(`Created At: ${new Date(refund.created_at * 1000).toLocaleString()}`);
    
    if (refund.speed_processed) {
      console.log(`Speed: ${refund.speed_processed}`);
    }
    
    if (refund.notes && Object.keys(refund.notes).length > 0) {
      console.log(`Notes: ${JSON.stringify(refund.notes, null, 2)}`);
    }

    console.log('\n📊 Status Meanings:');
    console.log('  - pending: Refund initiated, processing in progress');
    console.log('  - processed: Money successfully refunded to customer');
    console.log('  - failed: Refund failed (will be auto-retried by Razorpay)');
    
    console.log('\n⏱️  Timeline:');
    console.log('  - Normal refunds: 5-7 business days');
    console.log('  - Instant refunds: Within 30 minutes (if enabled)');
    
    return refund;

  } catch (error) {
    console.error('\n❌ Error checking refund status:');
    console.error(`Message: ${error.error?.description || error.message}`);
    console.error(`Code: ${error.error?.code || 'N/A'}`);
    
    if (error.statusCode === 400) {
      console.error('\n💡 Tip: Check if Payment ID and Refund ID are correct');
    }
    
    process.exit(1);
  }
}

async function listAllRefundsForPayment(paymentId) {
  try {
    console.log('\n📋 Fetching all refunds for payment...\n');
    console.log(`Payment ID: ${paymentId}\n`);

    const refunds = await razorpay.payments.fetchMultipleRefund(paymentId);

    if (refunds.items.length === 0) {
      console.log('ℹ️  No refunds found for this payment');
      return;
    }

    console.log(`✅ Found ${refunds.items.length} refund(s):\n`);
    
    refunds.items.forEach((refund, index) => {
      console.log(`${index + 1}. Refund ID: ${refund.id}`);
      console.log(`   Status: ${refund.status}`);
      console.log(`   Amount: ₹${refund.amount / 100}`);
      console.log(`   Created: ${new Date(refund.created_at * 1000).toLocaleString()}`);
      console.log('');
    });

    return refunds;

  } catch (error) {
    console.error('\n❌ Error fetching refunds:');
    console.error(`Message: ${error.error?.description || error.message}`);
    process.exit(1);
  }
}

// Main execution
const args = process.argv.slice(2);

if (args.length === 0) {
  console.log('\n❌ Missing arguments!\n');
  console.log('Usage:');
  console.log('  Check specific refund:');
  console.log('    node checkRefundStatus.js <payment_id> <refund_id>');
  console.log('');
  console.log('  List all refunds for a payment:');
  console.log('    node checkRefundStatus.js <payment_id>');
  console.log('');
  console.log('Examples:');
  console.log('  node checkRefundStatus.js pay_abc123 rfnd_xyz789');
  console.log('  node checkRefundStatus.js pay_abc123');
  console.log('');
  process.exit(1);
}

const paymentId = args[0];
const refundId = args[1];

if (refundId) {
  // Check specific refund
  checkRefundStatus(paymentId, refundId);
} else {
  // List all refunds for payment
  listAllRefundsForPayment(paymentId);
}