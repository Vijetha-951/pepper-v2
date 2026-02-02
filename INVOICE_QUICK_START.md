# Invoice System - Quick Start Guide

## ✨ What's New?

Your PEPPER Store now has **automatic PDF invoice generation**! 

### Features:
- ✅ **Auto-generated invoices** for every order
- ✅ **Email attachments** - customers receive invoice PDFs
- ✅ **Download capability** - customers can download anytime
- ✅ **Admin access** - view and manage all invoices

---

## 🚀 Quick Test

### 1. Test Invoice Generation
```bash
cd backend
node test-invoice-generation.js
```

This will:
- Find a sample order in your database
- Generate a PDF invoice
- Save it to `backend/invoices/`

### 2. View Generated Invoice
Check the file in: `backend/invoices/INV-XXXXXXXX.pdf`

---

## 📡 API Endpoints (Quick Reference)

### Customer - Download Their Invoice
```
GET /api/invoices/:orderId
Authorization: Bearer <customer-token>
```

### Admin - Download Any Invoice
```
GET /api/invoices/admin/:orderId
Authorization: Bearer <admin-token>
```

### Admin - Preview Invoice (Browser)
```
GET /api/invoices/preview/:orderId
Authorization: Bearer <admin-token>
```

### Admin - Regenerate Invoice
```
POST /api/invoices/regenerate/:orderId
Authorization: Bearer <admin-token>
```

---

## 💡 How It Works

### Automatic Process:

1. **Customer places order** (COD or Online Payment)
   ↓
2. **Order is saved to database**
   ↓
3. **Invoice PDF is generated automatically**
   ↓
4. **Confirmation email sent WITH invoice attached**
   ↓
5. **Customer can also download from their account**

### Email Integration:
- **Payment Success Email** → Invoice attached
- **COD Confirmation Email** → Invoice attached

---

## 📧 Email Setup (Required)

Make sure your `.env` has:

```env
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

Without this, invoices won't be emailed (but still generated).

---

## 🎨 Invoice Contents

Each invoice includes:

- **Header:** Company name, logo, contact info
- **Invoice Number:** Unique ID (e.g., INV-ABC12345)
- **Order Details:** Date, Order ID, Payment method
- **Customer Info:** Name, email, delivery address
- **Items Table:** Products, quantities, prices
- **Summary:** Subtotal, tax, delivery charges, total
- **Footer:** Thank you message, terms & conditions

---

## 🔧 Frontend Integration

### Add Download Button to Order Page

```jsx
const DownloadInvoice = ({ orderId }) => {
  const handleDownload = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/invoices/${orderId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Invoice-${orderId.slice(-8)}.pdf`;
        a.click();
      } else {
        alert('Failed to download invoice');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error downloading invoice');
    }
  };

  return (
    <button onClick={handleDownload} className="btn-download">
      📄 Download Invoice
    </button>
  );
};
```

### Use in Order History

```jsx
<div className="order-card">
  <h3>Order #{order._id.slice(-8)}</h3>
  <p>Total: ₹{order.totalAmount}</p>
  <p>Status: {order.status}</p>
  
  {/* Add invoice download button */}
  <DownloadInvoice orderId={order._id} />
</div>
```

---

## ✅ Testing Checklist

- [ ] Run test script: `node test-invoice-generation.js`
- [ ] Check invoice appears in `backend/invoices/`
- [ ] Place a new order through frontend
- [ ] Verify invoice is attached to confirmation email
- [ ] Test customer invoice download
- [ ] Test admin invoice preview
- [ ] Test admin invoice regeneration

---

## 🐛 Troubleshooting

### "Invoice not found"
- Ensure the order is paid (PAID status) or COD
- Check if order has all required fields (user, items)

### "Email sent but no attachment"
- Check email service configuration in `.env`
- Look for errors in backend console logs
- Verify invoice file was created in `backend/invoices/`

### "Permission denied"
- Customers can only download their own invoices
- Ensure correct authentication token is used

---

## 📚 Full Documentation

For detailed information, see: [INVOICE_SYSTEM_GUIDE.md](INVOICE_SYSTEM_GUIDE.md)

---

## 🎉 You're All Set!

The invoice system is ready to use. Every new order will automatically:
1. Generate a professional PDF invoice
2. Attach it to the confirmation email
3. Make it available for download

Happy selling! 🚀
