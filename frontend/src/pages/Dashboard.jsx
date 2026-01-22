import { useState, useEffect } from "react";
import { 
  User, Package, ShoppingCart, Truck, LogOut, Bell, Search, 
  Plus, Package2, AlertCircle, CheckCircle, Sparkles, Target, 
  Heart, Video as VideoIcon, Play, DollarSign 
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { auth } from "../config/firebase";
import authService from "../services/authService";
import customerProductService from "../services/customerProductService";
import RecommendedProducts from "../components/RecommendedProducts";
import MyReviews from "./MyReviews";
import DemandPredictionWidget from "../components/DemandPredictionWidget";

export default function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState(location.state?.activeTab || 'overview');
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState({ items: [], total: 0 });
  const [wishlist, setWishlist] = useState({ items: [] });
  const [wishlistLoading, setWishlistLoading] = useState({});
  const [productsLoading, setProductsLoading] = useState(false);
  const [cartLoading, setCartLoading] = useState({});
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [cartPrompt, setCartPrompt] = useState({ productId: null, visible: false });
  const [searchQuery, setSearchQuery] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);
  const [showHeaderSearch, setShowHeaderSearch] = useState(false);
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingDeliveries: 0,
    totalProducts: 0,
    newNotifications: 0,
    lowStockProducts: 0,
    todayOrders: 0,
    weekOrders: 0,
    monthOrders: 0,
    todayRevenue: 0,
    weekRevenue: 0,
    monthRevenue: 0,
    pendingAmount: 0,
    revenue: {
      totalRevenue: 0,
      averageOrderValue: 0,
      completedOrders: 0
    },
    statusStats: {},
    totalCustomers: 0,
    activeCustomers: 0
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [statsLoading, setStatsLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showProductModal, setShowProductModal] = useState(false);
  const [videos, setVideos] = useState([]);
  const [videosLoading, setVideosLoading] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [videoCategory, setVideoCategory] = useState('all');

  useEffect(() => {
    const initializeUser = async () => {
      let currentUser = authService.getCurrentUser();
      if (!currentUser) {
        window.location.href = '/login';
        return;
      }
      
      // Ensure user profile is refreshed from backend (to get latest role)
      if (!currentUser.role) {
        console.log('🔄 Refreshing user profile to fetch role...');
        const refreshed = await authService.refreshUserProfile();
        currentUser = refreshed || currentUser;
        console.log('✅ User refreshed:', currentUser);
        console.log('🎭 User role after refresh:', currentUser?.role);
      }
      
      setUser(currentUser);
      
      // Fetch stats immediately after user is set if on overview tab
      if (activeTab === 'overview' && currentUser) {
        console.log('📊 Triggering initial stats fetch with role:', currentUser.role);
        fetchDashboardStatsWithUser(currentUser);
      }
    };
    
    initializeUser();
  }, []);

  // Fetch products when products tab is active
  useEffect(() => {
    if (activeTab === 'products') {
      fetchProducts();
      fetchWishlist();
    }
  }, [activeTab]);

  // Fetch cart when cart tab is active
  useEffect(() => {
    if (activeTab === 'cart') {
      fetchCart();
    }
  }, [activeTab]);

  // Fetch dashboard stats when overview tab is active and user changes
  useEffect(() => {
    if (activeTab === 'overview' && user?.role) {
      console.log('📊 useEffect triggered - fetching stats for role:', user.role);
      fetchDashboardStats();
    }
  }, [activeTab, user?.role]); // Only depend on the role property, not the whole user object

  // Fetch recommendations when recommendations tab is active
  useEffect(() => {
    if (activeTab === 'recommendations') {
      // Component will handle fetching
    }
  }, [activeTab]);

  // Fetch videos when videos tab is active
  useEffect(() => {
    if (activeTab === 'videos') {
      fetchVideos();
    }
  }, [activeTab, videoCategory]);

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

  const fetchDashboardStatsWithUser = async (userObj) => {
    setStatsLoading(true);
    try {
      console.log('🔍 fetchDashboardStatsWithUser called');
      console.log('👤 User object:', userObj);
      console.log('🎭 User role:', userObj?.role);
      
      const isAdmin = (userObj?.role === 'admin');
      const endpoint = isAdmin ? 'admin dashboard' : 'user dashboard';
      
      console.log(`📊 Fetching ${endpoint} stats`);
      console.log(`🔑 Is Admin: ${isAdmin}`);
      
      const data = isAdmin
        ? await customerProductService.getAdminDashboardStats()
        : await customerProductService.getDashboardStats();
      
      console.log('✅ Stats data received:', data);
      console.log('📦 Total Orders:', data.totalOrders);
      console.log('⏳ Pending Deliveries:', data.pendingDeliveries);
      console.log('💰 Month Revenue:', data.monthRevenue);
      
      setStats({
        totalOrders: data.totalOrders || 0,
        pendingDeliveries: data.pendingDeliveries || 0,
        totalProducts: data.totalProducts || 0,
        newNotifications: data.newNotifications || 0,
        lowStockProducts: data.lowStockProducts || 0,
        todayOrders: data.todayOrders || 0,
        weekOrders: data.weekOrders || 0,
        monthOrders: data.monthOrders || 0,
        todayRevenue: data.todayRevenue || 0,
        weekRevenue: data.weekRevenue || 0,
        monthRevenue: data.monthRevenue || 0,
        pendingAmount: data.pendingAmount || 0,
        revenue: data.revenue || { totalRevenue: 0, averageOrderValue: 0, completedOrders: 0 },
        statusStats: data.statusStats || {},
        totalCustomers: data.totalCustomers || 0,
        activeCustomers: data.activeCustomers || 0
      });
      
      console.log('✅ Stats state updated');
      setRecentActivity(data.recentActivity || []);
      setErrorMessage("");
    } catch (error) {
      console.error('❌ Error fetching dashboard stats:', error);
      setErrorMessage(`Failed to load dashboard stats: ${error.message}`);
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchDashboardStats = async () => {
    await fetchDashboardStatsWithUser(user);
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
      fetchCart();
    } catch (error) {
      console.error('Error removing from cart:', error);
      setErrorMessage("Failed to remove item from cart");
    }
  };

  const fetchWishlist = async () => {
    if (!user?.uid || !auth.currentUser) return;
    try {
      const token = await auth.currentUser.getIdToken();
      const response = await fetch(`/api/wishlist/${user.uid}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        const data = await response.json();
        setWishlist(data);
      }
    } catch (error) {
      console.error('Error fetching wishlist:', error);
    }
  };

  const toggleWishlist = async (productId) => {
    if (!user?.uid || !auth.currentUser) return;
    
    setWishlistLoading(prev => ({ ...prev, [productId]: true }));
    
    try {
      const isInWishlist = wishlist.items.some(item => item.product._id === productId);
      const token = await auth.currentUser.getIdToken();
      
      if (isInWishlist) {
        // Remove from wishlist
        const response = await fetch(`/api/wishlist/item/${productId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        if (response.ok) {
          setSuccessMessage('Removed from wishlist');
          fetchWishlist();
        }
      } else {
        // Add to wishlist
        const response = await fetch('/api/wishlist/add', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ productId })
        });
        if (response.ok) {
          setSuccessMessage('Added to wishlist ❤️');
          fetchWishlist();
        }
      }
      
      setTimeout(() => setSuccessMessage(''), 2000);
    } catch (error) {
      console.error('Error toggling wishlist:', error);
      setErrorMessage('Failed to update wishlist');
      setTimeout(() => setErrorMessage(''), 3000);
    } finally {
      setWishlistLoading(prev => ({ ...prev, [productId]: false }));
    }
  };

  const isInWishlist = (productId) => {
    return wishlist.items.some(item => item.product._id === productId);
  };

  const fetchVideos = async () => {
    setVideosLoading(true);
    setErrorMessage("");
    try {
      const token = await auth.currentUser.getIdToken();
      const category = videoCategory !== 'all' ? `?category=${videoCategory}` : '';
      console.log('📹 Fetching videos with category:', videoCategory);
      const response = await fetch(`/api/videos${category}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('📹 Videos response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('📹 Videos received:', data);
        console.log('📹 Number of videos:', data.videos?.length || 0);
        setVideos(data.videos || []);
      } else {
        const errorText = await response.text();
        console.error('❌ Failed to load videos:', response.status, errorText);
        setErrorMessage('Failed to load videos');
      }
    } catch (error) {
      console.error('❌ Error fetching videos:', error);
      setErrorMessage('Failed to load videos');
    } finally {
      setVideosLoading(false);
    }
  };

  const handleVideoLike = async (videoId) => {
    try {
      const token = await auth.currentUser.getIdToken();
      const response = await fetch(`/api/videos/${videoId}/like`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        // Update videos list
        setVideos(prev => prev.map(v => 
          v._id === videoId ? { ...v, likes: data.likes } : v
        ));
        // Update selectedVideo if it's the one being liked
        if (selectedVideo && selectedVideo._id === videoId) {
          setSelectedVideo(prev => ({ ...prev, likes: data.likes }));
        }
        setSuccessMessage(data.liked ? 'Video liked! ❤️' : 'Video unliked');
        setTimeout(() => setSuccessMessage(''), 2000);
      }
    } catch (error) {
      console.error('Error liking video:', error);
      setErrorMessage('Failed to like video');
      setTimeout(() => setErrorMessage(''), 3000);
    }
  };

  const openVideo = async (video) => {
    try {
      const token = await auth.currentUser.getIdToken();
      // Call GET endpoint which tracks the view and returns updated video data
      const response = await fetch(`/api/videos/${video._id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        // Update the video in the list with new view count
        setVideos(prev => prev.map(v => 
          v._id === video._id ? { ...v, viewCount: data.video.viewCount, likes: data.video.likes } : v
        ));
        // Set the updated video data in the modal
        setSelectedVideo(data.video);
        setShowVideoModal(true);
      } else {
        // Fallback: show video with current data
        setSelectedVideo(video);
        setShowVideoModal(true);
      }
    } catch (error) {
      console.error('Error opening video:', error);
      // Fallback: show video with current data
      setSelectedVideo(video);
      setShowVideoModal(true);
    }
  };

  const proceedToHubCollection = () => {
    if (cart.items.length === 0) {
      setErrorMessage('Your cart is empty');
      return;
    }
    // Navigate directly to checkout with hub collection flag
    navigate('/checkout', {
      state: {
        cartItems: cart.items,
        deliveryType: 'HUB_COLLECTION'
      }
    });
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
    ...(user?.role !== 'admin' ? [
      { id: 'orders', label: 'My Orders', icon: ShoppingCart },
      { id: 'reviews', label: 'My Reviews', icon: Sparkles },
      { id: 'products', label: 'Products', icon: Package },
      { id: 'videos', label: 'Videos', icon: VideoIcon },
      { id: 'wishlist', label: 'My Wishlist', icon: Heart },
      { id: 'recommendations', label: 'Recommendations', icon: Sparkles },
      { id: 'cart', label: 'My Cart', icon: ShoppingCart },
    ] : []),
    ...(user?.role === 'deliveryboy' ? [{ id: 'deliveries', label: 'Deliveries', icon: Truck }] : []),
    ...(user?.role === 'admin' ? [
      { id: 'admin-users', label: 'User Management', icon: User },
      { id: 'admin-products', label: 'Product Management', icon: Package },
      { id: 'admin-stock', label: 'Stock Management', icon: Package2 },
      { id: 'admin-hub-inventory', label: 'Hub Inventory', icon: Package2 },
      { id: 'admin-videos', label: 'Video Management', icon: VideoIcon },
      { id: 'admin-demand-predictions', label: 'Demand Predictions', icon: Sparkles },
      { id: 'admin-customer-segmentation', label: 'Customer Segmentation', icon: Target },
      { id: 'admin-customer-reviews', label: 'Customer Reviews', icon: Sparkles },
      { id: 'admin-orders', label: 'All Orders', icon: ShoppingCart },
      { id: 'admin-delivery-status', label: 'Delivery Status', icon: Truck }
    ] : []),
    { id: 'profile', label: 'Profile', icon: User }
  ];

  const renderOverview = () => (
    <div>
      {errorMessage && (
        <div style={{
          padding: '1rem',
          marginBottom: '1.5rem',
          backgroundColor: '#fee2e2',
          border: '1px solid #fca5a5',
          borderRadius: '0.5rem',
          color: '#991b1b',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem'
        }}>
          <AlertCircle size={20} />
          <span>{errorMessage}</span>
        </div>
      )}

      {statsLoading ? (
        <div style={{
          padding: '3rem',
          textAlign: 'center',
          color: '#6b7280'
        }}>
          <div style={{
            width: '50px',
            height: '50px',
            border: '4px solid #f3f4f6',
            borderTop: '4px solid #10b981',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem'
          }}></div>
          <p>Loading dashboard statistics...</p>
        </div>
      ) : (
        <>
          {/* Admin-specific enhanced stats */}
          {user?.role === 'admin' && (
        <>
          {/* Primary Stats */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '1.5rem',
            marginBottom: '2rem'
          }}>
            <div style={{...statCardStyle, borderLeft: '4px solid #3b82f6'}}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Total Orders</p>
                  <h3 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>
                    {stats.totalOrders}
                  </h3>
                </div>
                <ShoppingCart size={28} color="#3b82f6" />
              </div>
            </div>

            <div style={{...statCardStyle, borderLeft: '4px solid #f59e0b'}}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Pending Actions</p>
                  <h3 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>
                    {stats.pendingDeliveries}
                  </h3>
                  <p style={{ color: '#f59e0b', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                    ₹{stats.pendingAmount?.toLocaleString() || 0}
                  </p>
                </div>
                <Truck size={28} color="#f59e0b" />
              </div>
            </div>

            <div style={{...statCardStyle, borderLeft: '4px solid #10b981'}}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Available Products</p>
                  <h3 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>
                    {stats.totalProducts}
                  </h3>
                  {stats.lowStockProducts > 0 && (
                    <p style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                      ⚠️ {stats.lowStockProducts} low stock
                    </p>
                  )}
                </div>
                <Package size={28} color="#10b981" />
              </div>
            </div>

            <div style={{...statCardStyle, borderLeft: '4px solid #8b5cf6'}}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Total Customers</p>
                  <h3 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>
                    {stats.totalCustomers}
                  </h3>
                  <p style={{ color: '#8b5cf6', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                    {stats.activeCustomers} active
                  </p>
                </div>
                <User size={28} color="#8b5cf6" />
              </div>
            </div>
          </div>

          {/* Revenue Stats */}
          <div style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '12px',
            padding: '1.5rem',
            color: 'white',
            marginBottom: '2rem',
            boxShadow: '0 4px 20px rgba(102, 126, 234, 0.3)'
          }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <DollarSign size={24} />
              Revenue Overview
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1.5rem' }}>
              <div>
                <p style={{ opacity: 0.9, fontSize: '0.875rem', marginBottom: '0.5rem' }}>Today</p>
                <p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>₹{stats.todayRevenue?.toLocaleString() || 0}</p>
                <p style={{ opacity: 0.8, fontSize: '0.75rem' }}>{stats.todayOrders || 0} orders</p>
              </div>
              <div>
                <p style={{ opacity: 0.9, fontSize: '0.875rem', marginBottom: '0.5rem' }}>This Week</p>
                <p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>₹{stats.weekRevenue?.toLocaleString() || 0}</p>
                <p style={{ opacity: 0.8, fontSize: '0.75rem' }}>{stats.weekOrders || 0} orders</p>
              </div>
              <div>
                <p style={{ opacity: 0.9, fontSize: '0.875rem', marginBottom: '0.5rem' }}>This Month</p>
                <p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>₹{stats.monthRevenue?.toLocaleString() || 0}</p>
                <p style={{ opacity: 0.8, fontSize: '0.75rem' }}>{stats.monthOrders || 0} orders</p>
              </div>
              <div>
                <p style={{ opacity: 0.9, fontSize: '0.875rem', marginBottom: '0.5rem' }}>All Time</p>
                <p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>₹{stats.revenue?.totalRevenue?.toLocaleString() || 0}</p>
                <p style={{ opacity: 0.8, fontSize: '0.75rem' }}>
                  Avg: ₹{stats.revenue?.averageOrderValue?.toLocaleString() || 0}
                </p>
              </div>
            </div>
          </div>

          {/* Order Status Breakdown */}
          <div style={{
            ...cardStyle,
            marginBottom: '2rem'
          }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem', color: '#1f2937' }}>
              Order Status Breakdown
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem' }}>
              {Object.entries(stats.statusStats || {}).map(([status, count]) => (
                <div key={status} style={{
                  padding: '1rem',
                  background: '#f9fafb',
                  borderRadius: '8px',
                  textAlign: 'center',
                  border: '1px solid #e5e7eb'
                }}>
                  <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '0.25rem' }}>
                    {count}
                  </p>
                  <p style={{ fontSize: '0.75rem', color: '#6b7280', textTransform: 'capitalize' }}>
                    {status.replace(/_/g, ' ').toLowerCase()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Regular user stats (original) */}
      {user?.role !== 'admin' && (
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
      )}

        </>
      )}

      <div style={cardStyle}>
        <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '1rem' }}>
          Recent Activity
        </h3>
        {statsLoading ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
            Loading activity...
          </div>
        ) : recentActivity && recentActivity.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {recentActivity.map((activity, index) => {
              const getStatusColor = (status) => {
                switch(status) {
                  case 'PENDING': return { bg: '#f0fdf4', border: '#bbf7d0', icon: '#10b981', text: 'Order Pending' };
                  case 'APPROVED': return { bg: '#fef3c7', border: '#fde68a', icon: '#f59e0b', text: 'Order Approved' };
                  case 'OUT_FOR_DELIVERY': return { bg: '#dbeafe', border: '#7dd3fc', icon: '#0ea5e9', text: 'Out for Delivery' };
                  case 'DELIVERED': return { bg: '#f0fdf4', border: '#bbf7d0', icon: '#10b981', text: 'Delivered' };
                  case 'CANCELLED': return { bg: '#fee2e2', border: '#fecaca', icon: '#ef4444', text: 'Cancelled' };
                  default: return { bg: '#f3f4f6', border: '#e5e7eb', icon: '#6b7280', text: 'Order Updated' };
                }
              };
              
              const colors = getStatusColor(activity.status);
              const productNames = activity.items
                ?.map(item => item.product?.name || 'Unknown Product')
                .join(', ') || 'Unknown Product';
              const orderDate = new Date(activity.createdAt).toLocaleDateString();
              
              return (
                <div key={activity._id} style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  padding: '1rem', 
                  background: colors.bg, 
                  borderRadius: '8px',
                  border: `1px solid ${colors.border}`
                }}>
                  <Package size={20} color={colors.icon} style={{ marginRight: '1rem', flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontWeight: '500', color: '#1f2937', margin: 0 }}>{colors.text}</p>
                    <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: '0.25rem 0 0 0', wordBreak: 'break-word' }}>
                      {productNames} - {orderDate}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p style={{ color: '#6b7280', textAlign: 'center', padding: '2rem' }}>
            No recent activity. Place your first order!
          </p>
        )}
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
                      background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
                      border: 'none',
                      borderRadius: '16px',
                      padding: '0',
                      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                      transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                      position: 'relative',
                      overflow: 'hidden',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-8px) scale(1.02)';
                      e.currentTarget.style.boxShadow = '0 12px 40px rgba(5, 150, 105, 0.25)';
                      customerProductService.trackProductBrowsing(product._id).catch(() => {});
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0) scale(1)';
                      e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.08)';
                    }}
                  >
                    {/* Gradient Top Bar */}
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: '4px',
                      background: 'linear-gradient(90deg, #10b981 0%, #059669 100%)'
                    }} />

                    <div style={{ padding: '1.5rem' }}>
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
                          fontSize: '1.125rem',
                          fontWeight: '700',
                          letterSpacing: '-0.025em'
                        }}>
                          {product.name}
                        </h4>
                        <span style={{
                          padding: '0.375rem 0.875rem',
                          borderRadius: '20px',
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          background: product.type === 'Bush' 
                            ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' 
                            : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                          color: 'white',
                          boxShadow: product.type === 'Bush'
                            ? '0 4px 12px rgba(239, 68, 68, 0.3)'
                            : '0 4px 12px rgba(59, 130, 246, 0.3)',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px'
                        }}>
                          {product.type}
                        </span>
                      </div>

                      {/* Product Image */}
                      {product.image && (
                        <div style={{
                          position: 'relative',
                          marginBottom: '1rem',
                          borderRadius: '12px',
                          overflow: 'hidden',
                          boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)'
                        }}>
                          <img 
                            src={product.image} 
                            alt={product.name} 
                            style={{
                              width: '100%',
                              height: '220px',
                              objectFit: 'cover',
                              transition: 'transform 0.4s ease',
                              imageRendering: 'high-quality',
                              WebkitBackfaceVisibility: 'hidden'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                          />
                          {/* Image Overlay Badge */}
                          <div style={{
                            position: 'absolute',
                            bottom: '10px',
                            right: '10px',
                            background: 'rgba(255, 255, 255, 0.95)',
                            backdropFilter: 'blur(10px)',
                            padding: '0.375rem 0.75rem',
                            borderRadius: '8px',
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            color: product.stock > 10 ? '#059669' : product.stock > 0 ? '#d97706' : '#dc2626',
                            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)'
                          }}>
                            ⚡ {product.stock > 0 ? 'Available' : 'Sold Out'}
                          </div>
                          
                          {/* Wishlist Heart Button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleWishlist(product._id);
                            }}
                            disabled={wishlistLoading[product._id]}
                            style={{
                              position: 'absolute',
                              top: '10px',
                              right: '10px',
                              background: isInWishlist(product._id) ? '#ef4444' : 'rgba(255, 255, 255, 0.95)',
                              backdropFilter: 'blur(10px)',
                              border: 'none',
                              borderRadius: '50%',
                              width: '40px',
                              height: '40px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: wishlistLoading[product._id] ? 'not-allowed' : 'pointer',
                              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                              transition: 'all 0.3s ease',
                              opacity: wishlistLoading[product._id] ? 0.6 : 1
                            }}
                            onMouseEnter={(e) => {
                              if (!wishlistLoading[product._id]) {
                                e.currentTarget.style.transform = 'scale(1.1)';
                              }
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = 'scale(1)';
                            }}
                          >
                            <Heart 
                              size={20} 
                              color={isInWishlist(product._id) ? 'white' : '#ef4444'}
                              fill={isInWishlist(product._id) ? 'white' : 'none'}
                            />
                          </button>
                        </div>
                      )}

                      {/* Product Description */}
                      <p style={{ 
                        color: '#6b7280', 
                        fontSize: '0.875rem', 
                        lineHeight: '1.6',
                        marginBottom: '1.25rem',
                        height: '48px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical'
                      }}>
                        {product.description}
                      </p>

                      {/* View Details Button */}
                      <button
                        onClick={() => {
                          setSelectedProduct(product);
                          setShowProductModal(true);
                        }}
                        style={{
                          width: '100%',
                          padding: '0.625rem',
                          marginBottom: '1rem',
                          background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
                          color: '#059669',
                          border: '2px solid #10b981',
                          borderRadius: '10px',
                          cursor: 'pointer',
                          fontSize: '0.875rem',
                          fontWeight: '600',
                          transition: 'all 0.3s ease',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.5rem'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
                          e.currentTarget.style.color = 'white';
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(5, 150, 105, 0.3)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)';
                          e.currentTarget.style.color = '#059669';
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                      >
                        <span style={{ fontSize: '1rem' }}>👁️</span> View Details
                      </button>

                      {/* Price and Stock */}
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center', 
                        marginBottom: '1rem',
                        padding: '0.75rem',
                        background: 'linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)',
                        borderRadius: '10px'
                      }}>
                        <span style={{ 
                          fontWeight: '800', 
                          fontSize: '1.75rem', 
                          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                          letterSpacing: '-0.5px'
                        }}>
                          ₹{product.price}
                        </span>
                        <span style={{ 
                          padding: '0.375rem 0.75rem',
                          borderRadius: '8px',
                          background: product.stock > 10 ? '#d1fae5' : product.stock > 0 ? '#fef3c7' : '#fee2e2',
                          color: product.stock > 10 ? '#059669' : product.stock > 0 ? '#d97706' : '#dc2626',
                          fontWeight: '600',
                          fontSize: '0.75rem'
                        }}>
                          📦 {product.stock} left
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
                          padding: '0.875rem',
                          background: product.stock > 0 
                            ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' 
                            : '#d1d5db',
                          color: 'white',
                          border: 'none',
                          borderRadius: '12px',
                          cursor: product.stock > 0 && !cartLoading[product._id] ? 'pointer' : 'not-allowed',
                          fontWeight: '700',
                          fontSize: '0.9375rem',
                          transition: 'all 0.3s ease',
                          position: 'relative',
                          boxShadow: product.stock > 0 ? '0 4px 15px rgba(5, 150, 105, 0.4)' : 'none',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px'
                        }}
                        onMouseEnter={(e) => {
                          if (product.stock > 0 && !cartLoading[product._id]) {
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.boxShadow = '0 6px 20px rgba(5, 150, 105, 0.5)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (product.stock > 0) {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 4px 15px rgba(5, 150, 105, 0.4)';
                          }
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
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      case 'wishlist':
        navigate('/wishlist');
        return null;
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
                  paddingTop: '1rem'
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '1rem'
                  }}>
                    <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#1f2937' }}>
                      Total: ₹{cart.total || 0}
                    </h3>
                  </div>

                  {/* Delivery Method Info Box */}
                  <div style={{ 
                    background: '#f0fdf4', 
                    border: '1px solid #86efac', 
                    borderRadius: '8px', 
                    padding: '1rem', 
                    marginBottom: '1rem',
                    fontSize: '0.875rem'
                  }}>
                    <div style={{ fontWeight: '600', color: '#065f46', marginBottom: '0.5rem' }}>
                      Choose Your Delivery Method
                    </div>
                    <div style={{ color: '#047857' }}>
                      • Home Delivery - Direct to your doorstep<br/>
                      • Hub Collection - Collect from nearest hub
                    </div>
                  </div>

                  {/* Delivery Method Buttons */}
                  <button
                    onClick={() => navigate('/checkout')}
                    disabled={cart.items.length === 0}
                    style={{
                      width: '100%',
                      padding: '0.75rem 2rem',
                      backgroundColor: '#10b981',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: cart.items.length === 0 ? 'not-allowed' : 'pointer',
                      fontSize: '1rem',
                      fontWeight: '600',
                      marginBottom: '0.75rem',
                      opacity: cart.items.length === 0 ? 0.5 : 1
                    }}
                  >
                    🏠 Home Delivery
                  </button>

                  <button
                    onClick={proceedToHubCollection}
                    disabled={cart.items.length === 0}
                    style={{
                      width: '100%',
                      padding: '0.75rem 2rem',
                      backgroundColor: '#2563eb',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: cart.items.length === 0 ? 'not-allowed' : 'pointer',
                      fontSize: '1rem',
                      fontWeight: '600',
                      opacity: cart.items.length === 0 ? 0.5 : 1
                    }}
                  >
                    📍 Hub Collection
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      case 'recommendations':
        return (
          <RecommendedProducts 
            onAddToCart={(productId, productName) => {
              addToCart(productId, productName);
            }}
            onProductClick={(product) => {
              // Could optionally navigate to product details here
              console.log('Product clicked:', product);
            }}
          />
        );
      case 'videos':
        const categories = [
          { value: 'all', label: 'All Videos' },
          { value: 'farming', label: 'Farming' },
          { value: 'processing', label: 'Processing' },
          { value: 'cooking', label: 'Cooking' },
          { value: 'benefits', label: 'Health Benefits' },
          { value: 'testimonial', label: 'Testimonials' },
          { value: 'tutorial', label: 'Tutorials' },
          { value: 'other', label: 'Other' }
        ];

        return (
          <div style={cardStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>
                🎥 Pepper Videos
              </h3>
              <button
                onClick={fetchVideos}
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
                <VideoIcon size={16} />
                Refresh
              </button>
            </div>

            {/* Category Filter */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: '#374151', fontWeight: '500' }}>
                Filter by Category
              </label>
              <select
                value={videoCategory}
                onChange={(e) => setVideoCategory(e.target.value)}
                style={{
                  width: '100%',
                  maxWidth: '300px',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '14px',
                  outline: 'none'
                }}
              >
                {categories.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>

            {/* Videos Display */}
            {videosLoading ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  border: '4px solid #e5e7eb',
                  borderTop: '4px solid #10b981',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                  margin: '0 auto 1rem'
                }}></div>
                Loading videos...
              </div>
            ) : videos.length === 0 ? (
              <div style={{
                padding: '3rem',
                backgroundColor: '#f9fafb',
                borderRadius: '8px',
                textAlign: 'center',
                border: '2px dashed #d1d5db'
              }}>
                <VideoIcon size={48} color="#9ca3af" style={{ marginBottom: '1rem' }} />
                <h4 style={{ color: '#374151', marginBottom: '0.5rem' }}>No Videos Available</h4>
                <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
                  No videos found in this category. Check back later!
                </p>
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                gap: '1.5rem'
              }}>
                {videos.map(video => (
                  <div
                    key={video._id}
                    style={{
                      background: 'white',
                      borderRadius: '12px',
                      overflow: 'hidden',
                      boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
                      transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                      cursor: 'pointer',
                      border: '1px solid #e5e7eb'
                    }}
                    onClick={() => openVideo(video)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-4px)';
                      e.currentTarget.style.boxShadow = '0 8px 20px rgba(0, 0, 0, 0.15)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.1)';
                    }}
                  >
                    {/* Thumbnail */}
                    <div style={{
                      position: 'relative',
                      paddingBottom: '56.25%',
                      background: video.thumbnail ? `url(${video.thumbnail})` : 'linear-gradient(135deg, #10b981, #059669)',
                      backgroundSize: 'cover',
                      backgroundPosition: 'center'
                    }}>
                      <div style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        background: 'rgba(0, 0, 0, 0.6)',
                        borderRadius: '50%',
                        padding: '1rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <Play size={32} color="white" />
                      </div>
                      {video.duration && (
                        <div style={{
                          position: 'absolute',
                          bottom: '8px',
                          right: '8px',
                          background: 'rgba(0, 0, 0, 0.8)',
                          color: 'white',
                          padding: '0.25rem 0.5rem',
                          borderRadius: '4px',
                          fontSize: '0.75rem'
                        }}>
                          {video.duration}
                        </div>
                      )}
                    </div>

                    {/* Video Info */}
                    <div style={{ padding: '1rem' }}>
                      <h4 style={{
                        margin: '0 0 0.5rem 0',
                        fontSize: '1rem',
                        fontWeight: '600',
                        color: '#1f2937',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {video.title}
                      </h4>
                      <p style={{
                        margin: '0 0 0.75rem 0',
                        fontSize: '0.875rem',
                        color: '#6b7280',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}>
                        {video.description}
                      </p>
                      
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: '0.75rem',
                        color: '#9ca3af'
                      }}>
                        <span style={{
                          backgroundColor: '#f3f4f6',
                          padding: '0.25rem 0.5rem',
                          borderRadius: '4px',
                          textTransform: 'capitalize'
                        }}>
                          {video.category}
                        </span>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                          <span>👁️ {video.viewCount || 0}</span>
                          <span>❤️ {video.likes || 0}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
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
      case 'reviews':
        return <MyReviews />;
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
                  // Navigate to dedicated pages
                  if (item.id === 'orders') {
                    navigate('/orders');
                  } else if (item.id === 'admin-stock') {
                    navigate('/admin-stock');
                  } else if (item.id === 'admin-hub-inventory') {
                    navigate('/admin-hub-inventory');
                  } else if (item.id === 'admin-users') {
                    navigate('/admin-users');
                  } else if (item.id === 'admin-products') {
                    navigate('/admin-products');
                  } else if (item.id === 'admin-demand-predictions') {
                    navigate('/admin-demand-predictions');
                  } else if (item.id === 'admin-customer-segmentation') {
                    navigate('/admin-customer-segmentation');
                  } else if (item.id === 'admin-videos') {
                    navigate('/admin-videos');
                  } else if (item.id === 'admin-customer-reviews') {
                    navigate('/admin-customer-reviews');
                  } else if (item.id === 'admin-orders') {
                    navigate('/admin-orders');
                  } else if (item.id === 'admin-delivery-status') {
                    navigate('/admin-delivery-status');
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

      {/* Product Detail Modal */}
      {showProductModal && selectedProduct && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem',
            animation: 'fadeIn 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
          onClick={() => setShowProductModal(false)}
        >
          <div
            style={{
              background: 'linear-gradient(135deg, #ffffff 0%, #f9fafb 50%, #ffffff 100%)',
              borderRadius: '32px',
              maxWidth: '950px',
              width: '100%',
              maxHeight: '90vh',
              overflow: 'auto',
              position: 'relative',
              boxShadow: '0 40px 100px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.2)',
              animation: 'modalSlideUp 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
              transform: 'translateZ(0)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Decorative gradient overlay */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '200px',
              background: 'linear-gradient(180deg, rgba(16, 185, 129, 0.08) 0%, transparent 100%)',
              borderRadius: '32px 32px 0 0',
              pointerEvents: 'none'
            }} />

            {/* Close Button */}
            <button
              onClick={() => setShowProductModal(false)}
              style={{
                position: 'absolute',
                top: '1.5rem',
                right: '1.5rem',
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                border: 'none',
                background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                color: 'white',
                fontSize: '2rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 10,
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: '0 8px 20px rgba(220, 38, 38, 0.5)',
                fontWeight: '300',
                lineHeight: '1',
                animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'rotate(90deg) scale(1.15)';
                e.currentTarget.style.boxShadow = '0 12px 30px rgba(220, 38, 38, 0.7)';
                e.currentTarget.style.animation = 'none';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'rotate(0deg) scale(1)';
                e.currentTarget.style.boxShadow = '0 8px 20px rgba(220, 38, 38, 0.5)';
                e.currentTarget.style.animation = 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite';
              }}
            >
              ×
            </button>

            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '2rem', 
              padding: '2.5rem',
              position: 'relative'
            }}>
              {/* Product Image with enhanced styling */}
              {selectedProduct.image && (
                <div style={{
                  width: '100%',
                  height: '520px',
                  borderRadius: '24px',
                  overflow: 'hidden',
                  background: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)',
                  boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15), inset 0 0 0 1px rgba(255, 255, 255, 0.5)',
                  position: 'relative',
                  animation: 'imageZoomIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)'
                }}>
                  {/* Image border glow effect */}
                  <div style={{
                    position: 'absolute',
                    inset: '-2px',
                    background: 'linear-gradient(135deg, #10b981, #3b82f6, #8b5cf6)',
                    borderRadius: '24px',
                    opacity: 0.3,
                    filter: 'blur(10px)',
                    zIndex: -1
                  }} />
                  
                  <img
                    src={selectedProduct.image}
                    alt={selectedProduct.name}
                    loading="eager"
                    decoding="async"
                    fetchpriority="high"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain',
                      imageRendering: '-webkit-optimize-contrast',
                      WebkitBackfaceVisibility: 'hidden',
                      backfaceVisibility: 'hidden',
                      WebkitFontSmoothing: 'antialiased',
                      MozOsxFontSmoothing: 'grayscale',
                      transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                      padding: '1rem',
                      filter: 'contrast(1.05) saturate(1.1)'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  />
                </div>
              )}

              {/* Product Header with animation */}
              <div style={{ animation: 'slideInLeft 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.2s both' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
                  <h2 style={{
                    fontSize: '2.25rem',
                    fontWeight: '800',
                    background: 'linear-gradient(135deg, #1f2937 0%, #10b981 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    margin: 0,
                    letterSpacing: '-0.02em'
                  }}>
                    {selectedProduct.name}
                  </h2>
                  <span style={{
                    padding: '0.625rem 1.25rem',
                    borderRadius: '25px',
                    fontSize: '0.875rem',
                    fontWeight: '700',
                    backgroundColor: selectedProduct.type === 'Bush' ? '#fee2e2' : '#dbeafe',
                    color: selectedProduct.type === 'Bush' ? '#991b1b' : '#1e40af',
                    border: `2px solid ${selectedProduct.type === 'Bush' ? '#fecaca' : '#bfdbfe'}`,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1)',
                    animation: 'bounceIn 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55) 0.3s both'
                  }}>
                    {selectedProduct.type}
                  </span>
                </div>

                <p style={{
                  fontSize: '2.75rem',
                  fontWeight: '800',
                  background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  margin: '0.75rem 0',
                  textShadow: '0 2px 10px rgba(16, 185, 129, 0.2)',
                  animation: 'pricePopIn 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55) 0.4s both'
                }}>
                  ₹{selectedProduct.price}
                </p>

                <p style={{
                  fontSize: '1.05rem',
                  color: '#6b7280',
                  lineHeight: '1.7',
                  marginTop: '1rem',
                  padding: '1rem',
                  backgroundColor: 'rgba(249, 250, 251, 0.8)',
                  borderRadius: '12px',
                  borderLeft: '4px solid #10b981'
                }}>
                  {selectedProduct.description}
                </p>
              </div>

              {/* Product Specifications with enhanced animation */}
              <div style={{ animation: 'slideInRight 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.3s both' }}>
                <h3 style={{
                  fontSize: '1.5rem',
                  fontWeight: '700',
                  color: '#1f2937',
                  marginBottom: '1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <span style={{
                    width: '8px',
                    height: '32px',
                    background: 'linear-gradient(180deg, #10b981 0%, #059669 100%)',
                    borderRadius: '4px'
                  }} />
                  Product Specifications
                </h3>
                <div style={{
                  border: '2px solid #e5e7eb',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  boxShadow: '0 10px 25px rgba(0, 0, 0, 0.08)',
                  background: 'white'
                }}>
                  {[
                    { label: 'Propagation Method', value: selectedProduct.propagationMethod || 'Cutting', icon: '🌱' },
                    { label: 'Maturity Duration', value: selectedProduct.maturityDuration || '1.5 years', icon: '⏳' },
                    { label: 'Blooming Season', value: selectedProduct.bloomingSeason || 'All season', icon: '🌸' },
                    { label: 'Plant Age', value: selectedProduct.plantAge || '3 Months', icon: '🌿' }
                  ].map((spec, index) => (
                    <div 
                      key={index}
                      style={{
                        display: 'flex',
                        borderBottom: index < 3 ? '1px solid #e5e7eb' : 'none',
                        fontSize: '1rem',
                        transition: 'all 0.3s ease',
                        animation: `specSlideIn 0.5s ease ${0.4 + index * 0.1}s both`
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(16, 185, 129, 0.05)';
                        e.currentTarget.style.transform = 'translateX(5px)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.transform = 'translateX(0)';
                      }}
                    >
                      <div style={{
                        flex: 1,
                        padding: '1.25rem',
                        color: '#6b7280',
                        fontWeight: '600',
                        backgroundColor: 'rgba(249, 250, 251, 0.8)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem'
                      }}>
                        <span style={{ fontSize: '1.5rem' }}>{spec.icon}</span>
                        {spec.label}
                      </div>
                      <div style={{
                        flex: 1,
                        padding: '1.25rem',
                        borderLeft: '1px solid #e5e7eb',
                        color: '#1f2937',
                        fontWeight: '700',
                        fontSize: '1.05rem',
                        display: 'flex',
                        alignItems: 'center'
                      }}>
                        {spec.value}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Stock and Add to Cart with enhanced styling */}
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '1.25rem',
                animation: 'fadeInUp 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.5s both'
              }}>
                <div style={{
                  padding: '1.25rem',
                  borderRadius: '16px',
                  backgroundColor: selectedProduct.stock > 10 ? 'rgba(240, 253, 244, 0.8)' : selectedProduct.stock > 0 ? 'rgba(254, 243, 199, 0.8)' : 'rgba(254, 242, 242, 0.8)',
                  border: `2px solid ${selectedProduct.stock > 10 ? '#86efac' : selectedProduct.stock > 0 ? '#fcd34d' : '#fca5a5'}`,
                  boxShadow: `0 8px 20px ${selectedProduct.stock > 10 ? 'rgba(16, 185, 129, 0.15)' : selectedProduct.stock > 0 ? 'rgba(217, 119, 6, 0.15)' : 'rgba(220, 38, 38, 0.15)'}`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  <span style={{ fontSize: '1.75rem' }}>
                    {selectedProduct.stock > 10 ? '✅' : selectedProduct.stock > 0 ? '⚠️' : '❌'}
                  </span>
                  <span style={{
                    color: selectedProduct.stock > 10 ? '#059669' : selectedProduct.stock > 0 ? '#d97706' : '#dc2626',
                    fontWeight: '700',
                    fontSize: '1.125rem'
                  }}>
                    {selectedProduct.stock > 0 ? `${selectedProduct.stock} units in stock` : 'Out of stock'}
                  </span>
                </div>

                <button
                  onClick={() => {
                    addToCart(selectedProduct._id, selectedProduct.name);
                    setShowProductModal(false);
                  }}
                  disabled={selectedProduct.stock === 0 || cartLoading[selectedProduct._id]}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.75rem',
                    padding: '1.25rem',
                    background: selectedProduct.stock > 0 
                      ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' 
                      : 'linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '16px',
                    cursor: selectedProduct.stock > 0 && !cartLoading[selectedProduct._id] ? 'pointer' : 'not-allowed',
                    fontWeight: '700',
                    fontSize: '1.125rem',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: selectedProduct.stock > 0 
                      ? '0 10px 30px rgba(16, 185, 129, 0.3)' 
                      : '0 4px 10px rgba(156, 163, 175, 0.2)',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                  onMouseEnter={(e) => {
                    if (selectedProduct.stock > 0 && !cartLoading[selectedProduct._id]) {
                      e.currentTarget.style.transform = 'translateY(-3px) scale(1.02)';
                      e.currentTarget.style.boxShadow = '0 15px 40px rgba(16, 185, 129, 0.5)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0) scale(1)';
                    e.currentTarget.style.boxShadow = selectedProduct.stock > 0 
                      ? '0 10px 30px rgba(16, 185, 129, 0.3)' 
                      : '0 4px 10px rgba(156, 163, 175, 0.2)';
                  }}
                >
                  {/* Shimmer effect overlay */}
                  {selectedProduct.stock > 0 && !cartLoading[selectedProduct._id] && (
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      left: '-100%',
                      width: '100%',
                      height: '100%',
                      background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent)',
                      animation: 'shimmer 3s infinite'
                    }} />
                  )}
                  
                  <span style={{ 
                    fontSize: '1.25rem',
                    position: 'relative',
                    zIndex: 1
                  }}>
                    🛒
                  </span>
                  <span style={{ position: 'relative', zIndex: 1 }}>
                    {cartLoading[selectedProduct._id] ? (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{
                          width: '20px',
                          height: '20px',
                          border: '2px solid transparent',
                          borderTop: '2px solid white',
                          borderRadius: '50%',
                          animation: 'spin 0.6s linear infinite'
                        }} />
                        Adding to Cart...
                      </span>
                    ) : selectedProduct.stock > 0 ? (
                      'Add to Cart'
                    ) : (
                      'Out of Stock'
                    )}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { 
            opacity: 0;
            transform: translateY(30px) scale(0.95);
          }
          to { 
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        @keyframes modalSlideUp {
          from { 
            opacity: 0;
            transform: translateY(50px) scale(0.9) rotateX(10deg);
          }
          to { 
            opacity: 1;
            transform: translateY(0) scale(1) rotateX(0deg);
          }
        }
        @keyframes imageZoomIn {
          from { 
            opacity: 0;
            transform: scale(0.8);
          }
          to { 
            opacity: 1;
            transform: scale(1);
          }
        }
        @keyframes slideInLeft {
          from { 
            opacity: 0;
            transform: translateX(-30px);
          }
          to { 
            opacity: 1;
            transform: translateX(0);
          }
        }
        @keyframes slideInRight {
          from { 
            opacity: 0;
            transform: translateX(30px);
          }
          to { 
            opacity: 1;
            transform: translateX(0);
          }
        }
        @keyframes bounceIn {
          0% { 
            opacity: 0;
            transform: scale(0.3) rotate(-10deg);
          }
          50% { 
            opacity: 1;
            transform: scale(1.05) rotate(2deg);
          }
          70% { 
            transform: scale(0.95) rotate(-1deg);
          }
          100% { 
            transform: scale(1) rotate(0);
          }
        }
        @keyframes pricePopIn {
          0% { 
            opacity: 0;
            transform: scale(0.5);
          }
          50% { 
            transform: scale(1.1);
          }
          100% { 
            opacity: 1;
            transform: scale(1);
          }
        }
        @keyframes specSlideIn {
          from { 
            opacity: 0;
            transform: translateY(20px);
          }
          to { 
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes fadeInUp {
          from { 
            opacity: 0;
            transform: translateY(20px);
          }
          to { 
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes shimmer {
          0% { left: -100%; }
          100% { left: 100%; }
        }
        @keyframes pulse {
          0%, 100% { 
            opacity: 1;
            transform: scale(1);
          }
          50% { 
            opacity: 0.8;
            transform: scale(0.98);
          }
        }
      `}</style>

      {/* Video Modal */}
      {showVideoModal && selectedVideo && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem',
            animation: 'fadeIn 0.3s ease'
          }}
          onClick={() => setShowVideoModal(false)}
        >
          <div
            style={{
              background: 'white',
              borderRadius: '16px',
              maxWidth: '1200px',
              width: '100%',
              maxHeight: '90vh',
              overflow: 'auto',
              position: 'relative',
              boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setShowVideoModal(false)}
              style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: 'rgba(0, 0, 0, 0.5)',
                color: 'white',
                border: 'none',
                fontSize: '1.5rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 10,
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = '#ef4444';
                e.target.style.transform = 'rotate(90deg)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'rgba(0, 0, 0, 0.5)';
                e.target.style.transform = 'rotate(0deg)';
              }}
            >
              ×
            </button>

            {/* Video Player */}
            <div style={{
              position: 'relative',
              paddingBottom: '56.25%',
              backgroundColor: '#000',
              borderRadius: '16px 16px 0 0',
              overflow: 'hidden'
            }}>
              <iframe
                src={selectedVideo.url}
                title={selectedVideo.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  border: 'none'
                }}
              />
            </div>

            {/* Video Details */}
            <div style={{ padding: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                <div>
                  <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.5rem', fontWeight: '700', color: '#1f2937' }}>
                    {selectedVideo.title}
                  </h2>
                  <div style={{ display: 'flex', gap: '1rem', fontSize: '0.875rem', color: '#6b7280' }}>
                    <span>👁️ {selectedVideo.viewCount || 0} views</span>
                    <span>❤️ {selectedVideo.likes || 0} likes</span>
                    {selectedVideo.duration && <span>⏱️ {selectedVideo.duration}</span>}
                  </div>
                </div>
                <span style={{
                  backgroundColor: '#f3f4f6',
                  padding: '0.5rem 1rem',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  textTransform: 'capitalize',
                  color: '#374151'
                }}>
                  {selectedVideo.category}
                </span>
              </div>

              <p style={{ margin: '1rem 0', color: '#4b5563', lineHeight: '1.6' }}>
                {selectedVideo.description}
              </p>

              {selectedVideo.tags && selectedVideo.tags.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '1rem' }}>
                  {selectedVideo.tags.map((tag, index) => (
                    <span
                      key={index}
                      style={{
                        backgroundColor: '#e5e7eb',
                        padding: '0.25rem 0.75rem',
                        borderRadius: '12px',
                        fontSize: '0.75rem',
                        color: '#6b7280'
                      }}
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              <button
                onClick={() => handleVideoLike(selectedVideo._id)}
                style={{
                  marginTop: '1.5rem',
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: '600',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#059669';
                  e.target.style.transform = 'scale(1.05)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = '#10b981';
                  e.target.style.transform = 'scale(1)';
                }}
              >
                ❤️ Like this video
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}