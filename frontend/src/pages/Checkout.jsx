import React, { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../config/firebase';
import { useNavigate } from 'react-router-dom';
import { CreditCard, MapPin, AlertCircle, CheckCircle } from 'lucide-react';

const Checkout = () => {
  const [user] = useAuthState(auth);
  const [cart, setCart] = useState({ items: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();
  
  const [shippingAddress, setShippingAddress] = useState({
    line1: '',
    line2: '',
    district: '',
    state: '',
    pincode: ''
  });

  useEffect(() => {
    if (user) {
      fetchCart();
      loadUserAddress();
    } else {
      navigate('/login');
    }
  }, [user, navigate]);

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
        if (data.items.length === 0) {
          navigate('/cart');
          return;
        }
        setCart(data);
      } else {
        navigate('/cart');
      }
    } catch (error) {
      console.error('Error fetching cart:', error);
      setError('Failed to load cart');
    } finally {
      setLoading(false);
    }
  };

  const loadUserAddress = async () => {
    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/user/profile', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const userData = await response.json();
        if (userData.address) {
          setShippingAddress(userData.address);
        } else if (userData.place || userData.district || userData.pincode) {
          setShippingAddress({
            line1: userData.place || '',
            line2: '',
            district: userData.district || '',
            state: '',
            pincode: userData.pincode || ''
          });
        }
      }
    } catch (error) {
      console.error('Error loading user address:', error);
    }
  };

  const handleAddressChange = (field, value) => {
    setShippingAddress(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateAddress = () => {
    const { line1, district, pincode } = shippingAddress;
    if (!line1.trim() || !district.trim() || !pincode.trim()) {
      setError('Please fill in required address fields (Address Line 1, District, Pincode)');
      return false;
    }
    return true;
  };

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePayment = async () => {
    if (!validateAddress()) return;

    setProcessing(true);
    setError('');

    try {
      // Load Razorpay script
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error('Failed to load payment gateway');
      }

      // Create order on backend
      const token = await user.getIdToken();
      const orderResponse = await fetch('/api/payment/create-order', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!orderResponse.ok) {
        const errorData = await orderResponse.json();
        throw new Error(errorData.message || 'Failed to create order');
      }

      const { order_id, amount, currency, key } = await orderResponse.json();

      // Configure Razorpay options
      const options = {
        key: key,
        amount: amount,
        currency: currency,
        name: 'PEPPER Store',
        description: 'Premium Pepper Products',
        order_id: order_id,
        handler: async (response) => {
          try {
            // Verify payment on backend
            const verifyResponse = await fetch('/api/payment/verify', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
                shippingAddress: shippingAddress
              })
            });

            if (verifyResponse.ok) {
              const data = await verifyResponse.json();
              setSuccess('Payment successful! Order has been placed.');
              setTimeout(() => {
                navigate('/orders');
              }, 2000);
            } else {
              const errorData = await verifyResponse.json();
              throw new Error(errorData.message || 'Payment verification failed');
            }
          } catch (error) {
            console.error('Payment verification error:', error);
            setError('Payment verification failed. Please contact support.');
          }
        },
        prefill: {
          name: user.displayName || `${user.firstName} ${user.lastName}`,
          email: user.email,
          contact: user.phoneNumber || ''
        },
        theme: {
          color: '#059669'
        },
        modal: {
          ondismiss: () => {
            setProcessing(false);
          }
        }
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.open();
      
    } catch (error) {
      console.error('Payment error:', error);
      setError(error.message || 'Failed to process payment');
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-500"></div>
          <p className="mt-4 text-gray-600">Loading checkout...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center mb-6">
          <CreditCard className="h-6 w-6 text-green-600 mr-2" />
          <h1 className="text-2xl font-bold text-gray-900">Checkout</h1>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg flex items-center">
            <AlertCircle className="h-5 w-5 mr-2" />
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg flex items-center">
            <CheckCircle className="h-5 w-5 mr-2" />
            {success}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Shipping Address */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center mb-4">
              <MapPin className="h-5 w-5 text-green-600 mr-2" />
              <h2 className="text-lg font-medium text-gray-900">Shipping Address</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="line1" className="block text-sm font-medium text-gray-700">
                  Address Line 1 *
                </label>
                <input
                  type="text"
                  id="line1"
                  value={shippingAddress.line1}
                  onChange={(e) => handleAddressChange('line1', e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                  placeholder="House number, street name"
                />
              </div>

              <div>
                <label htmlFor="line2" className="block text-sm font-medium text-gray-700">
                  Address Line 2
                </label>
                <input
                  type="text"
                  id="line2"
                  value={shippingAddress.line2}
                  onChange={(e) => handleAddressChange('line2', e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                  placeholder="Apartment, suite, etc. (optional)"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="district" className="block text-sm font-medium text-gray-700">
                    District *
                  </label>
                  <input
                    type="text"
                    id="district"
                    value={shippingAddress.district}
                    onChange={(e) => handleAddressChange('district', e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                    placeholder="District"
                  />
                </div>

                <div>
                  <label htmlFor="state" className="block text-sm font-medium text-gray-700">
                    State
                  </label>
                  <input
                    type="text"
                    id="state"
                    value={shippingAddress.state}
                    onChange={(e) => handleAddressChange('state', e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                    placeholder="State"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="pincode" className="block text-sm font-medium text-gray-700">
                  Pincode *
                </label>
                <input
                  type="text"
                  id="pincode"
                  value={shippingAddress.pincode}
                  onChange={(e) => handleAddressChange('pincode', e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                  placeholder="6-digit pincode"
                  maxLength={6}
                />
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Order Summary</h2>
            
            <div className="space-y-4 mb-6">
              {cart.items.map((item) => (
                <div key={item.product._id} className="flex justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900">{item.product.name}</h3>
                    <p className="text-sm text-gray-600">Qty: {item.quantity} × ₹{item.product.price}</p>
                  </div>
                  <span className="font-medium">₹{item.subtotal}</span>
                </div>
              ))}
            </div>

            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span>₹{cart.total}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Shipping</span>
                <span>Free</span>
              </div>
              <div className="flex justify-between font-medium text-lg">
                <span>Total</span>
                <span>₹{cart.total}</span>
              </div>
            </div>

            <button
              onClick={handlePayment}
              disabled={processing}
              className="w-full mt-6 bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {processing ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Processing...
                </div>
              ) : (
                <>
                  <CreditCard className="h-5 w-5 mr-2" />
                  Pay ₹{cart.total}
                </>
              )}
            </button>

            <p className="text-xs text-gray-500 mt-2 text-center">
              Secure payment powered by Razorpay
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;