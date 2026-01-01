import React, { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../config/firebase';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, MapPin, Clock, CheckCircle, XCircle, Truck, Package, AlertCircle, Cog } from 'lucide-react';
import { HUB_LAUNCH_DATE } from '../config/constants';
import './OrderTracking.css';

const OrderTracking = () => {
  const [user] = useAuthState(auth);
  const navigate = useNavigate();
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [routeData, setRouteData] = useState(null);

  useEffect(() => {
    if (!user) {
      navigate('/login');
    } else if (orderId) {
      fetchOrderDetails();
      fetchRouteDetails();
    }
  }, [user, orderId, navigate]);

  // Determine if order uses hub-based tracking
  const isHubBasedOrder = (order) => {
    if (!order) return false;
    const orderDate = new Date(order.createdAt);
    return orderDate >= HUB_LAUNCH_DATE && 
           order.trackingTimeline && 
           order.trackingTimeline.length > 0;
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

  const fetchRouteDetails = async () => {
    try {
      const token = await user.getIdToken();
      const response = await fetch(`/api/user/orders/${orderId}/route`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setRouteData(data);
      }
    } catch (err) {
      console.error('Error fetching route details:', err);
      // Route data is optional, don't set error
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
          <button onClick={() => navigate(-1)} className="btn-primary">
            Back to Orders
          </button>
        </div>
      </div>
    );
  }

  const timeline = getStatusTimeline();
  const currentStatusColor = getStatusColor(order.status);
  const useHubTracking = isHubBasedOrder(order);

  return (
    <div className="order-tracking-container">
      {/* Header */}
      <div className="tracking-header">
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            navigate(-1);
          }}
          className="back-button"
          title="Back to Orders"
          type="button"
        >
          <ArrowLeft size={20} />
          Back
        </button>
        <h1>Order Tracking Details</h1>
        <div className="header-spacer"></div>
      </div>

      <div className="tracking-content">
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

            {/* Hub-Based Tracking (New Orders) */}
            {useHubTracking && routeData && routeData.route && routeData.route.length > 0 && (
              <div className="hub-tracking-section" style={{ marginTop: '1.5rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1rem', color: '#1f2937' }}>
                  Hub Transit Route
                </h3>
                <div style={{ marginBottom: '0.75rem', fontWeight: '600', color: '#10b981', fontSize: '0.95rem' }}>
                  📍 Destination: {routeData.route[routeData.route.length - 1]?.name || 'Unknown'}
                </div>

                <div className="hub-route-timeline" style={{ marginTop: '1rem' }}>
                  {routeData.route.map((hub, index) => {
                    const isCurrent = routeData.currentHub && routeData.currentHub._id === hub._id;
                    const isPassed = routeData.currentHubIndex > index;
                    
                    return (
                      <div key={hub._id} style={{ 
                        display: 'flex', 
                        gap: '1rem', 
                        paddingBottom: '1.5rem', 
                        position: 'relative' 
                      }}>
                        {/* Connector Line */}
                        {index < routeData.route.length - 1 && (
                          <div style={{
                            position: 'absolute',
                            left: '0.6rem',
                            top: '1.75rem',
                            bottom: 0,
                            width: '2px',
                            background: isPassed ? '#10b981' : '#e2e8f0'
                          }}></div>
                        )}

                        {/* Icon */}
                        <div style={{ zIndex: 1 }}>
                          {isPassed ? (
                            <div style={{
                              width: '1.5rem',
                              height: '1.5rem',
                              borderRadius: '50%',
                              background: '#10b981',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'white'
                            }}>
                              <CheckCircle size={16} />
                            </div>
                          ) : isCurrent ? (
                            <div style={{
                              width: '1.5rem',
                              height: '1.5rem',
                              borderRadius: '50%',
                              background: '#3b82f6',
                              boxShadow: '0 0 0 4px #dbeafe',
                              animation: 'pulse 2s ease-in-out infinite'
                            }}></div>
                          ) : (
                            <div style={{
                              width: '1.5rem',
                              height: '1.5rem',
                              borderRadius: '50%',
                              border: '2px solid #cbd5e1',
                              background: 'white'
                            }}></div>
                          )}
                        </div>

                        {/* Hub Details */}
                        <div style={{ flex: 1 }}>
                          <div style={{ 
                            fontWeight: '600', 
                            color: isCurrent ? '#3b82f6' : isPassed ? '#10b981' : '#6b7280',
                            fontSize: '0.95rem'
                          }}>
                            {hub.name}
                            {isCurrent && <span style={{ 
                              marginLeft: '0.5rem', 
                              fontSize: '0.75rem',
                              background: '#dbeafe',
                              color: '#1e40af',
                              padding: '0.125rem 0.5rem',
                              borderRadius: '0.375rem',
                              fontWeight: '600'
                            }}>Current</span>}
                          </div>
                          <div style={{ 
                            fontSize: '0.875rem', 
                            color: '#6b7280',
                            marginTop: '0.25rem'
                          }}>
                            {hub.district}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Tracking Timeline Events */}
                {order.trackingTimeline && order.trackingTimeline.length > 0 && (
                  <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid #e5e7eb' }}>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: '600', marginBottom: '1rem', color: '#1f2937' }}>
                      Tracking History
                    </h4>
                    {order.trackingTimeline.map((event, index) => (
                      <div key={index} style={{
                        padding: '0.75rem',
                        background: '#f9fafb',
                        borderRadius: '0.5rem',
                        marginBottom: '0.5rem'
                      }}>
                        <div style={{ fontWeight: '600', fontSize: '0.875rem', color: '#374151' }}>
                          {event.status}
                        </div>
                        <div style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.25rem' }}>
                          {event.location} {event.description && `- ${event.description}`}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.25rem' }}>
                          {new Date(event.timestamp).toLocaleString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Legacy Tracking (Old Orders) */}
            {!useHubTracking && (
              <>
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