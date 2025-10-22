import React, { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../config/firebase';
import { useNavigate } from 'react-router-dom';
import { Package, Search, Eye, Trash2, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ArrowLeft, Star } from 'lucide-react';
import ReviewModal from '../components/ReviewModal';
import './Orders.css';

const Orders = () => {
  const [user] = useAuthState(auth);
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [currentPage, setCurrentPage] = useState(1);
  const [ordersPerPage, setOrdersPerPage] = useState(10);
  const [successMessage, setSuccessMessage] = useState('');
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewOrder, setReviewOrder] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      fetchOrders();
    } else {
      navigate('/login');
    }
  }, [user, navigate]);

  useEffect(() => {
    filterOrders();
    setCurrentPage(1); // Reset to first page when filters change
  }, [orders, searchTerm, statusFilter, dateRange]);

  // Handle browser back button - ensure it goes to dashboard
  useEffect(() => {
    // Store the current state in history so browser back goes to dashboard
    window.history.pushState({ from: 'orders' }, '', window.location.pathname);

    // Listen for back button
    const handlePopState = (event) => {
      if (event.state?.from !== 'orders') {
        navigate('/dashboard');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [navigate]);

  const fetchOrders = async () => {
    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/user/orders', {
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

  const filterOrders = () => {
    let filtered = [...orders];

    // Filter by search term (Order ID or Product name)
    if (searchTerm) {
      filtered = filtered.filter(order => 
        order._id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.items.some(item => 
          item.name.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    // Filter by status
    if (statusFilter !== 'ALL') {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    // Filter by date range
    if (dateRange.start) {
      filtered = filtered.filter(order => 
        new Date(order.createdAt) >= new Date(dateRange.start)
      );
    }
    if (dateRange.end) {
      filtered = filtered.filter(order => 
        new Date(order.createdAt) <= new Date(dateRange.end)
      );
    }

    setFilteredOrders(filtered);
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'PENDING': return 'status-badge status-pending';
      case 'APPROVED': return 'status-badge status-processing';
      case 'OUT_FOR_DELIVERY': return 'status-badge status-processing';
      case 'DELIVERED': return 'status-badge status-delivered';
      case 'CANCELLED': return 'status-badge status-cancelled';
      default: return 'status-badge';
    }
  };

  const getDisplayStatus = (status) => {
    switch (status) {
      case 'APPROVED': return 'Processing';
      case 'OUT_FOR_DELIVERY': return 'Out for Delivery';
      default: return status;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const handleViewDetails = (orderId) => {
    // Navigate directly to the order tracking page
    navigate(`/order-tracking/${orderId}`);
  };

  const handleDeleteOrder = async (orderId) => {
    setOrderToCancel(orderId);
    setShowCancelModal(true);
  };

  const handleReviewClick = (order) => {
    setReviewOrder(order);
    setShowReviewModal(true);
  };

  const handleReviewSuccess = () => {
    setShowReviewModal(false);
    setReviewOrder(null);
    setSuccessMessage('Review submitted successfully!');
    setTimeout(() => {
      setSuccessMessage('');
    }, 3000);
  };

  const confirmCancelOrder = async () => {
    try {
      const token = await user.getIdToken();
      const response = await fetch(`/api/user/orders/${orderToCancel}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (response.ok) {
        setSuccessMessage(data.message || 'Order cancelled successfully!');
        setShowCancelModal(false);
        setOrderToCancel(null);
        fetchOrders(); // Refresh orders
        
        // Auto-hide success message after 5 seconds
        setTimeout(() => {
          setSuccessMessage('');
        }, 5000);
      } else {
        setError(data.message || 'Failed to cancel order');
        setShowCancelModal(false);
        setOrderToCancel(null);
        
        // Auto-hide error message after 5 seconds
        setTimeout(() => {
          setError('');
        }, 5000);
      }
    } catch (error) {
      console.error('Error canceling order:', error);
      setError('Failed to cancel order. Please try again.');
      setShowCancelModal(false);
      setOrderToCancel(null);
      
      // Auto-hide error message after 5 seconds
      setTimeout(() => {
        setError('');
      }, 5000);
    }
  };

  // Pagination calculations
  const indexOfLastOrder = currentPage * ordersPerPage;
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
  const currentOrders = filteredOrders.slice(indexOfFirstOrder, indexOfLastOrder);
  const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOrdersPerPageChange = (value) => {
    setOrdersPerPage(value);
    setCurrentPage(1);
  };

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages = [];
    const maxPagesToShow = 5;
    
    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push('...');
        pages.push(currentPage - 1);
        pages.push(currentPage);
        pages.push(currentPage + 1);
        pages.push('...');
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  if (loading) {
    return (
      <div className="orders-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading your orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="orders-container">
      {/* Decorative leaves */}
      <div className="leaf-decoration top-left">
        <div className="leaf">🌿</div>
        <div className="leaf">🍃</div>
      </div>
      <div className="leaf-decoration top-right">
        <div className="leaf">🌿</div>
        <div className="leaf">🍃</div>
      </div>

      <div className="orders-content">
        {/* Header */}
        <div className="orders-header">
          <button
            onClick={() => navigate('/dashboard')}
            className="back-button-orders"
            title="Back to Dashboard"
          >
            <ArrowLeft size={20} />
            Back
          </button>
          <div className="logo-section">
            <span className="logo-icon">🌱</span>
            <span className="brand-name">PEPPER NURSERY</span>
          </div>
          <div className="header-spacer-orders"></div>
        </div>

        {/* Title */}
        <h1 className="page-title">My Order History</h1>

        {/* Filters Section */}
        <div className="filters-section">
          {/* Search Bar */}
          <div className="search-bar">
            <Search className="search-icon" size={18} />
            <input
              type="text"
              placeholder="Filter by Status"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>

          {/* Status Filter Buttons */}
          <div className="status-filters">
            <button
              className={`filter-btn ${statusFilter === 'ALL' ? 'active' : ''}`}
              onClick={() => setStatusFilter('ALL')}
            >
              All Orders
            </button>
            <button
              className={`filter-btn ${statusFilter === 'PENDING' || statusFilter === 'APPROVED' ? 'active' : ''}`}
              onClick={() => setStatusFilter('PENDING')}
            >
              Processing
            </button>
            <button
              className={`filter-btn ${statusFilter === 'CANCELLED' ? 'active' : ''}`}
              onClick={() => setStatusFilter('CANCELLED')}
            >
              Cancelled
            </button>
          </div>

          {/* Date Range Filter */}
          <div className="date-filter">
            <span className="filter-label">Filter by Date Range</span>
          </div>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="success-message">
            <p>✓ {successMessage}</p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="error-message">
            <p>{error}</p>
          </div>
        )}

        {/* Orders Table */}
        {filteredOrders.length === 0 ? (
          <div className="empty-state">
            <Package className="empty-icon" size={64} />
            <h2>No orders found</h2>
            <p>Your order history will appear here once you make your first purchase.</p>
            <button
              onClick={() => navigate('/add-products')}
              className="btn-primary"
            >
              Start Shopping
            </button>
          </div>
        ) : (
          <>
            {/* Orders per page selector and info */}
            <div className="pagination-info">
              <div className="results-info">
                Showing {indexOfFirstOrder + 1} to {Math.min(indexOfLastOrder, filteredOrders.length)} of {filteredOrders.length} orders
              </div>
              <div className="orders-per-page">
                <label htmlFor="ordersPerPage">Orders per page:</label>
                <select 
                  id="ordersPerPage"
                  value={ordersPerPage} 
                  onChange={(e) => handleOrdersPerPageChange(Number(e.target.value))}
                  className="per-page-select"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>
            </div>

            <div className="table-container">
              <table className="orders-table">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Order Date</th>
                    <th>Product & Quantity</th>
                    <th>Unit Price</th>
                    <th>Total Price</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {currentOrders.map((order) => (
                  <tr key={order._id}>
                    <td className="order-id">
                      <div className="id-wrapper">
                        <div className="order-id-text">#{order._id.slice(-8).toUpperCase()}</div>
                        {order.payment?.transactionId && (
                          <div className="payment-id">Pay ID: {order.payment.transactionId.slice(-10)}</div>
                        )}
                        {order.payment?.refundId && (
                          <div className="refund-id">Refund ID: {order.payment.refundId.slice(-10)}</div>
                        )}
                      </div>
                    </td>
                    <td className="order-date">
                      {formatDate(order.createdAt)}
                    </td>
                    <td className="products-cell">
                      <div className="products-list">
                        {order.items.map((item, index) => (
                          <div key={index} className="product-item">
                            <span className="product-name">{item.name}</span>
                            <span className="product-quantity">({item.quantity}x)</span>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="unit-price">
                      <div className="price-list">
                        {order.items.map((item, index) => (
                          <div key={index} className="price-item">
                            {formatCurrency(item.priceAtOrder)}
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="total-price">
                      <span className="price-highlight">{formatCurrency(order.totalAmount)}</span>
                    </td>
                    <td className="status-cell">
                      <span className={getStatusBadgeClass(order.status)}>
                        {getDisplayStatus(order.status)}
                      </span>
                      {order.status === 'CANCELLED' && order.payment?.status === 'REFUNDED' && (
                        <div className="refund-status-badge">
                          ✓ Refunded
                        </div>
                      )}
                    </td>
                    <td className="action-cell">
                      <div className="action-buttons">
                        <button
                          className="action-btn view-btn"
                          onClick={() => handleViewDetails(order._id)}
                          title="View Details"
                        >
                          <Eye size={16} />
                          <span>View Details / Invoice</span>
                        </button>
                        {order.status === 'DELIVERED' && (
                          <button
                            className="action-btn review-btn"
                            onClick={() => handleReviewClick(order)}
                            title="Review Order"
                          >
                            <Star size={16} />
                            <span>Review Order</span>
                          </button>
                        )}
                        {(order.status === 'PENDING' || order.status === 'APPROVED') && (
                          <button
                            className="action-btn delete-btn"
                            onClick={() => handleDeleteOrder(order._id)}
                            title="Cancel Order"
                          >
                            <Trash2 size={16} />
                            <span>Cancel</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="pagination-container">
              <button
                className="pagination-btn"
                onClick={() => handlePageChange(1)}
                disabled={currentPage === 1}
                title="First Page"
              >
                <ChevronsLeft size={18} />
              </button>
              
              <button
                className="pagination-btn"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                title="Previous Page"
              >
                <ChevronLeft size={18} />
              </button>

              <div className="pagination-numbers">
                {getPageNumbers().map((page, index) => (
                  page === '...' ? (
                    <span key={`ellipsis-${index}`} className="pagination-ellipsis">...</span>
                  ) : (
                    <button
                      key={page}
                      className={`pagination-number ${currentPage === page ? 'active' : ''}`}
                      onClick={() => handlePageChange(page)}
                    >
                      {page}
                    </button>
                  )
                ))}
              </div>

              <button
                className="pagination-btn"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                title="Next Page"
              >
                <ChevronRight size={18} />
              </button>

              <button
                className="pagination-btn"
                onClick={() => handlePageChange(totalPages)}
                disabled={currentPage === totalPages}
                title="Last Page"
              >
                <ChevronsRight size={18} />
              </button>
            </div>
          )}
        </>
        )}

        {/* Footer */}
        <div className="orders-footer">
          <p>Need help? Contact us: support@peppernursery.com | 1-800-PLANT-GO</p>
        </div>
      </div>

      {/* Review Modal */}
      <ReviewModal
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        order={reviewOrder || {}}
        onSuccess={handleReviewSuccess}
      />

      {/* Cancel Order Confirmation Modal */}
      {showCancelModal && (
        <div className="modal-overlay" onClick={() => setShowCancelModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Cancel Order</h2>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to cancel this order?</p>
              <p className="modal-warning">⚠️ This action cannot be undone. The stock will be restored automatically.</p>
            </div>
            <div className="modal-footer">
              <button 
                className="modal-btn cancel-btn" 
                onClick={() => {
                  setShowCancelModal(false);
                  setOrderToCancel(null);
                }}
              >
                No, Keep Order
              </button>
              <button 
                className="modal-btn confirm-btn" 
                onClick={confirmCancelOrder}
              >
                Yes, Cancel Order
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;