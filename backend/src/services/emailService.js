import nodemailer from 'nodemailer';

// Create reusable transporter
let transporter = null;

const initializeTransporter = () => {
  if (transporter) return transporter;

  // Check if email credentials are configured
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn('⚠️ Email service not configured. Set EMAIL_USER and EMAIL_PASS in .env');
    return null;
  }

  try {
    transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || 'gmail', // gmail, outlook, etc.
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS // For Gmail, use App Password
      }
    });
    console.log('✅ Email service initialized');
    return transporter;
  } catch (error) {
    console.error('❌ Failed to initialize email service:', error);
    return null;
  }
};

/**
 * Send payment success email to user
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.userName - User's name
 * @param {Object} options.order - Order details
 * @param {string} options.paymentId - Payment transaction ID
 */
export const sendPaymentSuccessEmail = async ({ to, userName, order, paymentId }) => {
  const emailTransporter = initializeTransporter();
  
  if (!emailTransporter) {
    console.warn('⚠️ Email service not available. Skipping email notification.');
    return { success: false, message: 'Email service not configured' };
  }

  try {
    const orderItems = order.items
      .map(item => `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${item.name}</td>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.quantity}</td>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: right;">₹${item.priceAtOrder.toFixed(2)}</td>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: right;">₹${(item.priceAtOrder * item.quantity).toFixed(2)}</td>
        </tr>
      `)
      .join('');

    const mailOptions = {
      from: `"PEPPER Store" <${process.env.EMAIL_USER}>`,
      to: to,
      subject: '✅ Payment Successful - Order Confirmed',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Payment Successful</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #2c5f2d 0%, #10b981 100%); padding: 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px;">Payment Successful! 🎉</h1>
            </div>
            
            <!-- Content -->
            <div style="padding: 30px;">
              <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">
                Dear ${userName},
              </p>
              
              <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">
                Thank you for your purchase! Your payment has been successfully processed and your order has been confirmed.
              </p>
              
              <!-- Order Details -->
              <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                <h2 style="color: #2c5f2d; font-size: 20px; margin-top: 0;">Order Details</h2>
                <p style="margin: 5px 0;"><strong>Order ID:</strong> ${order._id}</p>
                <p style="margin: 5px 0;"><strong>Payment ID:</strong> ${paymentId}</p>
                <p style="margin: 5px 0;"><strong>Order Date:</strong> ${new Date(order.createdAt).toLocaleString('en-IN', { 
                  dateStyle: 'medium', 
                  timeStyle: 'short' 
                })}</p>
              </div>
              
              <!-- Order Items -->
              <h3 style="color: #2c5f2d; font-size: 18px; margin-bottom: 15px;">Order Items</h3>
              <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                <thead>
                  <tr style="background-color: #f3f4f6;">
                    <th style="padding: 10px; text-align: left; border-bottom: 2px solid #e5e7eb;">Product</th>
                    <th style="padding: 10px; text-align: center; border-bottom: 2px solid #e5e7eb;">Qty</th>
                    <th style="padding: 10px; text-align: right; border-bottom: 2px solid #e5e7eb;">Price</th>
                    <th style="padding: 10px; text-align: right; border-bottom: 2px solid #e5e7eb;">Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${orderItems}
                </tbody>
                <tfoot>
                  <tr>
                    <td colspan="3" style="padding: 15px 10px 10px; text-align: right; font-weight: bold; font-size: 18px;">Total Amount:</td>
                    <td style="padding: 15px 10px 10px; text-align: right; font-weight: bold; font-size: 18px; color: #2c5f2d;">₹${order.totalAmount.toFixed(2)}</td>
                  </tr>
                </tfoot>
              </table>
              
              <!-- Shipping Address -->
              ${order.shippingAddress && order.shippingAddress.line1 ? `
              <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                <h3 style="color: #2c5f2d; font-size: 18px; margin-top: 0;">Shipping Address</h3>
                <p style="margin: 5px 0; color: #374151;">
                  ${order.shippingAddress.line1}<br>
                  ${order.shippingAddress.line2 ? order.shippingAddress.line2 + '<br>' : ''}
                  ${order.shippingAddress.district}, ${order.shippingAddress.state || ''}<br>
                  ${order.shippingAddress.pincode}
                </p>
              </div>
              ` : ''}
              
              <!-- Next Steps -->
              <div style="background-color: #dcfce7; border-left: 4px solid #10b981; padding: 15px; margin-bottom: 20px;">
                <h3 style="color: #166534; font-size: 16px; margin-top: 0;">What's Next?</h3>
                <ul style="margin: 10px 0; padding-left: 20px; color: #166534;">
                  <li>Your order is being processed</li>
                  <li>You'll receive updates on your order status</li>
                  <li>Track your order anytime from your account</li>
                </ul>
              </div>
              
              <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">
                If you have any questions about your order, please don't hesitate to contact us.
              </p>
              
              <p style="font-size: 16px; color: #374151;">
                Thank you for shopping with PEPPER Store!
              </p>
            </div>
            
            <!-- Footer -->
            <div style="background-color: #f3f4f6; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 5px 0; color: #6b7280; font-size: 14px;">
                PEPPER Store - Premium Pepper Products
              </p>
              <p style="margin: 5px 0; color: #6b7280; font-size: 12px;">
                This is an automated email. Please do not reply to this message.
              </p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    const info = await emailTransporter.sendMail(mailOptions);
    console.log('✅ Payment success email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Failed to send payment success email:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send order confirmation email (for COD orders)
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.userName - User's name
 * @param {Object} options.order - Order details
 */
export const sendOrderConfirmationEmail = async ({ to, userName, order }) => {
  const emailTransporter = initializeTransporter();
  
  if (!emailTransporter) {
    console.warn('⚠️ Email service not available. Skipping email notification.');
    return { success: false, message: 'Email service not configured' };
  }

  try {
    const orderItems = order.items
      .map(item => `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${item.name}</td>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.quantity}</td>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: right;">₹${item.priceAtOrder.toFixed(2)}</td>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: right;">₹${(item.priceAtOrder * item.quantity).toFixed(2)}</td>
        </tr>
      `)
      .join('');

    const mailOptions = {
      from: `"PEPPER Store" <${process.env.EMAIL_USER}>`,
      to: to,
      subject: '✅ Order Confirmed - Cash on Delivery',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Order Confirmed</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #2c5f2d 0%, #10b981 100%); padding: 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px;">Order Confirmed! 🎉</h1>
            </div>
            
            <!-- Content -->
            <div style="padding: 30px;">
              <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">
                Dear ${userName},
              </p>
              
              <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">
                Thank you for your order! Your order has been confirmed and will be delivered soon.
              </p>
              
              <!-- Order Details -->
              <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                <h2 style="color: #2c5f2d; font-size: 20px; margin-top: 0;">Order Details</h2>
                <p style="margin: 5px 0;"><strong>Order ID:</strong> ${order._id}</p>
                <p style="margin: 5px 0;"><strong>Payment Method:</strong> Cash on Delivery</p>
                <p style="margin: 5px 0;"><strong>Order Date:</strong> ${new Date(order.createdAt).toLocaleString('en-IN', { 
                  dateStyle: 'medium', 
                  timeStyle: 'short' 
                })}</p>
              </div>
              
              <!-- Order Items -->
              <h3 style="color: #2c5f2d; font-size: 18px; margin-bottom: 15px;">Order Items</h3>
              <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                <thead>
                  <tr style="background-color: #f3f4f6;">
                    <th style="padding: 10px; text-align: left; border-bottom: 2px solid #e5e7eb;">Product</th>
                    <th style="padding: 10px; text-align: center; border-bottom: 2px solid #e5e7eb;">Qty</th>
                    <th style="padding: 10px; text-align: right; border-bottom: 2px solid #e5e7eb;">Price</th>
                    <th style="padding: 10px; text-align: right; border-bottom: 2px solid #e5e7eb;">Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${orderItems}
                </tbody>
                <tfoot>
                  <tr>
                    <td colspan="3" style="padding: 15px 10px 10px; text-align: right; font-weight: bold; font-size: 18px;">Total Amount (COD):</td>
                    <td style="padding: 15px 10px 10px; text-align: right; font-weight: bold; font-size: 18px; color: #2c5f2d;">₹${order.totalAmount.toFixed(2)}</td>
                  </tr>
                </tfoot>
              </table>
              
              <!-- Shipping Address -->
              ${order.shippingAddress && order.shippingAddress.line1 ? `
              <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                <h3 style="color: #2c5f2d; font-size: 18px; margin-top: 0;">Delivery Address</h3>
                <p style="margin: 5px 0; color: #374151;">
                  ${order.shippingAddress.line1}<br>
                  ${order.shippingAddress.line2 ? order.shippingAddress.line2 + '<br>' : ''}
                  ${order.shippingAddress.district}, ${order.shippingAddress.state || ''}<br>
                  ${order.shippingAddress.pincode}
                </p>
              </div>
              ` : ''}
              
              <!-- Payment Info -->
              <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin-bottom: 20px;">
                <h3 style="color: #92400e; font-size: 16px; margin-top: 0;">Payment Information</h3>
                <p style="margin: 5px 0; color: #92400e;">
                  Please keep <strong>₹${order.totalAmount.toFixed(2)}</strong> ready for payment upon delivery.
                </p>
              </div>
              
              <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">
                If you have any questions about your order, please don't hesitate to contact us.
              </p>
              
              <p style="font-size: 16px; color: #374151;">
                Thank you for shopping with PEPPER Store!
              </p>
            </div>
            
            <!-- Footer -->
            <div style="background-color: #f3f4f6; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 5px 0; color: #6b7280; font-size: 14px;">
                PEPPER Store - Premium Pepper Products
              </p>
              <p style="margin: 5px 0; color: #6b7280; font-size: 12px;">
                This is an automated email. Please do not reply to this message.
              </p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    const info = await emailTransporter.sendMail(mailOptions);
    console.log('✅ Order confirmation email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Failed to send order confirmation email:', error);
    return { success: false, error: error.message };
  }
};

export const sendDeliveryOtpEmail = async ({ to, userName, order, otp }) => {
  const emailTransporter = initializeTransporter();
  
  if (!emailTransporter) {
    console.warn('⚠️ Email service not available. Skipping OTP email.');
    return { success: false, message: 'Email service not configured' };
  }

  try {
    const mailOptions = {
      from: `"PEPPER Store" <${process.env.EMAIL_USER}>`,
      to: to,
      subject: '📦 Out for Delivery - Your Delivery OTP',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Out for Delivery</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #2c5f2d 0%, #10b981 100%); padding: 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px;">Out for Delivery! 🚚</h1>
            </div>
            
            <!-- Content -->
            <div style="padding: 30px;">
              <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">
                Dear ${userName},
              </p>
              
              <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">
                Your order is out for delivery and will reach you soon!
              </p>
              
              <!-- OTP Section -->
              <div style="background-color: #f0fdf4; border: 2px dashed #16a34a; border-radius: 8px; padding: 20px; margin-bottom: 20px; text-align: center;">
                <p style="margin: 0 0 10px 0; color: #166534; font-weight: bold;">Your Delivery OTP</p>
                <div style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #15803d;">
                  ${otp}
                </div>
                <p style="margin: 10px 0 0 0; font-size: 12px; color: #166534;">
                  Please share this code with the delivery agent only upon receiving your package.
                </p>
              </div>
              
              <!-- Order Details -->
              <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                <h2 style="color: #2c5f2d; font-size: 20px; margin-top: 0;">Order Details</h2>
                <p style="margin: 5px 0;"><strong>Order ID:</strong> ${order._id}</p>
                <p style="margin: 5px 0;"><strong>Amount to Pay:</strong> ₹${order.totalAmount.toFixed(2)} (${order.payment.method})</p>
              </div>
              
              <p style="font-size: 16px; color: #374151;">
                Thank you for shopping with PEPPER Store!
              </p>
            </div>
            
            <!-- Footer -->
            <div style="background-color: #f3f4f6; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 5px 0; color: #6b7280; font-size: 14px;">
                PEPPER Store - Premium Pepper Products
              </p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    const info = await emailTransporter.sendMail(mailOptions);
    console.log('✅ Delivery OTP email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Failed to send delivery OTP email:', error);
    return { success: false, error: error.message };
  }
};

export default {
  sendPaymentSuccessEmail,
  sendOrderConfirmationEmail,
  sendDeliveryOtpEmail
};