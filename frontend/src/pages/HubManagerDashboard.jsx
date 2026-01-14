import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Truck, MapPin, Clock, Search, RefreshCw, X, AlertCircle, CheckCircle, ScanLine, Bell } from 'lucide-react';
import { auth } from '../config/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import './HubManagerDashboard.css';

const HubManagerDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [hub, setHub] = useState(null);
  const [orders, setOrders] = useState([]);
  const [dispatchedOrders, setDispatchedOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [filteredDispatchedOrders, setFilteredDispatchedOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');
  const [manualOrderId, setManualOrderId] = useState(''); // New state for manual input
  const [activeTab, setActiveTab] = useState('active'); // 'active', 'dispatched', 'hub-collection', or 'inventory'
  const [collectionOrders, setCollectionOrders] = useState([]);
  const [filteredCollectionOrders, setFilteredCollectionOrders] = useState([]);
  const [hubInventory, setHubInventory] = useState([]);
  
  // Notification state
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);

  const [modals, setModals] = useState({
    scanIn: { isOpen: false, orderId: null, loading: false },
    dispatch: {
      isOpen: false,
      orderId: null,
      loading: false,
      nextHubId: '',
      deliveryBoyId: '',
      nextHubs: [],
      deliveryBoys: [],
      loadingHubs: false,
      loadingBoys: false
    },
    trackingDetail: {
      isOpen: false,
      order: null
    }
  });

  const [summary, setSummary] = useState({
    ordersLeftToScan: 0,
    readyForDispatch: 0,
    inTransit: 0,
    recentArrivals: 0
  });

  // Helper function to generate headers with district selection
  const getApiHeaders = async (firebaseUser) => {
    const token = await firebaseUser.getIdToken();
    const selectedDistrict = sessionStorage.getItem('selectedDistrict');
    
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    
    if (selectedDistrict) {
      headers['X-Selected-District'] = selectedDistrict;
    }
    
    return headers;
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        fetchHubAndOrders(firebaseUser);
        fetchNotifications(firebaseUser);
      } else {
        setLoading(false);
        setError('Please sign in to view hub details');
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (hub) {
      filterOrders();
      calculateSummary();
    }
  }, [orders, dispatchedOrders, collectionOrders, searchTerm, hub]);

  const fetchHubAndOrders = async (firebaseUser) => {
    try {
      setLoading(true);
      const headers = await getApiHeaders(firebaseUser);

      const hubResponse = await fetch('/api/hub/my-hub', { headers });

      if (hubResponse.ok) {
        const hubData = await hubResponse.json();
        setHub(hubData);

        const ordersResponse = await fetch('/api/hub/orders', { headers });

        if (ordersResponse.ok) {
          const ordersData = await ordersResponse.json();
          console.log('🔍 Hub Manager - Orders fetched:', ordersData.length);
          console.log('🔍 First order route:', ordersData[0]?.route);
          setOrders(ordersData);
        } else {
          setError('Failed to fetch orders');
        }

        // Fetch dispatched orders
        const dispatchedResponse = await fetch('/api/hub/dispatched-orders', { headers });

        if (dispatchedResponse.ok) {
          const dispatchedData = await dispatchedResponse.json();
          console.log('🔍 Hub Manager - Dispatched orders fetched:', dispatchedData.length);
          setDispatchedOrders(dispatchedData);
        }

        // Fetch hub collection orders
        const collectionResponse = await fetch(`/api/orders?deliveryType=HUB_COLLECTION&collectionHub=${hubData._id}`, { headers });

        if (collectionResponse.ok) {
          const collectionData = await collectionResponse.json();
          console.log('🔍 Hub Manager - Hub collection orders fetched:', collectionData.length);
          setCollectionOrders(collectionData);
        }

        // Fetch hub inventory
        const inventoryResponse = await fetch(`/api/hub-inventory/hubs/${hubData._id}/inventory`, { headers });

        if (inventoryResponse.ok) {
          const inventoryData = await inventoryResponse.json();
          console.log('🔍 Hub Manager - Hub inventory fetched:', inventoryData.inventory?.length || 0);
          setHubInventory(inventoryData.inventory || []);
        }
      } else {
        setError('Failed to fetch hub details');
      }
    } catch (error) {
      console.error('Error fetching hub data:', error);
      setError('Failed to load hub data');
    } finally {
      setLoading(false);
    }
  };

  const filterOrders = () => {
    let filtered = orders;
    let filteredDispatched = dispatchedOrders;
    let filteredCollection = collectionOrders;

    if (searchTerm) {
      filtered = filtered.filter(order => {
        const customerName = order.user?.name || `${order.user?.firstName || ''} ${order.user?.lastName || ''}`.trim();
        return order._id.includes(searchTerm) ||
               customerName.toLowerCase().includes(searchTerm.toLowerCase());
      });
      filteredDispatched = filteredDispatched.filter(order => {
        const customerName = order.user?.name || `${order.user?.firstName || ''} ${order.user?.lastName || ''}`.trim();
        return order._id.includes(searchTerm) ||
               customerName.toLowerCase().includes(searchTerm.toLowerCase());
      });
      filteredCollection = filteredCollection.filter(order => {
        const customerName = order.user?.name || `${order.user?.firstName || ''} ${order.user?.lastName || ''}`.trim();
        return order._id.includes(searchTerm) ||
               customerName.toLowerCase().includes(searchTerm.toLowerCase());
      });
    }

    setFilteredOrders(filtered);
    setFilteredDispatchedOrders(filteredDispatched);
    setFilteredCollectionOrders(filteredCollection);
  };

  const calculateSummary = () => {
    if (!hub) return;

    // Get start of today (midnight)
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const todayTimestamp = startOfToday.getTime();

    let ordersLeftToScanCount = 0;
    let readyForDispatchCount = 0;
    let inTransitCount = 0;
    let recentArrivalsCount = 0;

    orders.forEach(order => {
      // Find events related to THIS hub
      const getHubId = (h) => (typeof h === 'object' && h !== null ? h._id : h);

      // Get latest arrival at this hub
      const arrivalEvent = [...(order.trackingTimeline || [])]
        .reverse()
        .find(t => t.status === 'ARRIVED_AT_HUB' && getHubId(t.hub) === hub._id);

      // Get latest dispatch from this hub
      const dispatchEvent = [...(order.trackingTimeline || [])]
        .reverse()
        .find(t => 
          (t.status === 'IN_TRANSIT' || t.status === 'OUT_FOR_DELIVERY') && 
          getHubId(t.hub) === hub._id
        );

      // 1. Orders Left to Scan: Active orders at this hub that haven't been scanned in yet
      const isActive = order.status !== 'CANCELLED' && order.status !== 'DELIVERED';
      const isAtThisHub = order.currentHub && getHubId(order.currentHub) === hub._id;
      
      // Count orders that are at this hub but haven't been scanned in yet
      if (isActive && isAtThisHub && !arrivalEvent) {
        ordersLeftToScanCount++;
      }

      // Check if dispatched (Dispatch event exists and is after arrival)
      const dispatchTime = dispatchEvent ? (dispatchEvent.timestamp || dispatchEvent.createdAt) : null;
      const arrivalTimeVal = arrivalEvent ? (arrivalEvent.timestamp || arrivalEvent.createdAt) : null;
      
      const isDispatched = dispatchEvent && arrivalEvent && 
        new Date(dispatchTime) > new Date(arrivalTimeVal);

      // 2. Ready for Dispatch: Scanned in (Approved) and NOT dispatched
      if (order.status === 'APPROVED' && !isDispatched) {
        readyForDispatchCount++;
      }

      // 3. In Transit: Dispatched from this hub
      if (isDispatched || order.status === 'OUT_FOR_DELIVERY') {
        inTransitCount++;
      }

      // 4. Recent Arrivals: Arrived today (since midnight)
      if (arrivalEvent) {
        const eventTime = arrivalEvent.timestamp || arrivalEvent.createdAt;
        const arrivalTime = new Date(eventTime).getTime();
        if (arrivalTime >= todayTimestamp) {
          recentArrivalsCount++;
        }
      }
    });

    setSummary({
      ordersLeftToScan: ordersLeftToScanCount,
      readyForDispatch: readyForDispatchCount,
      inTransit: inTransitCount,
      recentArrivals: recentArrivalsCount
    });
  };

  // Fetch notifications
  const fetchNotifications = async (firebaseUser) => {
    try {
      const token = await firebaseUser.getIdToken();
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

  // Handle notification click
  const handleNotificationClick = async (notification) => {
    try {
      if (!notification.isRead) {
        const token = await user.getIdToken();
        await fetch(`/api/notifications/${notification._id}/read`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        // Remove notification from list after clicking
        setNotifications(prev => prev.filter(n => n._id !== notification._id));
        setUnreadCount(prev => Math.max(0, prev - 1));
      } else {
        // If already read, still remove it when clicked
        setNotifications(prev => prev.filter(n => n._id !== notification._id));
      }

      // Navigate to the respective district hub manager dashboard
      if (notification.metadata?.district) {
        sessionStorage.setItem('selectedDistrict', notification.metadata.district);
        if (notification.hub) {
          sessionStorage.setItem('selectedHub', JSON.stringify(notification.hub));
        }
        
        // Close notification panel
        setShowNotifications(false);
        
        // Refresh the dashboard to load the selected district's data
        if (user) {
          fetchHubAndOrders(user);
        }
      }
    } catch (error) {
      console.error('Error handling notification:', error);
    }
  };

  // Dismiss notification without navigating
  const handleDismissNotification = async (e, notificationId) => {
    e.stopPropagation(); // Prevent triggering the notification click
    try {
      console.log('🗑️ Attempting to delete notification:', notificationId);
      const token = await user.getIdToken();
      
      // Delete the notification permanently
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('🗑️ Delete response status:', response.status);
      
      if (response.ok) {
        console.log('✅ Notification deleted successfully');
        // Remove from list immediately
        setNotifications(prev => {
          const notification = prev.find(n => n._id === notificationId);
          if (notification && !notification.isRead) {
            setUnreadCount(count => Math.max(0, count - 1));
          }
          return prev.filter(n => n._id !== notificationId);
        });
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Failed to delete notification:', response.status, errorData);
        alert('Failed to delete notification. Please try again.');
      }
    } catch (error) {
      console.error('❌ Error dismissing notification:', error);
      alert('Error dismissing notification. Please try again.');
    }
  };

  // Mark all notifications as read
  const handleMarkAllAsRead = async () => {
    try {
      const token = await user.getIdToken();
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

  const handleScanIn = async (orderIdToScan) => {
    // Use header-level state if argument is not provided (manual entry)
    const finalOrderId = orderIdToScan || manualOrderId;

    if (!finalOrderId) {
      setActionError('Please enter an Order ID');
      return;
    }

    try {
      setModals(prev => ({
        ...prev,
        scanIn: { ...prev.scanIn, loading: true }
      }));
      setActionError('');
      setActionSuccess('');

      const headers = await getApiHeaders(user);
      const response = await fetch('/api/hub/scan-in', {
        method: 'POST',
        headers,
        body: JSON.stringify({ orderId: finalOrderId })
      });

      if (response.ok) {
        const updatedOrder = await response.json();
        // If order already in list, update it; otherwise add it to list
        setOrders(prev => {
          const exists = prev.find(o => o._id === updatedOrder._id);
          if (exists) return prev.map(o => o._id === updatedOrder._id ? updatedOrder : o);
          return [updatedOrder, ...prev];
        });

        setActionSuccess(`Package ${finalOrderId} scanned in successfully!`);
        setManualOrderId(''); // Clear input
        closeModal('scanIn');

        setTimeout(() => setActionSuccess(''), 3000);
      } else {
        const err = await response.json();
        setActionError(err.message || 'Failed to scan in package');
      }
    } catch (error) {
      console.error('Scan-in error:', error);
      setActionError('Error scanning in package');
    } finally {
      setModals(prev => ({
        ...prev,
        scanIn: { ...prev.scanIn, loading: false }
      }));
    }
  };

  const loadDispatchOptions = async (orderId) => {
    try {
      const headers = await getApiHeaders(user);
      const order = orders.find(o => o._id === orderId);

      if (!order) return;

      setModals(prev => ({
        ...prev,
        dispatch: {
          ...prev.dispatch,
          loadingHubs: true,
          loadingBoys: true
        }
      }));

      // Load next hub
      let nextHubId = '';
      try {
        const nextHubResponse = await fetch(`/api/hub/next-hub/${orderId}`, {
          headers
        });

        if (nextHubResponse.ok) {
          const nextHub = await nextHubResponse.json();
          nextHubId = nextHub._id;
        }
      } catch (error) {
        console.warn('Could not fetch next hub:', error);
      }

      // Load delivery boys for local hub
      let deliveryBoys = [];
      if (hub?.type === 'LOCAL_HUB') {
        try {
          const boysResponse = await fetch('/api/hub/available-delivery-boys', {
            headers
          });

          if (boysResponse.ok) {
            deliveryBoys = await boysResponse.json();
          }
        } catch (error) {
          console.warn('Could not fetch delivery boys:', error);
        }
      }

      setModals(prev => ({
        ...prev,
        dispatch: {
          ...prev.dispatch,
          orderId: orderId,
          deliveryBoys: deliveryBoys || [],
          nextHubId: nextHubId || '',
          isOpen: true,
          loadingHubs: false,
          loadingBoys: false
        }
      }));
    } catch (error) {
      console.error('Error loading dispatch options:', error);
      setActionError('Failed to load dispatch options');
      setModals(prev => ({
        ...prev,
        dispatch: {
          ...prev.dispatch,
          loadingHubs: false,
          loadingBoys: false
        }
      }));
    }
  };

  const handleDispatch = async () => {
    try {
      const { orderId, nextHubId, deliveryBoyId } = modals.dispatch;

      if (!orderId) {
        setActionError('Order ID is missing');
        return;
      }

      if (hub?.type !== 'LOCAL_HUB' && !nextHubId) {
        setActionError('Please select a next hub');
        return;
      }

      if (hub?.type === 'LOCAL_HUB' && !deliveryBoyId) {
        setActionError('Please select a delivery boy');
        return;
      }

      setModals(prev => ({
        ...prev,
        dispatch: { ...prev.dispatch, loading: true }
      }));
      setActionError('');
      setActionSuccess('');

      const headers = await getApiHeaders(user);
      const response = await fetch('/api/hub/dispatch', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          orderId,
          nextHubId: hub?.type !== 'LOCAL_HUB' ? nextHubId : undefined,
          deliveryBoyId: hub?.type === 'LOCAL_HUB' ? deliveryBoyId : undefined
        })
      });

      if (response.ok) {
        const updatedOrder = await response.json();
        // Remove from active orders and refresh both lists
        setOrders(prev => prev.filter(o => o._id !== orderId));
        
        // Refresh dispatched orders to include the newly dispatched order
        const dispatchedResponse = await fetch('/api/hub/dispatched-orders', {
          headers
        });

        if (dispatchedResponse.ok) {
          const dispatchedData = await dispatchedResponse.json();
          setDispatchedOrders(dispatchedData);
        }

        setActionSuccess('Package dispatched successfully!');
        closeModal('dispatch');

        setTimeout(() => setActionSuccess(''), 3000);
      } else {
        const errorData = await response.json();
        setActionError(errorData.message || 'Failed to dispatch package');
      }
    } catch (error) {
      console.error('Dispatch error:', error);
      setActionError('Error dispatching package');
    } finally {
      setModals(prev => ({
        ...prev,
        dispatch: { ...prev.dispatch, loading: false }
      }));
    }
  };

  const closeModal = (modalName) => {
    setModals(prev => ({
      ...prev,
      [modalName]: {
        ...prev[modalName],
        isOpen: false
      }
    }));
  };

  const openTrackingDetail = (order) => {
    setModals(prev => ({
      ...prev,
      trackingDetail: {
        isOpen: true,
        order: order
      }
    }));
  };

  const handleMarkReadyForCollection = async (orderId) => {
    if (!window.confirm('Mark this order as ready for collection? An OTP will be generated and emailed to the customer.')) {
      return;
    }

    try {
      setActionError('');
      setActionSuccess('');

      const headers = await getApiHeaders(user);
      const response = await fetch(`/api/hub-collection/orders/${orderId}/ready-for-collection`, {
        method: 'PATCH',
        headers
      });

      if (response.ok) {
        const data = await response.json();
        setActionSuccess(`Order marked as ready! OTP sent to customer: ${data.order.user.email}`);
        
        // Refresh collection orders
        fetchHubAndOrders(user);
      } else {
        const errorData = await response.json();
        setActionError(errorData.message || 'Failed to mark order as ready');
      }
    } catch (error) {
      console.error('Error marking order ready:', error);
      setActionError('Failed to mark order as ready for collection');
    }
  };

  if (loading) {
    return (
      <div className="hub-loading">
        <div className="hub-spinner"></div>
        <p>Loading hub dashboard...</p>
      </div>
    );
  }

  return (
    <div className="hub-manager-dashboard">
      {error && <div className="hub-error-banner">{error}</div>}
      {actionSuccess && <div className="hub-success-banner">{actionSuccess}</div>}
      {actionError && <div className="hub-error-banner">{actionError}</div>}

      <div className="hub-header">
        <div className="hub-title-section">
          <h1>Hub Manager Dashboard</h1>
          {hub && (
            <div className="hub-info">
              <p className="hub-name">{hub.name}</p>
              <p className="hub-type">{hub.type.replace('_', ' ')}</p>
              {hub.location && (
                <p className="hub-location">
                  <MapPin size={14} />
                  {hub.location.city}, {hub.location.state}
                </p>
              )}
              {sessionStorage.getItem('selectedDistrict') && (
                <p className="hub-district-indicator">
                  <strong>District:</strong> {sessionStorage.getItem('selectedDistrict')}
                </p>
              )}
            </div>
          )}
        </div>
        <div className="hub-actions">
          {sessionStorage.getItem('selectedDistrict') && (
            <button
              className="hub-action-btn secondary"
              onClick={() => {
                sessionStorage.removeItem('selectedDistrict');
                sessionStorage.removeItem('selectedHub');
                navigate('/dashboard');
              }}
              title="Switch to another district"
            >
              <MapPin size={18} />
              Switch District
            </button>
          )}
          <button
            className="hub-action-btn notification-btn"
            onClick={() => setShowNotifications(!showNotifications)}
            title="Notifications"
            style={{ position: 'relative' }}
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="notification-badge">{unreadCount}</span>
            )}
          </button>
          <button
            className="hub-action-btn primary"
            onClick={() => {
              setManualOrderId('');
              setModals(prev => ({ ...prev, scanIn: { isOpen: true, orderId: null } }));
            }}
          >
            <ScanLine size={18} />
            Scan New Package
          </button>
          <button className="hub-refresh-btn" onClick={() => {
            fetchHubAndOrders(user);
            fetchNotifications(user);
          }}>
            <RefreshCw size={18} />
            Refresh
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
                  title="Mark all as read"
                >
                  Mark all as read
                </button>
              )}
              <button 
                className="close-notification-btn" 
                onClick={() => setShowNotifications(false)}
                title="Close"
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
                  style={{ cursor: 'pointer', position: 'relative' }}
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
                  <button
                    onClick={(e) => handleDismissNotification(e, notification._id)}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '12px',
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '4px',
                      borderRadius: '4px',
                      color: '#9ca3af',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#f3f4f6';
                      e.currentTarget.style.color = '#ef4444';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = '#9ca3af';
                    }}
                    title="Dismiss notification"
                  >
                    <X size={16} />
                  </button>
                  {!notification.isRead && (
                    <div className="notification-unread-dot"></div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      <div className="hub-summary">
        <div className="summary-card">
          <div className="summary-icon packages">
            <Package size={24} />
          </div>
          <div className="summary-content">
            <p className="summary-label">Total Orders Left to Scan</p>
            <p className="summary-value">{summary.ordersLeftToScan}</p>
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-icon dispatch">
            <Truck size={24} />
          </div>
          <div className="summary-content">
            <p className="summary-label">Ready for Dispatch</p>
            <p className="summary-value">{summary.readyForDispatch}</p>
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-icon transit">
            <Clock size={24} />
          </div>
          <div className="summary-content">
            <p className="summary-label">In Transit</p>
            <p className="summary-value">{summary.inTransit}</p>
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-icon recent">
            <AlertCircle size={24} />
          </div>
          <div className="summary-content">
            <p className="summary-label">Arrivals Today</p>
            <p className="summary-value">{summary.recentArrivals}</p>
          </div>
        </div>
      </div>

      <div className="hub-content">
        <div className="hub-orders-section">
          <div className="section-header">
            <div className="tabs-container">
              <button 
                className={`tab-btn ${activeTab === 'active' ? 'active' : ''}`}
                onClick={() => setActiveTab('active')}
              >
                Active Orders ({filteredOrders.length})
              </button>
              <button 
                className={`tab-btn ${activeTab === 'dispatched' ? 'active' : ''}`}
                onClick={() => setActiveTab('dispatched')}
              >
                Dispatched Orders ({filteredDispatchedOrders.length})
              </button>
              <button 
                className={`tab-btn ${activeTab === 'hub-collection' ? 'active' : ''}`}
                onClick={() => setActiveTab('hub-collection')}
              >
                📍 Hub Collection ({filteredCollectionOrders.length})
              </button>
              <button 
                className={`tab-btn ${activeTab === 'inventory' ? 'active' : ''}`}
                onClick={() => setActiveTab('inventory')}
              >
                📦 Hub Inventory ({hubInventory.length})
              </button>
            </div>
            <div className="search-box">
              <Search size={16} />
              <input
                type="text"
                placeholder="Search by Order ID or Customer Name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {activeTab === 'active' && filteredOrders.length === 0 && (
            <div className="no-orders">
              <Package size={48} />
              <p>No active packages at this hub</p>
            </div>
          )}

          {activeTab === 'dispatched' && filteredDispatchedOrders.length === 0 && (
            <div className="no-orders">
              <Truck size={48} />
              <p>No dispatched packages from this hub</p>
            </div>
          )}

          {activeTab === 'active' && filteredOrders.length > 0 && (
            <div className="orders-table-wrapper">
              <table className="orders-table">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Customer</th>
                    <th>Status</th>
                    <th>Items</th>
                    <th>Destination</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map(order => (
                    <tr key={order._id}>
                      <td className="order-id-cell">
                        <code>{order._id.substring(0, 8)}...</code>
                      </td>
                      <td>{order.user?.name || `${order.user?.firstName || ''} ${order.user?.lastName || ''}`.trim() || 'Unknown'}</td>
                      <td>
                        <span className={`status-badge status-${order.status?.toLowerCase()}`}>
                          {order.status || 'PENDING'}
                        </span>
                      </td>
                      <td>{order.items?.length || 0} items</td>
                      <td>
                        {order.shippingAddress?.district}, {order.shippingAddress?.state}
                      </td>
                      <td className="actions-cell">
                        <button
                          className="action-btn view-btn"
                          onClick={() => openTrackingDetail(order)}
                          title="View tracking"
                        >
                          View
                        </button>
                        {order.status !== 'DELIVERED' && order.status !== 'CANCELLED' && (
                          <>
                            {order.status === 'IN_TRANSIT' && (
                              <button
                                className="action-btn scan-btn"
                                onClick={() => setModals(prev => ({
                                  ...prev,
                                  scanIn: { isOpen: true, orderId: order._id, loading: false }
                                }))}
                                title="Scan in package"
                              >
                                Scan In
                              </button>
                            )}

                            {(order.status === 'APPROVED' && order.currentHub?._id === hub?._id) && (
                              <button
                                className="action-btn dispatch-btn"
                                onClick={() => loadDispatchOptions(order._id)}
                                title="Dispatch package"
                              >
                                Dispatch
                              </button>
                            )}
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'dispatched' && filteredDispatchedOrders.length > 0 && (
            <div className="orders-table-wrapper">
              <table className="orders-table">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Customer</th>
                    <th>Status</th>
                    <th>Items</th>
                    <th>Destination</th>
                    <th>Dispatch Time</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDispatchedOrders.map(order => {
                    // Get dispatch event from this hub
                    const dispatchEvent = order.trackingTimeline?.find(
                      entry => (entry.status === 'IN_TRANSIT' || entry.status === 'OUT_FOR_DELIVERY') &&
                      entry.hub && (typeof entry.hub === 'object' ? entry.hub._id : entry.hub) === hub?._id
                    );
                    
                    return (
                      <tr key={order._id}>
                        <td className="order-id-cell">
                          <code>{order._id.substring(0, 8)}...</code>
                        </td>
                        <td>{order.user?.name || `${order.user?.firstName || ''} ${order.user?.lastName || ''}`.trim() || 'Unknown'}</td>
                        <td>
                          <span className={`status-badge status-${order.status?.toLowerCase()}`}>
                            {order.status || 'IN_TRANSIT'}
                          </span>
                        </td>
                        <td>{order.items?.length || 0} items</td>
                        <td>
                          {order.shippingAddress?.district}, {order.shippingAddress?.state}
                        </td>
                        <td>
                          {dispatchEvent ? new Date(dispatchEvent.timestamp || dispatchEvent.createdAt).toLocaleString() : 'N/A'}
                        </td>
                        <td className="actions-cell">
                          <button
                            className="action-btn view-btn"
                            onClick={() => openTrackingDetail(order)}
                            title="View tracking"
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Hub Collection Orders Tab */}
          {activeTab === 'hub-collection' && filteredCollectionOrders.length === 0 && (
            <div className="empty-state">
              <Package size={48} color="#9ca3af" />
              <p>No hub collection orders</p>
            </div>
          )}

          {activeTab === 'hub-collection' && filteredCollectionOrders.length > 0 && (
            <div className="orders-table-wrapper">
              <table className="orders-table">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Customer</th>
                    <th>Status</th>
                    <th>Items</th>
                    <th>Total Amount</th>
                    <th>Order Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCollectionOrders.map(order => (
                    <tr key={order._id}>
                      <td className="order-id-cell">
                        <code>{order._id.substring(0, 8)}...</code>
                      </td>
                      <td>{order.user?.firstName} {order.user?.lastName}</td>
                      <td>
                        <span className={`status-badge status-${order.status?.toLowerCase()?.replace(/_/g, '-')}`}>
                          {order.status === 'READY_FOR_COLLECTION' ? 'Ready' : order.status || 'PENDING'}
                        </span>
                      </td>
                      <td>{order.items?.length || 0} items</td>
                      <td>₹{order.totalAmount}</td>
                      <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                      <td>
                        {order.status !== 'READY_FOR_COLLECTION' && order.status !== 'DELIVERED' && (
                          <button
                            className="action-btn primary"
                            onClick={() => handleMarkReadyForCollection(order._id)}
                            style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}
                          >
                            ✓ Mark Ready
                          </button>
                        )}
                        {order.status === 'READY_FOR_COLLECTION' && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <span style={{ color: '#10b981', fontWeight: '600', fontSize: '0.875rem' }}>
                              OTP Sent ✓
                            </span>
                            <button
                              className="action-btn primary"
                              onClick={() => navigate(`/collection-verification/${order._id}`)}
                              style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}
                            >
                              🔍 Verify Collection
                            </button>
                          </div>
                        )}
                        {order.status === 'DELIVERED' && (
                          <span style={{ color: '#6b7280' }}>
                            Collected ✓
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Hub Inventory Tab */}
          {activeTab === 'inventory' && (
            <div className="orders-table-wrapper">
              <table className="orders-table">
                <thead>
                  <tr>
                    <th>Product Name</th>
                    <th>Total Quantity</th>
                    <th>Reserved</th>
                    <th>Available</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {hubInventory.length === 0 ? (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                        No inventory items found
                      </td>
                    </tr>
                  ) : (
                    hubInventory.map((item) => {
                      const available = item.quantity - item.reservedQuantity;
                      const statusColor = available > 10 ? '#10b981' : available > 5 ? '#f59e0b' : '#ef4444';
                      const statusText = available > 10 ? 'Good' : available > 5 ? 'Low' : 'Critical';
                      
                      return (
                        <tr key={item._id}>
                          <td style={{ fontWeight: '600' }}>{item.product?.name || 'Unknown Product'}</td>
                          <td>{item.quantity}</td>
                          <td style={{ color: '#ef4444' }}>{item.reservedQuantity}</td>
                          <td style={{ fontWeight: '600', color: statusColor }}>{available}</td>
                          <td>
                            <span style={{
                              padding: '0.25rem 0.75rem',
                              background: `${statusColor}20`,
                              color: statusColor,
                              borderRadius: '12px',
                              fontSize: '0.75rem',
                              fontWeight: '600'
                            }}>
                              {statusText}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {modals.scanIn.isOpen && (
        <div className="hub-modal-overlay" onClick={() => closeModal('scanIn')}>
          <div className="hub-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Scan In Package</h3>
              <button className="close-btn" onClick={() => closeModal('scanIn')}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-content">

              {modals.scanIn.orderId ? (
                <>
                  <p>Are you sure you want to scan in this package at {hub?.name}?</p>
                  <div className="order-summary">
                    <p>
                      <strong>Order ID:</strong> {modals.scanIn.orderId}
                    </p>
                  </div>
                </>
              ) : (
                <div className="form-group">
                  <label>Enter Order ID to Scan</label>
                  <input
                    type="text"
                    className="modal-input"
                    placeholder="e.g. 64f..."
                    value={manualOrderId}
                    onChange={(e) => setManualOrderId(e.target.value)}
                    autoFocus
                  />
                  <p className="helper-text">Scan the barcode or enter the full Order ID manually.</p>
                </div>
              )}

            </div>
            <div className="modal-actions">
              <button
                className="btn btn-secondary"
                onClick={() => closeModal('scanIn')}
                disabled={modals.scanIn.loading}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={() => handleScanIn(modals.scanIn.orderId)}
                disabled={modals.scanIn.loading || (!modals.scanIn.orderId && !manualOrderId)}
              >
                {modals.scanIn.loading ? 'Scanning...' : 'Scan In'}
              </button>
            </div>
          </div>
        </div>
      )}

      {modals.dispatch.isOpen && (
        <div className="hub-modal-overlay" onClick={() => closeModal('dispatch')}>
          <div className="hub-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Dispatch Package</h3>
              <button className="close-btn" onClick={() => closeModal('dispatch')}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-content">
              <p>Configure dispatch details for this package:</p>

              {hub?.type !== 'LOCAL_HUB' && (
                <div className="form-group">
                  <label>Next Hub</label>
                  {modals.dispatch.loadingHubs ? (
                    <div className="loading-indicator">Loading next hub...</div>
                  ) : modals.dispatch.nextHubId ? (
                    <div className="selected-hub">
                      {modals.dispatch.nextHubId}
                    </div>
                  ) : (
                    <div className="no-next-hub">No next hub available. This may be the final hub.</div>
                  )}
                </div>
              )}

              {hub?.type === 'LOCAL_HUB' && (
                <div className="form-group">
                  <label>Assign to Delivery Boy</label>
                  {modals.dispatch.loadingBoys ? (
                    <div className="loading-indicator">Loading delivery boys...</div>
                  ) : (
                    <select
                      value={modals.dispatch.deliveryBoyId}
                      onChange={(e) => setModals(prev => ({
                        ...prev,
                        dispatch: { ...prev.dispatch, deliveryBoyId: e.target.value }
                      }))}
                    >
                      <option value="">Select delivery boy</option>
                      {modals.dispatch.deliveryBoys.map(boy => (
                        <option key={boy._id} value={boy._id}>
                          {boy.firstName} {boy.lastName} ({boy.phone})
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}
            </div>
            <div className="modal-actions">
              <button
                className="btn btn-secondary"
                onClick={() => closeModal('dispatch')}
                disabled={modals.dispatch.loading}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleDispatch}
                disabled={modals.dispatch.loading}
              >
                {modals.dispatch.loading ? 'Dispatching...' : 'Dispatch'}
              </button>
            </div>
          </div>
        </div>
      )}

      {modals.trackingDetail.isOpen && modals.trackingDetail.order && (
        <div className="hub-modal-overlay" onClick={() => closeModal('trackingDetail')}>
          <div className="hub-modal large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Tracking Details</h3>
              <button className="close-btn" onClick={() => closeModal('trackingDetail')}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-content">
              <div className="tracking-info">
                <div className="info-row">
                  <span className="info-label">Order ID:</span>
                  <span className="info-value">{modals.trackingDetail.order._id}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Status:</span>
                  <span className={`status-badge status-${modals.trackingDetail.order.status?.toLowerCase()}`}>
                    {modals.trackingDetail.order.status}
                  </span>
                </div>
                <div className="info-row">
                  <span className="info-label">Destination:</span>
                  <span className="info-value">
                    {modals.trackingDetail.order.shippingAddress?.district}, {modals.trackingDetail.order.shippingAddress?.state}
                  </span>
                </div>
              </div>

              <div className="tracking-timeline">
                <h4>Planned Route</h4>
                {modals.trackingDetail.order.route && modals.trackingDetail.order.route.length > 0 ? (
                  <div className="route-steps">
                    {modals.trackingDetail.order.route.map((hubStep, index) => (
                      <div key={hubStep._id || index} className="route-step-item">
                        <div className="step-number">{index + 1}</div>
                        <div className="step-content">
                          <p className="step-name">{hubStep.name}</p>
                          <p className="step-type">{hubStep.type?.replace('_', ' ')}</p>
                          {hubStep.district && <p className="step-location">{hubStep.district}</p>}
                        </div>
                        {index < modals.trackingDetail.order.route.length - 1 && (
                          <div className="step-arrow">↓</div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="no-timeline">No planned route available</p>
                )}

                <h4>Tracking History</h4>
                {modals.trackingDetail.order.trackingTimeline && modals.trackingDetail.order.trackingTimeline.length > 0 ? (
                  <div className="timeline">
                    {modals.trackingDetail.order.trackingTimeline.map((event, index) => (
                      <div key={index} className="timeline-item">
                        <div className="timeline-marker">
                          <CheckCircle size={18} />
                        </div>
                        <div className="timeline-content">
                          <p className="timeline-status">{event.status}</p>
                          <p className="timeline-location">{event.location || event.description}</p>
                          {event.createdAt && (
                            <p className="timeline-time">
                              {new Date(event.createdAt).toLocaleString()}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="no-timeline">No tracking events yet</p>
                )}
              </div>
            </div>
            <div className="modal-actions">
              <button
                className="btn btn-secondary"
                onClick={() => closeModal('trackingDetail')}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HubManagerDashboard;
