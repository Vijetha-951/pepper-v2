import React, { useState, useEffect } from 'react';
import { Star, X, AlertCircle, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react';
import reviewService from '../services/reviewService';
import './ReviewModal.css';

export default function ReviewModal({ isOpen, onClose, order, onSuccess, existingReview = null }) {
  const [expandedProduct, setExpandedProduct] = useState(0);
  const [reviews, setReviews] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const complaintTypes = ['None', 'Damaged', 'Wrong Variety', 'Delayed Delivery', 'Other'];

  // Initialize reviews state from order items
  useEffect(() => {
    if (order?.items) {
      const initialReviews = {};
      order.items.forEach((item, idx) => {
        initialReviews[idx] = {
          rating: 0,
          hoveredRating: 0,
          comment: '',
          complaintType: 'None',
          complaintDescription: ''
        };
      });
      setReviews(initialReviews);
    }
  }, [order]);

  const updateReview = (productIdx, field, value) => {
    setReviews(prev => ({
      ...prev,
      [productIdx]: {
        ...prev[productIdx],
        [field]: value
      }
    }));
  };

  const handleSubmitReviews = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Check if at least one product has a rating
    const hasRatings = Object.values(reviews).some(r => r.rating > 0);
    if (!hasRatings) {
      setError('Please rate at least one product');
      return;
    }

    setLoading(true);

    try {
      // Submit reviews for all products with ratings
      const submitPromises = [];
      
      order.items.forEach((item, idx) => {
        if (reviews[idx].rating > 0) {
          submitPromises.push(
            reviewService.submitReview({
              productId: item.product,
              orderId: order._id,
              rating: reviews[idx].rating,
              comment: reviews[idx].comment,
              complaintType: reviews[idx].complaintType,
              complaintDescription: reviews[idx].complaintDescription
            })
          );
        }
      });

      if (submitPromises.length > 0) {
        await Promise.all(submitPromises);
        setSuccess(`${submitPromises.length} review(s) submitted successfully!`);
        
        setTimeout(() => {
          onSuccess?.();
          onClose();
        }, 1500);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="review-modal-overlay" onClick={onClose}>
      <div className="review-modal review-modal-multi" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="review-modal-header">
          <h2>Review Order Products</h2>
          <button className="close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="alert alert-error">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="alert alert-success">
            <CheckCircle size={20} />
            <span>{success}</span>
          </div>
        )}

        {/* Products List */}
        <div className="review-products-list">
          {order.items?.map((item, idx) => (
            <div key={idx} className="review-product-card">
              {/* Product Header */}
              <div 
                className="product-card-header"
                onClick={() => setExpandedProduct(expandedProduct === idx ? -1 : idx)}
              >
                <div className="product-card-info">
                  {item.image && (
                    <img src={item.image} alt={item.name} className="product-card-image" />
                  )}
                  <div className="product-card-details">
                    <h4>{item.name}</h4>
                    <p className="product-quantity">Quantity: {item.quantity}x</p>
                    {reviews[idx]?.rating > 0 && (
                      <div className="product-rating-preview">
                        <span className="rating-stars">
                          {Array(reviews[idx].rating).fill('⭐').join('')}
                        </span>
                        <span className="rating-text">{reviews[idx].rating}/5</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="expand-icon">
                  {expandedProduct === idx ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </div>
              </div>

              {/* Product Review Form */}
              {expandedProduct === idx && (
                <div className="product-review-form">
                  {/* Rating Section */}
                  <div className="form-section">
                    <label className="form-label">Rate Product Quality *</label>
                    <p className="form-hint">Help us improve by rating your recent purchase</p>
                    <div className="rating-input">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          className="star-btn"
                          onMouseEnter={() => updateReview(idx, 'hoveredRating', star)}
                          onMouseLeave={() => updateReview(idx, 'hoveredRating', 0)}
                          onClick={() => updateReview(idx, 'rating', star)}
                        >
                          <Star
                            size={32}
                            className={
                              star <= (reviews[idx]?.hoveredRating || reviews[idx]?.rating) ? 'star-filled' : 'star-empty'
                            }
                          />
                        </button>
                      ))}
                    </div>
                    <span className="rating-value">
                      {reviews[idx]?.rating > 0 ? `${reviews[idx].rating}.0 / 5.0` : 'Select rating'}
                    </span>
                  </div>

                  {/* Comment Section */}
                  <div className="form-section">
                    <label className="form-label">Your Experience</label>
                    <p className="form-hint">Share details about health, growth, packaging, etc.</p>
                    <textarea
                      value={reviews[idx]?.comment || ''}
                      onChange={(e) => updateReview(idx, 'comment', e.target.value)}
                      placeholder="Tell us about your experience with this product..."
                      className="review-textarea"
                      maxLength="1000"
                      rows="3"
                    />
                    <span className="char-count">{(reviews[idx]?.comment || '').length}/1000</span>
                  </div>

                  {/* Complaint Section */}
                  <div className="form-section">
                    <label className="form-label">Complaint (Optional)</label>
                    <p className="form-hint">Describe any issues (e.g., wrong variety, damaged, delayed)</p>

                    <select
                      value={reviews[idx]?.complaintType || 'None'}
                      onChange={(e) => updateReview(idx, 'complaintType', e.target.value)}
                      className="review-select"
                    >
                      {complaintTypes.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>

                    {reviews[idx]?.complaintType !== 'None' && (
                      <>
                        <textarea
                          value={reviews[idx]?.complaintDescription || ''}
                          onChange={(e) => updateReview(idx, 'complaintDescription', e.target.value)}
                          placeholder="Describe the issue..."
                          className="review-textarea"
                          maxLength="1000"
                          rows="2"
                        />
                        <span className="char-count">{(reviews[idx]?.complaintDescription || '').length}/1000</span>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Review Summary */}
        <div className="review-summary">
          <p>
            {Object.values(reviews).filter(r => r.rating > 0).length} of {order.items?.length || 0} products rated
          </p>
        </div>

        {/* Buttons */}
        <div className="review-actions">
          <button
            type="button"
            className="btn-cancel"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn-submit"
            onClick={handleSubmitReviews}
            disabled={loading || !Object.values(reviews).some(r => r.rating > 0)}
          >
            {loading ? 'Submitting...' : 'Submit Reviews'}
          </button>
        </div>
      </div>
    </div>
  );
}