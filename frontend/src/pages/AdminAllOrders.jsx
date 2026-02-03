import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, Package, DollarSign, Clock, ChevronLeft, ChevronRight, ArrowLeft, MapPin, Home, Building2, Key, Trash2, Download } from 'lucide-react';
import { auth } from '../config/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import './AdminAllOrders.css';

const AdminAllOrders = () => {
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [ordersPerPage] = useState(10);
  const [summary, setSummary] = useState({
    todayOrders: 0,
    monthRevenue: 0,
    pendingOrders: 0,
    pendingAmount: 0
  });
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        fetchOrders(firebaseUser);
      } else {
        setLoading(false);
        setError('Please sign in to view orders');
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    calculateSummary();
  }, [orders]);

  const fetchOrders = async (firebaseUser = user) => {
    try {
      setLoading(true);
      if (!firebaseUser) {
        setError('Not authenticated');
        setLoading(false);
        return;
      }
      const token = await firebaseUser.getIdToken();
      const response = await fetch('/api/admin/orders', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setOrders(data);
      } else {
        setError('Failed to fetch orders');
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      setError('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const calculateSummary = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);

    const todayOrders = orders.filter(order => {
      const orderDate = new Date(order.createdAt);
      orderDate.setHours(0, 0, 0, 0);
      return orderDate.getTime() === today.getTime();
    }).length;

    const monthRevenue = orders
      .filter(order => {
        const orderDate = new Date(order.createdAt);
        return orderDate >= thisMonth && order.payment?.status === 'PAID';
      })
      .reduce((sum, order) => sum + order.totalAmount, 0);

    const pendingOrders = orders.filter(order => order.status === 'PENDING').length;
    const pendingAmount = orders
      .filter(order => order.status === 'PENDING')
      .reduce((sum, order) => sum + order.totalAmount, 0);

    setSummary({
      todayOrders,
      monthRevenue,
      pendingOrders,
      pendingAmount
    });
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'PENDING':
      case 'APPROVED':
        return 'status-processing';
      case 'OUT_FOR_DELIVERY':
        return 'status-shipped';
      case 'READY_FOR_COLLECTION':
        return 'status-ready';
      case 'DELIVERED':
        return 'status-delivered';
      case 'CANCELLED':
        return 'status-cancelled';
      default:
        return 'status-processing';
    }
  };

  const getPaymentBadgeClass = (status) => {
    switch (status) {
      case 'PAID':
        return 'payment-paid';
      case 'PENDING':
        return 'payment-pending';
      case 'FAILED':
        return 'payment-failed';
      default:
        return 'payment-pending';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleViewDetails = (orderId) => {
    navigate(`/admin/orders/${orderId}`);
  };

  const handleDeleteOrder = async (orderId, orderNumber) => {
    if (!window.confirm(`Are you sure you want to permanently delete order ${orderNumber}? This action cannot be undone and will remove all related data (notifications, restock requests, etc.)`)) {
      return;
    }

    try {
      if (!user) {
        alert('Not authenticated');
        return;
      }
      const token = await user.getIdToken();
      const response = await fetch(`/api/hub-collection/orders/${orderId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        alert(`✅ ${data.message}\n\nDeleted:\n- Order\n- ${data.deleted.notifications} notification(s)\n- ${data.deleted.restockRequests} restock request(s)`);
        // Refresh the orders list
        fetchOrders(user);
      } else {
        const errorData = await response.json();
        alert(`❌ Failed to delete order: ${errorData.message}`);
      }
    } catch (error) {
      console.error('Error deleting order:', error);
      alert('Failed to delete order');
    }
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      if (!user) {
        alert('Not authenticated');
        return;
      }
      const token = await user.getIdToken();
      const response = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        fetchOrders(); // Refresh orders
        alert(`Order status updated to ${newStatus}`);
      } else {
        alert('Failed to update order status');
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      alert('Failed to update order status');
    }
  };

  const handleDownloadInvoice = async (orderId) => {
    try {
      if (!user) {
        alert('Not authenticated');
        return;
      }
      const token = await user.getIdToken();
      const response = await fetch(`/api/invoices/admin/${orderId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Invoice-${orderId.slice(-8).toUpperCase()}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } else {
        alert('Invoice not available for this order');
      }
    } catch (error) {
      console.error('Error downloading invoice:', error);
      alert('Failed to download invoice');
    }
  };

  // Pagination
  const indexOfLastOrder = currentPage * ordersPerPage;
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
  const currentOrders = orders.slice(indexOfFirstOrder, indexOfLastOrder);
  const totalPages = Math.ceil(orders.length / ordersPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  if (loading) {
    return (
      <div className="admin-orders-loading">
        <div className="spinner"></div>
        <p>Loading orders...</p>
      </div>
    );
  }

  return (
    <div className="admin-orders-container">
      {/* Decorative leaves */}
      <div className="leaf-decoration leaf-top-left">🌿</div>
      <div className="leaf-decoration leaf-top-right">🍃</div>

      {/* Header */}
      <header className="admin-orders-header">
        <div className="header-content">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button
              onClick={() => navigate('/dashboard')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                border: '1px solid #e5e7eb',
                background: 'white',
                cursor: 'pointer',
                fontSize: '0.875rem',
                color: '#6b7280'
              }}
            >
              <ArrowLeft size={16} /> Back
            </button>
            <div className="brand">
              <span className="brand-icon">🌱</span>
              <span className="brand-name">PEPPER NURSERY</span>
            </div>
          </div>
          <h1 className="page-title">Admin Dashboard: All Orders</h1>
        </div>
      </header>

      {/* Summary Cards */}
      <div className="summary-cards">
        <div className="summary-card card-blue">
          <div className="card-icon">
            <Package size={32} />
          </div>
          <div className="card-content">
            <h3>Total Orders (Today)</h3>
            <p className="card-value">{summary.todayOrders}</p>
          </div>
        </div>

        <div className="summary-card card-green">
          <div className="card-icon">
            <DollarSign size={32} />
          </div>
          <div className="card-content">
            <h3>Total Revenue (This Month)</h3>
            <p className="card-value">₹{summary.monthRevenue.toLocaleString()}</p>
          </div>
        </div>

        <div className="summary-card card-orange">
          <div className="card-icon">
            <Clock size={32} />
          </div>
          <div className="card-content">
            <h3>₹{summary.pendingAmount.toLocaleString()}</h3>
            <p className="card-subtitle">Pending Order</p>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {/* Orders Table */}
      <div className="orders-table-container">
        <table className="orders-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Order ID</th>
              <th>Customer Name</th>
              <th>Order Date</th>
              <th>Delivery Type</th>
              <th>Hub / Address</th>
              <th>Order Total</th>
              <th>Payment Status</th>
              <th>Order Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {currentOrders.length === 0 ? (
              <tr>
                <td colSpan="10" className="no-orders">
                  <Package size={48} />
                  <p>No orders found</p>
                </td>
              </tr>
            ) : (
              currentOrders.map((order, index) => (
                <tr key={order._id}>
                  <td>{indexOfFirstOrder + index + 1}</td>
                  <td className="order-id">
                    <div>#{order._id.slice(-8).toUpperCase()}</div>
                    {order.items && order.items.length > 0 && (
                      <div className="order-products">
                        {order.items.map((item, idx) => (
                          <span key={idx}>
                            {item.name} ({item.quantity}x)
                            {idx < order.items.length - 1 ? ', ' : ''}
                          </span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td>
                    {order.user ?
                      `${order.user.firstName || ''} ${order.user.lastName || ''}`.trim() || 'N/A'
                      : 'N/A'
                    }
                  </td>
                  <td>{formatDate(order.createdAt)}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {order.deliveryType === 'HUB_COLLECTION' ? (
                        <>
                          <Building2 size={16} color="#059669" />
                          <span style={{ color: '#059669', fontWeight: '500' }}>Hub Collection</span>
                        </>
                      ) : (
                        <>
                          <Home size={16} color="#2563eb" />
                          <span style={{ color: '#2563eb', fontWeight: '500' }}>Home Delivery</span>
                        </>
                      )}
                    </div>
                  </td>
                  <td>
                    {order.deliveryType === 'HUB_COLLECTION' ? (
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                          <MapPin size={14} color="#059669" />
                          <span style={{ fontWeight: '500' }}>{order.collectionHub?.name || 'N/A'}</span>
                        </div>
                      </div>
                    ) : (
                      <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                        {order.address?.destinationDistrict || order.address?.district || 'N/A'}
                      </div>
                    )}
                  </td>
                  <td className="order-total">₹{order.totalAmount.toLocaleString()}</td>
                  <td>
                    <span className={`badge ${getPaymentBadgeClass(order.payment?.status)}`}>
                      {order.payment?.status || 'PENDING'}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${getStatusBadgeClass(order.status)}`}>
                      {order.status === 'OUT_FOR_DELIVERY' ? 'Shipped' :
                        order.status === 'APPROVED' ? 'Processing' :
                          order.status === 'READY_FOR_COLLECTION' ? 'Ready for Collection' :
                          order.status}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="view-details-btn"
                        onClick={() => handleViewDetails(order._id)}
                        title="View order details"
                      >
                        <Eye size={16} />
                        View
                      </button>
                      {(order.payment?.status === 'PAID' || order.payment?.method === 'COD') && (
                        <button
                          className="view-details-btn"
                          onClick={() => handleDownloadInvoice(order._id)}
                          title="Download Invoice"
                          style={{ background: '#10b981', marginLeft: '0.5rem' }}
                        >
                          <Download size={16} />
                          Invoice
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination">
          <button
            className="pagination-btn"
            onClick={() => paginate(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <ChevronLeft size={18} />
            Previous
          </button>

          <div className="pagination-numbers">
            {[...Array(totalPages)].map((_, index) => (
              <button
                key={index + 1}
                className={`pagination-number ${currentPage === index + 1 ? 'active' : ''}`}
                onClick={() => paginate(index + 1)}
              >
                {index + 1}
              </button>
            ))}
          </div>

          <button
            className="pagination-btn"
            onClick={() => paginate(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Next
            <ChevronRight size={18} />
          </button>
        </div>
      )}

      {/* Footer */}
      <footer className="admin-orders-footer">
        <p>© 2025 Pepper Nursery. All rights reserved.</p>
        <p>Need help? Contact support at support@peppernursery.com</p>
      </footer>
    </div>
  );
};

export default AdminAllOrders;