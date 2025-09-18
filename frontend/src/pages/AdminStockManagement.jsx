import { useEffect, useState } from 'react';
import { Search, Package2, TrendingUp, AlertTriangle, RotateCcw, Eye, Plus, Filter, RefreshCw, Loader2, BarChart3 } from 'lucide-react';
import productService from '../services/productService';

// CSS for animations
const animationStyles = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  .spin { animation: spin 1s linear infinite; }
  
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .fade-in { animation: fadeIn 0.3s ease-out; }
  
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.7; }
  }
  .pulse { animation: pulse 1.5s ease-in-out infinite; }
`;

// Inject styles if not already present
if (!document.head.querySelector('[data-stock-styles]')) {
  const style = document.createElement('style');
  style.setAttribute('data-stock-styles', 'true');
  style.textContent = animationStyles;
  document.head.appendChild(style);
}

export default function AdminStockManagement() {
  const [stockData, setStockData] = useState({
    products: [],
    summary: {
      total: 0,
      inStock: 0,
      lowStock: 0,
      outOfStock: 0,
      totalValue: 0,
      totalInventoryItems: 0
    }
  });
  
  const [filters, setFilters] = useState({
    search: '',
    status: '', // '', 'in stock', 'low stock', 'out of stock'
    type: '', // '', 'Bush', 'Climber'
    sortBy: 'name', // 'name', 'available_stock', 'total_stock', 'price'
    sortOrder: 'asc' // 'asc', 'desc'
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [restockModal, setRestockModal] = useState(null); // {product, quantity, reason}
  const [lowStockAlerts, setLowStockAlerts] = useState([]);
  const [pendingActions, setPendingActions] = useState({}); // {productId: 'restock'|'refresh'}

  useEffect(() => {
    fetchStockData();
    fetchLowStockAlerts();
  }, [filters]);

  const fetchStockData = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await productService.getStockOverview(filters);
      if (response.success) {
        setStockData(response);
      } else {
        throw new Error(response.message || 'Failed to fetch stock data');
      }
    } catch (err) {
      setError(err.message || 'Failed to load stock information');
    } finally {
      setLoading(false);
    }
  };

  const fetchLowStockAlerts = async () => {
    try {
      const response = await productService.getLowStockAlerts(5);
      if (response.success) {
        setLowStockAlerts(response.alerts || []);
      }
    } catch (err) {
      console.warn('Failed to fetch low stock alerts:', err);
    }
  };

  const handleRestock = async (productId, quantity, reason) => {
    setPendingActions(prev => ({ ...prev, [productId]: 'restock' }));
    try {
      const response = await productService.restockProduct(productId, quantity, reason);
      if (response.success) {
        setRestockModal(null);
        await fetchStockData();
        await fetchLowStockAlerts();
        alert(`Successfully restocked: ${response.message}`);
      } else {
        throw new Error(response.message || 'Restock failed');
      }
    } catch (err) {
      alert(`Restock failed: ${err.message}`);
    } finally {
      setPendingActions(prev => ({ ...prev, [productId]: undefined }));
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'in stock': return { bg: '#ecfdf5', color: '#065f46', border: '#a7f3d0' };
      case 'low stock': return { bg: '#fffbeb', color: '#92400e', border: '#fcd34d' };
      case 'out of stock': return { bg: '#fef2f2', color: '#991b1b', border: '#fecaca' };
      default: return { bg: '#f9fafb', color: '#6b7280', border: '#e5e7eb' };
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

  // Stock Overview Cards
  const StockOverviewCards = () => (
    <div className="fade-in" style={{ 
      display: 'grid', 
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
      gap: '1rem', 
      marginBottom: '2rem' 
    }}>
      <div style={{
        ...cardStyle,
        background: 'linear-gradient(135deg, #10b981, #059669)',
        color: 'white',
        textAlign: 'center',
        cursor: 'pointer'
      }} onClick={() => setFilters(prev => ({ ...prev, status: 'in stock' }))}>
        <Package2 size={32} style={{ marginBottom: '0.5rem' }} />
        <h3 style={{ fontSize: '2rem', fontWeight: 'bold', margin: '0.5rem 0' }}>
          {stockData.summary.inStock}
        </h3>
        <p style={{ opacity: 0.9 }}>In Stock</p>
      </div>

      <div style={{
        ...cardStyle,
        background: 'linear-gradient(135deg, #f59e0b, #d97706)',
        color: 'white',
        textAlign: 'center',
        cursor: 'pointer'
      }} onClick={() => setFilters(prev => ({ ...prev, status: 'low stock' }))}>
        <AlertTriangle size={32} style={{ marginBottom: '0.5rem' }} />
        <h3 style={{ fontSize: '2rem', fontWeight: 'bold', margin: '0.5rem 0' }}>
          {stockData.summary.lowStock}
        </h3>
        <p style={{ opacity: 0.9 }}>Low Stock</p>
      </div>

      <div style={{
        ...cardStyle,
        background: 'linear-gradient(135deg, #ef4444, #dc2626)',
        color: 'white',
        textAlign: 'center',
        cursor: 'pointer'
      }} onClick={() => setFilters(prev => ({ ...prev, status: 'out of stock' }))}>
        <AlertTriangle size={32} style={{ marginBottom: '0.5rem' }} />
        <h3 style={{ fontSize: '2rem', fontWeight: 'bold', margin: '0.5rem 0' }}>
          {stockData.summary.outOfStock}
        </h3>
        <p style={{ opacity: 0.9 }}>Out of Stock</p>
      </div>

      <div style={{
        ...cardStyle,
        background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
        color: 'white',
        textAlign: 'center'
      }}>
        <BarChart3 size={32} style={{ marginBottom: '0.5rem' }} />
        <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: '0.5rem 0' }}>
          ₹{stockData.summary.totalValue?.toLocaleString() || 0}
        </h3>
        <p style={{ opacity: 0.9 }}>Total Inventory Value</p>
      </div>
    </div>
  );

  // Filters and Search Bar
  const FiltersBar = () => (
    <div className="fade-in" style={{ 
      ...cardStyle, 
      marginBottom: '1rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '1rem'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Filter size={20} /> Filters & Search
        </h3>
        <button
          onClick={() => setFilters({ search: '', status: '', type: '', sortBy: 'name', sortOrder: 'asc' })}
          style={{
            padding: '0.5rem 1rem',
            background: '#f3f4f6',
            border: '1px solid #d1d5db',
            borderRadius: '8px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <RefreshCw size={16} /> Clear Filters
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        <div style={{ position: 'relative' }}>
          <Search size={18} style={{ 
            position: 'absolute', 
            left: '12px', 
            top: '50%', 
            transform: 'translateY(-50%)', 
            color: '#6b7280' 
          }} />
          <input
            type="text"
            placeholder="Search products..."
            value={filters.search}
            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            style={{
              width: '100%',
              padding: '0.75rem 0.75rem 0.75rem 2.5rem',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              fontSize: '14px'
            }}
          />
        </div>

        <select
          value={filters.status}
          onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
          style={{
            padding: '0.75rem',
            border: '1px solid #d1d5db',
            borderRadius: '8px',
            fontSize: '14px'
          }}
        >
          <option value="">All Status</option>
          <option value="in stock">In Stock</option>
          <option value="low stock">Low Stock</option>
          <option value="out of stock">Out of Stock</option>
        </select>

        <select
          value={filters.type}
          onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
          style={{
            padding: '0.75rem',
            border: '1px solid #d1d5db',
            borderRadius: '8px',
            fontSize: '14px'
          }}
        >
          <option value="">All Types</option>
          <option value="Bush">Bush</option>
          <option value="Climber">Climber</option>
        </select>

        <select
          value={`${filters.sortBy}-${filters.sortOrder}`}
          onChange={(e) => {
            const [sortBy, sortOrder] = e.target.value.split('-');
            setFilters(prev => ({ ...prev, sortBy, sortOrder }));
          }}
          style={{
            padding: '0.75rem',
            border: '1px solid #d1d5db',
            borderRadius: '8px',
            fontSize: '14px'
          }}
        >
          <option value="name-asc">Name A-Z</option>
          <option value="name-desc">Name Z-A</option>
          <option value="available_stock-desc">Stock High-Low</option>
          <option value="available_stock-asc">Stock Low-High</option>
          <option value="price-desc">Price High-Low</option>
          <option value="price-asc">Price Low-High</option>
        </select>
      </div>
    </div>
  );

  // Low Stock Alerts
  const LowStockAlerts = () => (
    lowStockAlerts.length > 0 && (
      <div className="fade-in pulse" style={{ 
        ...cardStyle,
        background: '#fef2f2',
        border: '1px solid #fecaca',
        marginBottom: '1rem'
      }}>
        <h3 style={{ 
          margin: '0 0 1rem 0', 
          color: '#991b1b',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <AlertTriangle size={20} /> Urgent: Low Stock Alerts
        </h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {lowStockAlerts.slice(0, 5).map(product => (
            <span key={product._id} style={{
              padding: '0.25rem 0.75rem',
              background: '#fee2e2',
              color: '#991b1b',
              borderRadius: '20px',
              fontSize: '0.875rem',
              border: '1px solid #fecaca'
            }}>
              {product.name} ({product.available_stock} left)
            </span>
          ))}
          {lowStockAlerts.length > 5 && (
            <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>
              +{lowStockAlerts.length - 5} more...
            </span>
          )}
        </div>
      </div>
    )
  );

  // Stock Table
  const StockTable = () => (
    <div className="fade-in" style={cardStyle}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Package2 size={20} /> Stock Inventory
        </h3>
        <button
          onClick={fetchStockData}
          disabled={loading}
          style={{
            padding: '0.5rem 1rem',
            background: '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          {loading ? <Loader2 className="spin" size={16} /> : <RefreshCw size={16} />}
          Refresh
        </button>
      </div>

      {error && (
        <div style={{
          padding: '1rem',
          background: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '8px',
          color: '#991b1b',
          marginBottom: '1rem'
        }}>
          {error}
        </div>
      )}

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
              <th style={{ textAlign: 'left', padding: '1rem', fontWeight: '600' }}>Product</th>
              <th style={{ textAlign: 'left', padding: '1rem', fontWeight: '600' }}>Type</th>
              <th style={{ textAlign: 'left', padding: '1rem', fontWeight: '600' }}>Status</th>
              <th style={{ textAlign: 'left', padding: '1rem', fontWeight: '600' }}>Available</th>
              <th style={{ textAlign: 'left', padding: '1rem', fontWeight: '600' }}>Total Stock</th>
              <th style={{ textAlign: 'left', padding: '1rem', fontWeight: '600' }}>Sold</th>
              <th style={{ textAlign: 'left', padding: '1rem', fontWeight: '600' }}>Price</th>
              <th style={{ textAlign: 'left', padding: '1rem', fontWeight: '600' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
                  <Loader2 className="spin" size={18} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
                  Loading stock data...
                </td>
              </tr>
            ) : stockData.products.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
                  No products found matching your criteria
                </td>
              </tr>
            ) : (
              stockData.products.map((product) => {
                const statusStyle = getStatusColor(product.status);
                return (
                  <tr key={product._id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        {product.image ? (
                          <img 
                            src={product.image} 
                            alt={product.name}
                            style={{ 
                              width: '40px', 
                              height: '40px', 
                              borderRadius: '8px', 
                              objectFit: 'cover',
                              border: '1px solid #e5e7eb'
                            }} 
                          />
                        ) : (
                          <div style={{ 
                            width: '40px', 
                            height: '40px', 
                            borderRadius: '8px', 
                            background: '#f3f4f6',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            <Package2 size={20} color="#6b7280" />
                          </div>
                        )}
                        <div>
                          <div style={{ fontWeight: '600', color: '#111827' }}>{product.name}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{
                        padding: '0.25rem 0.75rem',
                        borderRadius: '12px',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        color: product.type === 'Bush' ? '#7f1d1d' : '#155e75',
                        background: product.type === 'Bush' ? '#fee2e2' : '#ecfeff',
                        border: '1px solid',
                        borderColor: product.type === 'Bush' ? '#fecaca' : '#a5f3fc'
                      }}>
                        {product.type || 'Bush'}
                      </span>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{
                        padding: '0.25rem 0.75rem',
                        borderRadius: '12px',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        color: statusStyle.color,
                        background: statusStyle.bg,
                        border: `1px solid ${statusStyle.border}`
                      }}>
                        {product.status}
                      </span>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{ 
                        fontWeight: '600',
                        color: product.available_stock > 5 ? '#059669' : product.available_stock > 0 ? '#d97706' : '#dc2626'
                      }}>
                        {product.available_stock}
                      </span>
                    </td>
                    <td style={{ padding: '1rem', color: '#6b7280' }}>{product.total_stock}</td>
                    <td style={{ padding: '1rem', color: '#6b7280' }}>{product.sold || 0}</td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{ fontWeight: '600', color: '#059669' }}>₹{product.price}</span>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          onClick={() => setRestockModal({ 
                            product, 
                            quantity: '', 
                            reason: '' 
                          })}
                          disabled={pendingActions[product._id]}
                          style={{
                            padding: '0.4rem 0.8rem',
                            background: '#ecfdf5',
                            color: '#065f46',
                            border: '1px solid #a7f3d0',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '0.875rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem'
                          }}
                        >
                          {pendingActions[product._id] === 'restock' ? (
                            <Loader2 className="spin" size={14} />
                          ) : (
                            <Plus size={14} />
                          )}
                          Restock
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        marginTop: '1rem',
        paddingTop: '1rem',
        borderTop: '1px solid #e5e7eb',
        fontSize: '0.875rem',
        color: '#6b7280'
      }}>
        <span>
          Showing {stockData.products.length} of {stockData.summary.total} products
        </span>
        <span>
          Total inventory value: ₹{stockData.summary.totalValue?.toLocaleString() || 0}
        </span>
      </div>
    </div>
  );

  // Restock Modal
  const RestockModal = () => (
    restockModal && (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      }}>
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '2rem',
          width: '90%',
          maxWidth: '500px',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)'
        }}>
          <h3 style={{ margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <TrendingUp size={20} color="#10b981" />
            Restock Product
          </h3>
          
          <div style={{ marginBottom: '1rem' }}>
            <strong>{restockModal.product.name}</strong>
            <div style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.25rem' }}>
              Current Stock: {restockModal.product.available_stock} / {restockModal.product.total_stock}
            </div>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
              Quantity to Add *
            </label>
            <input
              type="number"
              min="1"
              max="10000"
              value={restockModal.quantity}
              onChange={(e) => setRestockModal(prev => ({ ...prev, quantity: e.target.value }))}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px'
              }}
              placeholder="Enter quantity..."
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
              Reason (Optional)
            </label>
            <input
              type="text"
              value={restockModal.reason}
              onChange={(e) => setRestockModal(prev => ({ ...prev, reason: e.target.value }))}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px'
              }}
              placeholder="e.g., Weekly restock, New shipment..."
            />
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
            <button
              onClick={() => setRestockModal(null)}
              style={{
                padding: '0.75rem 1.5rem',
                background: '#f9fafb',
                color: '#374151',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              onClick={() => handleRestock(
                restockModal.product._id, 
                restockModal.quantity, 
                restockModal.reason
              )}
              disabled={!restockModal.quantity || pendingActions[restockModal.product._id]}
              style={{
                padding: '0.75rem 1.5rem',
                background: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              {pendingActions[restockModal.product._id] ? (
                <>
                  <Loader2 className="spin" size={16} />
                  Restocking...
                </>
              ) : (
                <>
                  <Plus size={16} />
                  Add Stock
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    )
  );

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)',
      padding: '2rem'
    }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header */}
        <div className="fade-in" style={{ marginBottom: '2rem' }}>
          <h1 style={{ 
            fontSize: '2rem', 
            fontWeight: 'bold', 
            color: '#111827', 
            margin: '0 0 0.5rem 0',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
          }}>
            <Package2 size={32} color="#10b981" />
            Stock Management
          </h1>
          <p style={{ color: '#6b7280', margin: 0 }}>
            Monitor inventory levels, restock products, and track stock movements
          </p>
        </div>

        {/* Overview Cards */}
        <StockOverviewCards />

        {/* Low Stock Alerts */}
        <LowStockAlerts />

        {/* Filters */}
        <FiltersBar />

        {/* Stock Table */}
        <StockTable />

        {/* Restock Modal */}
        <RestockModal />
      </div>
    </div>
  );
}