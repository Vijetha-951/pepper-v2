import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Building2, Loader, ArrowRight, LogOut, Bell, Package, Truck, CheckCircle, X } from 'lucide-react';
import { auth } from '../config/firebase';
import { signOut } from 'firebase/auth';
import './DistrictSelection.css';

const DistrictSelection = () => {
  const navigate = useNavigate();
  const [districts, setDistricts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selecting, setSelecting] = useState(false);
  
  // Notification state
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    fetchDistricts();
    fetchNotifications();
  }, []);

  const fetchDistricts = async () => {
    try {
      setLoading(true);
      const token = await auth.currentUser?.getIdToken();
      
      if (!token) {
        setError('Authentication required');
        return;
      }

      const response = await fetch('/api/hub/districts', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setDistricts(data.districts || []);
      } else {
        setError('Failed to fetch districts');
      }
    } catch (err) {
      console.error('Error fetching districts:', err);
      setError('An error occurred while loading districts');
    } finally {
      setLoading(false);
    }
  };

  const handleDistrictSelect = async (district) => {
    try {
      console.log('🔵 CLICK DETECTED - Selecting district:', district);
      setSelectedDistrict(district);
      setSelecting(true);
      setError('');
      
      const token = await auth.currentUser?.getIdToken();
      console.log('Token obtained:', token ? 'Yes' : 'No');

      console.log('Making API call to /api/hub/select-district...');
      const response = await fetch('/api/hub/select-district', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ district })
      });

      console.log('Response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('✅ SUCCESS - Response data:', data);
        
        // Store selected district in session storage for the hub manager dashboard
        sessionStorage.setItem('selectedDistrict', district);
        sessionStorage.setItem('selectedHub', JSON.stringify(data.hub));
        console.log('✅ Stored in sessionStorage');
        console.log('✅ selectedDistrict:', sessionStorage.getItem('selectedDistrict'));
        console.log('✅ selectedHub:', sessionStorage.getItem('selectedHub'));
        console.log('✅ Now navigating to /dashboard...');
        
        // Navigate to hub manager dashboard with state to indicate we came from district selection
        navigate('/dashboard', { state: { fromDistrictSelection: true } });
      } else {
        const data = await response.json();
        console.error('❌ API ERROR - Status:', response.status, 'Data:', data);
        setError(data.error || 'Failed to select district');
        setSelectedDistrict('');
      }
    } catch (err) {
      console.error('Error selecting district:', err);
      setError('An error occurred while selecting district: ' + err.message);
      setSelectedDistrict('');
    } finally {
      setSelecting(false);
    }
  };

  const fetchNotifications = async () => {
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) return;

      const response = await fetch('/api/notifications?limit=10', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setNotifications(data);
      }

      // Fetch unread count
      const countResponse = await fetch('/api/notifications/unread-count', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (countResponse.ok) {
        const countData = await countResponse.json();
        setUnreadCount(countData.count);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const handleNotificationClick = async (notification) => {
    try {
      if (!notification.isRead) {
        const token = await auth.currentUser?.getIdToken();
        await fetch(`/api/notifications/${notification._id}/read`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        setNotifications(prev => 
          prev.map(n => n._id === notification._id ? { ...n, isRead: true } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }

      // Navigate to the district
      if (notification.metadata?.district) {
        setShowNotifications(false);
        await handleDistrictSelect(notification.metadata.district);
      }
    } catch (error) {
      console.error('Error handling notification:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const token = await auth.currentUser?.getIdToken();
      await fetch('/api/notifications/read-all', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      sessionStorage.clear();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (loading) {
    return (
      <div className="district-selection-container">
        <div className="loading-state">
          <Loader className="spinner" size={48} />
          <p>Loading districts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="district-selection-container">
      <div className="district-selection-header">
        <div className="header-content">
          <Building2 size={32} className="header-icon" />
          <div>
            <h1>Select Your District</h1>
            <p>Choose a district to manage hub operations</p>
          </div>
        </div>
        <div className="header-actions">
          <button 
            onClick={() => setShowNotifications(!showNotifications)} 
            className="notification-btn"
            style={{ position: 'relative' }}
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="notification-badge">{unreadCount}</span>
            )}
          </button>
          <button onClick={handleLogout} className="logout-btn">
            <LogOut size={20} />
            Logout
          </button>
        </div>
      </div>

      {/* Notification Panel */}
      {showNotifications && (
        <div className="notification-panel">
          <div className="notification-header">
            <h3>Notifications</h3>
            <div className="notification-header-actions">
              {unreadCount > 0 && (
                <button 
                  className="mark-all-read-btn" 
                  onClick={handleMarkAllAsRead}
                >
                  Mark all as read
                </button>
              )}
              <button 
                className="close-notification-btn" 
                onClick={() => setShowNotifications(false)}
              >
                <X size={18} />
              </button>
            </div>
          </div>
          <div className="notification-list">
            {notifications.length === 0 ? (
              <div className="no-notifications">
                <Bell size={40} />
                <p>No notifications yet</p>
              </div>
            ) : (
              notifications.map(notification => (
                <div
                  key={notification._id}
                  className={`notification-item ${notification.isRead ? 'read' : 'unread'}`}
                  onClick={() => handleNotificationClick(notification)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="notification-icon">
                    {notification.type === 'ORDER_PLACED' && <Package size={20} />}
                    {notification.type === 'ORDER_ARRIVED' && <Truck size={20} />}
                    {notification.type === 'ORDER_DISPATCHED' && <CheckCircle size={20} />}
                  </div>
                  <div className="notification-content">
                    <h4 className="notification-title">{notification.title}</h4>
                    <p className="notification-message">{notification.message}</p>
                    <span className="notification-time">
                      {new Date(notification.createdAt).toLocaleString()}
                    </span>
                  </div>
                  {!notification.isRead && (
                    <div className="notification-unread-dot"></div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {error && (
        <div className="error-banner">
          <p>{error}</p>
        </div>
      )}

      <div className="districts-grid">
        {districts.length === 0 ? (
          <div className="no-districts">
            <MapPin size={48} />
            <p>No districts available</p>
          </div>
        ) : (
          districts.map((districtData) => (
            <div
              key={districtData.district}
              className={`district-card ${selecting && selectedDistrict === districtData.district ? 'selecting' : ''}`}
              onClick={() => !selecting && handleDistrictSelect(districtData.district)}
              style={{ cursor: selecting ? 'wait' : 'pointer', opacity: selecting && selectedDistrict !== districtData.district ? 0.5 : 1 }}
            >
              <div className="district-card-header">
                <MapPin size={24} className="district-icon" />
                <h3>{districtData.district}</h3>
              </div>
              
              <div className="district-stats">
                <div className="stat-item">
                  <span className="stat-label">Hubs</span>
                  <span className="stat-value">{districtData.hubCount}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Active Orders</span>
                  <span className="stat-value">{districtData.orderCount || 0}</span>
                </div>
              </div>

              <div className="hub-types">
                {districtData.hubTypes && districtData.hubTypes.map((type, idx) => (
                  <span key={idx} className={`hub-type-badge ${type.toLowerCase()}`}>
                    {type}
                  </span>
                ))}
              </div>

              <button className="select-btn">
                {selecting && selectedDistrict === districtData.district ? (
                  <>
                    <Loader className="spinner" size={18} />
                    <span>Selecting...</span>
                  </>
                ) : (
                  <>
                    <span>Select District</span>
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default DistrictSelection;
