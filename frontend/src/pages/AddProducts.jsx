import React, { useState, useEffect } from "react";
import { auth } from "../config/firebase";
import { useAuthState } from "react-firebase-hooks/auth";

export default function AddProducts() {
  const [user] = useAuthState(auth);
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("All");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showProductModal, setShowProductModal] = useState(false);

  // Fetch all products on mount
  useEffect(() => {
    if (user) {
      fetchProducts();
    }
  }, [user]);

  // Filter products based on search and type filter
  useEffect(() => {
    let filtered = products;
    
    if (searchTerm) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    if (filterType !== "All") {
      filtered = filtered.filter(product => product.type === filterType);
    }
    
    setFilteredProducts(filtered);
  }, [products, searchTerm, filterType]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/user/products', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch products');
      }

      const data = await response.json();
      setProducts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Fetch products error:", err);
      alert(`Failed to fetch products: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async (productId, productName) => {
    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          product_id: productId,
          quantity: 1
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to add to cart');
      }

      alert(`${productName} added to cart successfully!`);
    } catch (err) {
      console.error("Add to cart error:", err);
      alert(`Failed to add to cart: ${err.message}`);
    }
  };



  if (!user) {
    return (
      <div style={{ 
        display: "flex", 
        justifyContent: "center", 
        alignItems: "center", 
        minHeight: "100vh",
        backgroundColor: "#f5f5f5"
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ 
            fontSize: "2rem", 
            marginBottom: "1rem" 
          }}>⏳</div>
          <p style={{ color: "#666" }}>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      padding: "2rem", 
      maxWidth: "1200px", 
      margin: "0 auto",
      fontFamily: "Arial, sans-serif",
      backgroundColor: "#f5f5f5",
      minHeight: "100vh"
    }}>
      <div style={{
        backgroundColor: "white",
        borderRadius: "8px",
        padding: "2rem",
        boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
        marginBottom: "2rem"
      }}>
        <h1 style={{ 
          color: "#2c3e50", 
          marginBottom: "1rem",
          textAlign: "center",
          borderBottom: "3px solid #3498db",
          paddingBottom: "1rem"
        }}>
          🌶️ Pepper Varieties Catalog
        </h1>
        
        <p style={{ textAlign: "center", color: "#666", marginBottom: "2rem" }}>
          Browse our collection of premium pepper varieties
        </p>

        {/* Search and Filter */}
        <div style={{ 
          display: "flex", 
          gap: "1rem", 
          marginBottom: "2rem",
          flexWrap: "wrap"
        }}>
          <input
            type="text"
            placeholder="🔍 Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              flex: 1,
              minWidth: "200px",
              padding: "0.75rem",
              border: "2px solid #ddd",
              borderRadius: "4px",
              fontSize: "1rem"
            }}
          />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            style={{
              padding: "0.75rem",
              border: "2px solid #ddd",
              borderRadius: "4px",
              fontSize: "1rem"
            }}
          >
            <option value="All">All Types</option>
            <option value="Bush">Bush Only</option>
            <option value="Climber">Climber Only</option>
          </select>
        </div>
      </div>

      {/* Products Display Section */}
      <div style={{
        backgroundColor: "white",
        borderRadius: "8px",
        padding: "2rem",
        boxShadow: "0 2px 10px rgba(0,0,0,0.1)"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
          <h2 style={{ color: "#2c3e50", margin: 0 }}>📦 Available Products</h2>
          <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
            <span style={{ color: "#666" }}>Total: {products.length} products</span>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "2rem", color: "#666" }}>
            ⏳ Loading products...
          </div>
        ) : filteredProducts.length === 0 ? (
          <div style={{ textAlign: "center", padding: "2rem", color: "#666" }}>
            📭 No products found
          </div>
        ) : (
          <div style={{ 
            display: "grid", 
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: "1rem"
          }}>
            {filteredProducts.map((p) => (
              <div key={p._id} style={{
                background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
                border: "none",
                borderRadius: "16px",
                padding: "0",
                boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                transition: "all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
                overflow: 'hidden',
                position: 'relative',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-8px) scale(1.02)";
                e.currentTarget.style.boxShadow = "0 12px 40px rgba(39, 174, 96, 0.25)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0) scale(1)";
                e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.08)";
              }}
              >
                {/* Gradient Top Bar */}
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '4px',
                  background: 'linear-gradient(90deg, #27ae60 0%, #229954 100%)'
                }} />

                <div style={{ padding: '1.5rem' }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "1rem" }}>
                    <h3 style={{ margin: 0, color: "#2c3e50", fontSize: '1.125rem', fontWeight: '700', letterSpacing: '-0.025em' }}>{p.name}</h3>
                    <span style={{
                      padding: "0.375rem 0.875rem",
                      borderRadius: "20px",
                      fontSize: "0.75rem",
                      fontWeight: '600',
                      background: p.type === "Bush" 
                        ? 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)'
                        : 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)',
                      color: "white",
                      boxShadow: p.type === "Bush"
                        ? '0 4px 12px rgba(231, 76, 60, 0.3)'
                        : '0 4px 12px rgba(52, 152, 219, 0.3)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      {p.type}
                    </span>
                  </div>
                
                  {p.image && (
                    <div style={{
                      position: 'relative',
                      marginBottom: '1rem',
                      borderRadius: '12px',
                      overflow: 'hidden',
                      boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)'
                    }}>
                      <img 
                        src={p.image} 
                        alt={p.name} 
                        style={{
                          width: "100%",
                          height: "200px",
                          objectFit: "cover",
                          transition: 'transform 0.4s ease',
                          imageRendering: "high-quality",
                          WebkitBackfaceVisibility: "hidden"
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                      />
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
                        color: p.stock > 10 ? '#27ae60' : p.stock > 0 ? '#f39c12' : '#e74c3c',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)'
                      }}>
                        ⚡ {p.stock > 0 ? 'Available' : 'Sold Out'}
                      </div>
                    </div>
                  )}
                
                  <p style={{ margin: "0.5rem 0", color: "#666", fontSize: "0.9rem", lineHeight: "1.6", height: '48px', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                    {p.description}
                  </p>
                  
                  {/* View Details Button */}
                  <button
                    onClick={() => {
                      setSelectedProduct(p);
                      setShowProductModal(true);
                    }}
                    style={{
                      width: "100%",
                      padding: "0.625rem",
                      marginTop: "1rem",
                      marginBottom: "0.75rem",
                      background: 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)',
                      color: "#27ae60",
                      border: "2px solid #27ae60",
                      borderRadius: "10px",
                      cursor: "pointer",
                      fontWeight: "600",
                      fontSize: "0.875rem",
                      transition: "all 0.3s ease",
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "linear-gradient(135deg, #27ae60 0%, #229954 100%)";
                      e.currentTarget.style.color = "white";
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(39, 174, 96, 0.3)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)";
                      e.currentTarget.style.color = "#27ae60";
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <span style={{ fontSize: '1rem' }}>👁️</span> View Details
                  </button>
                
                  <div style={{ 
                    display: "flex", 
                    justifyContent: "space-between", 
                    alignItems: "center", 
                    marginTop: "1rem",
                    marginBottom: '1rem',
                    padding: '0.75rem',
                    background: 'linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)',
                    borderRadius: '10px'
                  }}>
                    <span style={{ 
                      fontWeight: "800", 
                      fontSize: "1.75rem", 
                      background: 'linear-gradient(135deg, #27ae60 0%, #229954 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      letterSpacing: '-0.5px'
                    }}>
                      ₹{p.price}
                    </span>
                    <span style={{ 
                      padding: '0.375rem 0.75rem',
                      borderRadius: '8px',
                      background: p.stock > 10 ? "#c8e6c9" : p.stock > 0 ? "#fff3cd" : "#f8d7da",
                      color: p.stock > 10 ? "#27ae60" : p.stock > 0 ? "#f39c12" : "#e74c3c",
                      fontWeight: "600",
                      fontSize: "0.75rem"
                    }}>
                      📦 {p.stock} left
                    </span>
                  </div>
                
                  <button
                    onClick={() => addToCart(p._id, p.name)}
                    disabled={p.stock === 0}
                    style={{
                      width: "100%",
                      padding: "0.875rem",
                      marginTop: "0.5rem",
                      background: p.stock > 0 
                        ? 'linear-gradient(135deg, #27ae60 0%, #229954 100%)'
                        : "#bdc3c7",
                      color: "white",
                      border: "none",
                      borderRadius: "12px",
                      cursor: p.stock > 0 ? "pointer" : "not-allowed",
                      fontWeight: "700",
                      fontSize: "0.9375rem",
                      transition: 'all 0.3s ease',
                      boxShadow: p.stock > 0 ? '0 4px 15px rgba(39, 174, 96, 0.4)' : 'none',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem'
                    }}
                    onMouseEnter={(e) => {
                      if (p.stock > 0) {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 6px 20px rgba(39, 174, 96, 0.5)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (p.stock > 0) {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 4px 15px rgba(39, 174, 96, 0.4)';
                      }
                    }}
                  >
                    {p.stock > 0 ? <><span style={{ fontSize: '1.1rem' }}>🛒</span> Add to Cart</> : <><span style={{ fontSize: '1.1rem' }}>❌</span> Out of Stock</>}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
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
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem'
          }}
          onClick={() => setShowProductModal(false)}
        >
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '16px',
              maxWidth: '800px',
              width: '100%',
              maxHeight: '90vh',
              overflow: 'auto',
              position: 'relative',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowProductModal(false)}
              style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                border: 'none',
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                color: 'white',
                fontSize: '1.5rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 10
              }}
            >
              ×
            </button>

            <div style={{ padding: '2rem' }}>
              {selectedProduct.image && (
                <div style={{
                  width: '100%',
                  height: '500px',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  backgroundColor: '#f3f4f6',
                  marginBottom: '1.5rem'
                }}>
                  <img
                    src={selectedProduct.image}
                    alt={selectedProduct.name}
                    style={{ 
                      width: '100%', 
                      height: '100%', 
                      objectFit: 'contain',
                      imageRendering: 'high-quality',
                      WebkitBackfaceVisibility: 'hidden'
                    }}
                  />
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <h2 style={{ fontSize: '2rem', fontWeight: '700', color: '#2c3e50', margin: 0 }}>
                  {selectedProduct.name}
                </h2>
                <span style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '20px',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  backgroundColor: selectedProduct.type === 'Bush' ? '#e74c3c' : '#3498db',
                  color: 'white'
                }}>
                  {selectedProduct.type}
                </span>
              </div>

              <p style={{ fontSize: '2.5rem', fontWeight: '700', color: '#27ae60', margin: '0.5rem 0' }}>
                ₹{selectedProduct.price}
              </p>

              <p style={{ fontSize: '1rem', color: '#666', lineHeight: '1.6', marginTop: '1rem', marginBottom: '1.5rem' }}>
                {selectedProduct.description}
              </p>

              <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#2c3e50', marginBottom: '1rem' }}>
                Product Specifications
              </h3>
              <div style={{ border: '1px solid #e0e0e0', borderRadius: '12px', overflow: 'hidden', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', borderBottom: '1px solid #e0e0e0', fontSize: '0.95rem' }}>
                  <div style={{ flex: 1, padding: '1rem', color: '#666', fontWeight: '500', backgroundColor: '#f9f9f9' }}>
                    Propagation Method
                  </div>
                  <div style={{ flex: 1, padding: '1rem', borderLeft: '1px solid #e0e0e0', color: '#2c3e50', fontWeight: '600' }}>
                    {selectedProduct.propagationMethod || 'Cutting'}
                  </div>
                </div>
                <div style={{ display: 'flex', borderBottom: '1px solid #e0e0e0', fontSize: '0.95rem' }}>
                  <div style={{ flex: 1, padding: '1rem', color: '#666', fontWeight: '500', backgroundColor: '#f9f9f9' }}>
                    Maturity Duration
                  </div>
                  <div style={{ flex: 1, padding: '1rem', borderLeft: '1px solid #e0e0e0', color: '#2c3e50', fontWeight: '600' }}>
                    {selectedProduct.maturityDuration || '1.5 years'}
                  </div>
                </div>
                <div style={{ display: 'flex', borderBottom: '1px solid #e0e0e0', fontSize: '0.95rem' }}>
                  <div style={{ flex: 1, padding: '1rem', color: '#666', fontWeight: '500', backgroundColor: '#f9f9f9' }}>
                    Blooming Season
                  </div>
                  <div style={{ flex: 1, padding: '1rem', borderLeft: '1px solid #e0e0e0', color: '#2c3e50', fontWeight: '600' }}>
                    {selectedProduct.bloomingSeason || 'All season'}
                  </div>
                </div>
                <div style={{ display: 'flex', fontSize: '0.95rem' }}>
                  <div style={{ flex: 1, padding: '1rem', color: '#666', fontWeight: '500', backgroundColor: '#f9f9f9' }}>
                    Plant Age
                  </div>
                  <div style={{ flex: 1, padding: '1rem', borderLeft: '1px solid #e0e0e0', color: '#2c3e50', fontWeight: '600' }}>
                    {selectedProduct.plantAge || '3 Months'}
                  </div>
                </div>
              </div>

              <div style={{
                padding: '1rem',
                borderRadius: '8px',
                marginBottom: '1rem',
                backgroundColor: selectedProduct.stock > 10 ? '#e8f5e9' : selectedProduct.stock > 0 ? '#fff3cd' : '#f8d7da',
                border: `1px solid ${selectedProduct.stock > 10 ? '#c8e6c9' : selectedProduct.stock > 0 ? '#ffeaa7' : '#f5c6cb'}`
              }}>
                <span style={{
                  color: selectedProduct.stock > 10 ? '#27ae60' : selectedProduct.stock > 0 ? '#f39c12' : '#e74c3c',
                  fontWeight: '600',
                  fontSize: '1rem'
                }}>
                  {selectedProduct.stock > 0 ? `${selectedProduct.stock} units in stock` : 'Out of stock'}
                </span>
              </div>

              <button
                onClick={() => {
                  addToCart(selectedProduct._id, selectedProduct.name);
                  setShowProductModal(false);
                }}
                disabled={selectedProduct.stock === 0}
                style={{
                  width: '100%',
                  padding: '1rem',
                  backgroundColor: selectedProduct.stock > 0 ? '#27ae60' : '#bdc3c7',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: selectedProduct.stock > 0 ? 'pointer' : 'not-allowed',
                  fontWeight: '600',
                  fontSize: '1rem'
                }}
              >
                {selectedProduct.stock > 0 ? '🛒 Add to Cart' : '❌ Out of Stock'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
