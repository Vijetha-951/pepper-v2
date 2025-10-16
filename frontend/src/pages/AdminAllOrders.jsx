import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Eye, Package, DollarSign, Clock, RefreshCw, ChevronLeft, ChevronRight, Truck, X } from 'lucide-react';
import { auth } from '../config/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import './AdminAllOrders.css';

const AdminAllOrders = () => {
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('');
  const [dateRangeFilter, setDateRangeFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [ordersPerPage] = useState(10);
  const [summary, setSummary] = useState({
    todayOrders: 0,
    monthRevenue: 0,
    pendingOrders: 0,
    pendingAmount: 0
  });
  const [assignmentModal, setAssignmentModal] = useState({
    isOpen: false,
    orderId: null,
    availableDeliveryBoys: [],
    loadingBoys: false,
    selectedBoyId: null,
    assigning: false
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
    filterOrders();
    calculateSummary();
  }, [orders, searchTerm, orderStatusFilter, paymentStatusFilter, dateRangeFilter]);

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
        setFilteredOrders(data);
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

  const filterOrders = () => {
    let filtered = [...orders];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(order => {
        const orderId = order._id.slice(-8).toUpperCase();
        const customerName = `${order.user?.firstName || ''} ${order.user?.lastName || ''}`.toLowerCase();
        const products = order.items?.map(item => item.name?.toLowerCase() || '').join(' ');
        const search = searchTerm.toLowerCase();
        
        return orderId.includes(search.toUpperCase()) || 
               customerName.includes(search) || 
               products.includes(search);
      });
    }

    // Order status filter
    if (orderStatusFilter) {
      if (orderStatusFilter === 'PROCESSING') {
        filtered = filtered.filter(order => 
          ['PENDING', 'APPROVED', 'OUT_FOR_DELIVERY'].includes(order.status)
        );
      } else {
        filtered = filtered.filter(order => order.status === orderStatusFilter);
      }
    }

    // Payment status filter
    if (paymentStatusFilter) {
      filtered = filtered.filter(order => order.payment?.status === paymentStatusFilter);
    }

    // Date range filter
    if (dateRangeFilter !== 'all') {
      const now = new Date();
      filtered = filtered.filter(order => {
        const orderDate = new Date(order.createdAt);
        switch (dateRangeFilter) {
          case 'today':
            return orderDate.toDateString() === now.toDateString();
          case 'week':
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            return orderDate >= weekAgo;
          case 'month':
            return orderDate.getMonth() === now.getMonth() && 
                   orderDate.getFullYear() === now.getFullYear();
          default:
            return true;
        }
      });
    }

    setFilteredOrders(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'PENDING':
      case 'APPROVED':
        return 'status-processing';
      case 'OUT_FOR_DELIVERY':
        return 'status-shipped';
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
    // TODO: Implement order details modal or navigation
    console.log('View order details:', orderId);
    alert(`View details for order: ${orderId.slice(-8).toUpperCase()}`);
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

  const openAssignmentModal = async (orderId) => {
    try {
      if (!user) {
        alert('Not authenticated');
        return;
      }
      
      setAssignmentModal(prev => ({
        ...prev,
        isOpen: true,
        orderId,
        loadingBoys: true,
        selectedBoyId: null
      }));

      // Fetch available delivery boys
      const token = await user.getIdToken();
      const response = await fetch('/api/admin/delivery-boys/available', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setAssignmentModal(prev => ({
          ...prev,
          availableDeliveryBoys: data.deliveryBoys || [],
          loadingBoys: false
        }));
      } else {
        alert('Failed to fetch available delivery boys');
        setAssignmentModal(prev => ({
          ...prev,
          loadingBoys: false,
          isOpen: false
        }));
      }
    } catch (error) {
      console.error('Error opening assignment modal:', error);
      alert('Failed to open assignment modal');
      setAssignmentModal(prev => ({
        ...prev,
        loadingBoys: false,
        isOpen: false
      }));
    }
  };

  const closeAssignmentModal = () => {
    setAssignmentModal({
      isOpen: false,
      orderId: null,
      availableDeliveryBoys: [],
      loadingBoys: false,
      selectedBoyId: null,
      assigning: false
    });
  };

  const handleAssignOrder = async () => {
    try {
      if (!user || !assignmentModal.orderId || !assignmentModal.selectedBoyId) {
        alert('Please select a delivery boy');
        return;
      }

      setAssignmentModal(prev => ({
        ...prev,
        assigning: true
      }));

      const token = await user.getIdToken();
      const response = await fetch(`/api/admin/orders/${assignmentModal.orderId}/assign`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ deliveryBoyId: assignmentModal.selectedBoyId })
      });

      if (response.ok) {
        fetchOrders(); // Refresh orders
        closeAssignmentModal();
        alert('Order successfully assigned to delivery boy!');
      } else {
        alert('Failed to assign order');
      }
    } catch (error) {
      console.error('Error assigning order:', error);
      alert('Failed to assign order');
    } finally {
      setAssignmentModal(prev => ({
        ...prev,
        assigning: false
      }));
    }
  };

  // Pagination
  const indexOfLastOrder = currentPage * ordersPerPage;
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
  const currentOrders = filteredOrders.slice(indexOfFirstOrder, indexOfLastOrder);
  const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);

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
          <div className="brand">
            <span className="brand-icon">🌱</span>
            <span className="brand-name">PEPPER NURSERY</span>
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

      {/* Filters Section */}
      <div className="filters-section">
        <div className="search-bar">
          <Search size={20} />
          <input
            type="text"
            placeholder="Search by Order ID, Customer, Product..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-dropdowns">
          <div className="filter-group">
            <label>Order Status</label>
            <select 
              value={orderStatusFilter} 
              onChange={(e) => setOrderStatusFilter(e.target.value)}
            >
              <option value="">All</option>
              <option value="PROCESSING">Processing</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
              <option value="DELIVERED">Delivered</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Payment Status</label>
            <select 
              value={paymentStatusFilter} 
              onChange={(e) => setPaymentStatusFilter(e.target.value)}
            >
              <option value="">All</option>
              <option value="PAID">Paid</option>
              <option value="PENDING">Pending</option>
              <option value="FAILED">Failed</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Date Range</label>
            <select 
              value={dateRangeFilter} 
              onChange={(e) => setDateRangeFilter(e.target.value)}
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>
          </div>

          <button className="refresh-btn" onClick={fetchOrders}>
            <RefreshCw size={18} />
            Refresh
          </button>
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
              <th>Order Total</th>
              <th>Payment Status</th>
              <th>Order Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {currentOrders.length === 0 ? (
              <tr>
                <td colSpan="8" className="no-orders">
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
                      {['PENDING', 'APPROVED'].includes(order.status) && !order.deliveryBoy && (
                        <button 
                          className="assign-btn"
                          onClick={() => openAssignmentModal(order._id)}
                          title="Assign delivery boy"
                        >
                          <Truck size={16} />
                          Assign
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

      {/* Assignment Modal */}
      {assignmentModal.isOpen && (
        <div className="modal-overlay" onClick={closeAssignmentModal}>
          <div className="modal-content assignment-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Assign Order to Delivery Boy</h2>
              <button 
                className="modal-close-btn"
                onClick={closeAssignmentModal}
              >
                <X size={24} />
              </button>
            </div>

            <div className="modal-body">
              {assignmentModal.loadingBoys ? (
                <div className="loading-message">
                  <div className="spinner-small"></div>
                  <p>Loading available delivery boys...</p>
                </div>
              ) : assignmentModal.availableDeliveryBoys.length === 0 ? (
                <div className="no-delivery-boys">
                  <p>No delivery boys available with "Open for Delivery" status.</p>
                </div>
              ) : (
                <div className="delivery-boys-list">
                  <label>Select Delivery Boy:</label>
                  <select 
                    value={assignmentModal.selectedBoyId || ''} 
                    onChange={(e) => setAssignmentModal(prev => ({
                      ...prev,
                      selectedBoyId: e.target.value
                    }))}
                    className="delivery-boy-select"
                  >
                    <option value="">-- Select a Delivery Boy --</option>
                    {assignmentModal.availableDeliveryBoys.map((boy) => (
                      <option key={boy._id} value={boy._id}>
                        {boy.firstName} {boy.lastName} ({boy.phone})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button 
                className="cancel-btn"
                onClick={closeAssignmentModal}
                disabled={assignmentModal.assigning}
              >
                Cancel
              </button>
              <button 
                className="assign-confirm-btn"
                onClick={handleAssignOrder}
                disabled={!assignmentModal.selectedBoyId || assignmentModal.assigning || assignmentModal.loadingBoys}
              >
                {assignmentModal.assigning ? 'Assigning...' : 'Assign Order'}
              </button>
            </div>
          </div>
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