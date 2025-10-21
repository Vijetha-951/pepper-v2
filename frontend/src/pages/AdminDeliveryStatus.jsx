import { useEffect, useState } from "react";
import { Truck, Power, Package, RefreshCw, ArrowLeft, User, Phone, Mail, MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom";
import authService from "../services/authService";
import { apiFetch } from "../services/api";

export default function AdminDeliveryStatus() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [deliveryBoys, setDeliveryBoys] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [filter, setFilter] = useState('ALL'); // ALL, ONLINE, OFFLINE

  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    if (!currentUser) {
      window.location.href = '/login';
      return;
    }
    if (currentUser.role !== 'admin') {
      navigate('/dashboard');
      return;
    }
    setUser(currentUser);
    fetchDeliveryBoys();
  }, [navigate]);

  const fetchDeliveryBoys = async () => {
    setLoading(true);
    try {
      const response = await apiFetch('/api/admin/delivery-boys/status', { method: 'GET' });
      const data = await response.json();
      if (data.success) {
        setDeliveryBoys(data.deliveryBoys || []);
      }
    } catch (error) {
      console.error('Error fetching delivery boys:', error);
      showMessage('Failed to fetch delivery boy statuses', 'error');
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

  const getStatusIcon = (status) => {
    const iconMap = {
      'OFFLINE': Power,
      'OPEN_FOR_DELIVERY': Package,
      'OUT_FOR_DELIVERY': Truck
    };
    return iconMap[status] || Power;
  };

  const formatDate = (date) => {
    if (!date) return 'Never';
    const d = new Date(date);
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getFilteredDeliveryBoys = () => {
    if (filter === 'ALL') return deliveryBoys;
    if (filter === 'ONLINE') {
      return deliveryBoys.filter(db => 
        db.deliveryStatus === 'OPEN_FOR_DELIVERY' || db.deliveryStatus === 'OUT_FOR_DELIVERY'
      );
    }
    if (filter === 'OFFLINE') {
      return deliveryBoys.filter(db => db.deliveryStatus === 'OFFLINE' || !db.deliveryStatus);
    }
    return deliveryBoys;
  };

  const getStatusCounts = () => {
    const online = deliveryBoys.filter(db => 
      db.deliveryStatus === 'OPEN_FOR_DELIVERY' || db.deliveryStatus === 'OUT_FOR_DELIVERY'
    ).length;
    const offline = deliveryBoys.filter(db => 
      db.deliveryStatus === 'OFFLINE' || !db.deliveryStatus
    ).length;
    return { online, offline, total: deliveryBoys.length };
  };

  if (!user) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#f9fafb' }}>
        <div style={{ width: '3rem', height: '3rem', border: '4px solid #10b981', borderTop: '4px solid transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
      </div>
    );
  }

  const filteredDeliveryBoys = getFilteredDeliveryBoys();
  const counts = getStatusCounts();

  const containerStyle = {
    minHeight: '100vh',
    background: '#f9fafb',
    padding: '2rem'
  };

  const headerStyle = {
    background: 'white',
    borderRadius: '12px',
    padding: '1.5rem',
    marginBottom: '2rem',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
    border: '1px solid #e5e7eb'
  };

  const cardStyle = {
    background: 'white',
    borderRadius: '12px',
    padding: '1.5rem',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
    border: '1px solid #e5e7eb',
    marginBottom: '1rem'
  };

  const statCardStyle = {
    ...cardStyle,
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'all 0.3s ease'
  };

  const filterButtonStyle = (isActive) => ({
    padding: '0.5rem 1rem',
    borderRadius: '8px',
    border: isActive ? 'none' : '1px solid #e5e7eb',
    background: isActive ? '#10b981' : 'white',
    color: isActive ? 'white' : '#6b7280',
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontWeight: isActive ? '600' : '400',
    transition: 'all 0.2s ease'
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

      {/* Header */}
      <div style={headerStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button
              onClick={() => navigate(-1)}
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
            <h1 style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>
              Delivery Boy Status
            </h1>
          </div>
          
          <button
            onClick={fetchDeliveryBoys}
            disabled={loading}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 1rem',
              borderRadius: '8px',
              border: '1px solid #10b981',
              background: '#10b981',
              color: 'white',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '0.875rem',
              opacity: loading ? 0.6 : 1
            }}
          >
            <RefreshCw size={16} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
            Refresh
          </button>
        </div>

        {/* Message */}
        {message.text && (
          <div style={{
            padding: '1rem',
            borderRadius: '8px',
            marginTop: '1rem',
            background: message.type === 'success' ? '#f0fdf4' : '#fef2f2',
            border: `1px solid ${message.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
            color: message.type === 'success' ? '#166534' : '#dc2626',
            textAlign: 'center'
          }}>
            {message.text}
          </div>
        )}
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <div style={statCardStyle}>
          <Truck size={28} color="#10b981" style={{ marginBottom: '0.5rem' }} />
          <h3 style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>{counts.total}</h3>
          <p style={{ color: '#6b7280', margin: 0, fontSize: '0.875rem' }}>Total Delivery Boys</p>
        </div>
        
        <div style={statCardStyle}>
          <Package size={28} color="#10b981" style={{ marginBottom: '0.5rem' }} />
          <h3 style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>{counts.online}</h3>
          <p style={{ color: '#6b7280', margin: 0, fontSize: '0.875rem' }}>Online</p>
        </div>
        
        <div style={statCardStyle}>
          <Power size={28} color="#6b7280" style={{ marginBottom: '0.5rem' }} />
          <h3 style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>{counts.offline}</h3>
          <p style={{ color: '#6b7280', margin: 0, fontSize: '0.875rem' }}>Offline</p>
        </div>
      </div>

      {/* Filters */}
      <div style={{ ...cardStyle, display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
        <button
          onClick={() => setFilter('ALL')}
          style={filterButtonStyle(filter === 'ALL')}
        >
          All ({counts.total})
        </button>
        <button
          onClick={() => setFilter('ONLINE')}
          style={filterButtonStyle(filter === 'ONLINE')}
        >
          Online ({counts.online})
        </button>
        <button
          onClick={() => setFilter('OFFLINE')}
          style={filterButtonStyle(filter === 'OFFLINE')}
        >
          Offline ({counts.offline})
        </button>
      </div>

      {/* Delivery Boys List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <div style={{ 
            width: '3rem', 
            height: '3rem', 
            border: '4px solid #10b981', 
            borderTop: '4px solid transparent', 
            borderRadius: '50%', 
            animation: 'spin 1s linear infinite',
            margin: '0 auto'
          }}></div>
          <p style={{ color: '#6b7280', marginTop: '1rem' }}>Loading delivery boys...</p>
        </div>
      ) : filteredDeliveryBoys.length === 0 ? (
        <div style={cardStyle}>
          <p style={{ textAlign: 'center', color: '#6b7280', padding: '2rem' }}>
            No delivery boys found
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1rem' }}>
          {filteredDeliveryBoys.map((db) => {
            const StatusIcon = getStatusIcon(db.deliveryStatus || 'OFFLINE');
            const statusColor = getStatusColor(db.deliveryStatus || 'OFFLINE');
            
            return (
              <div key={db._id} style={cardStyle}>
                {/* Status Badge */}
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem 1rem',
                  borderRadius: '20px',
                  background: `${statusColor}15`,
                  border: `2px solid ${statusColor}30`,
                  marginBottom: '1rem'
                }}>
                  <StatusIcon size={16} color={statusColor} />
                  <span style={{ fontSize: '0.875rem', fontWeight: '600', color: statusColor }}>
                    {formatStatus(db.deliveryStatus || 'OFFLINE')}
                  </span>
                </div>

                {/* Name */}
                <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '1rem' }}>
                  {db.firstName} {db.lastName}
                </h3>

                {/* Contact Info */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Mail size={16} color="#6b7280" />
                    <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>{db.email}</span>
                  </div>
                  
                  {db.phone && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Phone size={16} color="#6b7280" />
                      <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>{db.phone}</span>
                    </div>
                  )}
                </div>

                {/* Assigned Areas */}
                {(db.assignedAreas?.districts?.length > 0 || db.assignedAreas?.pincodes?.length > 0) && (
                  <div style={{
                    padding: '0.75rem',
                    background: '#f9fafb',
                    borderRadius: '8px',
                    marginBottom: '1rem'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <MapPin size={14} color="#6b7280" />
                      <span style={{ fontSize: '0.75rem', fontWeight: '600', color: '#6b7280' }}>
                        ASSIGNED AREAS
                      </span>
                    </div>
                    {db.assignedAreas.districts?.length > 0 && (
                      <p style={{ fontSize: '0.875rem', color: '#1f2937', margin: '0.25rem 0' }}>
                        Districts: {db.assignedAreas.districts.join(', ')}
                      </p>
                    )}
                    {db.assignedAreas.pincodes?.length > 0 && (
                      <p style={{ fontSize: '0.875rem', color: '#1f2937', margin: '0.25rem 0' }}>
                        Pincodes: {db.assignedAreas.pincodes.join(', ')}
                      </p>
                    )}
                  </div>
                )}

                {/* Last Update */}
                <div style={{
                  padding: '0.5rem',
                  background: '#f9fafb',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  color: '#6b7280',
                  textAlign: 'center'
                }}>
                  Last updated: {formatDate(db.lastStatusUpdate)}
                </div>

                {/* Account Status */}
                {db.isActive === false && (
                  <div style={{
                    marginTop: '0.5rem',
                    padding: '0.5rem',
                    background: '#fef2f2',
                    border: '1px solid #fecaca',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    color: '#dc2626',
                    textAlign: 'center'
                  }}>
                    Account Inactive
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}