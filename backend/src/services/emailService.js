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

/**
 * Send hub arrival notification email to user
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.userName - User's name
 * @param {Object} options.order - Order details
 * @param {Object} options.hub - Hub details where order arrived
 * @param {Date} options.arrivedAt - Timestamp when order arrived
 */
export const sendHubArrivalEmail = async ({ to, userName, order, hub, arrivedAt }) => {
  const emailTransporter = initializeTransporter();
  
  if (!emailTransporter) {
    console.warn('⚠️ Email service not available. Skipping hub arrival notification.');
    return { success: false, message: 'Email service not configured' };
  }

  try {
    const formattedDate = new Date(arrivedAt).toLocaleString('en-IN', { 
      dateStyle: 'full', 
      timeStyle: 'short' 
    });

    const mailOptions = {
      from: `"PEPPER Store" <${process.env.EMAIL_USER}>`,
      to: to,
      subject: `📍 Order Update - Package Arrived at ${hub.name}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Package Tracking Update</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #2c5f2d 0%, #10b981 100%); padding: 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px;">📍 Package Tracking Update</h1>
            </div>
            
            <!-- Content -->
            <div style="padding: 30px;">
              <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">
                Dear ${userName},
              </p>
              
              <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">
                Great news! Your order has reached a new destination in its journey to you.
              </p>
              
              <!-- Current Location -->
              <div style="background-color: #dcfce7; border-left: 4px solid #10b981; padding: 20px; margin-bottom: 20px;">
                <h2 style="color: #166534; font-size: 20px; margin-top: 0;">📦 Current Location</h2>
                <div style="background-color: #ffffff; border-radius: 8px; padding: 15px; margin-top: 10px;">
                  <p style="margin: 5px 0; font-size: 18px; font-weight: bold; color: #15803d;">
                    ${hub.name}
                  </p>
                  ${hub.district ? `<p style="margin: 5px 0; color: #166534;">📍 ${hub.district}</p>` : ''}
                  ${hub.type ? `<p style="margin: 5px 0; color: #166534; font-size: 14px;">Hub Type: ${hub.type.replace('_', ' ')}</p>` : ''}
                </div>
              </div>
              
              <!-- Arrival Time -->
              <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                <h3 style="color: #2c5f2d; font-size: 18px; margin-top: 0;">⏰ Arrival Time</h3>
                <p style="margin: 5px 0; color: #374151; font-size: 16px;">
                  <strong>${formattedDate}</strong>
                </p>
              </div>
              
              <!-- Order Details -->
              <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                <h3 style="color: #2c5f2d; font-size: 18px; margin-top: 0;">📋 Order Details</h3>
                <p style="margin: 5px 0;"><strong>Order ID:</strong> ${order._id}</p>
                <p style="margin: 5px 0;"><strong>Total Items:</strong> ${order.items.length}</p>
                <p style="margin: 5px 0;"><strong>Order Amount:</strong> ₹${order.totalAmount.toFixed(2)}</p>
              </div>
              
              ${order.shippingAddress && order.shippingAddress.line1 ? `
              <!-- Delivery Address -->
              <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin-bottom: 20px;">
                <h3 style="color: #92400e; font-size: 16px; margin-top: 0;">🏠 Delivery Destination</h3>
                <p style="margin: 5px 0; color: #92400e;">
                  ${order.shippingAddress.line1}<br>
                  ${order.shippingAddress.line2 ? order.shippingAddress.line2 + '<br>' : ''}
                  ${order.shippingAddress.district}, ${order.shippingAddress.state || ''}<br>
                  ${order.shippingAddress.pincode}
                </p>
              </div>
              ` : ''}
              
              <p style="font-size: 16px; color: #374151; margin-bottom: 10px;">
                Your order is progressing smoothly towards its final destination. We'll keep you updated with each step of the journey!
              </p>
              
              <p style="font-size: 16px; color: #374151;">
                Thank you for your patience and for choosing PEPPER Store!
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
    console.log(`✅ Hub arrival email sent to ${to} for hub ${hub.name}:`, info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Failed to send hub arrival email:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send collection OTP email to user for hub collection
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.userName - User's name
 * @param {Object} options.order - Order details
 * @param {string} options.otp - Collection OTP
 * @param {string} options.hubName - Hub name for collection
 */
export const sendCollectionOtpEmail = async ({ to, userName, order, otp, hubName }) => {
  const emailTransporter = initializeTransporter();
  
  if (!emailTransporter) {
    console.warn('⚠️ Email service not available. Skipping email notification.');
    return { success: false, message: 'Email service not configured' };
  }

  try {
    const orderItems = order.items
      .map(item => `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${item.name || 'Product'}</td>
          <td style="padding: 10px; text-align: center; border-bottom: 1px solid #e5e7eb;">${item.quantity}</td>
          <td style="padding: 10px; text-align: right; border-bottom: 1px solid #e5e7eb;">₹${item.priceAtOrder.toFixed(2)}</td>
          <td style="padding: 10px; text-align: right; border-bottom: 1px solid #e5e7eb;">₹${(item.priceAtOrder * item.quantity).toFixed(2)}</td>
        </tr>
      `).join('');

    const mailOptions = {
      from: `"PEPPER Store" <${process.env.EMAIL_USER}>`,
      to: to,
      subject: `Your Order is Ready for Collection! - Order #${order._id.toString().slice(-6).toUpperCase()}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px;">🎉 Order Ready for Collection!</h1>
            </div>
            
            <!-- Content -->
            <div style="padding: 30px;">
              <p style="font-size: 18px; color: #111827; margin-bottom: 10px;">
                Hello ${userName},
              </p>
              
              <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">
                Great news! Your order is ready for collection at <strong>${hubName}</strong>.
              </p>
              
              <!-- OTP Section -->
              <div style="background-color: #f0fdf4; border: 2px dashed #10b981; border-radius: 8px; padding: 20px; margin-bottom: 20px; text-align: center;">
                <p style="margin: 0 0 10px 0; color: #065f46; font-weight: bold; font-size: 16px;">Your Collection OTP</p>
                <div style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #059669; margin: 10px 0;">
                  ${otp}
                </div>
                <p style="margin: 10px 0 0 0; font-size: 12px; color: #065f46;">
                  Please present this OTP at ${hubName} to collect your order.
                </p>
                <p style="margin: 5px 0 0 0; font-size: 11px; color: #6b7280;">
                  This OTP is valid for 24 hours.
                </p>
              </div>
              
              <!-- Order Details -->
              <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                <h2 style="color: #059669; font-size: 20px; margin-top: 0;">Order Details</h2>
                <p style="margin: 5px 0;"><strong>Order ID:</strong> #${order._id.toString().slice(-6).toUpperCase()}</p>
                <p style="margin: 5px 0;"><strong>Collection Hub:</strong> ${hubName}</p>
                <p style="margin: 5px 0;"><strong>Payment Method:</strong> ${order.payment?.method || 'Cash on Collection'}</p>
              </div>
              
              <!-- Order Items -->
              <h3 style="color: #059669; font-size: 18px; margin-bottom: 15px;">Order Items</h3>
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
                    <td colspan="3" style="padding: 15px; text-align: right; font-weight: bold; border-top: 2px solid #e5e7eb;">Total Amount:</td>
                    <td style="padding: 15px; text-align: right; font-weight: bold; font-size: 18px; color: #059669; border-top: 2px solid #e5e7eb;">₹${order.totalAmount.toFixed(2)}</td>
                  </tr>
                </tfoot>
              </table>
              
              <!-- Collection Instructions -->
              <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin-bottom: 20px;">
                <h3 style="color: #92400e; font-size: 16px; margin-top: 0;">📍 Collection Instructions</h3>
                <ol style="margin: 10px 0; padding-left: 20px; color: #92400e;">
                  <li>Visit <strong>${hubName}</strong> during business hours</li>
                  <li>Present your Collection OTP: <strong>${otp}</strong></li>
                  <li>Verify your identity with a valid ID</li>
                  <li>Complete payment (if Cash on Collection)</li>
                  <li>Collect your order</li>
                </ol>
                <p style="margin: 10px 0 0 0; font-size: 12px; color: #92400e;">
                  ⏰ Please collect your order within 24 hours.
                </p>
              </div>
              
              <p style="font-size: 14px; color: #6b7280; margin-top: 20px;">
                If you have any questions, please contact our support team.
              </p>
              
              <p style="font-size: 14px; color: #374151; margin-top: 20px;">
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
    console.log(`✅ Collection OTP email sent to ${to}:`, info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Failed to send collection OTP email:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send hub arrival notification email
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.userName - User's name
 * @param {Object} options.order - Order details
 * @param {string} options.hubName - Hub name where package arrived
 */
export const sendHubArrivedForCollectionEmail = async ({ to, userName, order, hubName }) => {
  const emailTransporter = initializeTransporter();
  
  if (!emailTransporter) {
    console.warn('⚠️ Email service not available. Skipping email notification.');
    return { success: false, message: 'Email service not configured' };
  }

  try {
    const orderItems = order.items
      .map(item => `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${item.name || 'Product'}</td>
          <td style="padding: 10px; text-align: center; border-bottom: 1px solid #e5e7eb;">${item.quantity}</td>
          <td style="padding: 10px; text-align: right; border-bottom: 1px solid #e5e7eb;">₹${item.priceAtOrder.toFixed(2)}</td>
        </tr>
      `).join('');

    const mailOptions = {
      from: `"PEPPER Store" <${process.env.EMAIL_USER}>`,
      to: to,
      subject: `Your Order Has Arrived at ${hubName} - Order #${order._id.toString().slice(-6).toUpperCase()}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); padding: 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px;">📦 Package Arrived!</h1>
            </div>
            
            <!-- Content -->
            <div style="padding: 30px;">
              <p style="font-size: 18px; color: #111827; margin-bottom: 10px;">
                Hello ${userName},
              </p>
              
              <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">
                Good news! Your order has arrived at <strong>${hubName}</strong> and is being prepared for collection.
              </p>
              
              <!-- Info Box -->
              <div style="background-color: #f5f3ff; border-left: 4px solid #8b5cf6; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                <h3 style="color: #7c3aed; margin-top: 0; font-size: 18px;">📍 Collection Location</h3>
                <p style="margin: 5px 0; color: #374151; font-size: 16px; font-weight: bold;">
                  ${hubName}
                </p>
                <p style="margin: 10px 0 0 0; color: #6b7280; font-size: 14px;">
                  ⏰ We will notify you once your order is ready for collection with an OTP.
                </p>
              </div>
              
              <!-- Order Details -->
              <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                <h2 style="color: #7c3aed; font-size: 20px; margin-top: 0;">Order Items</h2>
                <table style="width: 100%; border-collapse: collapse;">
                  <thead>
                    <tr style="background-color: #f3f4f6;">
                      <th style="padding: 10px; text-align: left; color: #374151; font-size: 14px; border-bottom: 2px solid #e5e7eb;">Item</th>
                      <th style="padding: 10px; text-align: center; color: #374151; font-size: 14px; border-bottom: 2px solid #e5e7eb;">Qty</th>
                      <th style="padding: 10px; text-align: right; color: #374151; font-size: 14px; border-bottom: 2px solid #e5e7eb;">Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${orderItems}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colspan="2" style="padding: 15px 10px 10px 10px; text-align: right; font-weight: bold; color: #111827; font-size: 16px; border-top: 2px solid #e5e7eb;">Total:</td>
                      <td style="padding: 15px 10px 10px 10px; text-align: right; font-weight: bold; color: #7c3aed; font-size: 18px; border-top: 2px solid #e5e7eb;">₹${order.totalAmount.toFixed(2)}</td>
                    </tr>
                  </tfoot>
                </table>
                <p style="margin: 15px 0 5px 0; font-size: 14px; color: #374151;">
                  <strong>Order ID:</strong> ${order._id.toString().slice(-8).toUpperCase()}
                </p>
              </div>
              
              <!-- Next Steps -->
              <div style="background-color: #fff7ed; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                <h3 style="color: #ea580c; margin-top: 0; font-size: 16px;">🔔 What's Next?</h3>
                <ul style="margin: 10px 0; padding-left: 20px; color: #374151;">
                  <li style="margin-bottom: 8px;">Your order is being processed at the hub</li>
                  <li style="margin-bottom: 8px;">You'll receive another email with a collection OTP</li>
                  <li style="margin-bottom: 8px;">Present the OTP at the hub to collect your order</li>
                </ul>
              </div>
              
              <p style="font-size: 14px; color: #6b7280; text-align: center;">
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
    console.log(`✅ Hub arrival notification email sent to ${to}:`, info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Failed to send hub arrival email:', error);
    return { success: false, error: error.message };
  }
};

export default {
  sendPaymentSuccessEmail,
  sendOrderConfirmationEmail,
  sendDeliveryOtpEmail,
  sendHubArrivalEmail,
  sendCollectionOtpEmail,
  sendHubArrivedForCollectionEmail
};