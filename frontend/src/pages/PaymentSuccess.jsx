import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../config/firebase';
import { CheckCircle, Package, Calendar, MapPin } from 'lucide-react';
import './PaymentSuccess.css';

const PaymentSuccess = () => {
  const [user] = useAuthState(auth);
  const navigate = useNavigate();
  const location = useLocation();
  const [orderDetails, setOrderDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    // Get order details from location state or fetch the latest order
    if (location.state?.order) {
      setOrderDetails(location.state.order);
      setLoading(false);
    } else {
      fetchLatestOrder();
    }
  }, [user, location, navigate]);

  const fetchLatestOrder = async () => {
    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/user/orders', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const orders = await response.json();
        if (orders && orders.length > 0) {
          // Get the most recent order
          const latestOrder = orders[0];
          setOrderDetails(latestOrder);
        }
      }
    } catch (error) {
      console.error('Error fetching order:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="payment-success-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading order details...</p>
        </div>
      </div>
    );
  }

  if (!orderDetails) {
    return (
      <div className="payment-success-container">
        <div className="error-message">
          <p>Order details not found</p>
          <button onClick={() => navigate('/orders')} className="btn-primary">
            View All Orders
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="payment-success-container">
      {/* Decorative leaves */}
      <div className="leaf-decoration left-leaves">
        <div className="leaf leaf-1">🌿</div>
        <div className="leaf leaf-2">🍃</div>
        <div className="leaf leaf-3">🌿</div>
      </div>
      <div className="leaf-decoration right-leaves">
        <div className="leaf leaf-1">🌿</div>
        <div className="leaf leaf-2">🍃</div>
        <div className="leaf leaf-3">🌿</div>
      </div>

      <div className="success-content">
        {/* Header with Logo */}
        <div className="success-header">
          <div className="logo-section">
            <div className="logo-wrapper">
              <span className="logo-icon">🌱</span>
            </div>
            <h2 className="brand-name">PEPPER NURSERY</h2>
          </div>
        </div>

        {/* Success Message */}
        <div className="success-message">
          <div className="success-icon-wrapper">
            <CheckCircle className="success-icon" size={56} />
          </div>
          <h1 className="success-title">
            PAYMENT SUCCESSFUL! <span className="checkmark-emoji">✓</span>
          </h1>
          <p className="success-subtitle">
            Thanks, {user?.displayName || 'Customer'}! Your order is confirmed and
            <br />
            bringing more green into your home.
          </p>
          <div className="plant-pot-icon">
            <span className="pot">🪴</span>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="content-grid">
          {/* Order Summary */}
          <div className="info-card order-summary">
            <h3 className="card-title">ORDER SUMMARY</h3>
            
            <div className="info-row">
              <span className="info-label">Order ID:</span>
              <span className="info-value">#{orderDetails._id?.slice(-8).toUpperCase()}</span>
            </div>

            <div className="info-row">
              <span className="info-label">Order Date:</span>
              <span className="info-value">{formatDate(orderDetails.createdAt)}</span>
            </div>

            <div className="info-row items-section">
              <span className="info-label">Items:</span>
              <div className="items-list">
                {orderDetails.items?.map((item, index) => (
                  <div key={index} className="order-item-text">
                    {item.quantity}x {item.name}
                    {index < orderDetails.items.length - 1 && ', '}
                  </div>
                ))}
              </div>
            </div>

            <div className="info-row total-row">
              <span className="info-label">Total Amount Paid:</span>
              <span className="info-value total-amount">{formatCurrency(orderDetails.totalAmount)}</span>
            </div>

            <div className="info-row">
              <span className="info-label">Payment Method:</span>
              <span className="info-value">
                {orderDetails.payment?.method === 'COD' ? 'Cash on Delivery' : 'Razorpay via UPI'}
              </span>
            </div>

            {orderDetails.payment?.transactionId && user?.email && (
              <div className="receipt-note">
                A detailed receipt has been sent to {user.email}
              </div>
            )}
          </div>

          {/* Next Steps & Care */}
          <div className="info-card next-steps">
            <h3 className="card-title">NEXT STEPS & CARE</h3>
            
            <div className="steps-content">
              <div className="step-item">
                <Package className="step-icon" size={22} />
                <div className="step-text">
                  <h4>We are preparing your plants for a safe journey!</h4>
                  <p>You will receive an email with your tracking number within <strong>2 business days</strong></p>
                </div>
              </div>

              <div className="step-item">
                <Calendar className="step-icon" size={22} />
                <div className="step-text">
                  <h4>Estimated Delivery:</h4>
                  <p>
                    {new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { 
                      month: 'long', 
                      day: 'numeric' 
                    })} - {new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { 
                      month: 'long', 
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </p>
                </div>
              </div>

              {orderDetails.shippingAddress && (
                <div className="step-item">
                  <MapPin className="step-icon" size={22} />
                  <div className="step-text">
                    <h4>Shipping Address:</h4>
                    <p>
                      {orderDetails.shippingAddress.line1}
                      {orderDetails.shippingAddress.line2 && `, ${orderDetails.shippingAddress.line2}`}
                      <br />
                      {orderDetails.shippingAddress.district}, {orderDetails.shippingAddress.state} - {orderDetails.shippingAddress.pincode}
                    </p>
                  </div>
                </div>
              )}

              <div className="care-guide-section">
                <button className="btn-care-guide" onClick={() => window.open('#', '_blank')}>
                  Download Your FREE Plant Care Guide
                </button>
                <p className="follow-text">Follow us for daily plant tips!</p>
                <div className="social-icons">
                  <a href="#" className="social-icon instagram" title="Instagram">
                    <span>📷</span>
                  </a>
                  <a href="#" className="social-icon facebook" title="Facebook">
                    <span>📘</span>
                  </a>
                  <a href="#" className="social-icon pinterest" title="Pinterest">
                    <span>📌</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="action-buttons">
          <button 
            onClick={() => navigate('/orders')} 
            className="btn-secondary"
          >
            View All Orders
          </button>
          <button 
            onClick={() => navigate('/user/dashboard', { state: { activeTab: 'products' } })} 
            className="btn-primary"
          >
            Continue Shopping
          </button>
        </div>

        {/* Footer */}
        <div className="success-footer">
          <p className="footer-contact">Need help? Contact us: support@peppernursery.com | 1-800-PEPPER</p>
          <div className="footer-badges">
            <span className="badge">
              <span className="badge-icon">🌿</span>
              <span className="badge-text">100% Organic</span>
            </span>
            <span className="badge">
              <span className="badge-icon">♻️</span>
              <span className="badge-text">Eco-Friendly Packaging</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;