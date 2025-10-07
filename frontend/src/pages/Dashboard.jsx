import { useState, useEffect } from "react";
import { User, Package, ShoppingCart, Truck, LogOut, Bell, Search, Plus, Package2, AlertCircle, CheckCircle } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import authService from "../services/authService";
import customerProductService from "../services/customerProductService";

export default function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState(location.state?.activeTab || 'overview');
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState({ items: [], total: 0 });
  const [productsLoading, setProductsLoading] = useState(false);
  const [cartLoading, setCartLoading] = useState({});
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [cartPrompt, setCartPrompt] = useState({ productId: null, visible: false });
  const [searchQuery, setSearchQuery] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);
  const [showHeaderSearch, setShowHeaderSearch] = useState(false);
  const [stats, setStats] = useState({
    totalOrders: 15,
    pendingDeliveries: 3,
    totalProducts: 47,
    newNotifications: 5
  });

  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    if (!currentUser) {
      window.location.href = '/login';
      return;
    }
    setUser(currentUser);
  }, []);

  // Fetch products when products tab is active
  useEffect(() => {
    if (activeTab === 'products') {
      fetchProducts();
    }
  }, [activeTab]);

  // Fetch cart when cart tab is active
  useEffect(() => {
    if (activeTab === 'cart') {
      fetchCart();
    }
  }, [activeTab]);

  // Add CSS animation for spinner
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      if (document.head.contains(style)) {
        document.head.removeChild(style);
      }
    };
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showHeaderSearch || showNotifications) {
        const target = event.target;
        const isClickInsideDropdown = target.closest('[data-dropdown]');
        const isClickOnButton = target.closest('[data-dropdown-button]');
        
        if (!isClickInsideDropdown && !isClickOnButton) {
          setShowHeaderSearch(false);
          setShowNotifications(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showHeaderSearch, showNotifications]);

  const fetchProducts = async () => {
    setProductsLoading(true);
    setErrorMessage("");
    try {
      const fetchedProducts = await customerProductService.getProducts({ available: true });
      setProducts(Array.isArray(fetchedProducts) ? fetchedProducts : []);
    } catch (error) {
      console.error('Error fetching products:', error);
      setErrorMessage("Failed to load products. Please try again.");
    } finally {
      setProductsLoading(false);
    }
  };

  const fetchCart = async () => {
    if (!user) return;
    try {
      const cartData = await customerProductService.getCart();
      setCart(cartData || { items: [], total: 0 });
    } catch (error) {
      console.error('Error fetching cart:', error);
      setCart({ items: [], total: 0 });
    }
  };

  const addToCart = async (productId, productName) => {
    if (!user) {
      navigate('/login');
      return;
    }

    setCartLoading(prev => ({ ...prev, [productId]: true }));
    setErrorMessage("");
    setSuccessMessage("");

    try {
      await customerProductService.addToCart(productId, 1);
      setSuccessMessage(`${productName} added to cart!`);

      // Show inline "View Cart" prompt near this product
      // It will stay visible until another product is added
      setCartPrompt({ productId, visible: true });
      
      // Update product stock locally
      setProducts(prev => prev.map(p => 
        p._id === productId ? { ...p, stock: Math.max(0, p.stock - 1) } : p
      ));

      // Refresh cart if we're on cart tab
      if (activeTab === 'cart') {
        fetchCart();
      }

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage("");
      }, 3000);

    } catch (err) {
      console.error("Add to cart error:", err);
      setErrorMessage(err.message || "Failed to add product to cart");
      setTimeout(() => {
        setErrorMessage("");
      }, 5000);
    } finally {
      setCartLoading(prev => ({ ...prev, [productId]: false }));
    }
  };

  const updateCartQuantity = async (productId, quantity) => {
    try {
      await customerProductService.updateCartQuantity(productId, quantity);
      fetchCart(); // Refresh cart
    } catch (error) {
      console.error('Error updating cart:', error);
      setErrorMessage("Failed to update cart item");
    }
  };

  const removeFromCart = async (productId) => {
    try {
      await customerProductService.removeFromCart(productId);
      fetchCart(); // Refresh cart
    } catch (error) {
      console.error('Error removing from cart:', error);
      setErrorMessage("Failed to remove cart item");
    }
  };

  const handleLogout = async () => {
    // show inline banner and delay redirect
    setSuccessMessage('You have been logged out. Redirecting to login...');
    const result = await authService.logoutNoRedirect();
    if (result?.success) {
      setTimeout(() => {
        window.location.href = '/login';
      }, 1500);
    } else {
      setErrorMessage('Logout failed. Please try again.');
    }
  };

  if (!user) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: '#f9fafb'
      }}>
        <div style={{
          width: '3rem',
          height: '3rem',
          border: '4px solid #10b981',
          borderTop: '4px solid transparent',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
      </div>
    );
  }

  const sidebarStyle = {
    width: '280px',
    background: 'linear-gradient(135deg, #10b981, #059669)',
    color: 'white',
    padding: '2rem',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '4px 0 20px rgba(0, 0, 0, 0.1)',
    position: 'relative',
    overflow: 'hidden'
  };

  const mainContentStyle = {
    flex: 1,
    background: '#f9fafb',
    padding: '2rem',
    overflowY: 'auto'
  };

  const cardStyle = {
    background: 'white',
    borderRadius: '12px',
    padding: '1.5rem',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
    border: '1px solid #e5e7eb',
    transition: 'all 0.3s ease'
  };

  const statCardStyle = {
    ...cardStyle,
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'all 0.3s ease'
  };

  const menuItems = [
    { id: 'overview', label: 'Overview', icon: Package },
    ...(user.role !== 'admin' ? [
      { id: 'orders', label: 'My Orders', icon: ShoppingCart },
      { id: 'products', label: 'Products', icon: Package },
      { id: 'cart', label: 'My Cart', icon: ShoppingCart },
    ] : []),
    ...(user.role === 'deliveryboy' ? [{ id: 'deliveries', label: 'Deliveries', icon: Truck }] : []),
    ...(user.role === 'admin' ? [
      { id: 'admin-users', label: 'User Management', icon: User },
      { id: 'admin-products', label: 'Product Management', icon: Package },
      { id: 'admin-stock', label: 'Stock Management', icon: Package2 },
      { id: 'admin-orders', label: 'All Orders', icon: ShoppingCart }
    ] : []),
    { id: 'profile', label: 'Profile', icon: User }
  ];

  const renderOverview = () => (
    <div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '1.5rem',
        marginBottom: '2rem'
      }}>
        <div 
          style={statCardStyle}
          onMouseEnter={(e) => {
            e.target.style.transform = 'translateY(-4px)';
            e.target.style.boxShadow = '0 8px 30px rgba(0, 0, 0, 0.15)';
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.05)';
          }}
        >
          <ShoppingCart size={32} color="#10b981" style={{ marginBottom: '1rem' }} />
          <h3 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '0.5rem' }}>
            {stats.totalOrders}
          </h3>
          <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>Total Orders</p>
        </div>

        <div 
          style={statCardStyle}
          onMouseEnter={(e) => {
            e.target.style.transform = 'translateY(-4px)';
            e.target.style.boxShadow = '0 8px 30px rgba(0, 0, 0, 0.15)';
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.05)';
          }}
        >
          <Truck size={32} color="#f59e0b" style={{ marginBottom: '1rem' }} />
          <h3 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '0.5rem' }}>
            {stats.pendingDeliveries}
          </h3>
          <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>Pending Deliveries</p>
        </div>

        <div 
          style={statCardStyle}
          onMouseEnter={(e) => {
            e.target.style.transform = 'translateY(-4px)';
            e.target.style.boxShadow = '0 8px 30px rgba(0, 0, 0, 0.15)';
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.05)';
          }}
        >
          <Package size={32} color="#10b981" style={{ marginBottom: '1rem' }} />
          <h3 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '0.5rem' }}>
            {stats.totalProducts}
          </h3>
          <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>Available Products</p>
        </div>

        <div 
          style={statCardStyle}
          onMouseEnter={(e) => {
            e.target.style.transform = 'translateY(-4px)';
            e.target.style.boxShadow = '0 8px 30px rgba(0, 0, 0, 0.15)';
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.05)';
          }}
        >
          <Bell size={32} color="#ef4444" style={{ marginBottom: '1rem' }} />
          <h3 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '0.5rem' }}>
            {stats.newNotifications}
          </h3>
          <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>New Notifications</p>
        </div>
      </div>

      <div style={cardStyle}>
        <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '1rem' }}>
          Recent Activity
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            padding: '1rem', 
            background: '#f0fdf4', 
            borderRadius: '8px',
            border: '1px solid #bbf7d0'
          }}>
            <Package size={20} color="#10b981" style={{ marginRight: '1rem' }} />
            <div>
              <p style={{ fontWeight: '500', color: '#1f2937' }}>New order placed</p>
              <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>Black Pepper Seedlings - 5 plants</p>
            </div>
          </div>
          
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            padding: '1rem', 
            background: '#fef3c7', 
            borderRadius: '8px',
            border: '1px solid #fde68a'
          }}>
            <Truck size={20} color="#f59e0b" style={{ marginRight: '1rem' }} />
            <div>
              <p style={{ fontWeight: '500', color: '#1f2937' }}>Order shipped</p>
              <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>White Pepper Seeds - Track: #WP2025001</p>
            </div>
          </div>
          
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            padding: '1rem', 
            background: '#ede9fe', 
            borderRadius: '8px',
            border: '1px solid #c4b5fd'
          }}>
            <User size={20} color="#8b5cf6" style={{ marginRight: '1rem' }} />
            <div>
              <p style={{ fontWeight: '500', color: '#1f2937' }}>Profile updated</p>
              <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>Delivery address changed</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview();
      case 'orders':
        return (
          <div style={cardStyle}>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '1rem' }}>
              My Orders
            </h3>
            <p style={{ color: '#6b7280' }}>Your order history and current orders will appear here.</p>
          </div>
        );
      case 'products':
        // Filter products based on search query
        const filteredProducts = products.filter(product => 
          product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          product.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          product.type?.toLowerCase().includes(searchQuery.toLowerCase())
        );

        return (
          <div style={cardStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>
                🌶️ Available Products
              </h3>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <button
                  onClick={() => setActiveTab('cart')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.5rem 1rem',
                    backgroundColor: '#059669',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: '500'
                  }}
                >
                  <ShoppingCart size={16} />
                  View Cart ({cart.items.length})
                </button>
                <button
                  onClick={fetchProducts}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.5rem 1rem',
                    backgroundColor: '#6b7280',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: '500'
                  }}
                >
                  <Package size={16} />
                  Refresh
                </button>
              </div>
            </div>

            {/* Search Bar */}
            <div style={{ 
              position: 'relative', 
              marginBottom: '1.5rem' 
            }}>
              <Search size={18} style={{ 
                position: 'absolute', 
                left: '12px', 
                top: '50%', 
                transform: 'translateY(-50%)', 
                color: '#6b7280',
                pointerEvents: 'none'
              }} />
              <input
                type="text"
                placeholder="Search products by name, type, or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem 0.75rem 0.75rem 2.5rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '14px',
                  outline: 'none',
                  transition: 'all 0.3s ease'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#10b981';
                  e.target.style.boxShadow = '0 0 0 3px rgba(16, 185, 129, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#d1d5db';
                  e.target.style.boxShadow = 'none';
                }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: '#6b7280',
                    cursor: 'pointer',
                    fontSize: '1.25rem',
                    padding: '0.25rem'
                  }}
                >
                  ×
                </button>
              )}
            </div>

            {/* Success/Error Messages */}
            {successMessage && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '1rem',
                marginBottom: '1.5rem',
                backgroundColor: '#f0fdf4',
                border: '1px solid #bbf7d0',
                borderRadius: '8px',
                color: '#166534'
              }}>
                <CheckCircle size={20} />
                {successMessage}
              </div>
            )}

            {errorMessage && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '1rem',
                marginBottom: '1.5rem',
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '8px',
                color: '#dc2626'
              }}>
                <AlertCircle size={20} />
                {errorMessage}
              </div>
            )}

            {/* Products Display */}
            {productsLoading ? (
              <div style={{ 
                textAlign: 'center', 
                padding: '3rem', 
                color: '#6b7280' 
              }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  border: '4px solid #e5e7eb',
                  borderTop: '4px solid #10b981',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                  margin: '0 auto 1rem'
                }}></div>
                Loading products...
              </div>
            ) : products.length === 0 ? (
              <div style={{ 
                padding: '3rem', 
                backgroundColor: '#f9fafb', 
                borderRadius: '8px', 
                textAlign: 'center',
                border: '2px dashed #d1d5db'
              }}>
                <Package size={48} color="#9ca3af" style={{ marginBottom: '1rem' }} />
                <h4 style={{ color: '#374151', marginBottom: '0.5rem' }}>No Products Available</h4>
                <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
                  No products found. Admin may not have added any products yet.
                </p>
                <button
                  onClick={fetchProducts}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.75rem 1.5rem',
                    backgroundColor: '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    fontWeight: '500'
                  }}
                >
                  <Package size={16} />
                  Refresh Products
                </button>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div style={{ 
                padding: '3rem', 
                backgroundColor: '#f9fafb', 
                borderRadius: '8px', 
                textAlign: 'center',
                border: '2px dashed #d1d5db'
              }}>
                <Search size={48} color="#9ca3af" style={{ marginBottom: '1rem' }} />
                <h4 style={{ color: '#374151', marginBottom: '0.5rem' }}>No Products Found</h4>
                <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
                  No products match your search "{searchQuery}". Try a different search term.
                </p>
                <button
                  onClick={() => setSearchQuery('')}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.75rem 1.5rem',
                    backgroundColor: '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    fontWeight: '500'
                  }}
                >
                  Clear Search
                </button>
              </div>
            ) : (
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '1.5rem'
              }}>
                {filteredProducts.map((product) => (
                  <div 
                    key={product._id} 
                    style={{
                      background: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '12px',
                      padding: '1.5rem',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                      transition: 'all 0.3s ease',
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-4px)';
                      e.currentTarget.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.15)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
                    }}
                  >
                    {/* Product Header */}
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'start', 
                      marginBottom: '1rem' 
                    }}>
                      <h4 style={{ 
                        margin: 0, 
                        color: '#1f2937', 
                        fontSize: '1.1rem',
                        fontWeight: '600' 
                      }}>
                        {product.name}
                      </h4>
                      <span style={{
                        padding: '0.25rem 0.75rem',
                        borderRadius: '16px',
                        fontSize: '0.75rem',
                        fontWeight: '500',
                        backgroundColor: product.type === 'Bush' ? '#fee2e2' : '#dbeafe',
                        color: product.type === 'Bush' ? '#991b1b' : '#1e40af'
                      }}>
                        {product.type}
                      </span>
                    </div>

                    {/* Product Image */}
                    {product.image && (
                      <img 
                        src={product.image} 
                        alt={product.name} 
                        style={{
                          width: '100%',
                          height: '160px',
                          objectFit: 'cover',
                          borderRadius: '8px',
                          marginBottom: '1rem'
                        }}
                      />
                    )}

                    {/* Product Description */}
                    <p style={{ 
                      color: '#6b7280', 
                      fontSize: '0.875rem', 
                      lineHeight: '1.4',
                      marginBottom: '1rem',
                      height: '40px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {product.description}
                    </p>

                    {/* Price and Stock */}
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center', 
                      marginBottom: '1rem' 
                    }}>
                      <span style={{ 
                        fontWeight: '700', 
                        fontSize: '1.5rem', 
                        color: '#059669' 
                      }}>
                        ₹{product.price}
                      </span>
                      <span style={{ 
                        color: product.stock > 10 ? '#059669' : product.stock > 0 ? '#d97706' : '#dc2626',
                        fontWeight: '600',
                        fontSize: '0.875rem'
                      }}>
                        {product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}
                      </span>
                    </div>

                    {/* Add to Cart Button */}
                    <button
                      onClick={() => addToCart(product._id, product.name)}
                      disabled={product.stock === 0 || cartLoading[product._id]}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        padding: '0.75rem',
                        backgroundColor: product.stock > 0 ? (cartLoading[product._id] ? '#059669' : '#10b981') : '#9ca3af',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: product.stock > 0 && !cartLoading[product._id] ? 'pointer' : 'not-allowed',
                        fontWeight: '600',
                        fontSize: '0.875rem',
                        transition: 'all 0.2s ease',
                        position: 'relative'
                      }}
                    >
                      {cartLoading[product._id] ? (
                        <>
                          <div style={{
                            width: '16px',
                            height: '16px',
                            border: '2px solid transparent',
                            borderTop: '2px solid white',
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite'
                          }}></div>
                          Adding...
                        </>
                      ) : product.stock > 0 ? (
                        <>
                          <ShoppingCart size={16} />
                          Add to Cart
                        </>
                      ) : (
                        <>
                          <AlertCircle size={16} />
                          Out of Stock
                        </>
                      )}
                    </button>

                    {/* Inline View Cart prompt (appears after add) */}
                    {cartPrompt.visible && cartPrompt.productId === product._id && (
                      <div style={{
                        position: 'absolute',
                        right: '1rem',
                        bottom: '4rem',
                        background: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                        padding: '0.75rem 1rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        zIndex: 5
                      }}>
                        <span style={{ color: '#065f46', fontWeight: 600 }}>Added!</span>
                        <button
                          onClick={() => setActiveTab('cart')}
                          style={{
                            backgroundColor: '#059669',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            padding: '0.4rem 0.75rem',
                            cursor: 'pointer',
                            fontSize: '0.8rem',
                            fontWeight: 600
                          }}
                        >
                          View Cart
                        </button>
                        <button
                          onClick={() => setCartPrompt({ productId: null, visible: false })}
                          style={{
                            backgroundColor: 'transparent',
                            color: '#6b7280',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '1.2rem',
                            padding: '0 0.25rem',
                            lineHeight: 1,
                            fontWeight: 'bold'
                          }}
                          title="Close"
                        >
                          ×
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      case 'cart':
        return (
          <div style={cardStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>
                🛒 My Cart
              </h3>
              <button
                onClick={() => setActiveTab('products')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem 1rem',
                  backgroundColor: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '500'
                }}
              >
                <Package size={16} />
                Continue Shopping
              </button>
            </div>

            {cart.items && cart.items.length === 0 ? (
              <div style={{ 
                padding: '3rem', 
                backgroundColor: '#f9fafb', 
                borderRadius: '8px', 
                textAlign: 'center',
                border: '2px dashed #d1d5db'
              }}>
                <ShoppingCart size={48} color="#9ca3af" style={{ marginBottom: '1rem' }} />
                <h4 style={{ color: '#374151', marginBottom: '0.5rem' }}>Your Cart is Empty</h4>
                <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
                  Add some pepper plants to your cart to get started.
                </p>
                <button
                  onClick={() => setActiveTab('products')}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.75rem 1.5rem',
                    backgroundColor: '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    fontWeight: '500'
                  }}
                >
                  <Package size={16} />
                  Browse Products
                </button>
              </div>
            ) : (
              <div>
                {/* Cart Items */}
                <div style={{ marginBottom: '2rem' }}>
                  {(cart.items || []).filter(item => item && item.product).map((item, idx) => (
                    <div key={item.product?._id || idx} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1rem',
                      padding: '1rem',
                      backgroundColor: '#f9fafb',
                      borderRadius: '8px',
                      marginBottom: '1rem',
                      border: '1px solid #e5e7eb'
                    }}>
                      {/* Product Image */}
                      {item.product?.image ? (
                        <img 
                          src={item.product.image} 
                          alt={item.product?.name || 'Product'} 
                          style={{
                            width: '60px',
                            height: '60px',
                            objectFit: 'cover',
                            borderRadius: '8px'
                          }}
                        />
                      ) : (
                        <div style={{
                          width: '60px',
                          height: '60px',
                          backgroundColor: '#e5e7eb',
                          borderRadius: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#6b7280',
                          fontSize: '0.75rem'
                        }}>
                          No Image
                        </div>
                      )}
                      
                      {/* Product Info */}
                      <div style={{ flex: 1 }}>
                        <h4 style={{ margin: '0 0 0.5rem 0', color: '#1f2937', fontSize: '1rem' }}>
                          {item.product?.name || 'Unknown product'}
                        </h4>
                        <p style={{ margin: 0, color: '#6b7280', fontSize: '0.875rem' }}>
                          ₹{item.product?.price ?? 0} each
                        </p>
                      </div>
                      
                      {/* Quantity Controls */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <button
                          onClick={() => updateCartQuantity(item.product?._id, item.quantity - 1)}
                          style={{
                            padding: '0.25rem 0.5rem',
                            backgroundColor: '#e5e7eb',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            color: '#374151'
                          }}
                          disabled={!item.product?._id}
                        >
                          -
                        </button>
                        <span style={{ 
                          padding: '0.25rem 0.5rem', 
                          minWidth: '2rem', 
                          textAlign: 'center',
                          fontWeight: '600'
                        }}>
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateCartQuantity(item.product?._id, item.quantity + 1)}
                          style={{
                            padding: '0.25rem 0.5rem',
                            backgroundColor: '#e5e7eb',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            color: '#374151'
                          }}
                          disabled={!item.product?._id}
                        >
                          +
                        </button>
                      </div>
                      
                      {/* Subtotal */}
                      <div style={{ textAlign: 'right', minWidth: '80px' }}>
                        <span style={{ 
                          fontWeight: '600', 
                          color: '#059669',
                          fontSize: '1rem'
                        }}>
                          ₹{(item.product?.price ?? 0) * item.quantity}
                        </span>
                      </div>
                      
                      {/* Remove Button */}
                      <button
                        onClick={() => removeFromCart(item.product?._id)}
                        style={{
                          padding: '0.5rem',
                          backgroundColor: '#fee2e2',
                          color: '#dc2626',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '0.875rem'
                        }}
                        disabled={!item.product?._id}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>

                {/* Cart Total */}
                <div style={{
                  borderTop: '2px solid #e5e7eb',
                  paddingTop: '1rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#1f2937' }}>
                    Total: ₹{cart.total || 0}
                  </h3>
                  <button
                    onClick={() => navigate('/checkout')}
                    style={{
                      padding: '0.75rem 2rem',
                      backgroundColor: '#10b981',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '1rem',
                      fontWeight: '600'
                    }}
                  >
                    Checkout
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      case 'deliveries':
        return (
          <div style={cardStyle}>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '1rem' }}>
              Delivery Management
            </h3>
            <p style={{ color: '#6b7280' }}>Manage your delivery routes and pending deliveries.</p>
          </div>
        );
      case 'profile':
        return (
          <div style={cardStyle}>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '1rem' }}>
              Profile Information
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#374151', fontWeight: '500' }}>
                  First Name
                </label>
                <input
                  type="text"
                  value={user.firstName || 'N/A'}
                  readOnly
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    background: '#f9fafb'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#374151', fontWeight: '500' }}>
                  Last Name
                </label>
                <input
                  type="text"
                  value={user.lastName || 'N/A'}
                  readOnly
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    background: '#f9fafb'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#374151', fontWeight: '500' }}>
                  Email
                </label>
                <input
                  type="email"
                  value={user.email || 'N/A'}
                  readOnly
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    background: '#f9fafb'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#374151', fontWeight: '500' }}>
                  Role
                </label>
                <input
                  type="text"
                  value={user.role || 'user'}
                  readOnly
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    background: '#f9fafb',
                    textTransform: 'capitalize'
                  }}
                />
              </div>
            </div>
          </div>
        );
      case 'settings':
        return (
          <div style={cardStyle}>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '1rem' }}>
              Settings
            </h3>
            <p style={{ color: '#6b7280' }}>Manage your account settings and preferences.</p>
          </div>
        );
      case 'admin-users':
        return (
          <div style={cardStyle}>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '1rem' }}>Admin • User Management</h3>
            <iframe title="AdminUserManagement" src="/admin-users" style={{ width: '100%', height: '70vh', border: 'none', borderRadius: 8 }} />
            <p style={{ color: '#6b7280', fontSize: 12, marginTop: 8 }}>Open full view at /admin-users if the embed is blocked by CSP.</p>
          </div>
        );
      case 'admin-products':
        return (
          <div style={cardStyle}>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '1rem' }}>Admin • Product Management</h3>
            <iframe title="AdminProductManagement" src="/admin-products" style={{ width: '100%', height: '70vh', border: 'none', borderRadius: 8 }} />
            <p style={{ color: '#6b7280', fontSize: 12, marginTop: 8 }}>Open full view at /admin-products if the embed is blocked by CSP.</p>
          </div>
        );
      case 'admin-stock':
        return (
          <div style={cardStyle}>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '1rem' }}>Admin • Stock Management</h3>
            <iframe title="AdminStockManagement" src="/admin-stock" style={{ width: '100%', height: '70vh', border: 'none', borderRadius: 8 }} />
            <p style={{ color: '#6b7280', fontSize: 12, marginTop: 8 }}>
              If the embed is blocked by CSP, {' '}
              <a 
                href="/admin-stock" 
                target="_blank" 
                rel="noopener noreferrer"
                style={{ 
                  color: '#10b981', 
                  textDecoration: 'underline',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
              >
                open full view here
              </a>
              .
            </p>
          </div>
        );
      case 'admin-orders':
        return (
          <div style={cardStyle}>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '1rem' }}>Admin • All Orders</h3>
            <iframe title="AdminAllOrders" src="/admin-orders" style={{ width: '100%', height: '70vh', border: 'none', borderRadius: 8 }} />
            <p style={{ color: '#6b7280', fontSize: 12, marginTop: 8 }}>Open full view at /admin-orders if the embed is blocked by CSP.</p>
          </div>
        );
      default:
        return renderOverview();
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <div style={sidebarStyle}>
        {/* Background decoration */}
        <div style={{
          position: 'absolute',
          top: '-50%',
          right: '-50%',
          width: '200%',
          height: '200%',
          background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
          pointerEvents: 'none'
        }}></div>

        {/* Logo/Brand */}
        <div style={{ marginBottom: '2rem', textAlign: 'center', position: 'relative', zIndex: 10 }}>
          <div style={{
            width: '60px',
            height: '60px',
            background: 'rgba(255, 255, 255, 0.2)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1rem',
            backdropFilter: 'blur(16px)'
          }}>
            <Package color="white" size={28} />
          </div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: 0 }}>Pepper Nursery</h1>
        </div>

        {/* User Info */}
        <div style={{
          padding: '1rem',
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '12px',
          marginBottom: '2rem',
          backdropFilter: 'blur(16px)',
          position: 'relative',
          zIndex: 10
        }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
            {user.avatar ? (
              <img 
                src={user.avatar} 
                alt="Profile" 
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  marginRight: '0.75rem'
                }}
              />
            ) : (
              <div style={{
                width: '40px',
                height: '40px',
                background: 'rgba(255, 255, 255, 0.2)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: '0.75rem'
              }}>
                <User color="white" size={20} />
              </div>
            )}
            <div>
              <p style={{ margin: 0, fontWeight: '600', fontSize: '0.875rem' }}>
                {user.firstName || 'User'} {user.lastName || ''}
              </p>
              <p style={{ margin: 0, fontSize: '0.75rem', opacity: 0.8, textTransform: 'capitalize' }}>
                {user.role || 'user'}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, position: 'relative', zIndex: 10 }}>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => {
                  // Navigate to dedicated Orders page for "My Orders"
                  if (item.id === 'orders') {
                    navigate('/orders');
                  } else if (item.id === 'admin-stock') {
                    // Navigate to full Stock Management page
                    navigate('/admin-stock');
                  } else {
                    setActiveTab(item.id);
                  }
                }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0.75rem 1rem',
                  marginBottom: '0.5rem',
                  background: isActive ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  fontSize: '0.875rem',
                  fontWeight: isActive ? '600' : '500',
                  backdropFilter: isActive ? 'blur(16px)' : 'none'
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.target.style.background = 'transparent';
                  }
                }}
              >
                <Icon size={18} style={{ marginRight: '0.75rem' }} />
                {item.label}
              </button>
            );
          })}

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              padding: '0.75rem 1rem',
              marginBottom: '0.5rem',
              background: 'rgba(239, 68, 68, 0.2)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              fontSize: '0.875rem',
              fontWeight: '500',
              backdropFilter: 'blur(16px)',
              position: 'relative',
              zIndex: 10
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'rgba(239, 68, 68, 0.3)';
              e.target.style.transform = 'scale(1.02)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'rgba(239, 68, 68, 0.2)';
              e.target.style.transform = 'scale(1)';
            }}
          >
            <LogOut size={18} style={{ marginRight: '0.75rem' }} />
            Logout
          </button>
        </nav>
      </div>

      {/* Main Content */}
      <div style={mainContentStyle}>
        {/* Header */}
        <header style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '2rem'
        }}>
          <div>
            <h1 style={{ 
              fontSize: '2rem', 
              fontWeight: 'bold', 
              color: '#1f2937',
              margin: 0,
              marginBottom: '0.5rem'
            }}>
              Welcome back, {user.firstName || 'User'}! 👋
            </h1>
            <p style={{ color: '#6b7280', margin: 0 }}>
              Here's what's happening with your pepper nursery today.
            </p>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', position: 'relative' }}>
            <button 
              data-dropdown-button
              onClick={() => {
                setShowHeaderSearch(!showHeaderSearch);
                setShowNotifications(false);
              }}
              style={{
                padding: '0.75rem',
                background: showHeaderSearch ? '#10b981' : 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                if (!showHeaderSearch) {
                  e.target.style.background = '#f9fafb';
                }
              }}
              onMouseLeave={(e) => {
                if (!showHeaderSearch) {
                  e.target.style.background = 'white';
                }
              }}
            >
              <Search size={20} color={showHeaderSearch ? 'white' : '#6b7280'} />
            </button>
            
            <button 
              data-dropdown-button
              onClick={() => {
                setShowNotifications(!showNotifications);
                setShowHeaderSearch(false);
              }}
              style={{
                position: 'relative',
                padding: '0.75rem',
                background: showNotifications ? '#10b981' : 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                if (!showNotifications) {
                  e.target.style.background = '#f9fafb';
                }
              }}
              onMouseLeave={(e) => {
                if (!showNotifications) {
                  e.target.style.background = 'white';
                }
              }}
            >
              <Bell size={20} color={showNotifications ? 'white' : '#6b7280'} />
              {stats.newNotifications > 0 && (
                <div style={{
                  position: 'absolute',
                  top: '4px',
                  right: '4px',
                  width: '12px',
                  height: '12px',
                  background: '#ef4444',
                  borderRadius: '50%',
                  border: '2px solid white'
                }}></div>
              )}
            </button>

            {/* Header Search Dropdown */}
            {showHeaderSearch && (
              <div data-dropdown style={{
                position: 'absolute',
                top: '100%',
                right: '0',
                marginTop: '0.5rem',
                width: '320px',
                background: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
                boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15)',
                padding: '1rem',
                zIndex: 1000
              }}>
                <div style={{ position: 'relative' }}>
                  <Search size={18} style={{ 
                    position: 'absolute', 
                    left: '12px', 
                    top: '50%', 
                    transform: 'translateY(-50%)', 
                    color: '#6b7280',
                    pointerEvents: 'none'
                  }} />
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    autoFocus
                    style={{
                      width: '100%',
                      padding: '0.75rem 0.75rem 0.75rem 2.5rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#10b981';
                      e.target.style.boxShadow = '0 0 0 3px rgba(16, 185, 129, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#d1d5db';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                </div>
                {searchQuery && (
                  <button
                    onClick={() => {
                      setActiveTab('products');
                      setShowHeaderSearch(false);
                    }}
                    style={{
                      width: '100%',
                      marginTop: '0.5rem',
                      padding: '0.5rem',
                      background: '#10b981',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      fontWeight: '500'
                    }}
                  >
                    Search in Products
                  </button>
                )}
              </div>
            )}

            {/* Notifications Dropdown */}
            {showNotifications && (
              <div data-dropdown style={{
                position: 'absolute',
                top: '100%',
                right: '0',
                marginTop: '0.5rem',
                width: '360px',
                background: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
                boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15)',
                padding: '1rem',
                zIndex: 1000,
                maxHeight: '400px',
                overflowY: 'auto'
              }}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  marginBottom: '1rem',
                  paddingBottom: '0.75rem',
                  borderBottom: '1px solid #e5e7eb'
                }}>
                  <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: '600', color: '#1f2937' }}>
                    Notifications
                  </h4>
                  {stats.newNotifications > 0 && (
                    <span style={{
                      padding: '0.25rem 0.5rem',
                      background: '#ef4444',
                      color: 'white',
                      borderRadius: '12px',
                      fontSize: '0.75rem',
                      fontWeight: '600'
                    }}>
                      {stats.newNotifications} new
                    </span>
                  )}
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{
                    padding: '0.75rem',
                    background: '#f0fdf4',
                    borderRadius: '8px',
                    border: '1px solid #bbf7d0'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'start', gap: '0.5rem' }}>
                      <Package size={16} color="#10b981" style={{ marginTop: '2px', flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: '500', color: '#1f2937' }}>
                          Order Delivered
                        </p>
                        <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.75rem', color: '#6b7280' }}>
                          Your order #12345 has been delivered successfully
                        </p>
                      </div>
                    </div>
                  </div>

                  <div style={{
                    padding: '0.75rem',
                    background: '#fef3c7',
                    borderRadius: '8px',
                    border: '1px solid #fde68a'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'start', gap: '0.5rem' }}>
                      <Truck size={16} color="#f59e0b" style={{ marginTop: '2px', flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: '500', color: '#1f2937' }}>
                          Order Shipped
                        </p>
                        <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.75rem', color: '#6b7280' }}>
                          Your order #12346 is on the way
                        </p>
                      </div>
                    </div>
                  </div>

                  <div style={{
                    padding: '0.75rem',
                    background: '#ede9fe',
                    borderRadius: '8px',
                    border: '1px solid #c4b5fd'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'start', gap: '0.5rem' }}>
                      <Bell size={16} color="#8b5cf6" style={{ marginTop: '2px', flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: '500', color: '#1f2937' }}>
                          New Products Available
                        </p>
                        <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.75rem', color: '#6b7280' }}>
                          Check out our latest pepper varieties
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setShowNotifications(false)}
                  style={{
                    width: '100%',
                    marginTop: '1rem',
                    padding: '0.5rem',
                    background: '#f9fafb',
                    color: '#6b7280',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: '500'
                  }}
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Global Messages */}
        {(successMessage || errorMessage) && (
          <div style={{ marginBottom: '1rem' }}>
            {successMessage && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '1rem',
                backgroundColor: '#f0fdf4',
                border: '1px solid #bbf7d0',
                borderRadius: '8px',
                color: '#166534',
                marginBottom: errorMessage ? '0.5rem' : 0
              }}>
                <CheckCircle size={20} />
                {successMessage}
              </div>
            )}
            {errorMessage && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '1rem',
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '8px',
                color: '#dc2626'
              }}>
                <AlertCircle size={20} />
                {errorMessage}
              </div>
            )}
          </div>
        )}

        {/* Content Area */}
        {renderContent()}
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}