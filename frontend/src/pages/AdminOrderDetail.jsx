import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Truck, Package, CheckCircle, Clock, AlertCircle, User, Phone, Mail, MapPin, DollarSign, RefreshCw } from 'lucide-react';
import authService from '../services/authService';
import { apiFetch } from '../services/api';
import './AdminOrderDetail.css';

export default function AdminOrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [order, setOrder] = useState(null);
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
  }, [id, navigate]);

  const fetchOrderDetail = async () => {
    setLoading(true);
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
          <div className="admin-order-detail-card">
            <h2 className="card-title">Order Status Management & Timeline</h2>
            
            {orderStatuses.map((status, idx) => {
              const StatusIcon = getStatusIcon(status);
              const isActive = order.status === status;
              const isCompleted = currentStatusIndex >= idx;
              const color = getStatusColor(status);

              return (
                <div key={status} className="timeline-item" style={{ opacity: isActive || isCompleted ? 1 : 0.6 }}>
                  {idx < orderStatuses.length - 1 && (
                    <div style={{
                      position: 'absolute',
                      left: '1.5rem',
                      top: '3rem',
                      width: '2px',
                      height: '2rem',
                      background: isCompleted ? color : '#e5e7eb'
                    }}></div>
                  )}
                  <div className="timeline-circle" style={{
                    borderColor: color,
                    backgroundColor: color + '15'
                  }}>
                    <StatusIcon size={16} color={color} />
                  </div>
                  <div className="timeline-text">
                    <div className="timeline-text-status" style={{ color: isActive ? color : '#6b7280' }}>
                      {status.replace(/_/g, ' ')}
                    </div>
                    <div className="timeline-text-label">
                      {isActive ? 'Current Status' : isCompleted ? 'Completed' : 'Pending'}
                    </div>
                  </div>
                </div>
              );
            })}

            {order.status === 'CANCELLED' && (
              <div className="cancelled-alert">
                <AlertCircle size={16} />
                <span>Order Cancelled</span>
              </div>
            )}
          </div>

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