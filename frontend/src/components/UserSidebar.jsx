import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  User, Package, ShoppingCart, Heart, LogOut, 
  Sparkles, Video as VideoIcon, Star, FileText
} from 'lucide-react';
import { auth } from '../config/firebase';

export default function UserSidebar({ user }) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await auth.signOut();
      localStorage.removeItem('user');
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const sidebarStyle = {
    width: '280px',
    background: 'linear-gradient(135deg, #10b981, #059669)',
    color: 'white',
    padding: '2rem',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '4px 0 20px rgba(0, 0, 0, 0.1)',
    position: 'relative',
    overflow: 'hidden',
    minHeight: '100vh'
  };

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Package, path: '/dashboard' },
    { id: 'products', label: 'Products', icon: Package, path: '/add-products' },
    { id: 'cart', label: 'My Cart', icon: ShoppingCart, path: '/cart' },
    { id: 'orders', label: 'My Orders', icon: FileText, path: '/dashboard?tab=orders' },
    { id: 'wishlist', label: 'My Wishlist', icon: Heart, path: '/dashboard?tab=wishlist' },
    { id: 'reviews', label: 'My Reviews', icon: Star, path: '/my-reviews' },
    { id: 'videos', label: 'Videos', icon: VideoIcon, path: '/user-videos' },
    { id: 'recommendations', label: 'Recommendations', icon: Sparkles, path: '/dashboard?tab=recommendations' }
  ];

  const isActive = (path) => {
    if (path.includes('?tab=')) {
      const [basePath, query] = path.split('?');
      return location.pathname === basePath && location.search.includes(query);
    }
    return location.pathname === path;
  };

  return (
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
      {user && (
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
                {user.role || 'Customer'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav style={{ flex: 1, position: 'relative', zIndex: 10 }}>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                padding: '0.75rem 1rem',
                marginBottom: '0.5rem',
                background: active ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                fontSize: '0.875rem',
                fontWeight: active ? '600' : '500',
                backdropFilter: active ? 'blur(16px)' : 'none'
              }}
              onMouseEnter={(e) => {
                if (!active) {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                }
              }}
              onMouseLeave={(e) => {
                if (!active) {
                  e.currentTarget.style.background = 'transparent';
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
            marginTop: '1rem',
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
            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.3)';
            e.currentTarget.style.transform = 'scale(1.02)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          <LogOut size={18} style={{ marginRight: '0.75rem' }} />
          Logout
        </button>
      </nav>
    </div>
  );
}
