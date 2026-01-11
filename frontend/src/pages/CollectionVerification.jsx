import React, { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../config/firebase';
import { useParams, useNavigate } from 'react-router-dom';
import { Package, CheckCircle, AlertCircle } from 'lucide-react';
import { apiFetch } from '../services/api';

export default function CollectionVerification() {
  const [user] = useAuthState(auth);
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [otp, setOtp] = useState('');
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (orderId) {
      fetchOrder();
    }
  }, [user, orderId]);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const response = await apiFetch(`/api/hub-collection/orders/${orderId}/details`);
      
      if (response.ok) {
        const data = await response.json();
        setOrder(data);
      } else {
        setError('Order not found');
      }
    } catch (err) {
      console.error('Error fetching order:', err);
      setError('Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    
    if (otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }

    try {
      setVerifying(true);
      setError('');

      const response = await apiFetch(`/api/hub-collection/orders/${orderId}/verify-collection`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ otp })
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => {
          navigate('/dashboard');
        }, 3000);
      } else {
        setError(data.message || 'Invalid OTP');
      }
    } catch (err) {
      console.error('Error verifying OTP:', err);
      setError('Failed to verify OTP. Please try again.');
    } finally {
      setVerifying(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <div className="spinner"></div>
        <p>Loading order details...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <AlertCircle size={48} color="#ef4444" style={{ margin: '0 auto 1rem' }} />
        <h2>Order Not Found</h2>
        <button
          onClick={() => navigate('/dashboard')}
          style={{
            marginTop: '1rem',
            padding: '0.75rem 1.5rem',
            background: '#10b981',
            color: '#ffffff',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer'
          }}
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  if (success) {
    return (
      <div style={{ 
        padding: '2rem', 
        maxWidth: '600px', 
        margin: '0 auto',
        textAlign: 'center'
      }}>
        <div style={{
          background: '#f0fdf4',
          border: '2px solid #10b981',
          borderRadius: '12px',
          padding: '2rem'
        }}>
          <CheckCircle size={64} color="#10b981" style={{ margin: '0 auto 1rem' }} />
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem', color: '#065f46' }}>
            Order Collected Successfully!
          </h2>
          <p style={{ color: '#047857', marginBottom: '1rem' }}>
            Thank you for collecting your order from the hub.
          </p>
          <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
            Redirecting to dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto' }}>
      <div style={{
        background: '#ffffff',
        border: '1px solid #e5e7eb',
        borderRadius: '12px',
        padding: '2rem'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <Package size={48} color="#10b981" style={{ margin: '0 auto 1rem' }} />
          <h1 style={{ fontSize: '1.75rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
            Verify Collection
          </h1>
          <p style={{ color: '#6b7280' }}>
            Enter the OTP to collect your order
          </p>
        </div>

        {order && (
          <div style={{
            background: '#f9fafb',
            borderRadius: '8px',
            padding: '1rem',
            marginBottom: '1.5rem'
          }}>
            <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>
              Order Details
            </div>
            <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>
              Order #{order._id?.slice(-6).toUpperCase()}
            </div>
            {order.collectionHub && (
              <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                Collection Hub: {order.collectionHub.name}
              </div>
            )}
            <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
              Total Amount: ₹{order.totalAmount}
            </div>
          </div>
        )}

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

        <form onSubmit={handleVerifyOtp}>
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '0.5rem'
            }}>
              Enter 6-Digit OTP
            </label>
            <input
              type="text"
              value={otp}
              onChange={(e) => {
                const value = e.target.value.replace(/[^0-9]/g, '');
                if (value.length <= 6) {
                  setOtp(value);
                  setError('');
                }
              }}
              placeholder="000000"
              maxLength={6}
              style={{
                width: '100%',
                padding: '1rem',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '1.5rem',
                textAlign: 'center',
                letterSpacing: '0.5rem',
                fontWeight: 'bold'
              }}
              required
            />
          </div>

          <button
            type="submit"
            disabled={verifying || otp.length !== 6}
            style={{
              width: '100%',
              padding: '1rem',
              background: verifying || otp.length !== 6 ? '#9ca3af' : '#10b981',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: verifying || otp.length !== 6 ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem'
            }}
          >
            {verifying ? (
              <>
                <div className="spinner" style={{ width: '20px', height: '20px' }}></div>
                Verifying...
              </>
            ) : (
              <>
                <CheckCircle size={20} />
                Verify & Collect Order
              </>
            )}
          </button>
        </form>

        <div style={{
          marginTop: '1.5rem',
          padding: '1rem',
          background: '#fffbeb',
          border: '1px solid #fbbf24',
          borderRadius: '8px',
          fontSize: '0.875rem',
          color: '#92400e'
        }}>
          <strong>Note:</strong> The OTP was sent to your registered email address. 
          Please check your inbox and present this OTP at the hub to collect your order.
        </div>
      </div>
    </div>
  );
}
