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
                border: "1px solid #ddd",
                borderRadius: "8px",
                padding: "1rem",
                backgroundColor: "#f9f9f9",
                transition: "transform 0.2s ease, box-shadow 0.2s ease"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 4px 15px rgba(0,0,0,0.1)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "1rem" }}>
                  <h3 style={{ margin: 0, color: "#2c3e50" }}>{p.name}</h3>
                  <span style={{
                    padding: "0.25rem 0.5rem",
                    borderRadius: "12px",
                    fontSize: "0.8rem",
                    backgroundColor: p.type === "Bush" ? "#e74c3c" : "#3498db",
                    color: "white"
                  }}>
                    {p.type}
                  </span>
                </div>
                
                {p.image && (
                  <img 
                    src={p.image} 
                    alt={p.name} 
                    style={{
                      width: "100%",
                      height: "150px",
                      objectFit: "cover",
                      borderRadius: "4px",
                      marginBottom: "1rem"
                    }}
                  />
                )}
                
                <p style={{ margin: "0.5rem 0", color: "#666", fontSize: "0.9rem", lineHeight: "1.4" }}>
                  {p.description}
                </p>
                
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "1rem" }}>
                  <span style={{ fontWeight: "bold", fontSize: "1.4rem", color: "#27ae60" }}>
                    ₹{p.price}
                  </span>
                  <span style={{ 
                    color: p.stock > 10 ? "#27ae60" : p.stock > 0 ? "#f39c12" : "#e74c3c",
                    fontWeight: "bold",
                    fontSize: "0.9rem"
                  }}>
                    {p.stock > 0 ? `${p.stock} in stock` : "Out of stock"}
                  </span>
                </div>
                
                <button
                  onClick={() => addToCart(p._id, p.name)}
                  disabled={p.stock === 0}
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    marginTop: "1rem",
                    backgroundColor: p.stock > 0 ? "#27ae60" : "#bdc3c7",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: p.stock > 0 ? "pointer" : "not-allowed",
                    fontWeight: "bold",
                    fontSize: "1rem"
                  }}
                >
                  {p.stock > 0 ? "🛒 Add to Cart" : "❌ Out of Stock"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
