import { useEffect, useState } from "react";
import { Truck, Package, MapPin, CheckCircle, Clock, LogOut, Loader, AlertCircle, MapPinIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import authService from "../services/authService";
import { apiFetch } from "../services/api";

export default function DeliveryDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('deliveries');
  const [assignedOrders, setAssignedOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [acceptingOrder, setAcceptingOrder] = useState(null);
  const [startingDelivery, setStartingDelivery] = useState(null);
  const [stats, setStats] = useState({
    assigned: 0,
    accepted: 0,
    outForDelivery: 0
  });

  // Fetch assigned orders
  const fetchAssignedOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiFetch('/api/delivery/orders/assigned');

      if (!response.ok) {
        throw new Error('Failed to fetch assigned orders');
      }

      const orders = await response.json();
      setAssignedOrders(orders);

      // Calculate stats
      const assigned = orders.filter(o => o.deliveryStatus === 'ASSIGNED').length;
      const accepted = orders.filter(o => o.deliveryStatus === 'ACCEPTED').length;
      const outForDelivery = orders.filter(o => o.deliveryStatus === 'OUT_FOR_DELIVERY').length;

      setStats({
        assigned,
        accepted,
        outForDelivery
      });
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError('Failed to load assigned orders');
    } finally {
      setLoading(false);
    }
  };

  // Accept an order
  const handleAcceptOrder = async (orderId) => {
    try {
      setAcceptingOrder(orderId);
      const response = await apiFetch(`/api/delivery/orders/${orderId}/accept`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to accept order');
      }

      // Refresh orders list
      fetchAssignedOrders();
    } catch (err) {
      console.error('Error accepting order:', err);
      alert('Failed to accept order: ' + err.message);
    } finally {
      setAcceptingOrder(null);
    }
  };

  // Start delivery for an order
  const handleStartDelivery = async (orderId) => {
    try {
      setStartingDelivery(orderId);
      const response = await apiFetch(`/api/delivery/orders/${orderId}/out-for-delivery`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to start delivery');
      }

      // Refresh orders list
      fetchAssignedOrders();
    } catch (err) {
      console.error('Error starting delivery:', err);
      alert('Failed to start delivery: ' + err.message);
    } finally {
      setStartingDelivery(null);
    }
  };

  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    if (!currentUser) {
      window.location.href = '/login';
      return;
    }
    setUser(currentUser);
    fetchAssignedOrders();
  }, []);

  const handleLogout = async () => {
    // show inline banner and delay redirect
    const banner = document.createElement('div');
    banner.textContent = 'You have been logged out. Redirecting to login...';
    banner.style.cssText = 'position:fixed;top:12px;left:50%;transform:translateX(-50%);background:#f0fdf4;color:#166534;border:1px solid #bbf7d0;padding:10px 14px;border-radius:8px;z-index:9999;box-shadow:0 6px 18px rgba(0,0,0,0.08)';
    document.body.appendChild(banner);
    const result = await authService.logoutNoRedirect();
    if (result?.success) {
      setTimeout(() => {
        window.location.href = '/login';
      }, 1500);
    } else {
      banner.textContent = 'Logout failed. Please try again.';
      banner.style.background = '#fef2f2';
      banner.style.border = '1px solid #fecaca';
      banner.style.color = '#dc2626';
      setTimeout(() => banner.remove(), 3000);
    }
  };

  if (!user) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#f9fafb' }}>
        <style>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
        <div style={{ width: '3rem', height: '3rem', border: '4px solid #10b981', borderTop: '4px solid transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
      </div>
    );
  }

  const sidebarStyle = {
    width: '280px',
    background: 'linear-gradient(135deg, #0ea5e9, #0284c7)',
    color: 'white',
    padding: '2rem',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '4px 0 20px rgba(0, 0, 0, 0.1)',
    position: 'relative',
    overflow: 'hidden'
  };

  const mainContentStyle = { flex: 1, background: '#f9fafb', padding: '2rem', overflowY: 'auto' };
  const cardStyle = { background: 'white', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)', border: '1px solid #e5e7eb' };
  const statCardStyle = { ...cardStyle, textAlign: 'center' };



  const menuItems = [
    { id: 'deliveries', label: 'Deliveries', icon: Truck },
    { id: 'routes', label: 'Routes', icon: MapPin },
    { id: 'history', label: 'History', icon: CheckCircle }
  ];

  const handleStatusClick = () => {
    navigate('/deliveryboy/status');
  };

  // Get status badge color
  const getStatusColor = (status) => {
    switch (status) {
      case 'ASSIGNED':
        return { bg: '#fef3c7', text: '#92400e', badge: '#f59e0b' };
      case 'ACCEPTED':
        return { bg: '#d1fae5', text: '#065f46', badge: '#10b981' };
      case 'OUT_FOR_DELIVERY':
        return { bg: '#dbeafe', text: '#0c4a6e', badge: '#0ea5e9' };
      case 'DELIVERED':
        return { bg: '#dcfce7', text: '#166534', badge: '#22c55e' };
      default:
        return { bg: '#f3f4f6', text: '#374151', badge: '#6b7280' };
    }
  };

  const renderDeliveries = () => (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={statCardStyle}>
          <Package size={28} color="#f59e0b" style={{ marginBottom: '0.5rem' }} />
          <h3 style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>{stats.assigned}</h3>
          <p style={{ color: '#6b7280', margin: 0 }}>Assigned</p>
        </div>
        <div style={statCardStyle}>
          <CheckCircle size={28} color="#10b981" style={{ marginBottom: '0.5rem' }} />
          <h3 style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>{stats.accepted}</h3>
          <p style={{ color: '#6b7280', margin: 0 }}>Accepted</p>
        </div>
        <div style={statCardStyle}>
          <Truck size={28} color="#0ea5e9" style={{ marginBottom: '0.5rem' }} />
          <h3 style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>{stats.outForDelivery}</h3>
          <p style={{ color: '#6b7280', margin: 0 }}>Out for Delivery</p>
        </div>
      </div>

      <div style={cardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>Assigned Orders</h3>
          <button 
            onClick={fetchAssignedOrders}
            disabled={loading}
            style={{
              padding: '0.5rem 0.75rem',
              borderRadius: '8px',
              border: '1px solid #e5e7eb',
              background: '#f9fafb',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1
            }}
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        {error && (
          <div style={{ padding: '1rem', background: '#fee2e2', border: '1px solid #fecaca', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', color: '#991b1b' }}>
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        {loading && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '2rem', gap: '0.5rem' }}>
            <Loader size={24} style={{ animation: 'spin 1s linear infinite' }} />
            <span style={{ color: '#6b7280' }}>Loading orders...</span>
          </div>
        )}

        {!loading && assignedOrders.length === 0 && (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
            <Package size={48} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
            <p>No assigned orders at the moment.</p>
          </div>
        )}

        {!loading && assignedOrders.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {assignedOrders.map((order) => {
              const statusColor = getStatusColor(order.deliveryStatus);
              const itemNames = order.items?.map(item => item.name || 'Product').join(', ') || 'Order';
              const address = order.shippingAddress ? `${order.shippingAddress.line1}, ${order.shippingAddress.district}` : 'Address not available';
              
              return (
                <div key={order._id} style={{ padding: '1rem', border: '2px solid #e5e7eb', borderRadius: '10px', background: '#fff', transition: 'all 0.3s ease' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', flex: 1 }}>
                      <Package size={20} color="#0ea5e9" style={{ marginTop: '0.25rem', flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, color: '#111827', marginBottom: '0.25rem' }}>
                          Order #{order._id?.slice(-6).toUpperCase()}
                        </div>
                        <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>
                          {itemNames}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: '#6b7280' }}>
                          <MapPin size={16} />
                          {address}
                        </div>
                        <div style={{ marginTop: '0.5rem', fontSize: '0.875rem' }}>
                          <span style={{ fontWeight: 600, color: '#1f2937' }}>Amount: </span>
                          <span style={{ color: '#6b7280' }}>₹{order.totalAmount?.toLocaleString()}</span>
                        </div>
                        <div style={{ marginTop: '0.5rem', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontWeight: 600, color: '#1f2937' }}>Payment: </span>
                          <span style={{ 
                            padding: '0.25rem 0.75rem', 
                            borderRadius: '6px', 
                            background: order.payment?.method === 'COD' ? '#fee2e2' : '#d1fae5',
                            color: order.payment?.method === 'COD' ? '#991b1b' : '#065f46',
                            fontWeight: 'bold',
                            fontSize: '0.75rem'
                          }}>
                            {order.payment?.method === 'COD' ? 'COD' : 'Paid Online'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-end', flexShrink: 0 }}>
                      <span style={{ padding: '0.25rem 0.75rem', borderRadius: '6px', background: statusColor.bg, color: statusColor.text, fontSize: '0.75rem', fontWeight: 'bold' }}>
                        {order.deliveryStatus || 'UNASSIGNED'}
                      </span>
                      {order.deliveryStatus === 'ASSIGNED' && (
                        <button
                          onClick={() => handleAcceptOrder(order._id)}
                          disabled={acceptingOrder === order._id}
                          style={{
                            padding: '0.5rem 1rem',
                            borderRadius: '8px',
                            border: 'none',
                            background: '#10b981',
                            color: 'white',
                            cursor: acceptingOrder === order._id ? 'not-allowed' : 'pointer',
                            fontWeight: 'bold',
                            fontSize: '0.875rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            opacity: acceptingOrder === order._id ? 0.6 : 1,
                            transition: 'all 0.2s ease'
                          }}
                          onMouseEnter={(e) => {
                            if (acceptingOrder !== order._id) {
                              e.target.style.background = '#059669';
                              e.target.style.transform = 'scale(1.05)';
                            }
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.background = '#10b981';
                            e.target.style.transform = 'scale(1)';
                          }}
                        >
                          {acceptingOrder === order._id ? (
                            <>
                              <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} />
                              Accepting...
                            </>
                          ) : (
                            <>
                              <CheckCircle size={16} />
                              Accept
                            </>
                          )}
                        </button>
                      )}
                      {order.deliveryStatus === 'ACCEPTED' && (
                        <button
                          onClick={() => handleStartDelivery(order._id)}
                          disabled={startingDelivery === order._id}
                          style={{
                            padding: '0.5rem 1rem',
                            borderRadius: '8px',
                            border: 'none',
                            background: '#3b82f6',
                            color: 'white',
                            cursor: startingDelivery === order._id ? 'not-allowed' : 'pointer',
                            fontWeight: 'bold',
                            fontSize: '0.875rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            opacity: startingDelivery === order._id ? 0.6 : 1,
                            transition: 'all 0.2s ease'
                          }}
                          onMouseEnter={(e) => {
                            if (startingDelivery !== order._id) {
                              e.target.style.background = '#2563eb';
                              e.target.style.transform = 'scale(1.05)';
                            }
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.background = '#3b82f6';
                            e.target.style.transform = 'scale(1)';
                          }}
                        >
                          {startingDelivery === order._id ? (
                            <>
                              <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} />
                              Starting...
                            </>
                          ) : (
                            <>
                              <Truck size={16} />
                              Start Delivery
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'deliveries':
        return renderDeliveries();
      case 'routes':
        return <div style={cardStyle}>Route planning coming soon.</div>;
      case 'history':
        return <div style={cardStyle}>History coming soon.</div>;

      default:
        return renderDeliveries();
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
      {/* Sidebar */}
      <div style={sidebarStyle}>
        <div style={{ marginBottom: '2rem', textAlign: 'center', position: 'relative', zIndex: 10 }}>
          <div style={{ width: '60px', height: '60px', background: 'rgba(255, 255, 255, 0.2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', backdropFilter: 'blur(16px)' }}>
            <Truck color="white" size={28} />
          </div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: 0 }}>Delivery Dashboard</h1>
          <h2 style={{ fontSize: '1rem', margin: '0.25rem 0 0', opacity: 0.9 }}>
            {user?.firstName || user?.lastName ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : (user?.displayName || user?.email || 'User')}
          </h2>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', zIndex: 10 }}>
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.75rem 1rem',
                borderRadius: '10px',
                border: 'none',
                background: activeTab === item.id ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
                color: 'white',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <item.icon size={18} /> {item.label}
            </button>
          ))}
          
          {/* Update Status Button */}
          <button
            onClick={handleStatusClick}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.75rem 1rem',
              borderRadius: '10px',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              background: 'rgba(255, 255, 255, 0.1)',
              color: 'white',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              marginTop: '0.5rem'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'rgba(255, 255, 255, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'rgba(255, 255, 255, 0.1)';
            }}
          >
            <Package size={18} /> Update Status
          </button>
        </div>

        <div style={{ marginTop: 'auto', zIndex: 10 }}>
          <button 
            onClick={handleLogout} 
            style={{ 
              width: '100%', 
              padding: '0.75rem 1rem', 
              borderRadius: '10px', 
              border: '1px solid rgba(255,255,255,0.3)', 
              background: 'rgba(255,255,255,0.1)', 
              color: 'white', 
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'rgba(255,255,255,0.2)';
              e.target.style.transform = 'scale(1.02)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'rgba(255,255,255,0.1)';
              e.target.style.transform = 'scale(1)';
            }}
          >
            <LogOut size={16} style={{ marginRight: '0.5rem' }} /> Logout
          </button>
        </div>
      </div>

      {/* Main content */}
      <div style={mainContentStyle}>{renderContent()}</div>
    </div>
  );
}