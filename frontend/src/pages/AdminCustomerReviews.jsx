import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Star, Trash2, Eye, EyeOff, ChevronLeft, ChevronRight, AlertCircle, ArrowLeft, MessageCircle } from 'lucide-react';
import { auth } from '../config/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import './AdminCustomerReviews.css';

const AdminCustomerReviews = () => {
  const [user, setUser] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [filteredReviews, setFilteredReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [ratingFilter, setRatingFilter] = useState('all');
  const [complaintFilter, setComplaintFilter] = useState('all');
  const [sortBy, setSortBy] = useState('recent');
  const [currentPage, setCurrentPage] = useState(1);
  const [reviewsPerPage] = useState(10);
  const [stats, setStats] = useState({
    totalReviews: 0,
    publishedReviews: 0,
    unpublishedReviews: 0,
    averageRating: 0,
    complaintReviews: 0,
    complaintTypes: []
  });
  const [selectedReview, setSelectedReview] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        fetchReviews(firebaseUser);
        fetchStats(firebaseUser);
      } else {
        setLoading(false);
        setError('Please sign in to view reviews');
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    filterReviews();
  }, [reviews, searchTerm, ratingFilter, complaintFilter, sortBy]);

  const fetchReviews = async (firebaseUser = user) => {
    try {
      setLoading(true);
      if (!firebaseUser) {
        setError('Not authenticated');
        setLoading(false);
        return;
      }
      const token = await firebaseUser.getIdToken();
      const params = new URLSearchParams({
        page: currentPage,
        limit: reviewsPerPage,
        sortBy: sortBy
      });

      if (searchTerm) params.append('search', searchTerm);
      if (ratingFilter !== 'all') params.append('ratingFilter', ratingFilter);
      if (complaintFilter !== 'all') params.append('complaintFilter', complaintFilter);

      const response = await fetch(`/api/admin/reviews?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setReviews(data.reviews);
        setFilteredReviews(data.reviews);
      } else {
        setError('Failed to fetch reviews');
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
      setError('Failed to load reviews');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async (firebaseUser = user) => {
    try {
      if (!firebaseUser) return;
      const token = await firebaseUser.getIdToken();
      const response = await fetch('/api/admin/reviews/stats/overview', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const filterReviews = () => {
    let filtered = [...reviews];

    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(review => {
        const customerName = `${review.user?.firstName || ''} ${review.user?.lastName || ''}`.toLowerCase();
        const productName = review.product?.name?.toLowerCase() || '';
        const comment = review.comment?.toLowerCase() || '';
        
        return customerName.includes(search) || 
               productName.includes(search) || 
               comment.includes(search);
      });
    }

    // Rating filter
    if (ratingFilter !== 'all') {
      filtered = filtered.filter(review => review.rating === parseInt(ratingFilter));
    }

    // Complaint filter
    if (complaintFilter !== 'all') {
      if (complaintFilter === 'with_complaint') {
        filtered = filtered.filter(review => review.complaintType !== 'None');
      } else if (complaintFilter !== 'all') {
        filtered = filtered.filter(review => review.complaintType === complaintFilter);
      }
    }

    setFilteredReviews(filtered);
    setCurrentPage(1);
  };

  const renderStars = (rating) => {
    return (
      <div className="stars-display">
        {[1, 2, 3, 4, 5].map(star => (
          <Star
            key={star}
            size={16}
            className={star <= rating ? 'star-filled' : 'star-empty'}
            fill={star <= rating ? '#fbbf24' : 'none'}
          />
        ))}
      </div>
    );
  };

  const handleViewDetails = (review) => {
    setSelectedReview(review);
    setShowDetailModal(true);
  };

  const handleTogglePublish = async (reviewId, currentStatus) => {
    try {
      if (!user) {
        alert('Not authenticated');
        return;
      }
      const token = await user.getIdToken();
      const response = await fetch(`/api/admin/reviews/${reviewId}/publish`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ isPublished: !currentStatus })
      });

      if (response.ok) {
        fetchReviews();
        alert(`Review ${!currentStatus ? 'published' : 'unpublished'} successfully`);
      } else {
        alert('Failed to update review');
      }
    } catch (error) {
      console.error('Error updating review:', error);
      alert('Failed to update review');
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm('Are you sure you want to delete this review?')) {
      return;
    }

    try {
      if (!user) {
        alert('Not authenticated');
        return;
      }
      const token = await user.getIdToken();
      const response = await fetch(`/api/admin/reviews/${reviewId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        fetchReviews();
        alert('Review deleted successfully');
      } else {
        alert('Failed to delete review');
      }
    } catch (error) {
      console.error('Error deleting review:', error);
      alert('Failed to delete review');
    }
  };

  // Pagination
  const indexOfLastReview = currentPage * reviewsPerPage;
  const indexOfFirstReview = indexOfLastReview - reviewsPerPage;
  const currentReviews = filteredReviews.slice(indexOfFirstReview, indexOfLastReview);
  const totalPages = Math.ceil(filteredReviews.length / reviewsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="admin-reviews-loading">
        <div className="spinner"></div>
        <p>Loading reviews...</p>
      </div>
    );
  }

  return (
    <div className="admin-reviews-container">
      {/* Decorative leaves */}
      <div className="leaf-decoration leaf-top-left">🌿</div>
      <div className="leaf-decoration leaf-top-right">🍃</div>

      {/* Header */}
      <header className="admin-reviews-header">
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
          <h1 className="page-title">Customer Reviews Management</h1>
        </div>
      </header>

      {/* Statistics Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Reviews</div>
          <div className="stat-value">{stats.totalReviews}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Average Rating</div>
          <div className="stat-value">{stats.averageRating}★</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Published</div>
          <div className="stat-value">{stats.publishedReviews}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Complaints</div>
          <div className="stat-value">{stats.complaintReviews}</div>
        </div>
      </div>

      {/* Complaint Types Breakdown */}
      {stats.complaintTypes && stats.complaintTypes.length > 0 && (
        <div className="complaint-types-section">
          <h3>Complaint Types Breakdown</h3>
          <div className="complaint-types-list">
            {stats.complaintTypes.map(type => (
              <div key={type._id} className="complaint-type-item">
                <span className="complaint-type-name">{type._id}</span>
                <span className="complaint-type-count">{type.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {error && <div className="error-message">{error}</div>}

      {/* Filters Section */}
      <div className="filters-section">
        <div className="search-box">
          <Search size={20} />
          <input
            type="text"
            placeholder="Search by customer name, product, or comment..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-controls">
          <select
            value={ratingFilter}
            onChange={(e) => setRatingFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Ratings</option>
            <option value="5">⭐ 5 Stars</option>
            <option value="4">⭐ 4 Stars</option>
            <option value="3">⭐ 3 Stars</option>
            <option value="2">⭐ 2 Stars</option>
            <option value="1">⭐ 1 Star</option>
          </select>

          <select
            value={complaintFilter}
            onChange={(e) => setComplaintFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Reviews</option>
            <option value="with_complaint">With Complaints</option>
            <option value="None">No Complaints</option>
            <option value="Damaged">Damaged</option>
            <option value="Wrong Variety">Wrong Variety</option>
            <option value="Delayed Delivery">Delayed Delivery</option>
            <option value="Other">Other</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="filter-select"
          >
            <option value="recent">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="highest_rating">Highest Rating</option>
            <option value="lowest_rating">Lowest Rating</option>
            <option value="most_complaints">Most Complaints</option>
          </select>
        </div>
      </div>

      {/* Reviews Table */}
      <div className="reviews-section">
        <h2>All Reviews ({filteredReviews.length})</h2>
        
        {currentReviews.length > 0 ? (
          <div className="reviews-table">
            <div className="table-header">
              <div className="col-customer">Customer</div>
              <div className="col-product">Product</div>
              <div className="col-rating">Rating</div>
              <div className="col-comment">Comment</div>
              <div className="col-complaint">Complaint</div>
              <div className="col-status">Status</div>
              <div className="col-date">Date</div>
              <div className="col-actions">Actions</div>
            </div>

            {currentReviews.map((review) => (
              <div key={review._id} className="table-row">
                <div className="col-customer">
                  <div className="customer-info">
                    <div className="customer-name">
                      {review.user?.firstName} {review.user?.lastName}
                    </div>
                    <div className="customer-email">{review.user?.email}</div>
                  </div>
                </div>

                <div className="col-product">
                  <div className="product-info">
                    <div className="product-name">{review.product?.name}</div>
                  </div>
                </div>

                <div className="col-rating">
                  {renderStars(review.rating)}
                </div>

                <div className="col-comment">
                  <div className="comment-preview">
                    {review.comment?.substring(0, 50)}
                    {review.comment?.length > 50 ? '...' : ''}
                  </div>
                </div>

                <div className="col-complaint">
                  {review.complaintType !== 'None' ? (
                    <span className="complaint-badge">{review.complaintType}</span>
                  ) : (
                    <span className="no-complaint">No</span>
                  )}
                </div>

                <div className="col-status">
                  <span className={`status-badge ${review.isPublished ? 'published' : 'unpublished'}`}>
                    {review.isPublished ? 'Published' : 'Unpublished'}
                  </span>
                </div>

                <div className="col-date">
                  <div className="date-text">{formatDate(review.createdAt)}</div>
                </div>

                <div className="col-actions">
                  <button
                    className="action-btn view-btn"
                    onClick={() => handleViewDetails(review)}
                    title="View Details"
                  >
                    <MessageCircle size={16} />
                  </button>
                  <button
                    className="action-btn toggle-btn"
                    onClick={() => handleTogglePublish(review._id, review.isPublished)}
                    title={review.isPublished ? 'Unpublish' : 'Publish'}
                  >
                    {review.isPublished ? <Eye size={16} /> : <EyeOff size={16} />}
                  </button>
                  <button
                    className="action-btn delete-btn"
                    onClick={() => handleDeleteReview(review._id)}
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-reviews">
            <AlertCircle size={40} />
            <p>No reviews found</p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="pagination">
            <button
              onClick={() => paginate(currentPage - 1)}
              disabled={currentPage === 1}
              className="pagination-btn"
            >
              <ChevronLeft size={18} /> Previous
            </button>

            <div className="pagination-info">
              Page {currentPage} of {totalPages}
            </div>

            <button
              onClick={() => paginate(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="pagination-btn"
            >
              Next <ChevronRight size={18} />
            </button>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedReview && (
        <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Review Details</h2>
              <button
                className="modal-close"
                onClick={() => setShowDetailModal(false)}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              <div className="detail-section">
                <h3>Customer Information</h3>
                <p><strong>Name:</strong> {selectedReview.user?.firstName} {selectedReview.user?.lastName}</p>
                <p><strong>Email:</strong> {selectedReview.user?.email}</p>
                <p><strong>Phone:</strong> {selectedReview.user?.phone || 'N/A'}</p>
              </div>

              <div className="detail-section">
                <h3>Product Information</h3>
                <p><strong>Product:</strong> {selectedReview.product?.name}</p>
                <p><strong>Category:</strong> {selectedReview.product?.category || 'N/A'}</p>
                <p><strong>Price:</strong> ₹{selectedReview.product?.price}</p>
              </div>

              <div className="detail-section">
                <h3>Review Rating</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {renderStars(selectedReview.rating)}
                  <span style={{ fontSize: '18px', fontWeight: 'bold' }}>
                    {selectedReview.rating}/5
                  </span>
                </div>
              </div>

              <div className="detail-section">
                <h3>Review Comment</h3>
                <p className="review-comment">{selectedReview.comment}</p>
              </div>

              {selectedReview.complaintType !== 'None' && (
                <div className="detail-section complaint-section">
                  <h3>Complaint Information</h3>
                  <p><strong>Type:</strong> {selectedReview.complaintType}</p>
                  <p><strong>Description:</strong> {selectedReview.complaintDescription}</p>
                </div>
              )}

              <div className="detail-section">
                <h3>Review Metadata</h3>
                <p><strong>Submitted:</strong> {formatDate(selectedReview.createdAt)}</p>
                <p><strong>Last Edited:</strong> {selectedReview.lastEditedAt ? formatDate(selectedReview.lastEditedAt) : 'Never'}</p>
                <p><strong>Edit Count:</strong> {selectedReview.editCount || 0}</p>
                <p><strong>Status:</strong> {selectedReview.isPublished ? '✓ Published' : '✗ Unpublished'}</p>
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => setShowDetailModal(false)}
              >
                Close
              </button>
              <button
                className="btn btn-danger"
                onClick={() => {
                  handleDeleteReview(selectedReview._id);
                  setShowDetailModal(false);
                }}
              >
                Delete Review
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCustomerReviews;