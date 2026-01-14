import React, { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../config/firebase';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, MapPin, Clock, CheckCircle, XCircle, Truck, Package, AlertCircle, Cog, User, Phone, Mail, CreditCard, ShoppingBag } from 'lucide-react';
import { HUB_LAUNCH_DATE } from '../config/constants';
import OrderTrackingMap from '../components/OrderTrackingMap';
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
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #e8f5e9 100%)',
      padding: '2rem 1rem'
    }}>
      {/* Header with Back Button */}
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto 2rem',
        display: 'flex',
        alignItems: 'center',
        gap: '1rem'
      }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem 1.5rem',
            background: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '10px',
            color: '#6b7280',
            fontWeight: '600',
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            transition: 'all 0.3s',
            fontSize: '0.9rem'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.15)';
            e.currentTarget.style.borderColor = '#10b981';
            e.currentTarget.style.color = '#10b981';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
            e.currentTarget.style.borderColor = '#e5e7eb';
            e.currentTarget.style.color = '#6b7280';
          }}
        >
          <ArrowLeft size={20} />
          Back to Orders
        </button>
      </div>

      {/* Main Container */}
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        background: 'white',
        borderRadius: '12px',
        boxShadow: '0 8px 30px rgba(16, 185, 129, 0.08)',
        overflow: 'hidden',
        border: '1px solid #e5e7eb'
      }}>
        {/* Header Section */}
        <div style={{
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          color: 'white',
          padding: '2rem',
          borderBottom: '4px solid #34d399'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h1 style={{ margin: 0, fontSize: '1.875rem', fontWeight: '700', marginBottom: '0.5rem' }}>
                Order Details
              </h1>
              <p style={{ margin: 0, opacity: 0.95, fontSize: '1rem', fontWeight: '500' }}>
                Order ID: <span style={{ fontWeight: '600', letterSpacing: '1px', background: 'rgba(255,255,255,0.2)', padding: '0.25rem 0.75rem', borderRadius: '6px' }}>#{order._id?.slice(-8).toUpperCase()}</span>
              </p>
            </div>
            <div style={{
              background: 'rgba(255,255,255,0.25)',
              backdropFilter: 'blur(10px)',
              padding: '0.75rem 1.5rem',
              borderRadius: '50px',
              border: '2px solid rgba(255,255,255,0.4)',
              fontWeight: '600'
            }}>
              {getStatusColor(order.status).label}
            </div>
          </div>
          <div style={{ marginTop: '1rem', display: 'flex', gap: '2rem', flexWrap: 'wrap', fontSize: '0.875rem', opacity: 0.95 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Clock size={16} />
              Placed: {new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </div>
            {order.updatedAt && order.updatedAt !== order.createdAt && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Clock size={16} />
                Updated: {new Date(order.updatedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </div>
            )}
          </div>
        </div>

        {/* Interactive Map Section */}
        {useHubTracking && (
          <div style={{ padding: '0 2rem 2rem' }}>
            <div style={{
              background: '#f9fafb',
              border: '1px solid #e5e7eb',
              borderRadius: '12px',
              padding: '1.5rem',
              marginBottom: '2rem'
            }}>
              <h3 style={{ 
                margin: '0 0 1rem 0', 
                fontSize: '1.25rem', 
                fontWeight: '700', 
                color: '#1f2937',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <MapPin size={24} color="#10b981" />
                Live Tracking Map
              </h3>
              <div style={{ height: '400px', borderRadius: '8px', overflow: 'hidden' }}>
                <OrderTrackingMap order={order} routeData={routeData} />
              </div>
            </div>
          </div>
        )}

        {/* Content Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', padding: '2rem' }}>
          
          {/* Order Items Section */}
          <div style={{ gridColumn: order.deliveryType === 'HUB_COLLECTION' ? 'span 1' : 'span 2' }}>
            <div style={{
              background: '#f9fafb',
              border: '1px solid #e5e7eb',
              borderRadius: '12px',
              padding: '1.5rem'
            }}>
              <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.25rem', fontWeight: '700', color: '#1f2937', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShoppingBag size={24} color="#10b981" />
                Order Items ({order.items?.length || 0})
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {order.items && order.items.length > 0 ? (
                  order.items.map((item, index) => (
                    <div key={index} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '1rem',
                      background: 'white',
                      borderRadius: '10px',
                      border: '1px solid #e5e7eb',
                      transition: 'all 0.2s'
                    }}>
                      <div style={{ flex: 1 }}>
                        <p style={{ margin: 0, fontWeight: '600', color: '#1f2937', fontSize: '1rem' }}>
                          {item.name || item.product?.name || 'Product'}
                        </p>
                        <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem', color: '#6b7280' }}>
                          Quantity: {item.quantity} × ₹{item.priceAtOrder?.toFixed(2) || '0.00'}
                        </p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ margin: 0, fontWeight: '700', color: '#10b981', fontSize: '1.125rem' }}>
                          ₹{((item.quantity || 0) * (item.priceAtOrder || 0)).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p style={{ color: '#6b7280', textAlign: 'center', padding: '1rem' }}>No items found</p>
                )}
              </div>

              {/* Total Amount */}
              <div style={{
                marginTop: '1.5rem',
                paddingTop: '1rem',
                borderTop: '2px solid #e5e7eb',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span style={{ fontSize: '1.25rem', fontWeight: '700', color: '#1f2937' }}>Total Amount:</span>
                <span style={{ fontSize: '1.5rem', fontWeight: '800', color: '#10b981' }}>
                  {formatCurrency(order.totalAmount || 0)}
                </span>
              </div>
            </div>
          </div>

          {/* Delivery Address / Hub Collection Info */}
          {order.deliveryType === 'HUB_COLLECTION' && order.collectionHub ? (
            <div>
              <div style={{
                background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
                border: '2px solid #10b981',
                borderRadius: '12px',
                padding: '1.5rem'
              }}>
                <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.25rem', fontWeight: '700', color: '#065f46', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <MapPin size={24} color="#10b981" />
                  Hub Collection
                </h3>
                <div style={{ fontSize: '0.9375rem', lineHeight: '1.7', color: '#374151' }}>
                  <div style={{ marginBottom: '0.75rem' }}>
                    <p style={{ margin: 0, fontWeight: '600', color: '#065f46' }}>{order.collectionHub.name}</p>
                    {order.collectionHub.address && (
                      <p style={{ margin: '0.25rem 0 0 0', color: '#047857' }}>{order.collectionHub.address}</p>
                    )}
                    <p style={{ margin: '0.25rem 0 0 0', color: '#047857' }}>
                      {order.collectionHub.district}, Kerala
                    </p>
                    {order.collectionHub.phone && (
                      <p style={{ margin: '0.5rem 0 0 0' }}>
                        <a href={`tel:${order.collectionHub.phone}`} style={{ color: '#10b981', textDecoration: 'none', fontWeight: '600' }}>
                          <Phone size={14} style={{ display: 'inline', marginRight: '0.25rem' }} />
                          {order.collectionHub.phone}
                        </a>
                      </p>
                    )}
                  </div>
                  
                  <div style={{
                    marginTop: '1rem',
                    padding: '1rem',
                    background: 'white',
                    borderRadius: '10px',
                    border: '1px solid #10b981'
                  }}>
                    <p style={{ margin: '0 0 0.5rem 0', fontWeight: '600', color: '#065f46' }}>📧 Collection Instructions:</p>
                    <ul style={{ margin: '0.5rem 0 0 1.25rem', paddingLeft: 0, color: '#047857', fontSize: '0.875rem' }}>
                      <li>Check your email for the OTP code</li>
                      <li>Visit the hub when order is ready</li>
                      <li>Present OTP to hub manager</li>
                      <li>Collect your order after verification</li>
                    </ul>
                  </div>

                  {order.status === 'READY_FOR_COLLECTION' && (
                    <div style={{
                      marginTop: '1rem',
                      padding: '1rem',
                      background: '#dcfce7',
                      border: '2px dashed #22c55e',
                      borderRadius: '10px',
                      textAlign: 'center'
                    }}>
                      <p style={{ margin: 0, fontWeight: '700', color: '#166534', fontSize: '1.125rem' }}>
                        ✅ Ready for Collection!
                      </p>
                      <p style={{ margin: '0.5rem 0 0 0', color: '#15803d', fontSize: '0.875rem' }}>
                        Check your email for the OTP
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : order.shippingAddress && (
            <div>
              <div style={{
                background: '#f9fafb',
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
                padding: '1.5rem'
              }}>
                <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.25rem', fontWeight: '700', color: '#1f2937', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <MapPin size={24} color="#10b981" />
                  Delivery Address
                </h3>
                <div style={{ fontSize: '0.9375rem', lineHeight: '1.8', color: '#374151' }}>
                  <p style={{ margin: 0, fontWeight: '600' }}>{order.shippingAddress.line1}</p>
                  {order.shippingAddress.line2 && (
                    <p style={{ margin: '0.25rem 0 0 0' }}>{order.shippingAddress.line2}</p>
                  )}
                  <p style={{ margin: '0.25rem 0 0 0' }}>
                    {order.shippingAddress.district}, {order.shippingAddress.state}
                  </p>
                  <p style={{ margin: '0.25rem 0 0 0', fontWeight: '600' }}>
                    PIN: {order.shippingAddress.pincode}
                  </p>
                </div>
              </div>

              {/* Delivery Boy Info */}
              {order.deliveryBoy && typeof order.deliveryBoy === 'object' && (
                <div style={{
                  background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
                  border: '1px solid #0ea5e9',
                  borderRadius: '12px',
                  padding: '1.5rem',
                  marginTop: '1rem'
                }}>
                  <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.25rem', fontWeight: '700', color: '#0c4a6e', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <User size={24} color="#0ea5e9" />
                    Delivery Partner
                  </h3>
                  <div style={{ fontSize: '0.9375rem', lineHeight: '1.8', color: '#374151' }}>
                    <p style={{ margin: 0, fontWeight: '600', fontSize: '1.0625rem', color: '#0c4a6e' }}>
                      {order.deliveryBoy.firstName && order.deliveryBoy.lastName 
                        ? `${order.deliveryBoy.firstName} ${order.deliveryBoy.lastName}`
                        : 'Delivery Partner'
                      }
                    </p>
                    {order.deliveryBoy.phone && (
                      <p style={{ margin: '0.5rem 0 0 0' }}>
                        <a href={`tel:${order.deliveryBoy.phone}`} style={{ color: '#0ea5e9', textDecoration: 'none', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <Phone size={16} />
                          {order.deliveryBoy.phone}
                        </a>
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Payment Information */}
          <div>
            <div style={{
              background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
              border: '2px solid #f59e0b',
              borderRadius: '12px',
              padding: '1.5rem'
            }}>
              <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.25rem', fontWeight: '700', color: '#92400e', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CreditCard size={24} color="#f59e0b" />
                Payment Details
              </h3>
              <div style={{ fontSize: '0.9375rem', lineHeight: '2', color: '#78350f' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ fontWeight: '600' }}>Method:</span>
                  <span style={{
                    padding: '0.25rem 0.75rem',
                    borderRadius: '8px',
                    fontWeight: '600',
                    fontSize: '0.875rem',
                    background: order.payment?.method === 'COD' ? '#fee2e2' : '#dcfce7',
                    color: order.payment?.method === 'COD' ? '#991b1b' : '#065f46',
                    border: `1px solid ${order.payment?.method === 'COD' ? '#fecaca' : '#a7f3d0'}`
                  }}>
                    {order.payment?.method === 'COD' ? 'Cash on Delivery' : 'Online Payment'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ fontWeight: '600' }}>Status:</span>
                  <span style={{
                    fontWeight: '700',
                    color: order.payment?.status === 'PAID' || order.payment?.status === 'REFUNDED' ? '#10b981' : '#f59e0b'
                  }}>
                    {order.payment?.status || 'PENDING'}
                  </span>
                </div>
                {order.payment?.refundStatus && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: '600' }}>Refund:</span>
                    <span style={{
                      fontWeight: '700',
                      color: order.payment.refundStatus === 'PROCESSED' ? '#10b981' : '#f59e0b'
                    }}>
                      {order.payment.refundStatus}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Order Status Timeline - Full Width */}
          <div style={{ gridColumn: '1 / -1' }}>
            <div style={{
              background: '#f9fafb',
              border: '1px solid #e5e7eb',
              borderRadius: '12px',
              padding: '2rem'
            }}>
              <h3 style={{ margin: '0 0 2rem 0', fontSize: '1.5rem', fontWeight: '700', color: '#1f2937', textAlign: 'center' }}>
                Order Status Timeline
              </h3>
              
              {order.deliveryType === 'HUB_COLLECTION' && order.trackingTimeline && order.trackingTimeline.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {order.trackingTimeline.map((event, index) => (
                    <div key={index} style={{
                      display: 'flex',
                      gap: '1rem',
                      padding: '1.25rem',
                      background: 'white',
                      borderRadius: '10px',
                      border: '1px solid #e5e7eb',
                      transition: 'all 0.2s'
                    }}>
                      <div style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontWeight: '700',
                        flexShrink: 0,
                        boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)'
                      }}>
                        {index + 1}
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ margin: '0 0 0.25rem 0', fontWeight: '700', fontSize: '1.0625rem', color: '#1f2937' }}>
                          {event.status}
                        </p>
                        <p style={{ margin: '0 0 0.5rem 0', color: '#6b7280', fontSize: '0.9375rem' }}>
                          {event.location} {event.description && `- ${event.description}`}
                        </p>
                        <p style={{ margin: 0, fontSize: '0.875rem', color: '#9ca3af', fontWeight: '500' }}>
                          {new Date(event.timestamp).toLocaleString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  position: 'relative',
                  padding: '2rem 0'
                }}>
                  {/* Progress Line */}
                  <div style={{
                    position: 'absolute',
                    top: '48px',
                    left: '10%',
                    right: '10%',
                    height: '4px',
                    background: '#e5e7eb',
                    zIndex: 0,
                    borderRadius: '2px'
                  }}>
                    <div style={{
                      height: '100%',
                      background: 'linear-gradient(90deg, #10b981 0%, #059669 100%)',
                      width: order.status === 'DELIVERED' ? '100%' : order.status === 'OUT_FOR_DELIVERY' ? '66%' : order.status === 'APPROVED' ? '33%' : '0%',
                      transition: 'width 0.5s ease',
                      borderRadius: '2px'
                    }}></div>
                  </div>

                  {timeline.map((step, index) => {
                    const StepIcon = step.icon;
                    const isCompleted = step.completed;
                    const isActive = !isCompleted && (index === 0 || timeline[index - 1]?.completed);

                    return (
                      <div key={step.id} style={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        position: 'relative',
                        zIndex: 1
                      }}>
                        <div style={{
                          width: '80px',
                          height: '80px',
                          borderRadius: '50%',
                          background: isCompleted ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : isActive ? 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)' : 'white',
                          border: isCompleted || isActive ? 'none' : '3px solid #e5e7eb',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: isCompleted || isActive ? 'white' : '#9ca3af',
                          boxShadow: isCompleted ? '0 6px 20px rgba(16, 185, 129, 0.3)' : isActive ? '0 6px 20px rgba(251, 191, 36, 0.3)' : '0 2px 8px rgba(0,0,0,0.08)',
                          marginBottom: '1rem',
                          transition: 'all 0.3s'
                        }}>
                          <StepIcon size={36} strokeWidth={2.5} />
                        </div>
                        <p style={{
                          margin: '0 0 0.5rem 0',
                          fontWeight: '700',
                          fontSize: '1rem',
                          color: isCompleted || isActive ? '#1f2937' : '#9ca3af',
                          textAlign: 'center'
                        }}>
                          {step.label}
                        </p>
                        <p style={{
                          margin: 0,
                          fontSize: '0.875rem',
                          color: '#6b7280',
                          textAlign: 'center',
                          maxWidth: '150px'
                        }}>
                          {step.description}
                        </p>
                        {isCompleted && step.date && (
                          <p style={{
                            margin: '0.5rem 0 0 0',
                            fontSize: '0.8125rem',
                            color: '#9ca3af',
                            textAlign: 'center'
                          }}>
                            {formatDate(step.date)}
                          </p>
                        )}
                      </div>
                    );
                  })}
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