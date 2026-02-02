# PDF Invoice System - Complete Guide

## 🎯 Overview

The PEPPER Store now includes a complete PDF invoice generation system that automatically creates professional invoices for all orders. Invoices are:

- **Automatically generated** and attached to confirmation emails
- **Downloadable** by customers for their orders
- **Accessible** to admins for all orders
- **Regenerable** if needed

---

## 📋 Features

### 1. **Automatic Invoice Generation**
- ✅ PDF invoices are generated automatically when orders are placed
- ✅ Attached to both payment success and COD confirmation emails
- ✅ Professional design with company branding

### 2. **Customer Access**
- ✅ Customers can download invoices for their own orders
- ✅ Only available for paid/confirmed orders
- ✅ Secure authentication required

### 3. **Admin Access**
- ✅ Admins can access invoices for any order
- ✅ Preview invoices in browser
- ✅ Regenerate invoices if needed
- ✅ Download for record-keeping

---

## 🔧 Technical Implementation

### Files Created/Modified

#### New Files:
1. **`backend/src/services/invoiceService.js`** - Invoice PDF generation logic
2. **`backend/src/routes/invoice.routes.js`** - Invoice API endpoints
3. **`backend/invoices/`** - Directory for storing generated invoices

#### Modified Files:
1. **`backend/src/services/emailService.js`** - Added invoice attachments
2. **`backend/src/server.js`** - Registered invoice routes

#### Dependencies Added:
- **pdfkit** - PDF generation library

---

## 📡 API Endpoints

### Customer Endpoints

#### 1. Download Own Invoice
```http
GET /api/invoices/:orderId
Authorization: Bearer <customer-token>
```

**Response:** PDF file download

**Example:**
```bash
GET /api/invoices/65f123abc456def789
```

---

### Admin Endpoints

#### 1. Download Any Invoice
```http
GET /api/invoices/admin/:orderId
Authorization: Bearer <admin-token>
```

**Response:** PDF file download

#### 2. Preview Invoice
```http
GET /api/invoices/preview/:orderId
Authorization: Bearer <admin-token>
```

**Response:** PDF file (inline preview in browser)

#### 3. Regenerate Invoice
```http
POST /api/invoices/regenerate/:orderId
Authorization: Bearer <admin-token>
```

**Response:**
```json
{
  "success": true,
  "message": "Invoice regenerated successfully",
  "invoiceNumber": "INV-ABC123",
  "orderId": "65f123abc456def789"
}
```

---

## 📧 Email Integration

### Invoice Attachments

Invoices are automatically attached to:

1. **Payment Success Emails** (Online payments)
   - Sent when payment is successfully processed
   - Invoice attached as PDF

2. **Order Confirmation Emails** (COD orders)
   - Sent when COD order is placed
   - Invoice attached as PDF

### Email Configuration

Make sure these environment variables are set in `.env`:

```env
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

---

## 📄 Invoice Format

### Invoice Contents

The generated PDF includes:

#### Header Section
- **Company Name:** PEPPER STORE
- **Company Details:** Email, phone, address
- **Invoice Number:** Format: `INV-XXXXXXXX`
- **Invoice Date:** Order creation date
- **Order ID:** Full order ID

#### Customer Information
- Customer name
- Email address
- Delivery address (if applicable)

#### Payment Information
- Payment method (COD/ONLINE)
- Payment status
- Transaction ID (if online payment)
- Delivery type (Home Delivery / Hub Collection)

#### Order Items Table
| Item | Quantity | Price | Amount |
|------|----------|-------|--------|
| Product Name | 2 | ₹100.00 | ₹200.00 |

#### Summary Section
- Subtotal
- Tax (currently 0%)
- Delivery charges (currently ₹0.00)
- **Total Amount**

#### Footer
- Thank you message
- Support contact information
- Terms & conditions

---

## 🎨 Invoice Design Features

- **Professional Layout:** Clean A4 format with proper margins
- **Company Branding:** Green color scheme matching PEPPER Store brand
- **Readable Typography:** Clear fonts and sizing hierarchy
- **Organized Sections:** Logical flow of information
- **Print-Ready:** Optimized for both digital viewing and printing

---

## 💻 Usage Examples

### Frontend Integration (React)

#### 1. Download Invoice Button (Customer)

```jsx
const downloadInvoice = async (orderId) => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`/api/invoices/${orderId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.ok) {
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Invoice-${orderId.slice(-8)}.pdf`;
      a.click();
    }
  } catch (error) {
    console.error('Error downloading invoice:', error);
  }
};

// In component
<button onClick={() => downloadInvoice(order._id)}>
  Download Invoice
</button>
```

#### 2. Admin Invoice Management

```jsx
const AdminInvoiceActions = ({ orderId }) => {
  const token = localStorage.getItem('token');
  
  const downloadInvoice = async () => {
    const response = await fetch(`/api/invoices/admin/${orderId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (response.ok) {
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Invoice-${orderId.slice(-8)}.pdf`;
      a.click();
    }
  };
  
  const previewInvoice = () => {
    window.open(`/api/invoices/preview/${orderId}`, '_blank');
  };
  
  const regenerateInvoice = async () => {
    const response = await fetch(`/api/invoices/regenerate/${orderId}`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const data = await response.json();
    alert(data.message);
  };
  
  return (
    <div>
      <button onClick={downloadInvoice}>Download</button>
      <button onClick={previewInvoice}>Preview</button>
      <button onClick={regenerateInvoice}>Regenerate</button>
    </div>
  );
};
```

---

## 🔒 Security Features

### Authentication
- ✅ Customers can only access their own invoices
- ✅ Admins can access all invoices
- ✅ JWT token verification required for all endpoints

### Validation
- ✅ Order ownership verification
- ✅ Payment status check (must be paid or COD)
- ✅ File existence validation

### File Storage
- ✅ Invoices stored in protected directory
- ✅ Static serving with route protection
- ✅ Automatic cleanup possible (future enhancement)

---

## 📊 File Storage

### Directory Structure

```
backend/
├── invoices/
│   ├── INV-ABC12345.pdf
│   ├── INV-DEF67890.pdf
│   └── ...
├── src/
│   ├── services/
│   │   └── invoiceService.js
│   └── routes/
│       └── invoice.routes.js
```

### Naming Convention
- Format: `INV-XXXXXXXX.pdf`
- XXXXXXXX = Last 8 characters of Order ID (uppercase)
- Example: Order ID `65f123abc456def789` → Invoice `INV-DEF789.pdf`

---

## 🧪 Testing

### Manual Testing

#### Test Customer Invoice Download
```bash
# Get auth token first
POST /api/auth/login
{
  "email": "customer@example.com",
  "password": "password"
}

# Download invoice
GET /api/invoices/65f123abc456def789
Authorization: Bearer <token>
```

#### Test Admin Features
```bash
# Admin login
POST /api/auth/login
{
  "email": "admin@pepper.com",
  "password": "admin123"
}

# Preview invoice
GET /api/invoices/preview/65f123abc456def789
Authorization: Bearer <admin-token>

# Regenerate invoice
POST /api/invoices/regenerate/65f123abc456def789
Authorization: Bearer <admin-token>
```

---

## 🚀 Deployment Checklist

- [ ] Ensure `pdfkit` is installed in production
- [ ] Verify `backend/invoices/` directory is created and writable
- [ ] Configure email service (EMAIL_USER, EMAIL_PASS)
- [ ] Test invoice generation for both COD and online orders
- [ ] Verify invoice attachments in emails
- [ ] Test customer invoice download
- [ ] Test admin invoice management
- [ ] Check file permissions on server
- [ ] Consider implementing invoice cleanup job (for old orders)

---

## 🔄 Future Enhancements

### Potential Features:
1. **Invoice Numbering:** Sequential invoice numbers (INV-0001, INV-0002, etc.)
2. **Multiple Formats:** Support for other formats (HTML, Excel)
3. **Customization:** Allow admins to customize invoice template
4. **Tax Calculation:** Automatic GST/VAT calculation
5. **Multi-language:** Support for multiple languages
6. **Bulk Download:** Download multiple invoices as ZIP
7. **Invoice History:** Track all invoice generations/regenerations
8. **Automatic Cleanup:** Delete invoices older than X months
9. **Digital Signature:** Add digital signatures for authenticity
10. **QR Code:** Add QR code for invoice verification

---

## ❓ Troubleshooting

### Issue: Invoice Not Generated
**Solution:** Check console logs for errors. Ensure order has all required fields populated.

### Issue: PDF Not Downloading
**Solution:** Verify authentication token is valid. Check if order exists and user has access.

### Issue: Invoice Not Attached to Email
**Solution:** Check if email service is configured. Look for errors in email service logs.

### Issue: Blank/Corrupted PDF
**Solution:** Ensure order is properly populated with user and product details before generating invoice.

### Issue: Permission Denied
**Solution:** Check file system permissions on `backend/invoices/` directory.

---

## 📞 Support

For issues or questions:
- Check backend logs for error messages
- Verify environment variables are set correctly
- Ensure MongoDB connection is working
- Test with a simple order first

---

## 📝 Summary

The PDF invoice system is now fully integrated into PEPPER Store:

✅ **Automatic generation** for all orders
✅ **Email attachments** for customer convenience
✅ **Customer download** capability
✅ **Admin management** tools
✅ **Professional design** with branding
✅ **Secure access** control
✅ **Easy to use** API endpoints

The system is production-ready and will enhance the professional appearance of your e-commerce platform!
