import { useEffect, useMemo, useState } from 'react';
import { Search, CheckCircle2, XCircle, Edit, Package, Loader2, AlertTriangle, ChevronLeft, ChevronRight, Trash2, Plus } from 'lucide-react';
import authService from '../services/authService';
import productService from '../services/productService';

// Add CSS for spinner animation
const spinnerStyle = document.createElement('style');
spinnerStyle.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  .spin {
    animation: spin 1s linear infinite;
  }
`;
if (!document.head.querySelector('[data-spinner-styles]')) {
  spinnerStyle.setAttribute('data-spinner-styles', 'true');
  document.head.appendChild(spinnerStyle);
}

// Predefined pepper varieties for easy selection
const PEPPER_VARIETIES = [
  'Karimunda', 'Naraya Pepper', 'Kumbukkan', 'Randhalmunda', 'Kairali',
  'Panniyur 1', 'Panniyur 2', 'Panniyur 3', 'Panniyur 4', 'Panniyur 5',
  'Panniyur 6', 'Panniyur 7', 'Panniyur 8', 'Panniyur 9', 'Vijay',
  'Thekkan 1', 'Thekkan 2', 'Neelamundi', 'Vattamundi', 'Vellamundi', 'Kuthiravalley'
];

const VARIETY_DATA = {
  'Karimunda': { type: 'Climber', description: 'Popular cultivar known for yield.', price: 120 },
  'Naraya Pepper': { type: 'Climber', description: 'Locally favored flavor profile.', price: 110 },
  'Kumbukkan': { type: 'Climber', description: 'Strong aroma, robust growth.', price: 115 },
  'Randhalmunda': { type: 'Climber', description: 'Good disease tolerance.', price: 130 },
  'Kairali': { type: 'Climber', description: 'Balanced flavor and yield.', price: 125 },
  'Panniyur 1': { type: 'Climber', description: 'High yielding selection.', price: 140 },
  'Panniyur 2': { type: 'Climber', description: 'Improved vigor.', price: 145 },
  'Panniyur 3': { type: 'Climber', description: 'Uniform spikes.', price: 150 },
  'Panniyur 4': { type: 'Climber', description: 'Good berry size.', price: 155 },
  'Panniyur 5': { type: 'Climber', description: 'Quality fruits.', price: 160 },
  'Panniyur 6': { type: 'Climber', description: 'Consistent producer.', price: 165 },
  'Panniyur 7': { type: 'Climber', description: 'Popular among growers.', price: 170 },
  'Panniyur 8': { type: 'Climber', description: 'Strong plant health.', price: 175 },
  'Panniyur 9': { type: 'Climber', description: 'Latest Panniyur line.', price: 180 },
  'Vijay': { type: 'Climber', description: 'Reliable cultivar.', price: 135 },
  'Thekkan 1': { type: 'Bush', description: 'Compact bush pepper.', price: 100 },
  'Thekkan 2': { type: 'Bush', description: 'Bush type, easy maintenance.', price: 105 },
  'Neelamundi': { type: 'Climber', description: 'Distinct taste.', price: 115 },
  'Vattamundi': { type: 'Climber', description: 'Roundish spike formation.', price: 120 },
  'Vellamundi': { type: 'Climber', description: 'Light-colored berries.', price: 120 },
  'Kuthiravalley': { type: 'Climber', description: 'Known regional variety.', price: 125 },
};

export default function AdminProductManagement() {
  const getProductId = (p) => p?._id || p?.id || '';

  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState(''); // '', 'Bush', 'Climber'
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);

  const [pendingAction, setPendingAction] = useState(null); // {type, productId}
  const [modal, setModal] = useState(null); // { type: 'create'|'edit'|'delete', product, payload }
  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / limit)), [total, limit]);

  useEffect(() => {
    // Authentication disabled for admin dashboard access
    const checkAuth = async () => {
      console.log('Authentication disabled - Admin dashboard access granted');
      return true;
    };

    checkAuth();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await productService.searchProducts({ query, type: typeFilter, page, limit });
      setProducts(res.products || res || []);
      setTotal(res.total || res.length || 0);
    } catch (e) {
      setError(e.message || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit]);

  const onSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchProducts();
  };

  const doDelete = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product? This action cannot be undone.')) return;
    setPendingAction({ type: 'delete', productId });
    setError('');
    try {
      await productService.deleteProduct(productId);
      await fetchProducts();
    } catch (e) {
      setError(e.message || 'Failed to delete product');
    } finally {
      setPendingAction(null);
      setModal(null);
    }
  };

  const doSeedProducts = async () => {
    if (!window.confirm('This will add all missing pepper varieties to the database. Continue?')) return;
    setPendingAction({ type: 'seed' });
    setError('');
    try {
      const result = await productService.seedProducts();
      alert(`${result.message}\nSeeded: ${result.seeded}, Existing: ${result.existing}`);
      await fetchProducts();
    } catch (e) {
      setError(e.message || 'Failed to seed products');
    } finally {
      setPendingAction(null);
    }
  };

  const isActingOn = (type, productId) => pendingAction && pendingAction.type === type && pendingAction.productId === productId;

  const cardStyle = {
    background: 'white',
    borderRadius: '12px',
    padding: '1rem',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
    border: '1px solid #e5e7eb'
  };

  const header = (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
      <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#111827' }}>Product Management</h2>
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        <button
          onClick={() => setModal({ type: 'create' })}
          style={{ padding: '0.6rem 0.9rem', background: '#10b981', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <Plus size={16} /> Add Product
        </button>
        <button
          onClick={doSeedProducts}
          disabled={pendingAction?.type === 'seed'}
          style={{ padding: '0.6rem 0.9rem', background: '#f59e0b', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
        >
          {pendingAction?.type === 'seed' ? <Loader2 className="spin" size={16} style={{ verticalAlign: 'middle' }} /> : '🌱'} Seed All
        </button>
      </div>
    </div>
  );

  const searchBar = (
    <form onSubmit={onSearch} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '0.5rem 0.75rem', flex: 1 }}>
        <Search size={18} color="#6b7280" />
        <input
          placeholder="Search products..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{ border: 'none', outline: 'none', background: 'transparent', marginLeft: '0.5rem', flex: 1 }}
        />
      </div>
      <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} style={{ padding: '0.5rem', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
        <option value="">All Types</option>
        <option value="Bush">Bush</option>
        <option value="Climber">Climber</option>
      </select>
      <button type="submit" style={{ padding: '0.6rem 0.9rem', background: '#10b981', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Search</button>
    </form>
  );

  const table = (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
        <thead>
          <tr style={{ background: '#f3f4f6' }}>
            <th style={{ textAlign: 'left', padding: '0.75rem', borderBottom: '1px solid #e5e7eb' }}>Product</th>
            <th style={{ textAlign: 'left', padding: '0.75rem', borderBottom: '1px solid #e5e7eb' }}>Type</th>
            <th style={{ textAlign: 'left', padding: '0.75rem', borderBottom: '1px solid #e5e7eb' }}>Price</th>
            <th style={{ textAlign: 'left', padding: '0.75rem', borderBottom: '1px solid #e5e7eb' }}>Stock</th>
            <th style={{ textAlign: 'left', padding: '0.75rem', borderBottom: '1px solid #e5e7eb' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
                <Loader2 className="spin" size={18} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} /> Loading products...
              </td>
            </tr>
          ) : products.length === 0 ? (
            <tr>
              <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>No products found</td>
            </tr>
          ) : (
            products.map((p) => (
              <tr key={getProductId(p)}>
                <td style={{ padding: '0.75rem', borderBottom: '1px solid #f3f4f6' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    {p.image ? (
                      <img src={p.image} alt={p.name} style={{ width: 40, height: 40, borderRadius: '8px', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: 40, height: 40, borderRadius: '8px', background: '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Package size={20} color="#6b7280" />
                      </div>
                    )}
                    <div>
                      <div style={{ fontWeight: 600, color: '#111827' }}>{p.name || 'Unnamed Product'}</div>
                      <div style={{ fontSize: 12, color: '#6b7280' }}>{p.description ? (p.description.length > 50 ? p.description.substring(0, 50) + '...' : p.description) : 'No description'}</div>
                    </div>
                  </div>
                </td>
                <td style={{ padding: '0.75rem', borderBottom: '1px solid #f3f4f6' }}>
                  <span style={{
                    padding: '0.15rem 0.5rem',
                    borderRadius: 6,
                    fontSize: 12,
                    color: p.type === 'Bush' ? '#7f1d1d' : '#155e75',
                    background: p.type === 'Bush' ? '#fee2e2' : '#ecfeff',
                    border: '1px solid',
                    borderColor: p.type === 'Bush' ? '#fecaca' : '#a5f3fc',
                    textTransform: 'capitalize'
                  }}>
                    {p.type || 'Bush'}
                  </span>
                </td>
                <td style={{ padding: '0.75rem', borderBottom: '1px solid #f3f4f6' }}>
                  <span style={{ fontWeight: 600, color: '#10b981' }}>₹{p.price || 0}</span>
                </td>
                <td style={{ padding: '0.75rem', borderBottom: '1px solid #f3f4f6' }}>
                  <span style={{
                    color: (p.stock || 0) > 10 ? '#10b981' : (p.stock || 0) > 0 ? '#f59e0b' : '#ef4444',
                    fontWeight: 600
                  }}>
                    {p.stock || 0}
                  </span>
                </td>
                <td style={{ padding: '0.75rem', borderBottom: '1px solid #f3f4f6' }}>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => setModal({ type: 'edit', product: p })}
                      style={{ padding: '0.4rem 0.6rem', background: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0', borderRadius: 6, cursor: 'pointer' }}
                    >
                      <Edit size={14} style={{ verticalAlign: 'middle' }} /> Edit
                    </button>
                    <button
                      disabled={isActingOn('delete', getProductId(p))}
                      onClick={() => doDelete(getProductId(p))}
                      style={{ padding: '0.4rem 0.6rem', background: '#fff7ed', color: '#7c2d12', border: '1px solid #fed7aa', borderRadius: 6, cursor: 'pointer' }}
                    >
                      {isActingOn('delete', getProductId(p)) ? <Loader2 className="spin" size={14} style={{ verticalAlign: 'middle' }} /> : <Trash2 size={14} style={{ verticalAlign: 'middle' }} />} Delete
                    </button>
                  </div>
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
      <div style={{ color: '#6b7280', fontSize: 14 }}>Page {page} of {totalPages} • {total} products</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button
          onClick={() => setPage(Math.max(1, page - 1))}
          disabled={page === 1 || loading}
          style={{ padding: '0.5rem', border: '1px solid #e5e7eb', borderRadius: 6, background: 'white', cursor: 'pointer' }}
        >
          <ChevronLeft size={16} />
        </button>
        <span style={{ padding: '0.5rem 0.75rem', border: '1px solid #e5e7eb', borderRadius: 6, background: '#f9fafb', minWidth: 40, textAlign: 'center' }}>
          {page}
        </span>
        <button
          onClick={() => setPage(Math.min(totalPages, page + 1))}
          disabled={page === totalPages || loading}
          style={{ padding: '0.5rem', border: '1px solid #e5e7eb', borderRadius: 6, background: 'white', cursor: 'pointer' }}
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ padding: '1rem', background: '#f9fafb', minHeight: '100vh' }}>
      <div style={cardStyle}>
        {header}
        {searchBar}
        
        {error && (
          <div style={{ padding: '0.75rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertTriangle size={18} color="#dc2626" />
            <span style={{ color: '#dc2626' }}>{error}</span>
          </div>
        )}

        {table}
        {pagination}
      </div>

      {/* Product Form Modal */}
      {modal && (modal.type === 'create' || modal.type === 'edit') && (
        <ProductFormModal
          isEdit={modal.type === 'edit'}
          product={modal.product}
          onClose={() => setModal(null)}
          onSuccess={() => {
            setModal(null);
            fetchProducts();
          }}
          varieties={PEPPER_VARIETIES}
          varietyData={VARIETY_DATA}
        />
      )}
    </div>
  );
}

// Product Form Modal Component
function ProductFormModal({ isEdit, product, onClose, onSuccess, varieties, varietyData }) {
  const [form, setForm] = useState({
    name: product?.name || '',
    type: product?.type || 'Bush',
    category: product?.category || 'Bush Pepper',
    description: product?.description || '',
    price: product?.price ? product.price.toString() : '',
    stock: product?.stock ? product.stock.toString() : '',
    image: product?.image || '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const quickAddVariety = (varietyName) => {
    const data = varietyData[varietyName];
    if (data) {
      setForm({
        name: varietyName,
        type: data.type,
        category: 'Bush Pepper',
        description: data.description,
        price: data.price.toString(),
        stock: '50',
        image: '',
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!form.name || !form.price || !form.stock || !form.description) {
      setError('Please fill in all required fields (Name, Description, Price, Stock)');
      return;
    }
    
    if (Number(form.price) <= 0 || Number(form.stock) < 0) {
      setError('Price must be greater than 0 and stock cannot be negative');
      return;
    }
    
    setLoading(true);
    setError('');
    try {
      if (isEdit) {
        await productService.updateProduct(product._id || product.id, form);
      } else {
        await productService.createProduct(form);
      }
      onSuccess();
    } catch (e) {
      setError(e.message || 'Failed to save product');
    } finally {
      setLoading(false);
    }
  };

  const modalStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '1rem'
  };

  const formStyle = {
    background: 'white',
    borderRadius: '12px',
    padding: '2rem',
    width: '100%',
    maxWidth: '600px',
    maxHeight: '90vh',
    overflowY: 'auto'
  };

  return (
    <div style={modalStyle} onClick={onClose}>
      <div style={formStyle} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3 style={{ margin: 0, color: '#111827' }}>{isEdit ? 'Edit Product' : 'Add New Product'}</h3>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#6b7280' }}
          >
            ×
          </button>
        </div>

        {!isEdit && (
          <div style={{ marginBottom: '1.5rem', padding: '1rem', background: '#f8f9fa', borderRadius: '6px' }}>
            <h4 style={{ margin: '0 0 0.5rem 0', color: '#374151' }}>Quick Add Varieties</h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {varieties.map((variety, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => quickAddVariety(variety)}
                  style={{
                    padding: '0.25rem 0.5rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    background: 'white',
                    fontSize: '0.875rem',
                    cursor: 'pointer'
                  }}
                >
                  {variety}
                </button>
              ))}
            </div>
          </div>
        )}

        {error && (
          <div style={{ padding: '0.75rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', marginBottom: '1rem', color: '#dc2626' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Name *</label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '4px' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Type *</label>
              <select
                name="type"
                value={form.type}
                onChange={handleChange}
                style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '4px' }}
              >
                <option value="Bush">Bush</option>
                <option value="Climber">Climber</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Price (₹) *</label>
              <input
                type="number"
                name="price"
                value={form.price}
                onChange={handleChange}
                min="1"
                required
                style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '4px' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Stock *</label>
              <input
                type="number"
                name="stock"
                value={form.stock}
                onChange={handleChange}
                min="0"
                required
                style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '4px' }}
              />
            </div>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Category</label>
            <input
              type="text"
              name="category"
              value={form.category}
              onChange={handleChange}
              style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '4px' }}
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Image URL</label>
            <input
              type="url"
              name="image"
              value={form.image}
              onChange={handleChange}
              style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '4px' }}
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Description *</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows="3"
              required
              style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '4px', resize: 'vertical' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              style={{ padding: '0.75rem 1.5rem', background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{ padding: '0.75rem 1.5rem', background: '#10b981', color: 'white', border: 'none', borderRadius: '6px', cursor: loading ? 'not-allowed' : 'pointer' }}
            >
              {loading ? <Loader2 className="spin" size={16} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} /> : null}
              {isEdit ? 'Update Product' : 'Create Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}