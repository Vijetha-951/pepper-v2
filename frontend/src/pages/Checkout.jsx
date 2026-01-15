import React, { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../config/firebase';
import { useNavigate, useLocation } from 'react-router-dom';
import { CreditCard, MapPin, AlertCircle, CheckCircle } from 'lucide-react';
import './Checkout.css';

const Checkout = () => {
  const [user] = useAuthState(auth);
  const [cart, setCart] = useState({ items: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  
  // Hub collection data from location state
  const hubCollectionData = location.state || {};
  const isHubCollection = hubCollectionData.deliveryType === 'HUB_COLLECTION';
  
  // Normalize address objects so all fields exist and are strings
  const emptyAddress = { line1: '', line2: '', district: '', state: '', pincode: '', phone: '' };
  const normalizeAddress = (addr) => {
    const merged = { ...emptyAddress, ...(addr || {}) };
    Object.keys(merged).forEach((k) => { if (merged[k] == null) merged[k] = ''; });
    return merged;
  };

  const [shippingAddress, setShippingAddress] = useState(emptyAddress);
  const [paymentMethod, setPaymentMethod] = useState('COD'); // 'COD' | 'ONLINE'
  const [addressBook, setAddressBook] = useState({ addresses: [], primary: null });
  const [selectedAddressId, setSelectedAddressId] = useState('');

  useEffect(() => {
    if (user) {
      fetchCart();
      loadUserAddress();
      loadAddressBook();
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
      const response = await fetch('/api/user/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const userData = await response.json();
        // Prefer structured primary address, else fall back to legacy fields
        const primary = userData.address || null;
        const addr = primary || {
          line1: userData.place || '',
          line2: '',
          district: userData.district || '',
          state: '',
          pincode: userData.pincode || '',
          phone: userData.phone || ''
        };
        const safe = normalizeAddress(addr);
        setShippingAddress(safe);
        try { localStorage.setItem('shippingAddress', JSON.stringify(safe)); } catch {}
      } else {
        // Fallback to local storage if available
        const cached = localStorage.getItem('shippingAddress');
        if (cached) setShippingAddress(normalizeAddress(JSON.parse(cached)));
      }
    } catch (error) {
      console.error('Error loading user address:', error);
      const cached = localStorage.getItem('shippingAddress');
      if (cached) setShippingAddress(normalizeAddress(JSON.parse(cached)));
    }
  };

  const loadAddressBook = async () => {
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/user/addresses', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) return;
      const data = await res.json();
      setAddressBook({ addresses: data.addresses || [], primary: data.primary || null });
    } catch (e) {
      // ignore non-blocking error
    }
  };

  const saveAddress = async () => {
    try {
      const token = await user.getIdToken();
      // Persist both structured primary address and legacy fields
      const payload = {
        address: {
          line1: shippingAddress.line1 || '',
          line2: shippingAddress.line2 || '',
          district: shippingAddress.district || '',
          state: shippingAddress.state || '',
          pincode: shippingAddress.pincode || '',
          phone: shippingAddress.phone || ''
        },
        place: shippingAddress.line1 || '',
        district: shippingAddress.district || '',
        pincode: shippingAddress.pincode || '',
        phone: shippingAddress.phone || ''
      };
      const response = await fetch('/api/user/me', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({ message: 'Failed to save address' }));
        throw new Error(err.message || 'Failed to save address');
      }
      try { localStorage.setItem('shippingAddress', JSON.stringify(shippingAddress)); } catch {}
      return true;
    } catch (e) {
      setError(e.message || 'Failed to save address');
      return false;
    }
  };

  const handleAddressChange = (field, value) => {
    let v = value;
    if (field === 'district' || field === 'state') {
      // Allow only letters and spaces
      v = String(value).replace(/[^A-Za-z ]/g, '');
    } else if (field === 'phone') {
      // Digits only, max 10
      v = String(value).replace(/\D/g, '').slice(0, 10);
    } else if (field === 'pincode') {
      // Digits only, max 6 (UI hint)
      v = String(value).replace(/\D/g, '').slice(0, 6);
    }
    setShippingAddress(prev => ({
      ...prev,
      [field]: v
    }));
  };

  const validateAddress = () => {
    const { line1, district, state, pincode, phone } = shippingAddress;
    
    // Clear any previous errors
    setError('');
    
    if (!line1.trim() || !district.trim() || !pincode.trim()) {
      setError('Please fill in required fields: Address Line 1, District, Pincode');
      return false;
    }
    if (line1.trim().length < 3) {
      setError('Address Line 1 must be at least 3 characters');
      return false;
    }
    if (!/^[A-Za-z ]+$/.test(district.trim())) {
      setError('District should contain letters only');
      return false;
    }
    if (state && !/^[A-Za-z ]+$/.test(state.trim())) {
      setError('State should contain letters only');
      return false;
    }
    if (!/^\d{6}$/.test(pincode.trim())) {
      setError('Pincode must be a 6-digit number');
      return false;
    }
    
    // Phone is required and must be exactly 10 digits
    const phoneStr = String(phone || '').trim();
    if (!phoneStr) {
      setError('Phone number is required');
      return false;
    }
    if (!/^\d{10}$/.test(phoneStr)) {
      setError('Phone number must be exactly 10 digits');
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

    // Always persist address before attempting any order (skip for hub collection)
    if (!isHubCollection) {
      const saved = await saveAddress();
      if (!saved) { setProcessing(false); return; }
    }

    try {
      const token = await user.getIdToken();

      // Hub Collection Order Flow - COD
      if (isHubCollection && hubCollectionData.collectionHub && paymentMethod === 'COD') {
        const createRes = await fetch('/api/hub-collection/orders/hub-collection', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            items: (hubCollectionData.cartItems || [])
              .filter(i => i && i.product && i.product._id)
              .map(i => ({ productId: i.product._id, quantity: i.quantity })),
            collectionHubId: hubCollectionData.collectionHub._id,
            payment: { method: paymentMethod, status: 'PENDING' },
            notes: ''
          })
        });
        
        if (!createRes.ok) {
          const err = await createRes.json().catch(() => ({ message: 'Failed to place hub collection order' }));
          throw new Error(err.message || 'Failed to place hub collection order');
        }
        
        const orderData = await createRes.json();
        setSuccess('Hub collection order placed successfully! You will be notified when ready for collection.');
        
        // Clear cart
        await fetch(`/api/cart/${user.uid}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        setTimeout(() => navigate('/orders'), 1500);
        return;
      }

      // Hub Collection Order Flow - Online Payment
      if (isHubCollection && hubCollectionData.collectionHub && paymentMethod === 'ONLINE') {
        // Load Razorpay script
        const scriptLoaded = await loadRazorpayScript();
        if (!scriptLoaded) {
          throw new Error('Failed to load payment gateway');
        }

        // Create order on backend with hub collection flag
        const orderResponse = await fetch('/api/payment/create-order', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            isHubCollection: true,
            collectionHubId: hubCollectionData.collectionHub._id,
            items: (hubCollectionData.cartItems || [])
              .filter(i => i && i.product && i.product._id)
              .map(i => ({ productId: i.product._id, quantity: i.quantity }))
          })
        });

        if (!orderResponse.ok) {
          const errorData = await orderResponse.json();
          console.error('Order creation failed:', errorData);
          const errorMsg = errorData.error 
            ? `${errorData.message}: ${errorData.error}` 
            : errorData.message || 'Failed to create order';
          throw new Error(errorMsg);
        }

        const { order_id, amount, currency, key } = await orderResponse.json();

        // Configure Razorpay options
        const options = {
          key: key,
          amount: amount,
          currency: currency,
          name: 'PEPPER Store',
          description: 'Hub Collection Order',
          order_id: order_id,
          handler: async (response) => {
            try {
              // Verify payment on backend with hub collection info
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
                  isHubCollection: true,
                  collectionHubId: hubCollectionData.collectionHub._id
                })
              });

              if (verifyResponse.ok) {
                const verifyData = await verifyResponse.json();
                setSuccess('Payment successful! Hub collection order placed.');
                
                // Clear cart
                await fetch(`/api/cart/${user.uid}`, {
                  method: 'DELETE',
                  headers: {
                    'Authorization': `Bearer ${token}`
                  }
                });
                
                setTimeout(() => {
                  navigate('/payment-success', { state: { order: verifyData.order } });
                }, 2000);
              } else {
                const errorData = await verifyResponse.json();
                throw new Error(errorData.message || 'Payment verification failed');
              }
            } catch (error) {
              console.error('Payment verification error:', error);
              setError('Payment verification failed. Please contact support.');
              setProcessing(false);
            }
          },
          prefill: {
            name: user.displayName || `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim(),
            email: user.email,
            contact: user.phoneNumber || ''
          },
          theme: { color: '#2c5f2d' },
          modal: {
            ondismiss: () => { setProcessing(false); }
          }
        };

        const paymentObject = new window.Razorpay(options);
        paymentObject.open();
        return;
      }

      // Regular Home Delivery - COD flow
      if (paymentMethod === 'COD') {
        const createRes = await fetch('/api/user/orders', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            items: (cart.items || [])
              .filter(i => i && i.product && i.product._id)
              .map(i => ({ productId: i.product._id, quantity: i.quantity })),
            payment: { method: 'COD' },
            notes: ''
          })
        });
        if (!createRes.ok) {
          const err = await createRes.json().catch(() => ({ message: 'Failed to place COD order' }));
          throw new Error(err.message || 'Failed to place COD order');
        }
        const orderData = await createRes.json();
        setSuccess('Order placed with Cash on Delivery!');
        setTimeout(() => navigate('/payment-success', { state: { order: orderData } }), 1200);
        return;
      }

      // Online flow: Razorpay
      // Load Razorpay script
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error('Failed to load payment gateway');
      }

      // Create order on backend
      const orderResponse = await fetch('/api/payment/create-order', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!orderResponse.ok) {
        const errorData = await orderResponse.json();
        console.error('Order creation failed:', errorData);
        const errorMsg = errorData.error 
          ? `${errorData.message}: ${errorData.error}` 
          : errorData.message || 'Failed to create order';
        throw new Error(errorMsg);
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
              const verifyData = await verifyResponse.json();
              setSuccess('Payment successful! Order has been placed.');
              setTimeout(() => {
                navigate('/payment-success', { state: { order: verifyData.order } });
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
          name: user.displayName || `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim(),
          email: user.email,
          contact: user.phoneNumber || ''
        },
        theme: { color: '#2c5f2d' }, // match theme
        modal: {
          ondismiss: () => { setProcessing(false); }
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
    <div className="pepper-checkout" style={{ minHeight: '100vh', padding: '32px 0' }}>
      <div className="max-w-4xl" style={{ maxWidth: 1024, margin: '0 auto', padding: '0 20px' }}>
        <div className="section-header" style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
          <CreditCard size={24} color="#10b981" />
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#111827', margin: 0 }}>Checkout</h1>
        </div>

        {error && (
          <div style={{
            marginBottom: 16,
            padding: 12,
            background: '#fee2e2',
            border: '1px solid #fecaca',
            color: '#b91c1c',
            borderRadius: 10,
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}>
            <AlertCircle size={18} style={{ marginRight: 4 }} />
            {error}
          </div>
        )}

        {success && (
          <div style={{
            marginBottom: 16,
            padding: 12,
            background: '#dcfce7',
            border: '1px solid #bbf7d0',
            color: '#166534',
            borderRadius: 10,
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}>
            <CheckCircle size={18} style={{ marginRight: 4 }} />
            {success}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 24 }}>
          {/* Shipping Address */}
          <div className="checkout-card">
            <div className="section-header">
              <MapPin size={18} color="#10b981" />
              <h2 className="section-title">Shipping Address</h2>
            </div>

            <div className="space-y-4" style={{ display: 'grid', gap: 16 }}>
              <div>
                <label htmlFor="line1">Address Line 1 *</label>
                {addressBook.addresses.length > 0 && (
                  <div style={{ marginTop: 8 }}>
                    <select
                      value={selectedAddressId}
                      onChange={async (e) => {
                        const id = e.target.value;
                        setSelectedAddressId(id);
                        if (!id) return;
                        const token = await user.getIdToken();
                        try {
                          const res = await fetch(`/api/user/addresses/${id}/select`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` } });
                          if (res.ok) {
                            const { primary } = await res.json();
                            const safePrimary = normalizeAddress(primary);
                            setShippingAddress(safePrimary);
                            try { localStorage.setItem('shippingAddress', JSON.stringify(safePrimary)); } catch {}
                          }
                        } catch {}
                      }}
                      style={{ width: '100%', padding: '10px', borderRadius: 10, border: '1px solid #e5e7eb', background: '#fff' }}
                    >
                      <option value="">Select a saved address</option>
                      {addressBook.addresses.map(a => (
                        <option key={a._id} value={a._id}>
                          {`${a.line1}${a.line2 ? ', ' + a.line2 : ''}, ${a.district}${a.state ? ', ' + a.state : ''} - ${a.pincode}`}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <input
                  type="text"
                  id="line1"
                  value={shippingAddress.line1 ?? ''}
                  onChange={(e) => handleAddressChange('line1', e.target.value)}
                  placeholder="House number, street name"
                />
              </div>

              <div>
                <label htmlFor="line2">Address Line 2</label>
                <input
                  type="text"
                  id="line2"
                  value={shippingAddress.line2 ?? ''}
                  onChange={(e) => handleAddressChange('line2', e.target.value)}
                  placeholder="Apartment, suite, etc. (optional)"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label htmlFor="district">District *</label>
                  <select
                    id="district"
                    value={shippingAddress.district ?? ''}
                    onChange={(e) => handleAddressChange('district', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #ddd',
                      borderRadius: '8px',
                      fontSize: '14px',
                      backgroundColor: 'white',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="">Select District</option>
                    <option value="Thiruvananthapuram">Thiruvananthapuram</option>
                    <option value="Kollam">Kollam</option>
                    <option value="Pathanamthitta">Pathanamthitta</option>
                    <option value="Alappuzha">Alappuzha</option>
                    <option value="Kottayam">Kottayam</option>
                    <option value="Idukki">Idukki</option>
                    <option value="Ernakulam">Ernakulam</option>
                    <option value="Thrissur">Thrissur</option>
                    <option value="Palakkad">Palakkad</option>
                    <option value="Malappuram">Malappuram</option>
                    <option value="Kozhikode">Kozhikode</option>
                    <option value="Wayanad">Wayanad</option>
                    <option value="Kannur">Kannur</option>
                    <option value="Kasaragod">Kasaragod</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="state">State</label>
                  <input
                    type="text"
                    id="state"
                    value={shippingAddress.state ?? ''}
                    onChange={(e) => handleAddressChange('state', e.target.value)}
                    placeholder="State (default: Kerala)"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="pincode">Pincode *</label>
                <input
                  type="text"
                  id="pincode"
                  value={shippingAddress.pincode ?? ''}
                  onChange={(e) => handleAddressChange('pincode', e.target.value)}
                  placeholder="6-digit pincode"
                  maxLength={6}
                />
              </div>

              <div>
                <label htmlFor="phone">Phone *</label>
                <input
                  type="tel"
                  id="phone"
                  value={shippingAddress.phone ?? ''}
                  onChange={(e) => handleAddressChange('phone', e.target.value)}
                  placeholder="10-digit phone"
                  inputMode="numeric"
                  maxLength={10}
                />
              </div>

              {/* Save button: placed below all fields */}
              <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  className="primary-action"
                  style={{ padding: '10px 14px' }}
                  onClick={async () => {
                    if (!validateAddress()) return;
                    try {
                      const token = await user.getIdToken();
                      const res = await fetch('/api/user/addresses', {
                        method: 'POST',
                        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                        body: JSON.stringify(normalizeAddress(shippingAddress))
                      });
                      if (res.ok) {
                        const data = await res.json();
                        setAddressBook(prev => ({ ...prev, addresses: data.addresses }));
                        setSuccess('Address saved to your profile');
                        setTimeout(() => setSuccess(''), 1500);
                      } else {
                        const err = await res.json().catch(() => ({ message: 'Failed to save address' }));
                        setError(err.message || 'Failed to save address');
                        setTimeout(() => setError(''), 2000);
                      }
                    } catch (e) {
                      setError('Failed to save address');
                      setTimeout(() => setError(''), 2000);
                    }
                  }}
                >
                  Save to address book
                </button>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="checkout-card">
            <h2 className="section-title" style={{ marginBottom: 16 }}>Order Summary</h2>
            
            <div style={{ display: 'grid', gap: 12, marginBottom: 20 }}>
              {(cart.items || []).filter(i => i && i.product).map((item, idx) => (
                <div key={item.product?._id || idx} className="summary-row">
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1rem', color: '#111827', fontWeight: 600 }}>{item.product?.name || 'Unknown product'}</h3>
                    <p className="muted" style={{ margin: 0 }}>Qty: {item.quantity} × ₹{item.product?.price ?? 0}</p>
                  </div>
                  <span style={{ fontWeight: 600 }}>₹{item.subtotal ?? ((item.product?.price ?? 0) * item.quantity)}</span>
                </div>
              ))}
            </div>

            {/* Payment Method */}
            <div style={{ marginBottom: 20 }}>
              <h3 className="section-title" style={{ fontSize: '0.95rem', marginBottom: 8 }}>Payment Method</h3>
              <div className="payment-options" style={{ display: 'grid', gap: 10 }}>
                <label>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="COD"
                    checked={paymentMethod === 'COD'}
                    onChange={() => setPaymentMethod('COD')}
                  />
                  <span style={{ color: '#374151' }}>Cash on Delivery</span>
                </label>
                <label>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="ONLINE"
                    checked={paymentMethod === 'ONLINE'}
                    onChange={() => setPaymentMethod('ONLINE')}
                  />
                  <span style={{ color: '#374151' }}>Online Payment (Razorpay)</span>
                </label>
              </div>
            </div>

            <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: 16 }}>
              <div className="summary-row muted">
                <span>Subtotal</span>
                <span>₹{cart.total}</span>
              </div>
              <div className="summary-row muted">
                <span>Shipping</span>
                <span>Free</span>
              </div>
              <div className="summary-total">
                <span>Total</span>
                <span>₹{cart.total}</span>
              </div>
            </div>

            <button
              onClick={handlePayment}
              disabled={processing}
              className="primary-action"
              style={{ marginTop: 16 }}
            >
              {processing ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 16, height: 16, border: '2px solid #ffffff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                  Processing...
                </div>
              ) : (
                <>
                  <CreditCard size={18} style={{ marginRight: 8 }} />
                  {paymentMethod === 'COD' ? 'Place Order (COD)' : `Pay ₹${cart.total}`}
                </>
              )}
            </button>

            <p className="muted" style={{ marginTop: 8 }}>
              {paymentMethod === 'ONLINE' ? 'Secure payment powered by Razorpay' : 'Pay in cash when your order arrives'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;