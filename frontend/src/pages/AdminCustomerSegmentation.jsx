import { useEffect, useMemo, useState } from 'react';
import { Search, Loader2, AlertTriangle, ChevronLeft, ChevronRight, TrendingUp, Users, Target, Zap } from 'lucide-react';
import userService from '../services/userService';

export default function AdminCustomerSegmentation() {
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [loading, setLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(true);
  const [error, setError] = useState('');

  const [customers, setCustomers] = useState([]);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState({
    totalCustomers: 0,
    segments: {
      new: { count: 0, percentage: 0, avg_confidence: 0 },
      regular: { count: 0, percentage: 0, avg_confidence: 0 },
      loyal: { count: 0, percentage: 0, avg_confidence: 0 },
      inactive: { count: 0, percentage: 0, avg_confidence: 0 }
    }
  });

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / limit)), [total, limit]);

  const fetchCustomerSegments = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await userService.getCustomerSegments({ query, page, limit });
      setCustomers(res.customers || []);
      setTotal(res.total || 0);
    } catch (e) {
      setError(e.message || 'Failed to load customer segments');
    } finally {
      setLoading(false);
    }
  };

  const fetchSegmentationStats = async () => {
    setStatsLoading(true);
    try {
      const res = await userService.getSegmentationStats();
      setStats(res);
    } catch (e) {
      console.error('Failed to fetch stats:', e);
    } finally {
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    fetchSegmentationStats();
  }, []);

  useEffect(() => {
    fetchCustomerSegments();
  }, [page, limit]);

  const onSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchCustomerSegments();
  };

  const getSegmentColor = (segment) => {
    const colors = {
      'New': '#3b82f6',
      'Regular': '#10b981',
      'Loyal': '#f59e0b',
      'Inactive': '#ef4444'
    };
    return colors[segment] || '#6b7280';
  };

  const getSegmentBgColor = (segment) => {
    const colors = {
      'New': '#dbeafe',
      'Regular': '#d1fae5',
      'Loyal': '#fef3c7',
      'Inactive': '#fee2e2'
    };
    return colors[segment] || '#f3f4f6';
  };

  const cardStyle = {
    background: 'white',
    borderRadius: '12px',
    padding: '1rem',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
    border: '1px solid #e5e7eb'
  };

  const statCard = (title, value, percentage, icon, bgColor) => (
    <div style={{
      background: 'white',
      borderRadius: '12px',
      padding: '1.5rem',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
      border: '1px solid #e5e7eb',
      flex: 1,
      minWidth: 200
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
        <div>
          <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>{title}</div>
          <div style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#111827' }}>{value}</div>
        </div>
        <div style={{ padding: '0.75rem', background: bgColor, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {icon}
        </div>
      </div>
      {percentage !== undefined && (
        <div style={{ fontSize: '0.875rem', color: '#10b981' }}>{percentage.toFixed(1)}% of customers</div>
      )}
    </div>
  );

  const header = (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
      <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#111827' }}>Customer Segmentation</h2>
      <form onSubmit={onSearch} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '0.5rem 0.75rem' }}>
          <Search size={18} color="#6b7280" />
          <input
            placeholder="Search name, email"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ border: 'none', outline: 'none', background: 'transparent', marginLeft: '0.5rem' }}
          />
        </div>
        <button type="submit" style={{ padding: '0.6rem 0.9rem', background: '#10b981', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Search</button>
      </form>
    </div>
  );

  const statsSection = (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
      {statsLoading ? (
        <div style={{ gridColumn: '1 / -1', textAlign: 'center', color: '#6b7280' }}>
          <Loader2 className="spin" size={18} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} /> Loading stats...
        </div>
      ) : (
        <>
          {statCard('New Customers', stats.segments?.new?.count || 0, stats.segments?.new?.percentage, <TrendingUp size={24} color="#3b82f6" />, '#dbeafe')}
          {statCard('Regular Customers', stats.segments?.regular?.count || 0, stats.segments?.regular?.percentage, <Users size={24} color="#10b981" />, '#d1fae5')}
          {statCard('Loyal Customers', stats.segments?.loyal?.count || 0, stats.segments?.loyal?.percentage, <Target size={24} color="#f59e0b" />, '#fef3c7')}
          {statCard('Inactive Customers', stats.segments?.inactive?.count || 0, stats.segments?.inactive?.percentage, <Zap size={24} color="#ef4444" />, '#fee2e2')}
        </>
      )}
    </div>
  );

  const table = (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
        <thead>
          <tr style={{ background: '#f3f4f6' }}>
            <th style={{ textAlign: 'left', padding: '0.75rem', borderBottom: '1px solid #e5e7eb' }}>Customer</th>
            <th style={{ textAlign: 'left', padding: '0.75rem', borderBottom: '1px solid #e5e7eb' }}>Email</th>
            <th style={{ textAlign: 'center', padding: '0.75rem', borderBottom: '1px solid #e5e7eb' }}>Segment</th>
            <th style={{ textAlign: 'center', padding: '0.75rem', borderBottom: '1px solid #e5e7eb' }}>Confidence</th>
            <th style={{ textAlign: 'center', padding: '0.75rem', borderBottom: '1px solid #e5e7eb' }}>Orders</th>
            <th style={{ textAlign: 'center', padding: '0.75rem', borderBottom: '1px solid #e5e7eb' }}>Total Spend</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
                <Loader2 className="spin" size={18} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} /> Loading customers...
              </td>
            </tr>
          ) : customers.length === 0 ? (
            <tr>
              <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>No customers found</td>
            </tr>
          ) : (
            customers.map((c) => (
              <tr key={c._id}>
                <td style={{ padding: '0.75rem', borderBottom: '1px solid #f3f4f6' }}>
                  <div style={{ fontWeight: 600, color: '#111827' }}>{c.firstName} {c.lastName}</div>
                </td>
                <td style={{ padding: '0.75rem', borderBottom: '1px solid #f3f4f6', color: '#6b7280' }}>
                  {c.email}
                </td>
                <td style={{ padding: '0.75rem', borderBottom: '1px solid #f3f4f6', textAlign: 'center' }}>
                  <span style={{
                    background: getSegmentBgColor(c.segment),
                    color: getSegmentColor(c.segment),
                    padding: '0.375rem 0.75rem',
                    borderRadius: '6px',
                    fontSize: '0.875rem',
                    fontWeight: 600
                  }}>
                    {c.segment}
                  </span>
                </td>
                <td style={{ padding: '0.75rem', borderBottom: '1px solid #f3f4f6', textAlign: 'center', color: '#374151' }}>
                  {(c.confidence * 100).toFixed(1)}%
                </td>
                <td style={{ padding: '0.75rem', borderBottom: '1px solid #f3f4f6', textAlign: 'center', color: '#374151' }}>
                  {c.metrics?.order_count || 0}
                </td>
                <td style={{ padding: '0.75rem', borderBottom: '1px solid #f3f4f6', textAlign: 'center', color: '#374151' }}>
                  ₹{(c.metrics?.total_spend || 0).toFixed(2)}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );

  const pagination = (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.75rem' }}>
      <div style={{ color: '#6b7280', fontSize: 14 }}>Page {page} of {totalPages} • {total} customers</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))} style={{ padding: '0.4rem 0.6rem', background: 'white', border: '1px solid #e5e7eb', borderRadius: 6, cursor: 'pointer' }}>
          <ChevronLeft size={16} />
        </button>
        <button disabled={page >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))} style={{ padding: '0.4rem 0.6rem', background: 'white', border: '1px solid #e5e7eb', borderRadius: 6, cursor: 'pointer' }}>
          <ChevronRight size={16} />
        </button>
        <select value={limit} onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }} style={{ padding: '0.4rem 0.6rem', border: '1px solid #e5e7eb', borderRadius: 6 }}>
          <option value={10}>10</option>
          <option value={20}>20</option>
          <option value={50}>50</option>
        </select>
      </div>
    </div>
  );

  const errorBanner = error ? (
    <div style={{ marginBottom: '0.75rem', padding: '0.6rem 0.8rem', borderRadius: 8, background: '#fef2f2', border: '1px solid #fecaca', color: '#7f1d1d', display: 'flex', alignItems: 'center', gap: 8 }}>
      <AlertTriangle size={16} /> {error}
    </div>
  ) : null;

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', padding: '2rem' }}>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        {errorBanner}
        {statsSection}
        <div style={cardStyle}>
          {header}
          {table}
          {pagination}
        </div>
      </div>

      <style>{`
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
