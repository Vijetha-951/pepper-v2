import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure invoices directory exists
const invoicesDir = path.join(__dirname, '../../invoices');
if (!fs.existsSync(invoicesDir)) {
  fs.mkdirSync(invoicesDir, { recursive: true });
}

/**
 * Generate a PDF invoice for an order
 * @param {Object} order - Order object (must be populated with user, items.product)
 * @returns {Promise<string>} - Path to generated PDF file
 */
export const generateInvoice = async (order) => {
  return new Promise((resolve, reject) => {
    try {
      // Create invoice filename
      const invoiceNumber = `INV-${order._id.toString().slice(-8).toUpperCase()}`;
      const fileName = `${invoiceNumber}.pdf`;
      const filePath = path.join(invoicesDir, fileName);

      // Create PDF document
      const doc = new PDFDocument({ 
        size: 'A4', 
        margin: 50,
        info: {
          Title: `Invoice ${invoiceNumber}`,
          Author: 'PEPPER Store'
        }
      });

      // Pipe to file
      const writeStream = fs.createWriteStream(filePath);
      doc.pipe(writeStream);

      // Company Header
      doc
        .fontSize(26)
        .fillColor('#2c5f2d')
        .text('PEPPER STORE', 50, 50, { align: 'left' })
        .fontSize(10)
        .fillColor('#666666')
        .text('Premium Organic Products', 50, 85)
        .fontSize(9)
        .fillColor('#2c5f2d')
        .text('Kollam Hub', 50, 100)
        .fontSize(9)
        .fillColor('#666666')
        .text('Building No. 42, Chinnakada Junction', 50, 113)
        .text('Main Road, Kollam - 691001', 50, 126)
        .text('Email: info@pepperstore.com | Phone: +91 1234567890', 50, 139);

      // Invoice Title
      doc
        .fontSize(20)
        .fillColor('#000000')
        .text('INVOICE', 400, 50, { align: 'right' });

      // Invoice Details Box
      doc
        .fontSize(10)
        .fillColor('#666666')
        .text(`Invoice No: ${invoiceNumber}`, 400, 75, { align: 'right' })
        .text(`Date: ${new Date(order.createdAt).toLocaleDateString('en-IN')}`, 400, 90, { align: 'right' })
        .text(`Order ID: ${order._id}`, 400, 105, { align: 'right' });

      // Line separator
      doc
        .moveTo(50, 160)
        .lineTo(545, 160)
        .strokeColor('#2c5f2d')
        .lineWidth(2)
        .stroke();

      // Bill To Section
      const billToY = 180;
      doc
        .fontSize(12)
        .fillColor('#2c5f2d')
        .text('BILL TO:', 50, billToY)
        .fontSize(10)
        .fillColor('#000000')
        .text(`${order.user.firstName || ''} ${order.user.lastName || ''}`.trim() || 'Customer', 50, billToY + 20)
        .fillColor('#666666')
        .text(order.user.email || '', 50, billToY + 35);

      // Delivery Address or Hub Collection Address
      if (order.deliveryType === 'HUB_COLLECTION' && order.collectionHub) {
        doc.fillColor('#2c5f2d')
          .text('Collection Hub:', 50, billToY + 55)
          .fillColor('#000000')
          .text(order.collectionHub.name || 'Hub', 50, billToY + 70);
        
        if (order.collectionHub.address) {
          doc.text(order.collectionHub.address.line1 || '', 50, billToY + 85)
            .text(order.collectionHub.address.line2 || '', 50, billToY + 100)
            .text(`${order.collectionHub.address.district || ''}, ${order.collectionHub.address.state || ''}`, 50, billToY + 115)
            .text(`PIN: ${order.collectionHub.address.pincode || ''}`, 50, billToY + 130);
        }
      } else if (order.deliveryAddress && order.deliveryAddress.line1) {
        doc.fillColor('#2c5f2d')
          .text('Delivery Address:', 50, billToY + 55)
          .fillColor('#000000')
          .text(order.deliveryAddress.line1, 50, billToY + 70)
          .text(order.deliveryAddress.line2 || '', 50, billToY + 85)
          .text(`${order.deliveryAddress.district || ''}, ${order.deliveryAddress.state || ''}`, 50, billToY + 100)
          .text(`PIN: ${order.deliveryAddress.pincode || ''}`, 50, billToY + 115);
      }

      // Payment Info Box
      doc
        .fontSize(10)
        .fillColor('#2c5f2d')
        .text('PAYMENT INFO:', 350, billToY)
        .fillColor('#000000')
        .text(`Method: ${order.payment?.method || 'COD'}`, 350, billToY + 20)
        .text(`Status: ${order.payment?.status || 'PENDING'}`, 350, billToY + 35);

      if (order.payment?.transactionId) {
        doc.text(`Transaction ID: ${order.payment.transactionId}`, 350, billToY + 50);
      }

      // Delivery Type
      const deliveryTypeText = order.deliveryType === 'HUB_COLLECTION' ? 'Hub Collection' : 'Home Delivery';
      doc.text(`Delivery: ${deliveryTypeText}`, 350, billToY + 70);

      // Table Header
      const tableTop = 340;
      doc
        .fontSize(10)
        .fillColor('#ffffff')
        .rect(50, tableTop, 495, 25)
        .fillAndStroke('#2c5f2d', '#2c5f2d');

      doc
        .fillColor('#ffffff')
        .text('Item', 60, tableTop + 8, { width: 200 })
        .text('Qty', 270, tableTop + 8, { width: 50, align: 'center' })
        .text('Price', 330, tableTop + 8, { width: 80, align: 'right' })
        .text('Amount', 420, tableTop + 8, { width: 115, align: 'right' });

      // Table Items
      let yPosition = tableTop + 35;
      const items = order.items || [];

      items.forEach((item, index) => {
        const itemName = item.name || item.product?.name || 'Product';
        const quantity = item.quantity || 0;
        const price = item.priceAtOrder || 0;
        const amount = price * quantity;

        // Alternate row colors
        if (index % 2 === 0) {
          doc
            .rect(50, yPosition - 5, 495, 25)
            .fillAndStroke('#f9fafb', '#f9fafb');
        }

        doc
          .fillColor('#000000')
          .fontSize(10)
          .text(itemName, 60, yPosition, { width: 200, ellipsis: true })
          .text(quantity.toString(), 270, yPosition, { width: 50, align: 'center' })
          .text(`Rs. ${price.toFixed(2)}`, 330, yPosition, { width: 80, align: 'right' })
          .text(`Rs. ${amount.toFixed(2)}`, 420, yPosition, { width: 115, align: 'right' });

        yPosition += 25;
      });

      // Summary section
      yPosition += 20;
      const summaryX = 350;

      // Subtotal
      doc
        .moveTo(summaryX, yPosition)
        .lineTo(545, yPosition)
        .strokeColor('#cccccc')
        .lineWidth(1)
        .stroke();

      yPosition += 10;
      doc
        .fontSize(10)
        .fillColor('#666666')
        .text('Subtotal:', summaryX, yPosition)
        .fillColor('#000000')
        .text(`Rs. ${order.totalAmount.toFixed(2)}`, 420, yPosition, { width: 115, align: 'right' });

      yPosition += 20;
      doc
        .fillColor('#666666')
        .text('Tax (0%):', summaryX, yPosition)
        .fillColor('#000000')
        .text('Rs. 0.00', 420, yPosition, { width: 115, align: 'right' });

      yPosition += 20;
      doc
        .fillColor('#666666')
        .text('Delivery Charges:', summaryX, yPosition)
        .fillColor('#000000')
        .text('Rs. 0.00', 420, yPosition, { width: 115, align: 'right' });

      // Total
      yPosition += 10;
      doc
        .moveTo(summaryX, yPosition)
        .lineTo(545, yPosition)
        .strokeColor('#2c5f2d')
        .lineWidth(2)
        .stroke();

      yPosition += 10;
      doc
        .fontSize(12)
        .fillColor('#2c5f2d')
        .text('TOTAL:', summaryX, yPosition)
        .fontSize(14)
        .text(`Rs. ${order.totalAmount.toFixed(2)}`, 420, yPosition, { width: 115, align: 'right' });

      // Footer
      const footerY = 720;
      doc
        .fontSize(9)
        .fillColor('#666666')
        .text('Thank you for shopping with PEPPER Store!', 50, footerY, { align: 'center', width: 495 })
        .text('For queries, contact us at support@pepperstore.com', 50, footerY + 15, { align: 'center', width: 495 });

      // Terms & Conditions
      doc
        .fontSize(8)
        .fillColor('#999999')
        .text('Terms: All sales are final. Return within 7 days for damaged items only.', 50, footerY + 35, { align: 'center', width: 495 });

      // Finalize PDF
      doc.end();

      // Wait for write to complete
      writeStream.on('finish', () => {
        console.log(`✅ Invoice generated: ${fileName}`);
        resolve(filePath);
      });

      writeStream.on('error', (error) => {
        console.error('❌ Error writing invoice:', error);
        reject(error);
      });

    } catch (error) {
      console.error('❌ Error generating invoice:', error);
      reject(error);
    }
  });
};

/**
 * Delete an invoice file
 * @param {string} filePath - Path to invoice file
 */
export const deleteInvoice = async (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`✅ Invoice deleted: ${filePath}`);
    }
  } catch (error) {
    console.error('❌ Error deleting invoice:', error);
  }
};

/**
 * Get invoice file path for an order
 * @param {string} orderId - Order ID
 * @returns {string} - Path to invoice file
 */
export const getInvoicePath = (orderId) => {
  const invoiceNumber = `INV-${orderId.toString().slice(-8).toUpperCase()}`;
  const fileName = `${invoiceNumber}.pdf`;
  return path.join(invoicesDir, fileName);
};

/**
 * Check if invoice exists for an order
 * @param {string} orderId - Order ID
 * @returns {boolean}
 */
export const invoiceExists = (orderId) => {
  const filePath = getInvoicePath(orderId);
  return fs.existsSync(filePath);
};
