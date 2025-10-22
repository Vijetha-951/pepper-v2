import React, { useState, useEffect } from 'react';
import { Star, Edit2, Trash2, AlertCircle, CheckCircle } from 'lucide-react';
import reviewService from '../services/reviewService';
import ReviewModal from '../components/ReviewModal';
import './MyReviews.css';

export default function MyReviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedReview, setSelectedReview] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await reviewService.getUserReviews();
      setReviews(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (review) => {
    setSelectedReview(review);
    setShowModal(true);
  };

  const handleDelete = async (reviewId) => {
    try {
      await reviewService.deleteReview(reviewId);
      setSuccessMessage('Review deleted successfully!');
      setDeleteConfirm(null);
      setTimeout(() => {
        fetchReviews();
        setSuccessMessage('');
      }, 1000);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleModalClose = () => {
    setShowModal(false);
    setSelectedReview(null);
  };

  const handleModalSuccess = () => {
    setSuccessMessage('Review updated successfully!');
    setTimeout(() => {
      fetchReviews();
      setSuccessMessage('');
    }, 1000);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const renderStars = (rating) => {
    return (
      <div className="review-stars">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={16}
            className={star <= rating ? 'star-filled' : 'star-empty'}
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="my-reviews-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading your reviews...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="my-reviews-container">
      <div className="my-reviews-header">
        <h1>My Reviews</h1>
        <p className="header-subtitle">
          Manage your product reviews and feedback
        </p>
      </div>

      {successMessage && (
        <div className="alert alert-success">
          <CheckCircle size={20} />
          <span>{successMessage}</span>
        </div>
      )}

      {error && (
        <div className="alert alert-error">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {reviews.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">⭐</div>
          <h2>No reviews yet</h2>
          <p>Once you receive your orders, you can share your feedback and help other customers!</p>
        </div>
      ) : (
        <div className="reviews-grid">
          {reviews.map((review) => (
            <div key={review._id} className="review-card">
              {/* Product Info */}
              <div className="review-card-header">
                <div className="review-product-header">
                  {review.product?.image && (
                    <img src={review.product.image} alt={review.product.name} className="review-product-thumb" />
                  )}
                  <div className="review-product-info">
                    <h3>{review.product?.name}</h3>
                    <p className="review-date">
                      Reviewed on {formatDate(review.createdAt)}
                      {review.lastEditedAt && ` (Edited ${formatDate(review.lastEditedAt)})`}
                    </p>
                  </div>
                </div>

                {/* Edit Count Badge */}
                {review.editCount > 0 && (
                  <span className="edit-badge">Edited {review.editCount}x</span>
                )}
              </div>

              {/* Rating */}
              <div className="review-rating">
                {renderStars(review.rating)}
                <span className="rating-text">{review.rating}.0 / 5.0</span>
              </div>

              {/* Comment */}
              {review.comment && (
                <div className="review-comment">
                  <p>{review.comment}</p>
                </div>
              )}

              {/* Complaint */}
              {review.complaintType !== 'None' && (
                <div className="review-complaint">
                  <div className="complaint-header">
                    <span className="complaint-badge">{review.complaintType}</span>
                  </div>
                  {review.complaintDescription && (
                    <p className="complaint-text">{review.complaintDescription}</p>
                  )}
                </div>
              )}

              {/* Status */}
              <div className="review-status">
                {review.isPublished ? (
                  <span className="status-published">✓ Published</span>
                ) : (
                  <span className="status-draft">Draft</span>
                )}
                {!review.canEdit && (
                  <span className="status-locked">Cannot edit (30 days passed)</span>
                )}
              </div>

              {/* Actions */}
              <div className="review-actions">
                {review.canEdit && (
                  <>
                    <button
                      className="btn-edit"
                      onClick={() => handleEdit(review)}
                      title="Edit this review"
                    >
                      <Edit2 size={16} />
                      Edit
                    </button>
                    <button
                      className="btn-delete"
                      onClick={() => setDeleteConfirm(review._id)}
                      title="Delete this review"
                    >
                      <Trash2 size={16} />
                      Delete
                    </button>
                  </>
                )}
              </div>

              {/* Delete Confirmation */}
              {deleteConfirm === review._id && (
                <div className="delete-confirm">
                  <p>Are you sure you want to delete this review?</p>
                  <div className="confirm-actions">
                    <button
                      className="btn-cancel-delete"
                      onClick={() => setDeleteConfirm(null)}
                    >
                      Cancel
                    </button>
                    <button
                      className="btn-confirm-delete"
                      onClick={() => handleDelete(review._id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Review Modal */}
      <ReviewModal
        isOpen={showModal}
        onClose={handleModalClose}
        product={selectedReview?.product || {}}
        order={selectedReview?.order || {}}
        onSuccess={handleModalSuccess}
        existingReview={selectedReview}
      />
    </div>
  );
}