import React, { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../config/firebase';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, MapPin, Clock, CheckCircle, XCircle, Truck, Package, AlertCircle, Leaf, Cog } from 'lucide-react';
import './OrderTracking.css';

const OrderTracking = () => {
  const [user] = useAuthState(auth);
  const navigate = useNavigate();
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) {
      navigate('/login');
    } else if (orderId) {
      fetchOrderDetails();
      fetchRecentOrders();
    }
  }, [user, orderId, navigate]);

  const fetchRecentOrders = async () => {
    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/user/orders?limit=5', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setRecentOrders(data.orders || []);
      }
    } catch (err) {
      console.error('Error fetching recent orders:', err);
    }
  };

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      const token = await user.getIdToken();
      const response = await fetch(`/api/user/orders/${orderId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Order data received:', data);
        console.log('Delivery Boy:', data.deliveryBoy);
        setOrder(data);
      } else {
        setError('Failed to fetch order details');
      }
    } catch (err) {
      console.error('Error fetching order details:', err);
      setError('Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  const getStatusTimeline = () => {
    if (!order) return [];

    const timeline = [
      {
        id: 'pending',
        label: 'Order Placed',
        description: 'Your order has been placed successfully',
        icon: Package,
        completed: order.status !== 'PENDING',
        date: new Date(order.createdAt)
      },
      {
        id: 'approved',
        label: 'Order Confirmed',
        description: order.deliveryBoy ? `Delivery assigned to: Preparing for dispatch` : 'Processing your order',
        icon: CheckCircle,
        completed: ['OUT_FOR_DELIVERY', 'DELIVERED'].includes(order.status),
        date: order.updatedAt
      },
      {
        id: 'out_for_delivery',
        label: 'Out for Delivery',
        description: 'Your order is on the way',
        icon: Truck,
        completed: order.status === 'DELIVERED',
        date: order.updatedAt
      },
      {
        id: 'delivered',
        label: 'Order Delivered',
        description: 'Your order has been delivered',
        icon: CheckCircle,
        completed: order.status === 'DELIVERED',
        date: order.updatedAt
      }
    ];

    return timeline;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Pending';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING':
        return { text: '#f59e0b', bg: '#fef3c7', label: 'Pending' };
      case 'APPROVED':
        return { text: '#10b981', bg: '#d1fae5', label: 'Confirmed' };
      case 'OUT_FOR_DELIVERY':
        return { text: '#0ea5e9', bg: '#dbeafe', label: 'Out for Delivery' };
      case 'DELIVERED':
        return { text: '#22c55e', bg: '#dcfce7', label: 'Delivered' };
      case 'CANCELLED':
        return { text: '#ef4444', bg: '#fee2e2', label: 'Cancelled' };
      default:
        return { text: '#6b7280', bg: '#f3f4f6', label: status };
    }
  };

  if (loading) {
    return (
      <div className="order-tracking-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading order details...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="order-tracking-container">
        <div className="error-state">
          <AlertCircle size={64} />
          <h2>{error || 'Order not found'}</h2>
          <button onClick={() => navigate('/my-orders')} className="btn-primary">
            Back to Orders
          </button>
        </div>
      </div>
    );
  }

  const timeline = getStatusTimeline();
  const currentStatusColor = getStatusColor(order.status);

  return (
    <div className="order-tracking-container">
      {/* Header */}
      <div className="tracking-header">
        <button
          onClick={() => navigate('/my-orders')}
          className="back-button"
          title="Back to Orders"
        >
          <ArrowLeft size={20} />
          Back
        </button>
        <h1>Order Tracking Details</h1>
        <div className="header-spacer"></div>
      </div>

      <div className="tracking-content">
        {/* Sidebar - Recent Orders */}
        <div className="tracking-sidebar">
          <div className="sidebar-header">
            <Leaf size={24} />
            <h2>Your Recent Orders</h2>
          </div>

          {/* Recent Orders List */}
          <div className="recent-orders-list">
            {recentOrders.map((recentOrder) => (
              <div
                key={recentOrder._id}
                className={`recent-order-item ${recentOrder._id === orderId ? 'active' : ''}`}
                onClick={() => navigate(`/order-tracking/${recentOrder._id}`)}
              >
                <div className="order-item-image">
                  {recentOrder.items && recentOrder.items[0]?.image ? (
                    <img src={recentOrder.items[0].image} alt="Product" />
                  ) : (
                    <div className="plant-placeholder">
                      <Leaf size={32} />
                    </div>
                  )}
                </div>
                <div className="order-item-info">
                  <p className="order-item-id">Order ID #{recentOrder._id?.slice(-6).toUpperCase()}</p>
                  <p className="order-item-pid">Plant ID</p>
                  <p className="order-item-date">
                    {new Date(recentOrder.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Main Content - Tracking Timeline */}
        <div className="tracking-main">
          <div className="tracking-card">
            {/* Title and Order Info */}
            <h2 className="tracking-title">Order Tracking Details</h2>
            <div className="order-info-header">
              <div>
                <p className="order-number">#{order._id?.slice(-6).toUpperCase()}</p>
                <p className="order-placed">Placed on {new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</p>
              </div>
            </div>

            {/* Delivery & Real-Time Tracking Section */}
            {order.deliveryBoy && (typeof order.deliveryBoy === 'object') && (
              <div className="delivery-tracking-section">
                <h3 className="tracking-section-title">Delivery & Real-Time Tracking</h3>
                
                {/* Assigned Delivery Boy Card */}
                <div className="delivery-boy-card">
                  <label className="card-label">ASSIGNED DELIVERY BOY</label>
                  <div className="delivery-boy-card-content">
                    <div className="delivery-boy-details">
                      <p className="delivery-boy-name">
                        {order.deliveryBoy.firstName && order.deliveryBoy.lastName 
                          ? `${order.deliveryBoy.firstName} ${order.deliveryBoy.lastName}`
                          : 'Delivery Partner'
                        }
                      </p>
                      {order.deliveryBoy.phone && (
                        <a href={`tel:${order.deliveryBoy.phone}`} className="delivery-boy-phone">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                          </svg>
                          {order.deliveryBoy.phone}
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                {/* Live Status */}
                <div className="live-status-section">
                  <label className="card-label">LIVE STATUS</label>
                  <div className="live-status-badge">
                    <span className="status-dot"></span>
                    {order.status === 'APPROVED' ? 'ASSIGNED' : 
                     order.status === 'OUT_FOR_DELIVERY' ? 'OUT FOR DELIVERY' :
                     order.status === 'DELIVERED' ? 'DELIVERED' :
                     order.status}
                  </div>
                </div>

                {/* Assigned Areas */}
                <div className="assigned-areas-section">
                  <label className="card-label">ASSIGNED AREAS</label>
                  <div className="assigned-areas-content">
                    <p className="assigned-area-item">
                      {order.shippingAddress?.district || 'District'}, {order.shippingAddress?.state || 'State'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {order.status === 'CANCELLED' ? (
              // Cancelled State
              <div className="cancelled-state">
                <XCircle size={48} color="#ef4444" />
                <h2>Order Cancelled</h2>
                <p>Order cancelled by customer</p>
              </div>
            ) : (
              <>
                {/* Timeline - Horizontal */}
                <div className="timeline-horizontal">
                  {timeline.map((step, index) => {
                    const StepIcon = step.icon;
                    const isCompleted = step.completed;
                    const isActive = !isCompleted && (index === 0 || timeline[index - 1]?.completed);

                    return (
                      <div key={step.id} className="timeline-item-horizontal">
                        <div
                          className={`timeline-icon-horizontal ${isCompleted ? 'completed' : ''} ${isActive ? 'active' : ''}`}
                          title={step.label}
                        >
                          {isCompleted ? (
                            <CheckCircle size={28} />
                          ) : isActive ? (
                            <Cog size={28} />
                          ) : (
                            <div className="circle-outline"></div>
                          )}
                        </div>
                        {index < timeline.length - 1 && (
                          <div
                            className={`timeline-line-horizontal ${isCompleted ? 'completed' : ''}`}
                          ></div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Status Details */}
                <div className="status-details">
                  <div className="status-section">
                    <div className={`status-icon ${order.status === 'PENDING' ? 'active' : 'completed'}`}>
                      <Package size={24} />
                    </div>
                    <div>
                      <h3>Pending</h3>
                      <p>Order just placed. Awaiting confirmation.</p>
                    </div>
                  </div>

                  <div className="status-section">
                    <div className={`status-icon ${order.status === 'APPROVED' ? 'active' : order.status === 'PENDING' ? 'pending' : 'completed'}`}>
                      <Cog size={24} />
                    </div>
                    <div>
                      <h3>Delivery boy confirmed!</h3>
                      <p>Preparing for dispatch</p>
                    </div>
                  </div>

                  <div className="status-section">
                    <div className={`status-icon ${order.status === 'OUT_FOR_DELIVERY' ? 'active' : ['OUT_FOR_DELIVERY', 'DELIVERED'].includes(order.status) ? 'completed' : 'pending'}`}>
                      <Truck size={24} />
                    </div>
                    <div>
                      <h3>Out for Delivery</h3>
                      <p>{order.status === 'OUT_FOR_DELIVERY' ? 'Estimated arrival: 1 hour' : 'On the way'}</p>
                    </div>
                  </div>

                  <div className="status-section">
                    {order.status === 'DELIVERED' && (
                      <>
                        <div className="status-icon completed">
                          <CheckCircle size={24} />
                        </div>
                        <div>
                          <h3>Order completed</h3>
                          <p>on {formatDate(order.updatedAt).split(',')[0]}</p>
                        </div>
                      </>
                    )}
                    {order.status === 'CANCELLED' && (
                      <>
                        <div className="status-icon cancelled">
                          <XCircle size={24} />
                        </div>
                        <div>
                          <h3>Cancelled</h3>
                          <p>Order cancelled by customer</p>
                        </div>
                      </>
                    )}
                    {!['DELIVERED', 'CANCELLED'].includes(order.status) && (
                      <>
                        <div className="status-icon pending">
                          <div className="circle-outline"></div>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Map Placeholder */}
                {order.status === 'OUT_FOR_DELIVERY' && (
                  <div className="map-container">
                    <div className="map-placeholder">
                      <div className="map-marker-delivery"></div>
                      <div className="map-marker-destination"></div>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Shipping Address */}
            {order.shippingAddress && (
              <div className="address-section-bottom">
                <h4>Delivery Address</h4>
                <p>{order.shippingAddress.line1}</p>
                {order.shippingAddress.line2 && <p>{order.shippingAddress.line2}</p>}
                <p>{order.shippingAddress.district}, {order.shippingAddress.state}</p>
                <p className="pincode">Pin: {order.shippingAddress.pincode}</p>
              </div>
            )}

            {/* Delivery Boy Info */}
            {order.deliveryBoy && (typeof order.deliveryBoy === 'object') && (
              <div className="delivery-boy-section">
                <h4>Delivery Boy Details</h4>
                <div className="delivery-boy-info">
                  <div className="info-row">
                    <span className="info-label">Name:</span>
                    <span className="info-value">
                      {order.deliveryBoy.firstName && order.deliveryBoy.lastName 
                        ? `${order.deliveryBoy.firstName} ${order.deliveryBoy.lastName}`
                        : 'Not Available'
                      }
                    </span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Phone:</span>
                    <span className="info-value">
                      {order.deliveryBoy.phone ? (
                        <a href={`tel:${order.deliveryBoy.phone}`} style={{ color: '#10b981', textDecoration: 'none' }}>
                          {order.deliveryBoy.phone}
                        </a>
                      ) : (
                        'Not Available'
                      )}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Payment Info */}
            <div className="payment-info-section">
              <h4>Payment Information</h4>
              <div className="payment-row">
                <span>Method:</span>
                <span className="method-badge" style={{
                  backgroundColor: order.payment?.method === 'COD' ? '#fee2e2' : '#d1fae5',
                  color: order.payment?.method === 'COD' ? '#991b1b' : '#065f46'
                }}>
                  {order.payment?.method === 'COD' ? 'Cash on Delivery' : 'Online Payment'}
                </span>
              </div>
              <div className="payment-row">
                <span>Status:</span>
                <span style={{
                  color: order.payment?.status === 'PAID' || order.payment?.status === 'REFUNDED' ? '#10b981' : '#f59e0b',
                  fontWeight: '600'
                }}>
                  {order.payment?.status || 'PENDING'}
                </span>
              </div>
              {order.payment?.refundStatus && (
                <div className="payment-row">
                  <span>Refund Status:</span>
                  <span style={{
                    color: order.payment.refundStatus === 'PROCESSED' ? '#10b981' : '#f59e0b',
                    fontWeight: '600'
                  }}>
                    {order.payment.refundStatus}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderTracking;