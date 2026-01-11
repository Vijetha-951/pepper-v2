import React, { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../config/firebase';
import { useNavigate, useLocation } from 'react-router-dom';
import { MapPin, Package, Store, AlertCircle } from 'lucide-react';
import { apiFetch } from '../services/api';

export default function HubSelection() {
  const [user] = useAuthState(auth);
  const navigate = useNavigate();
  const location = useLocation();
  const [hubs, setHubs] = useState([]);
  const [selectedHub, setSelectedHub] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [availability, setAvailability] = useState(null);

  // Get cart items from location state
  const cartItems = location.state?.cartItems || [];

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (cartItems.length === 0) {
      navigate('/cart');
      return;
    }

    fetchHubs();
  }, [user, cartItems]);

  const fetchHubs = async () => {
    try {
      setLoading(true);
      const token = await user.getIdToken();
      const response = await fetch('/api/hub-inventory/hubs/available', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setHubs(data.hubs || []);
      } else {
        setError('Failed to load hubs');
      }
    } catch (err) {
      console.error('Error fetching hubs:', err);
      setError('Failed to load available hubs');
    } finally {
      setLoading(false);
    }
  };

  const checkHubAvailability = async (hubId) => {
    try {
      setCheckingAvailability(true);
      setAvailability(null);
      
      const items = cartItems.map(item => ({
        productId: item.product._id,
        productName: item.product.name,
        quantity: item.quantity
      }));

      const response = await apiFetch(`/api/hub-inventory/hubs/${hubId}/check-availability`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ items })
      });

      if (response.ok) {
        const data = await response.json();
        setAvailability(data);
      } else {
        throw new Error('Failed to check availability');
      }
    } catch (err) {
      console.error('Error checking availability:', err);
      setError('Failed to check product availability');
    } finally {
      setCheckingAvailability(false);
    }
  };

  const handleSelectHub = async (hub) => {
    setSelectedHub(hub);
    await checkHubAvailability(hub._id);
  };

  const handleConfirmHub = () => {
    if (!selectedHub || !availability) return;

    // Navigate to checkout with selected hub
    navigate('/checkout', {
      state: {
        cartItems,
        deliveryType: 'HUB_COLLECTION',
        collectionHub: selectedHub,
        availability
      }
    });
  };

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <div className="spinner"></div>
        <p>Loading available hubs...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
          Select Collection Hub
        </h1>
        <p style={{ color: '#6b7280' }}>
          Choose a hub to collect your order. We'll check product availability and notify you when ready.
        </p>
      </div>

      {error && (
        <div style={{
          background: '#fee2e2',
          border: '1px solid #ef4444',
          borderRadius: '8px',
          padding: '1rem',
          marginBottom: '1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <AlertCircle size={20} color="#ef4444" />
          <span style={{ color: '#991b1b' }}>{error}</span>
        </div>
      )}

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: '1.5rem',
        marginBottom: '2rem'
      }}>
        {hubs.map(hub => (
          <div
            key={hub._id}
            onClick={() => handleSelectHub(hub)}
            style={{
              border: selectedHub?._id === hub._id ? '2px solid #10b981' : '1px solid #e5e7eb',
              borderRadius: '12px',
              padding: '1.5rem',
              cursor: 'pointer',
              transition: 'all 0.2s',
              background: selectedHub?._id === hub._id ? '#f0fdf4' : '#ffffff',
              boxShadow: selectedHub?._id === hub._id
                ? '0 4px 6px rgba(16, 185, 129, 0.1)'
                : '0 1px 3px rgba(0, 0, 0, 0.1)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
              <div style={{
                background: selectedHub?._id === hub._id ? '#10b981' : '#f3f4f6',
                borderRadius: '8px',
                padding: '0.75rem',
                color: selectedHub?._id === hub._id ? '#ffffff' : '#6b7280'
              }}>
                <Store size={24} />
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                  {hub.name}
                </h3>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  color: '#6b7280',
                  fontSize: '0.875rem',
                  marginBottom: '0.5rem'
                }}>
                  <MapPin size={16} />
                  <span>{hub.district}, {hub.location?.state || 'Kerala'}</span>
                </div>
                <div style={{
                  display: 'inline-block',
                  padding: '0.25rem 0.75rem',
                  background: hub.type === 'WAREHOUSE' ? '#dbeafe' : '#e0e7ff',
                  color: hub.type === 'WAREHOUSE' ? '#1e40af' : '#4338ca',
                  borderRadius: '12px',
                  fontSize: '0.75rem',
                  fontWeight: '500'
                }}>
                  {hub.type.replace('_', ' ')}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {checkingAvailability && (
        <div style={{
          background: '#fffbeb',
          border: '1px solid #fbbf24',
          borderRadius: '8px',
          padding: '1rem',
          marginBottom: '1rem',
          textAlign: 'center'
        }}>
          <div className="spinner" style={{ margin: '0 auto 0.5rem' }}></div>
          <p style={{ color: '#92400e' }}>Checking product availability...</p>
        </div>
      )}

      {availability && selectedHub && (
        <div style={{
          background: '#ffffff',
          border: '1px solid #e5e7eb',
          borderRadius: '12px',
          padding: '1.5rem',
          marginBottom: '1rem'
        }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>
            Availability at {selectedHub.name}
          </h3>

          <div style={{ marginBottom: '1rem' }}>
            {availability.availability.map((item, index) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.75rem',
                  background: '#f9fafb',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  marginBottom: '0.5rem'
                }}
              >
                <div>
                  <div style={{ fontWeight: '500' }}>{item.productName}</div>
                  <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
                    {item.available ? '✓ Ready for collection' : '📦 Will be restocked from main hub'}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Note: Removed low stock warning - customers don't need to see internal restock process */}

          <button
            onClick={handleConfirmHub}
            style={{
              width: '100%',
              padding: '1rem',
              background: '#10b981',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem'
            }}
          >
            <Package size={20} />
            Continue to Checkout
          </button>
        </div>
      )}
    </div>
  );
}
