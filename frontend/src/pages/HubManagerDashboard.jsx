import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Truck, MapPin, Clock, Search, RefreshCw, X, AlertCircle, CheckCircle, ScanLine } from 'lucide-react';
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
  const [activeTab, setActiveTab] = useState('active'); // 'active' or 'dispatched'

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
  }, [orders, dispatchedOrders, searchTerm, hub]);

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
    }

    setFilteredOrders(filtered);
    setFilteredDispatchedOrders(filteredDispatched);
  };

  const calculateSummary = () => {
    if (!hub) return;

    const oneHourAgo = Date.now() - 3600000;

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

      // 4. Recent Arrivals: Arrived in last 1 hour
      if (arrivalEvent) {
        const eventTime = arrivalEvent.timestamp || arrivalEvent.createdAt;
        const arrivalTime = new Date(eventTime).getTime();
        if (arrivalTime > oneHourAgo) {
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
            className="hub-action-btn primary"
            onClick={() => {
              setManualOrderId('');
              setModals(prev => ({ ...prev, scanIn: { isOpen: true, orderId: null } }));
            }}
          >
            <ScanLine size={18} />
            Scan New Package
          </button>
          <button className="hub-refresh-btn" onClick={() => fetchHubAndOrders(user)}>
            <RefreshCw size={18} />
            Refresh
          </button>
        </div>
      </div>

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
            <p className="summary-label">Recent Arrivals</p>
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
