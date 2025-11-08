import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, RefreshCw, TrendingUp, AlertCircle,
  SmilePlus, Frown, Zap, BarChart3, Search
} from 'lucide-react';
import { auth } from '../config/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import './AdminReviewSentimentDashboard.css';

const AdminReviewSentimentDashboard = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [summary, setSummary] = useState(null);
  const [analyzedReviews, setAnalyzedReviews] = useState([]);
  const [filterSentiment, setFilterSentiment] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        fetchSentimentData(firebaseUser);
      } else {
        setLoading(false);
        setError('Please sign in to view sentiment analysis');
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchSentimentData = async (firebaseUser = user) => {
    try {
      setLoading(true);
      setError('');
      
      if (!firebaseUser) {
        setError('Not authenticated');
        setLoading(false);
        return;
      }

      const token = await firebaseUser.getIdToken();

      // Fetch sentiment summary
      const summaryResponse = await fetch('/api/admin/reviews/sentiment/summary', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!summaryResponse.ok) {
        throw new Error('Failed to fetch sentiment summary');
      }

      const summaryData = await summaryResponse.json();
      setSummary(summaryData);

      // Fetch detailed analysis
      const analysisResponse = await fetch('/api/admin/reviews/sentiment/analyze?limit=100', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!analysisResponse.ok) {
        throw new Error('Failed to fetch sentiment analysis');
      }

      const analysisData = await analysisResponse.json();
      setAnalyzedReviews(analysisData.reviews || []);
    } catch (err) {
      console.error('Error fetching sentiment data:', err);
      setError(err.message || 'Failed to load sentiment analysis');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    if (user) {
      fetchSentimentData(user);
    }
  };

  const getFilteredReviews = () => {
    let filtered = [...analyzedReviews];

    if (filterSentiment !== 'all') {
      filtered = filtered.filter(r => r.sentiment === filterSentiment);
    }

    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(r => 
        r.comment.toLowerCase().includes(search) ||
        (r.user?.firstName || '').toLowerCase().includes(search) ||
        (r.product?.name || '').toLowerCase().includes(search)
      );
    }

    return filtered;
  };

  const getSentimentColor = (sentiment) => {
    switch (sentiment) {
      case 'POSITIVE':
        return '#10b981';
      case 'NEGATIVE':
        return '#ef4444';
      case 'NEUTRAL':
        return '#f59e0b';
      default:
        return '#6b7280';
    }
  };

  const getSentimentIcon = (sentiment) => {
    switch (sentiment) {
      case 'POSITIVE':
        return '😊';
      case 'NEGATIVE':
        return '😞';
      case 'NEUTRAL':
        return '😐';
      default:
        return '😐';
    }
  };

  const filteredReviews = getFilteredReviews();

  if (loading) {
    return (
      <div className="sentiment-loading">
        <div className="spinner"></div>
        <p>Loading sentiment analysis...</p>
      </div>
    );
  }

  return (
    <div className="sentiment-dashboard-container">
      {/* Decorative leaves */}
      <div className="leaf-decoration leaf-top-left">🌿</div>
      <div className="leaf-decoration leaf-top-right">🍃</div>

      {/* Header */}
      <header className="sentiment-header">
        <div className="header-content">
          <button
            onClick={() => navigate('/dashboard')}
            className="back-button"
          >
            <ArrowLeft size={16} /> Back
          </button>
          <div className="header-title">
            <BarChart3 size={32} className="title-icon" />
            <div>
              <h1>Review Sentiment Analysis</h1>
              <p>AI-powered sentiment classification using SVM</p>
            </div>
          </div>
          <button onClick={handleRefresh} className="refresh-button">
            <RefreshCw size={20} /> Refresh
          </button>
        </div>
      </header>

      {error && (
        <div className="error-message">
          <AlertCircle size={20} />
          {error}
        </div>
      )}

      {/* Summary Cards */}
      {summary && (
        <div className="summary-cards">
          <div className="summary-card total">
            <div className="card-icon">📊</div>
            <div className="card-content">
              <div className="card-label">Total Reviews</div>
              <div className="card-value">{summary.totalReviews}</div>
            </div>
          </div>

          <div className="summary-card positive">
            <div className="card-icon">😊</div>
            <div className="card-content">
              <div className="card-label">Positive</div>
              <div className="card-value">{summary.positiveSentiment}</div>
              <div className="card-percentage">{summary.positivePercentage}%</div>
            </div>
          </div>

          <div className="summary-card negative">
            <div className="card-icon">😞</div>
            <div className="card-content">
              <div className="card-label">Negative</div>
              <div className="card-value">{summary.negativeSentiment}</div>
              <div className="card-percentage">{summary.negativePercentage}%</div>
            </div>
          </div>

          <div className="summary-card neutral">
            <div className="card-icon">😐</div>
            <div className="card-content">
              <div className="card-label">Neutral</div>
              <div className="card-value">{summary.neutralSentiment}</div>
              <div className="card-percentage">{summary.neutralPercentage}%</div>
            </div>
          </div>

          <div className="summary-card rating">
            <div className="card-icon">⭐</div>
            <div className="card-content">
              <div className="card-label">Avg Rating</div>
              <div className="card-value">{summary.averageRating}</div>
            </div>
          </div>

          <div className="summary-card confidence">
            <div className="card-icon">🎯</div>
            <div className="card-content">
              <div className="card-label">Avg Confidence</div>
              <div className="card-value">{summary.averageConfidence}%</div>
            </div>
          </div>
        </div>
      )}

      {/* Problematic Reviews */}
      {summary && summary.problematicReviews && summary.problematicReviews.length > 0 && (
        <div className="problematic-section">
          <h2>
            <AlertCircle size={24} className="section-icon" />
            Problematic Reviews (Requiring Attention)
          </h2>
          <div className="problematic-list">
            {summary.problematicReviews.map((review, idx) => (
              <div key={idx} className="problematic-item">
                <div className="problematic-header">
                  <span className="user-info">
                    {review.userName} - {review.productName}
                  </span>
                  <div className="review-meta">
                    <span className={`rating-badge ${review.rating <= 2 ? 'low' : ''}`}>
                      ⭐ {review.rating}
                    </span>
                    <span
                      className="sentiment-badge"
                      style={{ backgroundColor: getSentimentColor(review.sentiment) }}
                    >
                      {review.sentiment}
                    </span>
                  </div>
                </div>
                <p className="problematic-comment">{review.comment}</p>
                {review.complaintType !== 'None' && (
                  <span className="complaint-badge">{review.complaintType}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="filters-section">
        <div className="search-box">
          <Search size={20} />
          <input
            type="text"
            placeholder="Search by customer, product, or comment..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="sentiment-filter">
          <button
            className={`filter-btn ${filterSentiment === 'all' ? 'active' : ''}`}
            onClick={() => setFilterSentiment('all')}
          >
            All
          </button>
          <button
            className={`filter-btn positive ${filterSentiment === 'POSITIVE' ? 'active' : ''}`}
            onClick={() => setFilterSentiment('POSITIVE')}
          >
            😊 Positive
          </button>
          <button
            className={`filter-btn negative ${filterSentiment === 'NEGATIVE' ? 'active' : ''}`}
            onClick={() => setFilterSentiment('NEGATIVE')}
          >
            😞 Negative
          </button>
          <button
            className={`filter-btn neutral ${filterSentiment === 'NEUTRAL' ? 'active' : ''}`}
            onClick={() => setFilterSentiment('NEUTRAL')}
          >
            😐 Neutral
          </button>
        </div>
      </div>

      {/* Detailed Reviews */}
      <div className="reviews-section">
        <h2>Analyzed Reviews ({filteredReviews.length})</h2>

        {filteredReviews.length > 0 ? (
          <div className="reviews-grid">
            {filteredReviews.map((review) => (
              <div key={review._id} className="review-card">
                <div className="review-header">
                  <div className="sentiment-indicator">
                    <span
                      className="sentiment-dot"
                      style={{ backgroundColor: getSentimentColor(review.sentiment) }}
                    />
                    <span className="sentiment-label">{review.sentiment}</span>
                  </div>
                  <div className="confidence-badge">
                    {review.sentimentConfidence}% confident
                  </div>
                </div>

                <div className="review-body">
                  <div className="review-meta">
                    <span className="customer">
                      {review.user?.firstName || 'Anonymous'} {review.user?.lastName || ''}
                    </span>
                    <span className="product">{review.product?.name || 'Unknown Product'}</span>
                  </div>

                  <p className="review-comment">{review.comment}</p>

                  <div className="review-footer">
                    <div className="rating">
                      {'⭐'.repeat(review.rating)}
                      <span className="rating-number">{review.rating}/5</span>
                    </div>
                    {review.complaintType !== 'None' && (
                      <span className="complaint">{review.complaintType}</span>
                    )}
                  </div>

                  {review.keywords && review.keywords.length > 0 && (
                    <div className="keywords">
                      {review.keywords.map((kw, idx) => (
                        <span key={idx} className="keyword">
                          {kw}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <p>No reviews match your filters</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="sentiment-footer">
        <p>Last updated: {summary?.analyzedAt ? new Date(summary.analyzedAt).toLocaleString() : 'Never'}</p>
      </div>
    </div>
  );
};

export default AdminReviewSentimentDashboard;