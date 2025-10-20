import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Truck, Package, CheckCircle, Clock, AlertCircle, User, Phone, Mail, MapPin, DollarSign, RefreshCw } from 'lucide-react';
import authService from '../services/authService';
import { apiFetch } from '../services/api';

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
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <div style={{ width: '3rem', height: '3rem', border: '4px solid #10b981', borderTop: '4px solid transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <div style={{ width: '3rem', height: '3rem', border: '4px solid #10b981', borderTop: '4px solid transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ minHeight: '100vh', background: '#f9fafb', padding: '2rem' }}>
        <button
          onClick={() => navigate('/admin-orders')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem 1rem',
            borderRadius: '8px',
            border: '1px solid #e5e7eb',
            background: 'white',
            cursor: 'pointer',
            marginBottom: '1rem',
            color: '#6b7280'
          }}
        >
          <ArrowLeft size={16} /> Back to Orders
        </button>
        <div style={{
          background: '#fee2e2',
          border: '1px solid #fecaca',
          color: '#dc2626',
          padding: '1rem',
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          {error}
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div style={{ minHeight: '100vh', background: '#f9fafb', padding: '2rem' }}>
        <button
          onClick={() => navigate('/admin-orders')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem 1rem',
            borderRadius: '8px',
            border: '1px solid #e5e7eb',
            background: 'white',
            cursor: 'pointer',
            marginBottom: '1rem',
            color: '#6b7280'
          }}
        >
          <ArrowLeft size={16} /> Back to Orders
        </button>
        <div style={{ textAlign: 'center', color: '#6b7280' }}>Order not found</div>
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

  const containerStyle = {
    minHeight: '100vh',
    background: '#f9fafb',
    padding: '2rem'
  };

  const headerStyle = {
    background: '#4b5563',
    color: 'white',
    borderRadius: '12px',
    padding: '2rem',
    marginBottom: '2rem',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  };

  const cardStyle = {
    background: 'white',
    borderRadius: '12px',
    padding: '1.5rem',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
    border: '1px solid #e5e7eb',
    marginBottom: '1.5rem'
  };

  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))',
    gap: '1.5rem',
    marginBottom: '1.5rem'
  };

  const sectionTitleStyle = {
    fontSize: '1.25rem',
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: '1rem'
  };

  const timelineItemStyle = (isActive, isCompleted) => ({
    display: 'flex',
    alignItems: 'center',
    marginBottom: '1rem',
    opacity: isActive || isCompleted ? 1 : 0.6
  });

  const timelineCircleStyle = (color, isActive) => ({
    width: '3rem',
    height: '3rem',
    borderRadius: '50%',
    background: color + '15',
    border: `2px solid ${color}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: '1rem',
    flexShrink: 0
  });

  const timelineTextStyle = (isActive) => ({
    flex: 1,
    fontSize: '0.875rem',
    color: isActive ? '#1f2937' : '#9ca3af'
  });

  return (
    <div style={containerStyle}>
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>

      {/* Header */}
      <div style={headerStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button
            onClick={() => navigate('/admin-orders')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 1rem',
              borderRadius: '8px',
              border: '1px solid rgba(255,255,255,0.3)',
              background: 'rgba(255,255,255,0.1)',
              color: 'white',
              cursor: 'pointer',
              fontSize: '0.875rem'
            }}
          >
            <ArrowLeft size={16} /> Back
          </button>
          <h1 style={{ fontSize: '1.75rem', margin: 0 }}>Order Detail: {order._id.substring(0, 8).toUpperCase()}</h1>
        </div>
        <button
          onClick={fetchOrderDetail}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem 1rem',
            borderRadius: '8px',
            border: 'none',
            background: 'rgba(255,255,255,0.2)',
            color: 'white',
            cursor: 'pointer',
            fontSize: '0.875rem'
          }}
        >
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      {/* Main Grid */}
      <div style={gridStyle}>
        {/* Left Column */}
        <div>
          {/* Order Status Management & Timeline */}
          <div style={cardStyle}>
            <h2 style={sectionTitleStyle}>Order Status Management & Timeline</h2>
            
            {orderStatuses.map((status, idx) => {
              const StatusIcon = getStatusIcon(status);
              const isActive = order.status === status;
              const isCompleted = currentStatusIndex >= idx;
              const color = getStatusColor(status);

              return (
                <div key={status} style={timelineItemStyle(isActive, isCompleted)}>
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
                  <div style={timelineCircleStyle(color, isActive)}>
                    <StatusIcon size={16} color={color} />
                  </div>
                  <div style={timelineTextStyle(isActive)}>
                    <div style={{ fontWeight: '600', color: isActive ? color : '#6b7280' }}>
                      {status.replace(/_/g, ' ')}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.25rem' }}>
                      {isActive ? 'Current Status' : isCompleted ? 'Completed' : 'Pending'}
                    </div>
                  </div>
                </div>
              );
            })}

            {order.status === 'CANCELLED' && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.75rem',
                background: '#fee2e2',
                borderRadius: '8px',
                marginTop: '1rem'
              }}>
                <AlertCircle size={16} color='#dc2626' />
                <span style={{ color: '#dc2626', fontSize: '0.875rem' }}>Order Cancelled</span>
              </div>
            )}
          </div>

          {/* Customer Information */}
          <div style={cardStyle}>
            <h2 style={sectionTitleStyle}>Customer Information</h2>
            {order.user && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                  <User size={16} color='#6b7280' />
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>Name</div>
                    <div style={{ fontWeight: '600', color: '#1f2937' }}>
                      {order.user.firstName} {order.user.lastName}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                  <Mail size={16} color='#6b7280' />
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>Email</div>
                    <div style={{ fontWeight: '600', color: '#1f2937' }}>{order.user.email}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <Phone size={16} color='#6b7280' />
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>Phone</div>
                    <div style={{ fontWeight: '600', color: '#1f2937' }}>{order.user.phone || 'N/A'}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div>
          {/* Delivery & Real-Time Tracking */}
          <div style={cardStyle}>
            <h2 style={sectionTitleStyle}>Delivery & Real-Time Tracking</h2>
            
            {order.deliveryBoy ? (
              <>
                <div style={{ marginBottom: '1.5rem' }}>
                  <div style={{ fontSize: '0.875rem', color: '#9ca3af', marginBottom: '0.5rem' }}>
                    ASSIGNED DELIVERY BOY
                  </div>
                  <div style={{
                    padding: '0.75rem',
                    background: '#f3f4f6',
                    borderRadius: '8px'
                  }}>
                    <div style={{ fontWeight: '600', color: '#1f2937' }}>
                      {order.deliveryBoy.firstName} {order.deliveryBoy.lastName}
                    </div>
                    <div style={{ fontSize: '0.875rem', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                      <Phone size={14} /> {order.deliveryBoy.phone || 'N/A'}
                    </div>
                  </div>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ fontSize: '0.875rem', color: '#9ca3af', marginBottom: '0.5rem' }}>
                    LIVE STATUS
                  </div>
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
                    <div style={{ fontSize: '0.75rem', color: '#9ca3af', fontWeight: '600', marginBottom: '0.5rem' }}>
                      ASSIGNED AREAS
                    </div>
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
              <div style={{
                padding: '1rem',
                background: '#fef3c7',
                border: '1px solid #fcd34d',
                borderRadius: '8px',
                color: '#92400e',
                fontSize: '0.875rem'
              }}>
                No delivery boy assigned yet
              </div>
            )}
          </div>

          {/* Shipping Address */}
          <div style={cardStyle}>
            <h2 style={sectionTitleStyle}>Shipping Address</h2>
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
      <div style={cardStyle}>
        <h2 style={sectionTitleStyle}>Order Items and Inventory Control</h2>
        <div style={{
          overflowX: 'auto'
        }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '0.875rem'
          }}>
            <thead>
              <tr style={{ background: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', color: '#6b7280' }}>Item Name</th>
                <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', color: '#6b7280' }}>Qty</th>
                <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', color: '#6b7280' }}>Price</th>
                <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', color: '#6b7280' }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '0.75rem', color: '#1f2937' }}>{item.name || 'Product'}</td>
                  <td style={{ padding: '0.75rem', color: '#1f2937' }}>{item.quantity}</td>
                  <td style={{ padding: '0.75rem', color: '#1f2937' }}>₹{item.priceAtOrder}</td>
                  <td style={{ padding: '0.75rem', color: '#1f2937', fontWeight: '600' }}>₹{item.priceAtOrder * item.quantity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Financial & Refund Module */}
      <div style={cardStyle}>
        <h2 style={sectionTitleStyle}>Financial & Refund Module</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
          <div style={{
            padding: '1rem',
            background: '#f9fafb',
            borderRadius: '8px'
          }}>
            <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginBottom: '0.5rem' }}>
              PAYMENT METHOD
            </div>
            <div style={{ fontSize: '1rem', fontWeight: '600', color: '#1f2937' }}>
              {order.payment.method === 'COD' ? 'Cash on Delivery (COD)' : 'Online Payment'}
            </div>
          </div>

          <div style={{
            padding: '1rem',
            background: '#f9fafb',
            borderRadius: '8px'
          }}>
            <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginBottom: '0.5rem' }}>
              PAYMENT STATUS
            </div>
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
            <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginBottom: '0.5rem' }}>
              TOTAL AMOUNT
            </div>
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
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.25rem 0.5rem',
                  borderRadius: '4px',
                  background: getPaymentStatusColor(order.payment.refundStatus) + '15',
                  color: getPaymentStatusColor(order.payment.refundStatus),
                  fontWeight: '600'
                }}>
                  {order.payment.refundStatus}
                </div>
              </div>
              <div>
                <div style={{ color: '#9ca3af', marginBottom: '0.25rem' }}>Initiated At</div>
                <div style={{ fontWeight: '600', color: '#1f2937' }}>
                  {formatDate(order.payment.refundInitiatedAt)}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Order Timeline Metadata */}
      <div style={cardStyle}>
        <h2 style={sectionTitleStyle}>Order Timeline</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', fontSize: '0.875rem' }}>
          <div>
            <div style={{ color: '#9ca3af', marginBottom: '0.25rem' }}>Created</div>
            <div style={{ fontWeight: '600', color: '#1f2937' }}>{formatDate(order.createdAt)}</div>
          </div>
          <div>
            <div style={{ color: '#9ca3af', marginBottom: '0.25rem' }}>Last Updated</div>
            <div style={{ fontWeight: '600', color: '#1f2937' }}>{formatDate(order.updatedAt)}</div>
          </div>
          {order.notes && (
            <div style={{ gridColumn: '1 / -1' }}>
              <div style={{ color: '#9ca3af', marginBottom: '0.25rem' }}>Notes</div>
              <div style={{ color: '#1f2937', padding: '0.5rem', background: '#f9fafb', borderRadius: '4px' }}>
                {order.notes}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}