import { useState, useEffect } from 'react';
import { Sparkles, TrendingUp, AlertCircle } from 'lucide-react';
import customerProductService from '../services/customerProductService';

export default function RecommendedProducts({ onAddToCart, onProductClick }) {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [insights, setInsights] = useState(null);

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const fetchRecommendations = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch both recommendations and insights
      const [recData, insightData] = await Promise.all([
        customerProductService.getRecommendations(5, 5),
        customerProductService.getRecommendationInsights().catch(() => null)
      ]);

      setRecommendations(recData?.recommendations || []);
      setInsights(insightData?.insights);
    } catch (err) {
      console.error('Error fetching recommendations:', err);
      setError('Failed to load recommendations');
    } finally {
      setLoading(false);
    }
  };

  const handleProductClick = (product) => {
    // Track browsing
    customerProductService.trackProductBrowsing(product._id).catch(() => {});
    
    if (onProductClick) {
      onProductClick(product);
    }
  };

  const cardStyle = {
    background: 'white',
    borderRadius: '12px',
    padding: '1.5rem',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
    border: '1px solid #e5e7eb',
    transition: 'all 0.3s ease'
  };

  const productCardStyle = {
    background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
    borderRadius: '16px',
    padding: '0',
    border: 'none',
    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.08)',
    transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    overflow: 'hidden',
    position: 'relative'
  };

  return (
    <div style={cardStyle}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '1.5rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Sparkles size={24} color="#10b981" />
          <h3 style={{
            fontSize: '1.5rem',
            fontWeight: 'bold',
            color: '#1f2937',
            margin: 0
          }}>
            Recommended For You
          </h3>
        </div>
        <TrendingUp size={20} color="#10b981" />
      </div>

      {/* Insights */}
      {insights && (
        <div style={{
          background: '#f0fdf4',
          border: '1px solid #bbf7d0',
          borderRadius: '8px',
          padding: '0.75rem 1rem',
          marginBottom: '1rem',
          fontSize: '0.875rem',
          color: '#065f46'
        }}>
          <strong>Personalized by KNN:</strong> Based on {insights.totalPurchases} purchases and {insights.totalBrowsed} browsed items
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '200px'
        }}>
          <div style={{
            width: '3rem',
            height: '3rem',
            border: '4px solid #e5e7eb',
            borderTop: '4px solid #10b981',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></div>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          background: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '8px',
          padding: '1rem',
          color: '#dc2626'
        }}>
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {/* Recommendations Grid */}
      {!loading && recommendations.length > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: '1rem'
        }}>
          {recommendations.map((product) => (
            <div
              key={product._id}
              style={productCardStyle}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 8px 30px rgba(16, 185, 129, 0.25)';
                e.currentTarget.style.transform = 'translateY(-6px) scale(1.02)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.08)';
                e.currentTarget.style.transform = 'translateY(0) scale(1)';
              }}
            >
              {/* Gradient Top Bar */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '3px',
                background: 'linear-gradient(90deg, #10b981 0%, #059669 100%)'
              }} />

              <div style={{ padding: '1rem' }}>
                {/* Product Image */}
              <div style={{
                width: '100%',
                height: '180px',
                background: '#f3f4f6',
                borderRadius: '8px',
                marginBottom: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden'
              }}>
                {product.image ? (
                  <img
                    src={product.image}
                    alt={product.name}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      cursor: 'pointer',
                      imageRendering: 'high-quality',
                      WebkitBackfaceVisibility: 'hidden'
                    }}
                    onClick={() => handleProductClick(product)}
                  />
                ) : (
                  <span style={{ color: '#9ca3af', fontSize: '0.875rem' }}>No Image</span>
                )}
              </div>

              {/* Product Type Badge */}
              <div style={{
                display: 'inline-flex',
                background: product.type === 'Climber' ? '#dbeafe' : '#fef3c7',
                color: product.type === 'Climber' ? '#0369a1' : '#92400e',
                padding: '0.25rem 0.75rem',
                borderRadius: '20px',
                fontSize: '0.75rem',
                fontWeight: '600',
                marginBottom: '0.5rem',
                width: 'fit-content'
              }}>
                {product.type}
              </div>

              {/* Product Name */}
              <h4 style={{
                fontSize: '0.95rem',
                fontWeight: '600',
                color: '#1f2937',
                margin: '0.5rem 0',
                cursor: 'pointer',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
              onClick={() => handleProductClick(product)}>
                {product.name}
              </h4>

              {/* Price */}
              <p style={{
                fontSize: '1.25rem',
                fontWeight: 'bold',
                color: '#10b981',
                margin: '0.5rem 0'
              }}>
                ₹{product.price}
              </p>

              {/* Stock Status */}
              <p style={{
                fontSize: '0.8rem',
                color: product.available_stock > 5 ? '#059669' : '#dc2626',
                margin: '0.5rem 0',
                fontWeight: '500'
              }}>
                {product.available_stock > 5 ? '✓ In Stock' : 
                 product.available_stock > 0 ? '⚠ Low Stock' : 
                 '✗ Out of Stock'}
              </p>

              {/* Add to Cart Button */}
              <button
                onClick={() => onAddToCart(product._id, product.name)}
                style={{
                  background: product.available_stock > 0 
                    ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                    : '#d1d5db',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '0.625rem 1rem',
                  marginTop: 'auto',
                  cursor: product.available_stock > 0 ? 'pointer' : 'not-allowed',
                  fontSize: '0.875rem',
                  fontWeight: '700',
                  transition: 'all 0.3s ease',
                  opacity: product.available_stock > 0 ? 1 : 0.6,
                  boxShadow: product.available_stock > 0 ? '0 4px 12px rgba(16, 185, 129, 0.3)' : 'none',
                  textTransform: 'uppercase',
                  letterSpacing: '0.3px'
                }}
                disabled={product.available_stock <= 0}
                onMouseEnter={(e) => {
                  if (product.available_stock > 0) {
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 6px 16px rgba(16, 185, 129, 0.4)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (product.available_stock > 0) {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.3)';
                  }
                }}
              >
                Add to Cart
              </button>
            </div>
          </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && recommendations.length === 0 && !error && (
        <div style={{
          textAlign: 'center',
          padding: '2rem',
          color: '#6b7280'
        }}>
          <p>No recommendations available yet. Start exploring products to get personalized suggestions!</p>
        </div>
      )}

      {/* Refresh Button */}
      {!loading && (
        <div style={{ marginTop: '1rem', textAlign: 'center' }}>
          <button
            onClick={fetchRecommendations}
            style={{
              background: 'transparent',
              border: '1px solid #10b981',
              color: '#10b981',
              padding: '0.5rem 1.5rem',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.9rem',
              fontWeight: '600',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = '#f0fdf4';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'transparent';
            }}
          >
            Refresh Recommendations
          </button>
        </div>
      )}
    </div>
  );
}