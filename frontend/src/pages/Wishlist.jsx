import React, { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../config/firebase';
import { useNavigate } from 'react-router-dom';
import { Heart, ShoppingCart, Trash2, AlertCircle, Sparkles, ArrowLeft } from 'lucide-react';

const Wishlist = () => {
  const [user] = useAuthState(auth);
  const [wishlist, setWishlist] = useState({ items: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [removing, setRemoving] = useState({});
  const [adding, setAdding] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      fetchWishlist();
    }
  }, [user]);

  const fetchWishlist = async () => {
    try {
      const token = await user.getIdToken();
      const response = await fetch(`/api/wishlist/${user.uid}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setWishlist(data);
      } else {
        console.error('Failed to fetch wishlist');
        setWishlist({ items: [] });
      }
    } catch (error) {
      console.error('Error fetching wishlist:', error);
      setError('Failed to load wishlist');
    } finally {
      setLoading(false);
    }
  };

  const removeFromWishlist = async (productId) => {
    setRemoving(prev => ({ ...prev, [productId]: true }));
    
    try {
      const token = await user.getIdToken();
      const response = await fetch(`/api/wishlist/item/${productId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setSuccess('Removed from wishlist');
        setTimeout(() => setSuccess(''), 2000);
        await fetchWishlist();
      } else {
        setError('Failed to remove item from wishlist');
      }
    } catch (error) {
      console.error('Error removing from wishlist:', error);
      setError('Failed to remove item');
    } finally {
      setRemoving(prev => ({ ...prev, [productId]: false }));
    }
  };

  const addToCart = async (product) => {
    setAdding(prev => ({ ...prev, [product._id]: true }));
    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/cart/add', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          product_id: product._id,
          quantity: 1
        })
      });

      if (response.ok) {
        setSuccess(`${product.name} added to cart!`);
        setTimeout(() => setSuccess(''), 2000);
        // Optionally remove from wishlist after adding to cart
        await removeFromWishlist(product._id);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to add to cart');
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      setError('Failed to add to cart');
    } finally {
      setAdding(prev => ({ ...prev, [product._id]: false }));
    }
  };

  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '80px',
            height: '80px',
            border: '4px solid rgba(255, 255, 255, 0.3)',
            borderTop: '4px solid white',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto'
          }}></div>
          <p style={{ marginTop: '1.5rem', color: 'white', fontSize: '1.125rem', fontWeight: 500 }}>
            Loading your wishlist...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      padding: '2rem 0',
      position: 'relative'
    }}>
      {/* Decorative Background Elements */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        overflow: 'hidden',
        pointerEvents: 'none'
      }}>
        <div style={{
          position: 'absolute',
          width: '500px',
          height: '500px',
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '50%',
          top: '-250px',
          right: '-250px',
          filter: 'blur(80px)'
        }}></div>
        <div style={{
          position: 'absolute',
          width: '400px',
          height: '400px',
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '50%',
          bottom: '-200px',
          left: '-200px',
          filter: 'blur(80px)'
        }}></div>
      </div>

      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 1.5rem', position: 'relative', zIndex: 1 }}>
        {/* Header */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          borderRadius: '20px',
          padding: '2rem',
          marginBottom: '2rem',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
        }}>
          <button
            onClick={() => navigate('/dashboard')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 1rem',
              background: 'transparent',
              border: '2px solid #10b981',
              borderRadius: '12px',
              color: '#10b981',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: 600,
              marginBottom: '1.5rem',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#10b981';
              e.currentTarget.style.color = 'white';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = '#10b981';
            }}
          >
            <ArrowLeft size={18} />
            Back to Dashboard
          </button>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                borderRadius: '16px',
                padding: '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Heart size={32} color="white" fill="white" />
              </div>
              <div>
                <h1 style={{
                  fontSize: '2.5rem',
                  fontWeight: 800,
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  margin: 0,
                  lineHeight: 1.2
                }}>
                  My Wishlist
                </h1>
                <p style={{ color: '#6b7280', fontSize: '1rem', margin: '0.25rem 0 0 0' }}>
                  {wishlist.items.length} {wishlist.items.length === 1 ? 'item' : 'items'} saved
                </p>
              </div>
            </div>
            
            {wishlist.items.length > 0 && (
              <div style={{
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                padding: '1rem 1.5rem',
                borderRadius: '12px',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: 600
              }}>
                <Sparkles size={18} />
                <span>Your favorite picks!</span>
              </div>
            )}
          </div>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div style={{
            background: 'rgba(16, 185, 129, 0.95)',
            backdropFilter: 'blur(10px)',
            padding: '1rem 1.5rem',
            borderRadius: '12px',
            marginBottom: '1.5rem',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            boxShadow: '0 10px 30px rgba(16, 185, 129, 0.3)',
            animation: 'slideInDown 0.3s ease'
          }}>
            <Heart size={20} fill="white" />
            <span style={{ fontWeight: 600 }}>{success}</span>
          </div>
        )}

        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.95)',
            backdropFilter: 'blur(10px)',
            padding: '1rem 1.5rem',
            borderRadius: '12px',
            marginBottom: '1.5rem',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            boxShadow: '0 10px 30px rgba(239, 68, 68, 0.3)'
          }}>
            <AlertCircle size={20} />
            <span style={{ fontWeight: 600 }}>{error}</span>
          </div>
        )}

        {/* Empty State */}
        {wishlist.items.length === 0 ? (
          <div style={{
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            borderRadius: '20px',
            padding: '4rem 2rem',
            textAlign: 'center',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
          }}>
            <div style={{
              width: '120px',
              height: '120px',
              margin: '0 auto 2rem',
              background: 'linear-gradient(135deg, #fecaca 0%, #fca5a5 100%)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              animation: 'pulse 2s ease-in-out infinite'
            }}>
              <Heart size={60} color="#dc2626" />
            </div>
            <h2 style={{
              fontSize: '1.875rem',
              fontWeight: 700,
              color: '#1f2937',
              marginBottom: '0.75rem'
            }}>
              Your wishlist is empty
            </h2>
            <p style={{
              color: '#6b7280',
              fontSize: '1.125rem',
              marginBottom: '2rem',
              maxWidth: '500px',
              margin: '0 auto 2rem'
            }}>
              Start adding your favorite pepper products to keep track of what you love!
            </p>
            <button
              onClick={() => navigate('/dashboard', { state: { activeTab: 'products' } })}
              style={{
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: 'white',
                padding: '1rem 2.5rem',
                borderRadius: '12px',
                border: 'none',
                fontSize: '1rem',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 10px 30px rgba(16, 185, 129, 0.4)',
                transition: 'all 0.3s ease',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 15px 40px rgba(16, 185, 129, 0.5)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 10px 30px rgba(16, 185, 129, 0.4)';
              }}
            >
              Browse Products
            </button>
          </div>
        ) : (
          /* Product Grid */
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '2rem'
          }}>
            {wishlist.items.map((item) => (
              <div
                key={item.product._id}
                style={{
                  background: 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: '20px',
                  overflow: 'hidden',
                  boxShadow: '0 20px 60px rgba(0, 0, 0, 0.2)',
                  transition: 'all 0.3s ease',
                  position: 'relative'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-8px)';
                  e.currentTarget.style.boxShadow = '0 25px 70px rgba(0, 0, 0, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 20px 60px rgba(0, 0, 0, 0.2)';
                }}
              >
                {/* Product Image */}
                <div style={{
                  position: 'relative',
                  height: '240px',
                  background: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)',
                  overflow: 'hidden'
                }}>
                  {item.product.image ? (
                    <img
                      src={item.product.image}
                      alt={item.product.name}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        transition: 'transform 0.4s ease'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                      onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    />
                  ) : (
                    <div style={{
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#9ca3af',
                      fontSize: '1rem'
                    }}>
                      No Image Available
                    </div>
                  )}
                  
                  {/* Stock Badge */}
                  <div style={{
                    position: 'absolute',
                    bottom: '1rem',
                    left: '1rem',
                    background: item.product.available_stock > 0 || item.product.stock > 0
                      ? 'rgba(16, 185, 129, 0.95)'
                      : 'rgba(239, 68, 68, 0.95)',
                    backdropFilter: 'blur(10px)',
                    padding: '0.5rem 1rem',
                    borderRadius: '8px',
                    color: 'white',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    {item.product.available_stock > 0 || item.product.stock > 0 ? '✓ In Stock' : '✗ Out of Stock'}
                  </div>

                  {/* Remove Button */}
                  <button
                    onClick={() => removeFromWishlist(item.product._id)}
                    disabled={removing[item.product._id]}
                    style={{
                      position: 'absolute',
                      top: '1rem',
                      right: '1rem',
                      background: 'rgba(239, 68, 68, 0.95)',
                      backdropFilter: 'blur(10px)',
                      border: 'none',
                      borderRadius: '50%',
                      width: '44px',
                      height: '44px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: removing[item.product._id] ? 'not-allowed' : 'pointer',
                      boxShadow: '0 4px 15px rgba(239, 68, 68, 0.4)',
                      transition: 'all 0.3s ease',
                      opacity: removing[item.product._id] ? 0.6 : 1
                    }}
                    onMouseEnter={(e) => {
                      if (!removing[item.product._id]) {
                        e.currentTarget.style.transform = 'scale(1.1) rotate(10deg)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1) rotate(0deg)';
                    }}
                    title="Remove from wishlist"
                  >
                    <Trash2 size={20} color="white" />
                  </button>
                </div>

                {/* Product Details */}
                <div style={{ padding: '1.5rem' }}>
                  <h3 style={{
                    fontSize: '1.25rem',
                    fontWeight: 700,
                    color: '#1f2937',
                    marginBottom: '0.5rem',
                    lineHeight: 1.3
                  }}>
                    {item.product.name}
                  </h3>
                  
                  <p style={{
                    color: '#6b7280',
                    fontSize: '0.875rem',
                    lineHeight: 1.6,
                    marginBottom: '1rem',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    minHeight: '40px'
                  }}>
                    {item.product.description}
                  </p>
                  
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '1.25rem',
                    paddingTop: '1rem',
                    borderTop: '2px solid #f3f4f6'
                  }}>
                    <div>
                      <span style={{
                        fontSize: '1.875rem',
                        fontWeight: 800,
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent'
                      }}>
                        ₹{item.product.price}
                      </span>
                    </div>
                    <div style={{
                      background: '#f3f4f6',
                      padding: '0.5rem 1rem',
                      borderRadius: '8px',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      color: '#6b7280'
                    }}>
                      Stock: {item.product.available_stock || item.product.stock}
                    </div>
                  </div>

                  {/* Add to Cart Button */}
                  <button
                    onClick={() => addToCart(item.product)}
                    disabled={adding[item.product._id] || removing[item.product._id] || 
                      (item.product.available_stock === 0 && item.product.stock === 0)}
                    style={{
                      width: '100%',
                      background: (item.product.available_stock > 0 || item.product.stock > 0)
                        ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                        : 'linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)',
                      color: 'white',
                      padding: '1rem',
                      borderRadius: '12px',
                      border: 'none',
                      fontSize: '1rem',
                      fontWeight: 700,
                      cursor: (adding[item.product._id] || removing[item.product._id] || 
                        (item.product.available_stock === 0 && item.product.stock === 0))
                        ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.75rem',
                      transition: 'all 0.3s ease',
                      boxShadow: (item.product.available_stock > 0 || item.product.stock > 0)
                        ? '0 8px 20px rgba(16, 185, 129, 0.4)'
                        : 'none',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}
                    onMouseEnter={(e) => {
                      if (!adding[item.product._id] && !removing[item.product._id] && 
                        (item.product.available_stock > 0 || item.product.stock > 0)) {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 12px 30px rgba(16, 185, 129, 0.5)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (item.product.available_stock > 0 || item.product.stock > 0) {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 8px 20px rgba(16, 185, 129, 0.4)';
                      }
                    }}
                  >
                    {adding[item.product._id] ? (
                      <>
                        <div style={{
                          width: '20px',
                          height: '20px',
                          border: '3px solid rgba(255, 255, 255, 0.3)',
                          borderTop: '3px solid white',
                          borderRadius: '50%',
                          animation: 'spin 1s linear infinite'
                        }}></div>
                        Adding...
                      </>
                    ) : (item.product.available_stock > 0 || item.product.stock > 0) ? (
                      <>
                        <ShoppingCart size={20} />
                        Add to Cart
                      </>
                    ) : (
                      <>
                        <AlertCircle size={20} />
                        Out of Stock
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.05); opacity: 0.8; }
        }
        @keyframes slideInDown {
          from {
            transform: translateY(-20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default Wishlist;
