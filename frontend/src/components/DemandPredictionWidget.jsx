import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, AlertCircle, Package, Zap } from 'lucide-react';
import { apiFetch } from '../services/api';

export default function DemandPredictionWidget() {
  const [summary, setSummary] = useState(null);
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedProduct, setExpandedProduct] = useState(null);

  useEffect(() => {
    fetchPredictions();
  }, []);

  const fetchPredictions = async () => {
    setLoading(true);
    setError('');
    try {
      // Fetch both summary and top predictions
      const [summaryRes, predictionsRes] = await Promise.all([
        apiFetch('/api/admin/demand-predictions/summary/dashboard'),
        apiFetch('/api/admin/demand-predictions?limit=5')
      ]);

      if (summaryRes.ok) {
        const data = await summaryRes.json();
        setSummary(data.summary);
      }

      if (predictionsRes.ok) {
        const data = await predictionsRes.json();
        setPredictions(data.predictions);
      } else {
        throw new Error('Failed to fetch predictions');
      }
    } catch (err) {
      console.error('Error fetching predictions:', err);
      setError(err.message || 'Failed to load demand predictions');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '2rem',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
        border: '1px solid #e5e7eb'
      }}>
        <div style={{ textAlign: 'center', color: '#9ca3af' }}>
          Loading predictions...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '2rem',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
        border: '1px solid #e5e7eb'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          color: '#991b1b',
          backgroundColor: '#fee2e2',
          padding: '1rem',
          borderRadius: '0.5rem'
        }}>
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  const getRecommendationColor = (recommendation) => {
    switch (recommendation) {
      case 'INCREASE': return '#10b981';
      case 'REDUCE': return '#ef4444';
      case 'MAINTAIN': return '#f59e0b';
      case 'MONITOR': return '#3b82f6';
      default: return '#6b7280';
    }
  };

  const getRecommendationBgColor = (recommendation) => {
    switch (recommendation) {
      case 'INCREASE': return '#d1fae5';
      case 'REDUCE': return '#fee2e2';
      case 'MAINTAIN': return '#fef3c7';
      case 'MONITOR': return '#dbeafe';
      default: return '#f3f4f6';
    }
  };

  const getTrendIcon = (trend) => {
    return trend === 'RISING' ? 
      <TrendingUp size={20} color="#10b981" /> : 
      trend === 'DECLINING' ? 
      <TrendingDown size={20} color="#ef4444" /> :
      <Package size={20} color="#f59e0b" />;
  };

  const containerStyle = {
    background: 'white',
    borderRadius: '12px',
    padding: '2rem',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
    border: '1px solid #e5e7eb'
  };

  return (
    <div>
      <div style={containerStyle}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#1f2937', margin: 0 }}>
            📊 Stock Demand Prediction
          </h2>
          <button
            onClick={fetchPredictions}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: '500'
            }}
          >
            Refresh
          </button>
        </div>

        {/* Summary Stats */}
        {summary && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem',
            marginBottom: '2rem'
          }}>
            {/* Critical Stocks */}
            <div style={{
              padding: '1.5rem',
              backgroundColor: '#fee2e2',
              borderRadius: '0.75rem',
              borderLeft: '4px solid #ef4444'
            }}>
              <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>
                Critical Stocks
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: '700', color: '#1f2937' }}>
                {summary.criticalStocks}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.5rem' }}>
                Products with ≤5 units
              </div>
            </div>

            {/* Increase Demand */}
            <div style={{
              padding: '1.5rem',
              backgroundColor: '#d1fae5',
              borderRadius: '0.75rem',
              borderLeft: '4px solid #10b981'
            }}>
              <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>
                Need Increase
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: '700', color: '#1f2937' }}>
                {summary.increaseDemand}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.5rem' }}>
                Rising trend products
              </div>
            </div>

            {/* Reduce Demand */}
            <div style={{
              padding: '1.5rem',
              backgroundColor: '#fef3c7',
              borderRadius: '0.75rem',
              borderLeft: '4px solid #f59e0b'
            }}>
              <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>
                Can Reduce
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: '700', color: '#1f2937' }}>
                {summary.reduceDemand}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.5rem' }}>
                Declining trend products
              </div>
            </div>

            {/* Total Products */}
            <div style={{
              padding: '1.5rem',
              backgroundColor: '#dbeafe',
              borderRadius: '0.75rem',
              borderLeft: '4px solid #3b82f6'
            }}>
              <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>
                Total Analyzed
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: '700', color: '#1f2937' }}>
                {summary.totalProducts}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.5rem' }}>
                Active products
              </div>
            </div>
          </div>
        )}

        {/* Trend Distribution */}
        {summary && (
          <div style={{
            padding: '1.5rem',
            backgroundColor: '#f9fafb',
            borderRadius: '0.75rem',
            marginBottom: '2rem'
          }}>
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem', fontWeight: '600', color: '#1f2937' }}>
              Sales Trends
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#10b981', marginBottom: '0.5rem' }}>
                  ↑ {summary.trends.rising}
                </div>
                <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Rising</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#f59e0b', marginBottom: '0.5rem' }}>
                  → {summary.trends.stable}
                </div>
                <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Stable</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#ef4444', marginBottom: '0.5rem' }}>
                  ↓ {summary.trends.declining}
                </div>
                <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Declining</div>
              </div>
            </div>
          </div>
        )}

        {/* Top Urgent Products */}
        <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1rem', fontWeight: '600', color: '#1f2937' }}>
          🔥 Top Priority Products
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {predictions.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#9ca3af' }}>
              No predictions available yet. Predictions appear once sales data is available.
            </div>
          ) : (
            predictions.map((pred, idx) => (
              <div
                key={pred.product._id}
                style={{
                  padding: '1.5rem',
                  backgroundColor: expandedProduct === pred.product._id ? '#f0fdf4' : '#f9fafb',
                  border: `1px solid ${expandedProduct === pred.product._id ? '#10b981' : '#e5e7eb'}`,
                  borderRadius: '0.75rem',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onClick={() => setExpandedProduct(expandedProduct === pred.product._id ? null : pred.product._id)}
              >
                {/* Product Header */}
                <div style={{ display: 'flex', alignItems: 'start', gap: '1rem', marginBottom: '1rem' }}>
                  {/* Rank Badge */}
                  <div style={{
                    width: '2.5rem',
                    height: '2.5rem',
                    backgroundColor: '#10b981',
                    color: 'white',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 'bold',
                    flexShrink: 0
                  }}>
                    {idx + 1}
                  </div>

                  {/* Product Info */}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '1rem', fontWeight: '600', color: '#1f2937' }}>
                      {pred.product.name}
                    </div>
                    <div style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.25rem' }}>
                      {pred.product.type} • Current Stock: {pred.currentStock}
                    </div>
                  </div>

                  {/* Recommendation Badge */}
                  <div style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: getRecommendationBgColor(pred.prediction.recommendation),
                    color: getRecommendationColor(pred.prediction.recommendation),
                    borderRadius: '0.5rem',
                    fontWeight: '600',
                    fontSize: '0.875rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <Zap size={16} />
                    {pred.prediction.recommendation}
                  </div>
                </div>

                {/* Quick Stats */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                  gap: '1rem',
                  marginBottom: '1rem'
                }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}>
                      Recent Avg Sales
                    </div>
                    <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#1f2937' }}>
                      {pred.salesMetrics.recentAverageMonthlySales}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}>
                      Trend
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.25rem', fontWeight: '700' }}>
                      {getTrendIcon(pred.salesMetrics.trend)}
                      {pred.salesMetrics.trend}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}>
                      Confidence
                    </div>
                    <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#10b981' }}>
                      {pred.prediction.confidence}%
                    </div>
                  </div>
                </div>

                {/* Adjustment Recommendation */}
                <div style={{
                  padding: '1rem',
                  backgroundColor: getRecommendationBgColor(pred.prediction.recommendation),
                  borderRadius: '0.5rem',
                  marginBottom: expandedProduct === pred.product._id ? '1rem' : 0
                }}>
                  <div style={{ fontSize: '0.875rem', fontWeight: '600', color: '#1f2937', marginBottom: '0.5rem' }}>
                    Stock Adjustment
                  </div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}>
                        Current → Suggested
                      </div>
                      <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#1f2937' }}>
                        {pred.currentStock} → {pred.prediction.suggestedStock}
                      </div>
                    </div>
                    <div style={{
                      fontSize: '1.75rem',
                      fontWeight: '700',
                      color: getRecommendationColor(pred.prediction.recommendation)
                    }}>
                      {pred.prediction.adjustmentPercentage > 0 ? '+' : ''}{pred.prediction.adjustmentPercentage}%
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {expandedProduct === pred.product._id && (
                  <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #e5e7eb' }}>
                    <div style={{ fontSize: '0.875rem', color: '#1f2937', lineHeight: '1.6' }}>
                      <strong>Prediction:</strong> {pred.prediction.reason}
                    </div>
                    <div style={{
                      marginTop: '1rem',
                      padding: '1rem',
                      backgroundColor: 'white',
                      borderRadius: '0.5rem',
                      fontSize: '0.875rem'
                    }}>
                      <div style={{ fontWeight: '600', marginBottom: '0.5rem' }}>Sales History</div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                        {pred.salesMetrics.salesHistory.map((history, i) => (
                          <div key={i} style={{ textAlign: 'center', padding: '0.5rem', backgroundColor: '#f9fafb', borderRadius: '0.25rem' }}>
                            <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>{history.month}</div>
                            <div style={{ fontWeight: '600', color: '#1f2937' }}>{history.sales}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}