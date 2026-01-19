import React, { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../config/firebase';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Plus, Minus, Trash2, AlertCircle } from 'lucide-react';

const Cart = () => {
  const [user] = useAuthState(auth);
  const [cart, setCart] = useState({ items: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      fetchCart();
    }
  }, [user]);

  const fetchCart = async () => {
    try {
      const token = await user.getIdToken();
      const response = await fetch(`/api/cart/${user.uid}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setCart(data);
      } else {
        console.error('Failed to fetch cart');
        setCart({ items: [], total: 0 });
      }
    } catch (error) {
      console.error('Error fetching cart:', error);
      setError('Failed to load cart');
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (productId, newQuantity) => {
    setUpdating(prev => ({ ...prev, [productId]: true }));
    
    try {
      const token = await user.getIdToken();
      const response = await fetch(`/api/cart/item/${productId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ quantity: newQuantity })
      });

      if (response.ok) {
        await fetchCart(); // Refresh cart
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to update cart');
      }
    } catch (error) {
      console.error('Error updating cart:', error);
      setError('Failed to update cart');
    } finally {
      setUpdating(prev => ({ ...prev, [productId]: false }));
    }
  };

  const removeFromCart = async (productId) => {
    setUpdating(prev => ({ ...prev, [productId]: true }));
    
    try {
      const token = await user.getIdToken();
      const response = await fetch(`/api/cart/item/${productId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        await fetchCart(); // Refresh cart
      } else {
        setError('Failed to remove item from cart');
      }
    } catch (error) {
      console.error('Error removing from cart:', error);
      setError('Failed to remove item');
    } finally {
      setUpdating(prev => ({ ...prev, [productId]: false }));
    }
  };

  const proceedToCheckout = () => {
    if (cart.items.length === 0) {
      setError('Your cart is empty');
      return;
    }
    navigate('/checkout');
  };

  const proceedToHubCollection = () => {
    if (cart.items.length === 0) {
      setError('Your cart is empty');
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-500"></div>
          <p className="mt-4 text-gray-600">Loading your cart...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center mb-6">
          <ShoppingCart className="h-6 w-6 text-green-600 mr-2" />
          <h1 className="text-2xl font-bold text-gray-900">Your Cart</h1>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg flex items-center">
            <AlertCircle className="h-5 w-5 mr-2" />
            {error}
          </div>
        )}

        {cart.items.length === 0 ? (
          <div className="text-center py-12">
            <ShoppingCart className="h-24 w-24 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-medium text-gray-600 mb-2">Your cart is empty</h2>
            <p className="text-gray-500 mb-6">Add some delicious peppers to get started!</p>
            <button
              onClick={() => navigate('/add-products')}
              className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
            >
              Continue Shopping
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-sm">
                {cart.items.map((item) => (
                  <div key={item.product._id} className="p-6 border-b border-gray-200 last:border-b-0">
                    <div className="flex items-start space-x-4">
                      {/* Product Image */}
                      <div className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center overflow-hidden">
                        {item.product.image ? (
                          <img
                            src={item.product.image}
                            alt={item.product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="text-gray-400 text-xs text-center">No Image</div>
                        )}
                      </div>

                      {/* Product Details */}
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{item.product.name}</h3>
                        <p className="text-sm text-gray-600 mt-1">₹{item.product.price} per unit</p>
                        <p className="text-sm text-gray-500">Available: {item.product.available_stock || item.product.stock}</p>
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => updateQuantity(item.product._id, Math.max(0, item.quantity - 1))}
                          disabled={updating[item.product._id]}
                          className="p-1 rounded-md hover:bg-gray-100 disabled:opacity-50"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        
                        <span className="w-8 text-center font-medium">
                          {updating[item.product._id] ? '...' : item.quantity}
                        </span>
                        
                        <button
                          onClick={() => updateQuantity(item.product._id, item.quantity + 1)}
                          disabled={updating[item.product._id] || item.quantity >= (item.product.available_stock || item.product.stock)}
                          className="p-1 rounded-md hover:bg-gray-100 disabled:opacity-50"
                        >
                          <Plus className="h-4 w-4" />
                        </button>

                        <button
                          onClick={() => removeFromCart(item.product._id)}
                          disabled={updating[item.product._id]}
                          className="p-1 ml-2 text-red-500 hover:bg-red-50 rounded-md disabled:opacity-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      {/* Item Total */}
                      <div className="text-right">
                        <p className="font-medium text-gray-900">₹{item.subtotal}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm p-6 sticky top-4">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Order Summary</h2>
                
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Items ({cart.items.length})</span>
                    <span className="text-gray-900">₹{cart.total}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Shipping</span>
                    <span className="text-gray-900">Free</span>
                  </div>
                  <div className="border-t pt-2">
                    <div className="flex justify-between font-medium">
                      <span className="text-gray-900">Total</span>
                      <span className="text-gray-900">₹{cart.total}</span>
                    </div>
                  </div>
                </div>

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

                <button
                  onClick={proceedToCheckout}
                  disabled={cart.items.length === 0}
                  className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mb-3"
                >
                  🏠 Home Delivery
                </button>

                <button
                  onClick={proceedToHubCollection}
                  disabled={cart.items.length === 0}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  📍 Hub Collection
                </button>

                <button
                  onClick={() => navigate('/add-products')}
                  className="w-full mt-3 border border-gray-300 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Continue Shopping
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Cart;