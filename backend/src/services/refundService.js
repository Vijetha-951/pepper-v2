import '../config/env.js';
import Razorpay from 'razorpay';

// Initialize Razorpay
let razorpay = null;
if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_ID !== 'your_razorpay_key_id') {
  razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
  });
  console.log('✅ Razorpay initialized for refund service');
} else {
  console.log('❌ Razorpay NOT initialized in refund service');
}

/**
 * Process a refund for a payment
 * @param {string} paymentId - Razorpay payment ID
 * @param {number} amount - Amount to refund in rupees (will be converted to paise)
 * @param {string} reason - Reason for refund (optional)
 * @returns {Promise<Object>} Refund details
 */
export const processRefund = async (paymentId, amount, reason = 'Order cancelled by customer') => {
  if (!razorpay) {
    throw new Error('Payment gateway not configured');
  }

  try {
    // Convert amount to paise (Razorpay expects amount in smallest currency unit)
    const amountInPaise = Math.round(amount * 100);

    console.log('🔄 Processing refund:', {
      paymentId,
      amount: amountInPaise,
      reason
    });

    // Create refund using Razorpay API
    const refund = await razorpay.payments.refund(paymentId, {
      amount: amountInPaise,
      speed: 'normal', // 'normal' or 'optimum' - normal takes 5-7 days
      notes: {
        reason: reason
      }
    });

    console.log('✅ Refund processed successfully:', refund.id);

    return {
      success: true,
      refundId: refund.id,
      amount: refund.amount / 100, // Convert back to rupees
      status: refund.status,
      createdAt: new Date(refund.created_at * 1000),
      message: 'Refund initiated successfully. Amount will be credited to your account in 5-7 business days.'
    };

  } catch (error) {
    console.error('❌ Refund processing error:', error);
    
    // Handle specific Razorpay errors
    if (error.error) {
      const razorpayError = error.error;
      
      // Payment already refunded
      if (razorpayError.code === 'BAD_REQUEST_ERROR' && 
          razorpayError.description?.includes('already been refunded')) {
        return {
          success: false,
          error: 'This payment has already been refunded',
          code: 'ALREADY_REFUNDED'
        };
      }
      
      // Payment not captured yet
      if (razorpayError.code === 'BAD_REQUEST_ERROR' && 
          razorpayError.description?.includes('not captured')) {
        return {
          success: false,
          error: 'Payment is not yet captured and cannot be refunded',
          code: 'NOT_CAPTURED'
        };
      }
      
      // Invalid payment ID
      if (razorpayError.code === 'BAD_REQUEST_ERROR' && 
          razorpayError.description?.includes('does not exist')) {
        return {
          success: false,
          error: 'Invalid payment ID',
          code: 'INVALID_PAYMENT_ID'
        };
      }
    }

    // Generic error
    throw new Error(error.message || 'Failed to process refund');
  }
};

/**
 * Check refund status
 * @param {string} refundId - Razorpay refund ID
 * @returns {Promise<Object>} Refund status details
 */
export const checkRefundStatus = async (refundId) => {
  if (!razorpay) {
    throw new Error('Payment gateway not configured');
  }

  try {
    const refund = await razorpay.refunds.fetch(refundId);
    
    return {
      success: true,
      refundId: refund.id,
      paymentId: refund.payment_id,
      amount: refund.amount / 100,
      status: refund.status, // 'processed', 'pending', 'failed'
      createdAt: new Date(refund.created_at * 1000)
    };
  } catch (error) {
    console.error('❌ Error checking refund status:', error);
    throw new Error('Failed to check refund status');
  }
};

/**
 * Process full refund for an order
 * @param {Object} order - Order object with payment details
 * @returns {Promise<Object>} Refund result
 */
export const processOrderRefund = async (order) => {
  // Check if payment method is ONLINE
  if (order.payment.method !== 'ONLINE') {
    return {
      success: false,
      error: 'Only online payments can be refunded automatically. COD orders do not require refund.',
      code: 'NOT_ONLINE_PAYMENT'
    };
  }

  // Check if payment is PAID
  if (order.payment.status !== 'PAID') {
    return {
      success: false,
      error: 'Payment is not in PAID status and cannot be refunded',
      code: 'PAYMENT_NOT_PAID'
    };
  }

  // Check if transaction ID exists
  if (!order.payment.transactionId) {
    return {
      success: false,
      error: 'No transaction ID found for this order',
      code: 'NO_TRANSACTION_ID'
    };
  }

  // Process the refund
  return await processRefund(
    order.payment.transactionId,
    order.totalAmount,
    `Order cancellation - Order ID: ${order._id}`
  );
};

export default {
  processRefund,
  checkRefundStatus,
  processOrderRefund
};