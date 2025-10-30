import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertCircle, TrendingUp, Users, Package, DollarSign,
  RefreshCw, Search, Download, Filter, ArrowLeft, BarChart3,
  Activity, Clock, CheckCircle, TrendingDown
} from 'lucide-react';
import { auth } from '../config/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import authService from '../services/authService';
import { apiFetch } from '../services/api';
import AdminSidebar from '../components/AdminSidebar';
import './AdminCancellationSVMDashboard.css';

// Simple Chart Component (using canvas)
const LineChart = ({ data, label }) => {
  const canvasRef = React.useRef(null);

  useEffect(() => {
    if (!canvasRef.current || !data || data.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, width, height);

    // Get max value
    const maxValue = Math.max(...data.map(d => d.value), 1);
    const padding = 40;
    const graphWidth = width - 2 * padding;
    const graphHeight = height - 2 * padding;

    // Draw grid
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
      const y = padding + (i * graphHeight) / 5;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();
    }

    // Draw axes
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, height - padding);
    ctx.lineTo(width - padding, height - padding);
    ctx.stroke();

    // Draw line
    if (data.length > 0) {
      ctx.strokeStyle = '#ff6b6b';
      ctx.lineWidth = 2;
      ctx.beginPath();

      data.forEach((point, index) => {
        const x = padding + (index / (data.length - 1 || 1)) * graphWidth;
        const y = height - padding - (point.value / maxValue) * graphHeight;
        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      ctx.stroke();

      // Draw points
      ctx.fillStyle = '#ff6b6b';
      data.forEach((point, index) => {
        const x = padding + (index / (data.length - 1 || 1)) * graphWidth;
        const y = height - padding - (point.value / maxValue) * graphHeight;
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, 2 * Math.PI);
        ctx.fill();
      });
    }

    // Draw labels
    ctx.fillStyle = '#666';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    data.forEach((point, index) => {
      const x = padding + (index / (data.length - 1 || 1)) * graphWidth;
      ctx.fillText(point.label.slice(5), x, height - padding + 20);
    });
  }, [data]);

  return <canvas ref={canvasRef} width={500} height={300} className="chart-canvas" />;
};

// Bar Chart Component
const BarChart = ({ data, label }) => {
  const canvasRef = React.useRef(null);

  useEffect(() => {
    if (!canvasRef.current || !data || data.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // Clear
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, width, height);

    const padding = 40;
    const barWidth = (width - 2 * padding) / data.length * 0.7;
    const maxValue = Math.max(...data.map(d => d.value), 1);
    const graphHeight = height - 2 * padding;

    // Draw bars
    data.forEach((item, index) => {
      const x = padding + (index * (width - 2 * padding)) / data.length + 10;
      const barHeight = (item.value / maxValue) * graphHeight;
      const y = height - padding - barHeight;

      // Bar
      ctx.fillStyle = item.color || '#ff6b6b';
      ctx.fillRect(x, y, barWidth, barHeight);

      // Value label
      ctx.fillStyle = '#333';
      ctx.font = 'bold 14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(Math.round(item.value), x + barWidth / 2, y - 5);

      // X-axis label
      ctx.fillStyle = '#666';
      ctx.font = '12px Arial';
      ctx.fillText(item.label, x + barWidth / 2, height - 15);
    });

    // Draw axes
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, height - padding);
    ctx.lineTo(width - padding, height - padding);
    ctx.stroke();
  }, [data]);

  return <canvas ref={canvasRef} width={400} height={300} className="chart-canvas" />;
};

const AdminCancellationSVMDashboard = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [predicting, setPredicting] = useState(false);
  const [error, setError] = useState('');
  const [analytics, setAnalytics] = useState(null);
  const [paymentAnalysis, setPaymentAnalysis] = useState(null);
  const [activeTab, setActiveTab] = useState('overview'); // overview, trends, payment
  const navigate = useNavigate();

  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    if (!currentUser) {
      window.location.href = '/login';
      return;
    }
    if (currentUser.role !== 'admin') {
      navigate('/dashboard');
      return;
    }
    setUser(currentUser);
    loadAnalytics();
  }, [navigate]);

  const loadAnalytics = async () => {
    try {
      setPredicting(true);
      setError('');

      // Fetch analytics
      const response = await apiFetch('/api/cancellation/analytics?limit=200', {
        method: 'GET'
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to fetch analytics');
        return;
      }

      setAnalytics(data.data);

      // Fetch payment analysis
      const payRes = await apiFetch('/api/cancellation/payment-analysis', {
        method: 'GET'
      });
      const payData = await payRes.json();
      if (payRes.ok) {
        setPaymentAnalysis(payData.data);
      }
    } catch (err) {
      console.error('Error loading analytics:', err);
      setError('Failed to load analytics');
    } finally {
      setPredicting(false);
      setLoading(false);
    }
  };

  const downloadReport = () => {
    if (!analytics || !analytics.predictions) return;

    const csvContent = [
      ['Order ID', 'Customer', 'Amount', 'Payment Method', 'Risk Level', 'Risk Score', 'Probability', 'Date'],
      ...analytics.predictions.map(pred => [
        pred.orderId,
        pred.customerName,
        pred.amount,
        pred.paymentMethod,
        pred.risk_level,
        pred.risk_score,
        (pred.probability * 100).toFixed(1),
        new Date(pred.createdAt).toLocaleDateString()
      ])
    ];

    const csv = csvContent.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `svm-cancellation-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (!user) {
    return (
      <div className="dashboard-loading">
        <div className="spinner"></div>
      </div>
    );
  }

  const stats = analytics?.stats || {};
  const trends = analytics?.trends || [];
  const topRiskOrders = stats.topRiskOrders || [];

  // Prepare chart data
  const trendChartData = trends.map(t => ({
    label: t.date,
    value: t.HIGH || 0
  }));

  const riskDistributionData = [
    {
      label: 'HIGH',
      value: stats.highRiskCount || 0,
      color: '#ff6b6b'
    },
    {
      label: 'MEDIUM',
      value: stats.mediumRiskCount || 0,
      color: '#ffd93d'
    },
    {
      label: 'LOW',
      value: stats.lowRiskCount || 0,
      color: '#6bcf7f'
    }
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <AdminSidebar />
      <div className="svm-dashboard-container">
        {/* Header */}
        <div className="svm-header">
          <div className="header-top">
            <div>
              <h1>
                <BarChart3 size={32} />
                SVM Cancellation Risk Analytics
              </h1>
              <p>Real-time machine learning predictions using Support Vector Machine</p>
            </div>
            <button onClick={() => navigate('/admin/orders')} className="back-btn">
              <ArrowLeft size={20} /> Back
            </button>
          </div>

          <div className="header-controls">
            <button
              onClick={loadAnalytics}
              disabled={predicting}
              className="btn-refresh"
            >
              <RefreshCw size={18} className={predicting ? 'spinning' : ''} />
              {predicting ? 'Analyzing...' : 'Refresh Analytics'}
            </button>
            <button onClick={downloadReport} className="btn-download">
              <Download size={18} />
              Export CSV
            </button>
          </div>
        </div>

        {error && (
          <div className="error-alert">
            <AlertCircle size={20} />
            {error}
          </div>
        )}

        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading SVM analytics...</p>
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="summary-cards-grid">
              <div className="summary-card">
                <div className="card-header">
                  <Package size={24} />
                  <span>Total Orders</span>
                </div>
                <div className="card-value">{stats.totalOrders || 0}</div>
              </div>

              <div className="summary-card high-risk-card">
                <div className="card-header">
                  <AlertCircle size={24} />
                  <span>High Risk</span>
                </div>
                <div className="card-value">{stats.highRiskCount || 0}</div>
                <div className="card-meta">
                  {stats.totalOrders > 0
                    ? Math.round((stats.highRiskCount / stats.totalOrders) * 100)
                    : 0}
                  % of orders
                </div>
              </div>

              <div className="summary-card medium-risk-card">
                <div className="card-header">
                  <Clock size={24} />
                  <span>Medium Risk</span>
                </div>
                <div className="card-value">{stats.mediumRiskCount || 0}</div>
              </div>

              <div className="summary-card low-risk-card">
                <div className="card-header">
                  <CheckCircle size={24} />
                  <span>Low Risk</span>
                </div>
                <div className="card-value">{stats.lowRiskCount || 0}</div>
              </div>

              <div className="summary-card">
                <div className="card-header">
                  <TrendingUp size={24} />
                  <span>Avg Risk Score</span>
                </div>
                <div className="card-value">{stats.averageRiskScore || 0}/100</div>
              </div>

              <div className="summary-card revenue-card">
                <div className="card-header">
                  <DollarSign size={24} />
                  <span>Revenue at Risk</span>
                </div>
                <div className="card-value">₹{(stats.totalRevenueAtRisk / 1000).toFixed(1)}K</div>
              </div>
            </div>

            {/* Tabs */}
            <div className="tabs-container">
              <button
                className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
                onClick={() => setActiveTab('overview')}
              >
                <Activity size={18} /> Overview
              </button>
              <button
                className={`tab ${activeTab === 'trends' ? 'active' : ''}`}
                onClick={() => setActiveTab('trends')}
              >
                <TrendingDown size={18} /> Trends
              </button>
              <button
                className={`tab ${activeTab === 'payment' ? 'active' : ''}`}
                onClick={() => setActiveTab('payment')}
              >
                <DollarSign size={18} /> Payment Analysis
              </button>
            </div>

            {/* Content */}
            {activeTab === 'overview' && (
              <div className="tab-content">
                {/* Risk Distribution Chart */}
                <div className="chart-section">
                  <h3>Risk Level Distribution</h3>
                  <div className="chart-wrapper">
                    <BarChart data={riskDistributionData} label="Orders by Risk Level" />
                  </div>
                </div>

                {/* Top Risk Orders */}
                <div className="section">
                  <h3>Top 10 High-Risk Orders</h3>
                  {topRiskOrders && topRiskOrders.length > 0 ? (
                    <div className="table-wrapper">
                      <table className="orders-table">
                        <thead>
                          <tr>
                            <th>Order ID</th>
                            <th>Customer</th>
                            <th>Amount</th>
                            <th>Payment</th>
                            <th>Risk Score</th>
                            <th>Risk Level</th>
                            <th>Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {topRiskOrders.map(order => (
                            <tr key={order.orderId}>
                              <td className="order-id">{order.orderId.slice(-8)}</td>
                              <td>{order.customerName}</td>
                              <td>₹{order.amount}</td>
                              <td>{order.paymentMethod}</td>
                              <td>
                                <span className="risk-score">{order.risk_score.toFixed(1)}/100</span>
                              </td>
                              <td>
                                <span className={`risk-badge risk-${order.risk_level.toLowerCase()}`}>
                                  {order.risk_level}
                                </span>
                              </td>
                              <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="empty-message">No orders to display</p>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'trends' && (
              <div className="tab-content">
                <div className="chart-section">
                  <h3>High-Risk Orders Trend (Last 30 Days)</h3>
                  <div className="chart-wrapper">
                    {trendChartData.length > 0 ? (
                      <LineChart data={trendChartData} label="High-Risk Orders" />
                    ) : (
                      <p className="empty-message">No trend data available</p>
                    )}
                  </div>
                </div>

                {/* Daily breakdown */}
                <div className="section">
                  <h3>Daily Risk Breakdown</h3>
                  {trends && trends.length > 0 ? (
                    <div className="table-wrapper">
                      <table className="trends-table">
                        <thead>
                          <tr>
                            <th>Date</th>
                            <th>High Risk</th>
                            <th>Medium Risk</th>
                            <th>Low Risk</th>
                            <th>Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {trends.map(trend => (
                            <tr key={trend.date}>
                              <td>{new Date(trend.date).toLocaleDateString()}</td>
                              <td className="high">
                                <strong>{trend.HIGH || 0}</strong>
                              </td>
                              <td className="medium">
                                <strong>{trend.MEDIUM || 0}</strong>
                              </td>
                              <td className="low">
                                <strong>{trend.LOW || 0}</strong>
                              </td>
                              <td>{trend.total || 0}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="empty-message">No trend data available</p>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'payment' && (
              <div className="tab-content">
                {paymentAnalysis ? (
                  <div className="payment-analysis">
                    {Object.entries(paymentAnalysis).map(([method, data]) => (
                      <div key={method} className="payment-card">
                        <h4>{method || 'Unknown'}</h4>
                        <div className="payment-stats">
                          <div className="stat">
                            <span>Total Orders</span>
                            <strong>{data.total || 0}</strong>
                          </div>
                          <div className="stat">
                            <span>Avg Risk Score</span>
                            <strong>{data.averageRiskScore || 0}/100</strong>
                          </div>
                          <div className="stat">
                            <span>High Risk %</span>
                            <strong>{data.highRiskPercentage || 0}%</strong>
                          </div>
                          <div className="stat">
                            <span>Total Revenue</span>
                            <strong>₹{(data.totalRevenue / 1000).toFixed(1)}K</strong>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="empty-message">No payment analysis available</p>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AdminCancellationSVMDashboard;