import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Truck, Package, CheckCircle, Clock, AlertCircle, User, Phone, Mail, MapPin, DollarSign, RefreshCw, Building2, Key, Home } from 'lucide-react';
import authService from '../services/authService';
import { apiFetch } from '../services/api';
import './AdminOrderDetail.css';

export default function AdminOrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [order, setOrder] = useState(null);
  const [routeData, setRouteData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    if (!currentUser) {
      window.location.href = '/login';
      return;
    }
    if (currentUser.role !== 'admin') {
      navigate('/dashboard');
      return;
    }
    setUser(currentUser);
    fetchOrderDetail();
    fetchRouteDetail();
  }, [id, navigate]);

  const fetchOrderDetail = async () => {
    // ... existing fetchOrderDetail logic ...
    try {
      const response = await apiFetch(`/api/admin/orders/${id}`, { method: 'GET' });
      const data = await response.json();
      if (!response.ok) {
        setError(data.message || 'Failed to fetch order');
        return;
      }
      setOrder(data);
    } catch (err) {
      console.error('Error fetching order:', err);
      setError('Failed to load order details');
    }
  };

  const fetchRouteDetail = async () => {
    try {
      const response = await apiFetch(`/api/admin/orders/${id}/route`, { method: 'GET' });
      if (response.ok) {
        const data = await response.json();
        setRouteData(data);
      }
    } catch (err) {
      console.error('Error fetching route:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="admin-order-detail-loading">
        <div className="spinner"></div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="admin-order-detail-loading">
        <div className="spinner"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-order-detail-container">
        <button
          onClick={() => navigate('/admin/orders')}
          className="back-button"
        >
          <ArrowLeft size={16} /> Back to Orders
        </button>
        <div className="error-alert">
          {error}
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="admin-order-detail-container">
        <button
          onClick={() => navigate('/admin/orders')}
          className="back-button"
          style={{ marginBottom: '1rem' }}
        >
          <ArrowLeft size={16} /> Back to Orders
        </button>
        <div className="not-found-alert">Order not found</div>
      </div>
    );
  }

  const getStatusColor = (status) => {
    const colors = {
      'PENDING': '#f59e0b',
      'APPROVED': '#3b82f6',
      'OUT_FOR_DELIVERY': '#8b5cf6',
      'READY_FOR_COLLECTION': '#10b981',
      'DELIVERED': '#10b981',
      'CANCELLED': '#ef4444'
    };
    return colors[status] || '#6b7280';
  };

  const getStatusIcon = (status) => {
    const icons = {
      'PENDING': Clock,
      'APPROVED': CheckCircle,
      'OUT_FOR_DELIVERY': Truck,
      'READY_FOR_COLLECTION': Package,
      'DELIVERED': CheckCircle,
      'CANCELLED': AlertCircle
    };
    return icons[status] || Clock;
  };

  const getDeliveryStatusColor = (status) => {
    const colors = {
      'ASSIGNED': '#3b82f6',
      'ACCEPTED': '#8b5cf6',
      'OUT_FOR_DELIVERY': '#f59e0b',
      'DELIVERED': '#10b981'
    };
    return colors[status] || '#6b7280';
  };

  const getPaymentStatusColor = (status) => {
    const colors = {
      'PENDING': '#f59e0b',
      'PAID': '#10b981',
      'FAILED': '#ef4444',
      'REFUNDED': '#3b82f6'
    };
    return colors[status] || '#6b7280';
  };

  const orderStatuses = ['PENDING', 'APPROVED', 'OUT_FOR_DELIVERY', 'DELIVERED'];
  const currentStatusIndex = orderStatuses.indexOf(order.status);

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="admin-order-detail-container">
      {/* Header */}
      <div className="admin-order-detail-header">
        <div className="admin-order-detail-header-left">
          <button
            onClick={() => navigate('/admin/orders')}
            className="back-button"
          >
            <ArrowLeft size={16} /> Back
          </button>
          <h1 className="admin-order-detail-header-title">Order Detail: {order._id.substring(0, 8).toUpperCase()}</h1>
        </div>
        <button
          onClick={fetchOrderDetail}
          className="refresh-button"
        >
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      {/* Main Grid */}
      <div className="admin-order-detail-grid">
        {/* Left Column */}
        <div>
          {/* Order Status Management & Timeline */}
          {/* Hub Transit Route or Hub Collection Info */}
          {order.deliveryType === 'HUB_COLLECTION' ? (
            <div className="admin-order-detail-card">
              <h2 className="card-title">Hub Collection Information</h2>
              
              <div style={{ padding: '1rem', background: '#f0fdf4', borderRadius: '8px', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                  <Building2 size={24} color="#059669" />
                  <div>
                    <div style={{ fontWeight: '600', fontSize: '1.125rem', color: '#065f46' }}>
                      {order.collectionHub?.name || 'Hub Not Selected'}
                    </div>
                    <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                      {order.collectionHub?.district || 'N/A'}
                    </div>
                  </div>
                </div>

                {order.collectionHub?.address && (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.75rem' }}>
                    <MapPin size={16} color="#6b7280" style={{ marginTop: '0.25rem' }} />
                    <div style={{ fontSize: '0.875rem', color: '#4b5563' }}>
                      {order.collectionHub.address.line1}
                      {order.collectionHub.address.line2 && `, ${order.collectionHub.address.line2}`}
                    </div>
                  </div>
                )}

                {order.collectionOtp && (
                  <div style={{ marginTop: '1rem', padding: '1rem', background: 'white', borderRadius: '8px', border: '2px dashed #10b981' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <Key size={18} color="#059669" />
                      <span style={{ fontWeight: '600', color: '#065f46' }}>Collection OTP</span>
                    </div>
                    <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#059669', letterSpacing: '0.25rem' }}>
                      {order.collectionOtp}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.5rem' }}>
                      Generated: {formatDate(order.collectionOtpGeneratedAt)}
                    </div>
                  </div>
                )}

                {order.collectedAt && (
                  <div style={{ marginTop: '1rem', padding: '0.75rem', background: '#dcfce7', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <CheckCircle size={16} color="#15803d" />
                      <span style={{ fontSize: '0.875rem', color: '#15803d', fontWeight: '500' }}>
                        Collected at: {formatDate(order.collectedAt)}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div style={{ padding: '1rem', background: '#fffbeb', borderRadius: '8px', border: '1px solid #fcd34d' }}>
                <div style={{ fontSize: '0.875rem', color: '#78350f' }}>
                  <strong>Note:</strong> Customer will collect this order from the hub using the OTP provided above.
                </div>
              </div>
            </div>
          ) : (
            <div className="admin-order-detail-card">
              <h2 className="card-title">Hub Transit Route</h2>

            {routeData && routeData.route && routeData.route.length > 0 ? (
              <div className="hub-route-timeline">
                <div style={{ marginBottom: '1rem', fontWeight: '600', color: '#10b981' }}>
                  Destination: {routeData.route[routeData.route.length - 1].name}
                </div>

                {routeData.route.map((hub, index) => {
                  const isCurrent = routeData.currentHub && routeData.currentHub._id === hub._id;
                  const isPassed = routeData.currentHubIndex > index;
                  // If we are at the last hub and it is 'current', it might be delivered or waiting there.

                  // Status Icons
                  // Passed: Green Check
                  // Current: Blue Dot with Pulse
                  // Future: Gray Ring

                  return (
                    <div key={hub._id} className="hub-timeline-item" style={{ display: 'flex', gap: '1rem', paddingBottom: '1.5rem', position: 'relative' }}>
                      {/* Connector Line */}
                      {index < routeData.route.length - 1 && (
                        <div style={{
                          position: 'absolute',
                          left: '0.6rem',
                          top: '1.5rem',
                          bottom: 0,
                          width: '2px',
                          background: isPassed ? '#10b981' : '#e2e8f0'
                        }}></div>
                      )}

                      {/* Icon */}
                      <div className="hub-timeline-icon" style={{ zIndex: 1 }}>
                        {isPassed ? (
                          <div style={{
                            width: '1.25rem',
                            height: '1.25rem',
                            borderRadius: '50%',
                            background: '#10b981',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white'
                          }}>
                            <CheckCircle size={14} />
                          </div>
                        ) : isCurrent ? (
                          <div style={{
                            width: '1.25rem',
                            height: '1.25rem',
                            borderRadius: '50%',
                            background: '#3b82f6',
                            boxShadow: '0 0 0 4px #dbeafe',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white'
                          }}>
                            <div style={{ width: '0.5rem', height: '0.5rem', background: 'white', borderRadius: '50%' }}></div>
                          </div>
                        ) : (
                          <div style={{
                            width: '1.25rem',
                            height: '1.25rem',
                            borderRadius: '50%',
                            border: '2px solid #cbd5e1',
                            background: 'white'
                          }}></div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="hub-timeline-content">
                        <div style={{
                          fontWeight: isCurrent ? '700' : '500',
                          color: isPassed ? '#10b981' : isCurrent ? '#3b82f6' : '#64748b'
                        }}>
                          {hub.name}
                          {isCurrent && <span style={{ marginLeft: '0.5rem', fontSize: '0.75rem', padding: '0.1rem 0.5rem', background: '#dbeafe', color: '#1e40af', borderRadius: '999px' }}>Current</span>}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                          {hub.district}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="no-route-alert" style={{
                padding: '1rem',
                background: '#fff7ed',
                border: '1px solid #ffedd5',
                borderRadius: '8px',
                color: '#c2410c',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <AlertCircle size={18} />
                <span>Route Pending / Not Planned Yet</span>
              </div>
            )}
          </div>
          )}

          {/* Customer Information */}
          <div className="admin-order-detail-card">
            <h2 className="card-title">Customer Information</h2>
            {order.user && (
              <div>
                <div className="info-item">
                  <div className="info-item-icon">
                    <User size={16} />
                  </div>
                  <div className="info-item-content">
                    <div className="info-label">Name</div>
                    <div className="info-value">
                      {order.user.firstName} {order.user.lastName}
                    </div>
                  </div>
                </div>
                <div className="info-item">
                  <div className="info-item-icon">
                    <Mail size={16} />
                  </div>
                  <div className="info-item-content">
                    <div className="info-label">Email</div>
                    <div className="info-value">{order.user.email}</div>
                  </div>
                </div>
                <div className="info-item">
                  <div className="info-item-icon">
                    <Phone size={16} />
                  </div>
                  <div className="info-item-content">
                    <div className="info-label">Phone</div>
                    <div className="info-value">{order.user.phone || 'N/A'}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div>
          {/* Delivery & Real-Time Tracking */}
          <div className="admin-order-detail-card">
            <h2 className="card-title">Delivery & Real-Time Tracking</h2>

            {/* Hub Route Visualization */}
            {routeData && routeData.route && routeData.route.length > 0 && (
              <div style={{ marginBottom: '2rem', padding: '1rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <h3 style={{ fontSize: '0.9rem', fontWeight: '600', color: '#475569', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <MapPin size={14} /> HUB TRANSIT ROUTE
                </h3>
                <div style={{ position: 'relative', paddingLeft: '1rem' }}>
                  {routeData.route.map((hub, index) => {
                    const isCurrent = routeData.currentHub && routeData.currentHub._id === hub._id;
                    const isPassed = routeData.currentHubIndex > index;
                    const isUpcoming = routeData.currentHubIndex < index;

                    let statusColor = '#cbd5e1'; // gray (upcoming)
                    if (isPassed) statusColor = '#10b981'; // green (passed)
                    if (isCurrent) statusColor = '#3b82f6'; // blue (current)

                    return (
                      <div key={hub._id} style={{ position: 'relative', paddingBottom: index === routeData.route.length - 1 ? 0 : '1.5rem' }}>
                        {/* Vertical Line */}
                        {index < routeData.route.length - 1 && (
                          <div style={{
                            position: 'absolute',
                            left: '0.35rem',
                            top: '1.2rem',
                            bottom: 0,
                            width: '2px',
                            background: isPassed ? '#10b981' : '#e2e8f0'
                          }}></div>
                        )}

                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                          {/* Dot */}
                          <div style={{
                            width: '0.8rem',
                            height: '0.8rem',
                            borderRadius: '50%',
                            background: statusColor,
                            border: isCurrent ? '2px solid #dbeafe' : 'none',
                            boxShadow: isCurrent ? '0 0 0 2px #3b82f6' : 'none',
                            zIndex: 1,
                            marginTop: '0.2rem'
                          }}></div>

                          {/* Content */}
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '0.875rem', fontWeight: isCurrent ? '700' : '500', color: isCurrent ? '#1e293b' : '#64748b' }}>
                              {hub.name}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                              {hub.district} • {hub.type.replace('_', ' ')}
                            </div>
                            {isCurrent && (
                              <div style={{ marginTop: '0.25rem', fontSize: '0.75rem', color: '#3b82f6', fontWeight: '600' }}>
                                ● Current Location
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {order.deliveryBoy ? (
              <>
                <div style={{ marginBottom: '1.5rem' }}>
                  <div className="info-label">ASSIGNED DELIVERY BOY</div>
                  <div className="delivery-boy-badge">
                    <div className="delivery-boy-name">
                      {order.deliveryBoy.firstName} {order.deliveryBoy.lastName}
                    </div>
                    <div className="delivery-boy-phone">
                      <Phone size={14} style={{ display: 'inline', marginRight: '0.5rem' }} />
                      {order.deliveryBoy.phone || 'N/A'}
                    </div>
                  </div>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <div className="info-label">LIVE STATUS</div>
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.5rem 1rem',
                    borderRadius: '8px',
                    background: getDeliveryStatusColor(order.deliveryStatus) + '15',
                    border: `1px solid ${getDeliveryStatusColor(order.deliveryStatus)}30`
                  }}>
                    <div style={{
                      width: '0.5rem',
                      height: '0.5rem',
                      borderRadius: '50%',
                      background: getDeliveryStatusColor(order.deliveryStatus)
                    }}></div>
                    <span style={{
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      color: getDeliveryStatusColor(order.deliveryStatus)
                    }}>
                      {order.deliveryStatus?.replace(/_/g, ' ') || 'ASSIGNED'}
                    </span>
                  </div>
                </div>

                {order.deliveryBoy.assignedAreas && (
                  <div style={{
                    padding: '0.75rem',
                    background: '#f9fafb',
                    borderRadius: '8px',
                    fontSize: '0.875rem'
                  }}>
                    <div className="info-label">ASSIGNED AREAS</div>
                    {order.deliveryBoy.assignedAreas.districts?.length > 0 && (
                      <p style={{ margin: '0.25rem 0', color: '#1f2937' }}>
                        <strong>Districts:</strong> {order.deliveryBoy.assignedAreas.districts.join(', ')}
                      </p>
                    )}
                    {order.deliveryBoy.assignedAreas.pincodes?.length > 0 && (
                      <p style={{ margin: '0.25rem 0', color: '#1f2937' }}>
                        <strong>Pincodes:</strong> {order.deliveryBoy.assignedAreas.pincodes.join(', ')}
                      </p>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="status-pending" style={{ padding: '1rem', borderRadius: '8px' }}>
                No delivery boy assigned yet
              </div>
            )}
          </div>

          {/* Shipping Address */}
          <div className="admin-order-detail-card">
            <h2 className="card-title">Shipping Address</h2>
            {order.shippingAddress ? (
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <MapPin size={16} color='#6b7280' style={{ marginTop: '0.25rem' }} />
                <div>
                  <p style={{ margin: '0.5rem 0', color: '#1f2937' }}>
                    {order.shippingAddress.line1}
                  </p>
                  {order.shippingAddress.line2 && (
                    <p style={{ margin: '0.5rem 0', color: '#1f2937' }}>
                      {order.shippingAddress.line2}
                    </p>
                  )}
                  <p style={{ margin: '0.5rem 0', color: '#6b7280' }}>
                    {order.shippingAddress.district}, {order.shippingAddress.state}
                  </p>
                  <p style={{ margin: '0.5rem 0', color: '#6b7280' }}>
                    PIN: {order.shippingAddress.pincode}
                  </p>
                </div>
              </div>
            ) : (
              <p style={{ color: '#6b7280' }}>No address provided</p>
            )}
          </div>
        </div>
      </div>

      {/* Order Items and Inventory Control */}
      <div className="admin-order-detail-card">
        <h2 className="card-title">Order Items and Inventory Control</h2>
        <div style={{ overflowX: 'auto' }}>
          <table className="order-items-table">
            <thead>
              <tr>
                <th>Item Name</th>
                <th>Qty</th>
                <th>Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item, idx) => (
                <tr key={idx}>
                  <td>{item.name || 'Product'}</td>
                  <td>{item.quantity}</td>
                  <td>₹{item.priceAtOrder}</td>
                  <td style={{ fontWeight: '600' }}>₹{item.priceAtOrder * item.quantity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Financial & Refund Module */}
      <div className="admin-order-detail-card">
        <h2 className="card-title">Financial & Refund Module</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
          <div style={{
            padding: '1rem',
            background: '#f9fafb',
            borderRadius: '8px'
          }}>
            <div className="info-label">PAYMENT METHOD</div>
            <div style={{ fontSize: '1rem', fontWeight: '600', color: '#1f2937' }}>
              {order.payment.method === 'COD' ? 'Cash on Delivery (COD)' : 'Online Payment'}
            </div>
          </div>

          <div style={{
            padding: '1rem',
            background: '#f9fafb',
            borderRadius: '8px'
          }}>
            <div className="info-label">PAYMENT STATUS</div>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 0.75rem',
              borderRadius: '6px',
              background: getPaymentStatusColor(order.payment.status) + '15',
              border: `1px solid ${getPaymentStatusColor(order.payment.status)}30`
            }}>
              <span style={{
                fontSize: '0.875rem',
                fontWeight: '600',
                color: getPaymentStatusColor(order.payment.status)
              }}>
                {order.payment.status}
              </span>
            </div>
          </div>

          <div style={{
            padding: '1rem',
            background: '#f9fafb',
            borderRadius: '8px'
          }}>
            <div className="info-label">TOTAL AMOUNT</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#1f2937' }}>
              ₹{order.totalAmount}
            </div>
          </div>
        </div>

        {order.payment.refundId && (
          <div style={{
            marginTop: '1.5rem',
            padding: '1rem',
            background: '#f0f9ff',
            borderRadius: '8px',
            border: '1px solid #bfdbfe'
          }}>
            <h3 style={{ fontSize: '0.875rem', fontWeight: '600', color: '#1f2937', marginTop: 0, marginBottom: '0.75rem' }}>
              Refund Information
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', fontSize: '0.875rem' }}>
              <div>
                <div style={{ color: '#9ca3af', marginBottom: '0.25rem' }}>Refund ID</div>
                <div style={{ fontWeight: '600', color: '#1f2937' }}>{order.payment.refundId}</div>
              </div>
              <div>
                <div style={{ color: '#9ca3af', marginBottom: '0.25rem' }}>Refund Amount</div>
                <div style={{ fontWeight: '600', color: '#1f2937' }}>₹{order.payment.refundAmount}</div>
              </div>
              <div>
                <div style={{ color: '#9ca3af', marginBottom: '0.25rem' }}>Refund Status</div>
                <div style={{ fontWeight: '600', color: '#1f2937' }}>{order.payment.refundStatus}</div>
              </div>
              <div>
                <div style={{ color: '#9ca3af', marginBottom: '0.25rem' }}>Initiated At</div>
                <div style={{ fontWeight: '600', color: '#1f2937' }}>{formatDate(order.payment.refundInitiatedAt)}</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Order Summary */}
      <div className="admin-order-detail-card">
        <h2 className="card-title">Order Summary</h2>
        <div className="totals-section">
          <div className="total-row">
            <span>Subtotal:</span>
            <span>₹{order.totalAmount}</span>
          </div>
          <div className="total-row">
            <span>Tax/Charges:</span>
            <span>₹0</span>
          </div>
          <div className="total-row">
            <span>Discount:</span>
            <span>₹0</span>
          </div>
          <div className="total-row grand-total">
            <span>Total:</span>
            <span>₹{order.totalAmount}</span>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="admin-order-detail-card">
        <h2 className="card-title">Timeline</h2>
        <div style={{ fontSize: '0.875rem' }}>
          <p><strong>Order Created:</strong> {formatDate(order.createdAt)}</p>
          {order.updatedAt && <p><strong>Last Updated:</strong> {formatDate(order.updatedAt)}</p>}
        </div>
      </div>
    </div>
  );
}