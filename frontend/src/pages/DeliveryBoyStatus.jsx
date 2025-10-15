import { useEffect, useState } from "react";
import { Power, Truck, Package, LogOut, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import authService from "../services/authService";
import { apiFetch } from "../services/api";

export default function DeliveryBoyStatus() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [currentStatus, setCurrentStatus] = useState('OFFLINE');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    if (!currentUser) {
      window.location.href = '/login';
      return;
    }
    if (currentUser.role !== 'deliveryboy') {
      navigate('/dashboard');
      return;
    }
    setUser(currentUser);
    fetchCurrentStatus();
  }, [navigate]);

  const fetchCurrentStatus = async () => {
    try {
      // Force refresh Firebase token before making the request
      const firebaseUser = authService.getFirebaseUser();
      if (!firebaseUser) {
        window.location.href = '/login';
        return;
      }
      
      // Get fresh token
      const token = await firebaseUser.getIdToken(true);
      if (!token) {
        window.location.href = '/login';
        return;
      }
      
      const response = await apiFetch('/api/delivery/status', { 
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          window.location.href = '/login';
          return;
        }
        throw new Error('Failed to fetch status');
      }
      
      const data = await response.json();
      setCurrentStatus(data.deliveryStatus || 'OFFLINE');
    } catch (error) {
      console.error('Error fetching status:', error);
      showMessage('Failed to fetch current status', 'error');
    }
  };

  const updateStatus = async (newStatus) => {
    setLoading(true);
    setMessage({ text: '', type: '' });
    
    try {
      // Force refresh Firebase token before making the request
      const firebaseUser = authService.getFirebaseUser();
      if (!firebaseUser) {
        showMessage('Session expired. Please login again.', 'error');
        setTimeout(() => window.location.href = '/login', 2000);
        return;
      }
      
      // Get fresh token
      const token = await firebaseUser.getIdToken(true);
      if (!token) {
        showMessage('Authentication failed. Please login again.', 'error');
        setTimeout(() => window.location.href = '/login', 2000);
        return;
      }
      
      const response = await apiFetch('/api/delivery/status', {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 401 || response.status === 403) {
          showMessage('Session expired. Please login again.', 'error');
          setTimeout(() => window.location.href = '/login', 2000);
          return;
        }
        throw new Error(errorData.message || errorData.error || 'Failed to update status');
      }
      
      const data = await response.json();
      if (data.success) {
        setCurrentStatus(newStatus);
        showMessage(`Status updated to ${formatStatus(newStatus)}`, 'success');
      } else {
        throw new Error(data.message || 'Failed to update status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      showMessage(error.message || 'Failed to update status', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (text, type) => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 4000);
  };

  const formatStatus = (status) => {
    const statusMap = {
      'OFFLINE': 'Offline',
      'OPEN_FOR_DELIVERY': 'Open for Delivery',
      'OUT_FOR_DELIVERY': 'Out for Delivery'
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status) => {
    const colorMap = {
      'OFFLINE': '#6b7280',
      'OPEN_FOR_DELIVERY': '#10b981',
      'OUT_FOR_DELIVERY': '#f59e0b'
    };
    return colorMap[status] || '#6b7280';
  };

  const handleLogout = async () => {
    const result = await authService.logoutNoRedirect();
    if (result?.success) {
      showMessage('Logged out successfully', 'success');
      setTimeout(() => {
        window.location.href = '/login';
      }, 1500);
    } else {
      showMessage('Logout failed. Please try again.', 'error');
    }
  };

  if (!user) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#f9fafb' }}>
        <div style={{ width: '3rem', height: '3rem', border: '4px solid #0ea5e9', borderTop: '4px solid transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
      </div>
    );
  }

  const containerStyle = {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2rem'
  };

  const cardStyle = {
    background: 'white',
    borderRadius: '20px',
    padding: '3rem',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
    maxWidth: '600px',
    width: '100%',
    position: 'relative'
  };

  const statusButtonStyle = (status) => ({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2rem',
    borderRadius: '16px',
    border: currentStatus === status ? `3px solid ${getStatusColor(status)}` : '2px solid #e5e7eb',
    background: currentStatus === status ? `${getStatusColor(status)}15` : 'white',
    cursor: loading ? 'not-allowed' : 'pointer',
    transition: 'all 0.3s ease',
    opacity: loading ? 0.6 : 1
  });

  const iconStyle = (status) => ({
    marginBottom: '1rem',
    color: getStatusColor(status)
  });

  return (
    <div style={containerStyle}>
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
      
      <div style={cardStyle}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <button
            onClick={() => navigate('/deliveryboy/dashboard')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 1rem',
              borderRadius: '8px',
              border: '1px solid #e5e7eb',
              background: 'white',
              cursor: 'pointer',
              fontSize: '0.875rem',
              color: '#6b7280'
            }}
          >
            <ArrowLeft size={16} /> Back
          </button>
          
          <button
            onClick={handleLogout}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 1rem',
              borderRadius: '8px',
              border: '1px solid #fee2e2',
              background: '#fef2f2',
              cursor: 'pointer',
              fontSize: '0.875rem',
              color: '#dc2626'
            }}
          >
            <LogOut size={16} /> Logout
          </button>
        </div>

        {/* Title */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '0.5rem' }}>
            Update Your Status
          </h1>
          <p style={{ color: '#6b7280', fontSize: '1rem' }}>
            Let the admin know your availability
          </p>
        </div>

        {/* Current Status Badge */}
        <div style={{ 
          textAlign: 'center', 
          marginBottom: '2rem',
          padding: '1rem',
          background: `${getStatusColor(currentStatus)}15`,
          borderRadius: '12px',
          border: `2px solid ${getStatusColor(currentStatus)}30`
        }}>
          <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>Current Status</p>
          <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: getStatusColor(currentStatus) }}>
            {formatStatus(currentStatus)}
          </p>
        </div>

        {/* Message */}
        {message.text && (
          <div style={{
            padding: '1rem',
            borderRadius: '8px',
            marginBottom: '1.5rem',
            background: message.type === 'success' ? '#f0fdf4' : '#fef2f2',
            border: `1px solid ${message.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
            color: message.type === 'success' ? '#166534' : '#dc2626',
            textAlign: 'center'
          }}>
            {message.text}
          </div>
        )}

        {/* Status Options */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem', marginBottom: '2rem' }}>
          <button
            onClick={() => updateStatus('OFFLINE')}
            disabled={loading || currentStatus === 'OFFLINE'}
            style={statusButtonStyle('OFFLINE')}
            onMouseEnter={(e) => {
              if (!loading && currentStatus !== 'OFFLINE') {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 8px 20px rgba(0, 0, 0, 0.1)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <Power size={32} style={iconStyle('OFFLINE')} />
            <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '0.25rem' }}>
              Offline
            </h3>
            <p style={{ fontSize: '0.875rem', color: '#6b7280', textAlign: 'center' }}>
              Not available for deliveries
            </p>
          </button>

          <button
            onClick={() => updateStatus('OPEN_FOR_DELIVERY')}
            disabled={loading || currentStatus === 'OPEN_FOR_DELIVERY'}
            style={statusButtonStyle('OPEN_FOR_DELIVERY')}
            onMouseEnter={(e) => {
              if (!loading && currentStatus !== 'OPEN_FOR_DELIVERY') {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 8px 20px rgba(0, 0, 0, 0.1)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <Package size={32} style={iconStyle('OPEN_FOR_DELIVERY')} />
            <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '0.25rem' }}>
              Open for Delivery
            </h3>
            <p style={{ fontSize: '0.875rem', color: '#6b7280', textAlign: 'center' }}>
              Ready to accept new deliveries
            </p>
          </button>

          <button
            onClick={() => updateStatus('OUT_FOR_DELIVERY')}
            disabled={loading || currentStatus === 'OUT_FOR_DELIVERY'}
            style={statusButtonStyle('OUT_FOR_DELIVERY')}
            onMouseEnter={(e) => {
              if (!loading && currentStatus !== 'OUT_FOR_DELIVERY') {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 8px 20px rgba(0, 0, 0, 0.1)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <Truck size={32} style={iconStyle('OUT_FOR_DELIVERY')} />
            <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '0.25rem' }}>
              Out for Delivery
            </h3>
            <p style={{ fontSize: '0.875rem', color: '#6b7280', textAlign: 'center' }}>
              Currently delivering orders
            </p>
          </button>
        </div>

        {/* Info */}
        <div style={{
          padding: '1rem',
          background: '#f9fafb',
          borderRadius: '8px',
          border: '1px solid #e5e7eb'
        }}>
          <p style={{ fontSize: '0.875rem', color: '#6b7280', textAlign: 'center', margin: 0 }}>
            💡 Your status helps the admin assign deliveries efficiently
          </p>
        </div>
      </div>
    </div>
  );
}