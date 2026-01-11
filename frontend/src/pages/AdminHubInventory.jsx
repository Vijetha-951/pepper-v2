import React, { useState, useEffect } from 'react';
import { Package, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';
import { auth } from '../config/firebase';
import { onAuthStateChanged } from 'firebase/auth';

export default function AdminHubInventory() {
  const [user, setUser] = useState(null);
  const [hubs, setHubs] = useState([]);
  const [selectedHub, setSelectedHub] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [restockRequests, setRestockRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inventoryLoading, setInventoryLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('inventory'); // 'inventory' or 'requests'

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
      } else {
        setError('Please login to access this page');
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      fetchHubs();
      fetchRestockRequests();
    }
  }, [user]);

  useEffect(() => {
    if (selectedHub && user) {
      fetchHubInventory(selectedHub);
    }
  }, [selectedHub, user]);

  const getAuthHeaders = async () => {
    if (!user) {
      throw new Error('User not authenticated');
    }
    const token = await user.getIdToken();
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  };

  const fetchHubs = async () => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch('/api/hub-inventory/hubs/available', { headers });
      
      if (response.ok) {
        const data = await response.json();
        setHubs(data.hubs);
        if (data.hubs.length > 0) {
          setSelectedHub(data.hubs[0]._id);
        }
      }
    } catch (error) {
      console.error('Error fetching hubs:', error);
      setError('Failed to load hubs');
    } finally {
      setLoading(false);
    }
  };

  const fetchHubInventory = async (hubId) => {
    try {
      setInventoryLoading(true);
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/hub-inventory/hubs/${hubId}/inventory`, { headers });
      
      if (response.ok) {
        const data = await response.json();
        setInventory(data.inventory);
      }
    } catch (error) {
      console.error('Error fetching inventory:', error);
      setError('Failed to load inventory');
    } finally {
      setInventoryLoading(false);
    }
  };

  const fetchRestockRequests = async () => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch('/api/hub-inventory/admin/restock-requests', { headers });
      
      if (response.ok) {
        const data = await response.json();
        setRestockRequests(data.requests);
      }
    } catch (error) {
      console.error('Error fetching restock requests:', error);
    }
  };

  const handleApproveRestock = async (requestId) => {
    if (!window.confirm('Approve this restock request? Stock will be transferred from Kottayam Hub.')) {
      return;
    }

    try {
      setError('');
      setSuccess('');
      const headers = await getAuthHeaders();
      
      const response = await fetch(`/api/hub-inventory/admin/restock-requests/${requestId}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ action: 'APPROVE' })
      });

      if (response.ok) {
        setSuccess('Restock request approved successfully!');
        fetchRestockRequests();
        if (selectedHub) fetchHubInventory(selectedHub);
      } else {
        const data = await response.json();
        setError(data.message || 'Failed to approve restock request');
      }
    } catch (error) {
      console.error('Error approving restock:', error);
      setError('Failed to approve restock request');
    }
  };

  const handleRejectRestock = async (requestId) => {
    if (!window.confirm('Reject this restock request?')) {
      return;
    }

    try {
      setError('');
      setSuccess('');
      const headers = await getAuthHeaders();
      
      const response = await fetch(`/api/hub-inventory/admin/restock-requests/${requestId}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ action: 'REJECT' })
      });

      if (response.ok) {
        setSuccess('Restock request rejected');
        fetchRestockRequests();
      } else {
        const data = await response.json();
        setError(data.message || 'Failed to reject restock request');
      }
    } catch (error) {
      console.error('Error rejecting restock:', error);
      setError('Failed to reject restock request');
    }
  };

  const getPriorityColor = (priority) => {
    const colors = {
      URGENT: '#ef4444',
      HIGH: '#f59e0b',
      MEDIUM: '#3b82f6',
      LOW: '#10b981'
    };
    return colors[priority] || '#6b7280';
  };

  const getStatusColor = (status) => {
    const colors = {
      PENDING: '#f59e0b',
      APPROVED: '#3b82f6',
      FULFILLED: '#10b981',
      REJECTED: '#ef4444'
    };
    return colors[status] || '#6b7280';
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: '400px',
        padding: '2rem' 
      }}>
        <RefreshCw size={48} className="animate-spin" style={{ color: '#10b981' }} />
        <p style={{ marginTop: '1rem', fontSize: '1.125rem', color: '#6b7280' }}>
          Loading inventory management...
        </p>
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: '400px',
        padding: '2rem' 
      }}>
        <AlertTriangle size={48} style={{ color: '#ef4444' }} />
        <p style={{ marginTop: '1rem', fontSize: '1.125rem', color: '#991b1b' }}>
          Please login to access this page
        </p>
        <a 
          href="/login" 
          style={{ 
            marginTop: '1rem', 
            padding: '0.75rem 1.5rem',
            background: '#10b981',
            color: 'white',
            borderRadius: '8px',
            textDecoration: 'none',
            fontWeight: '600'
          }}
        >
          Go to Login
        </a>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '2rem' }}>
        Hub Inventory Management
      </h1>

      {error && (
        <div style={{ 
          background: '#fee2e2', 
          border: '1px solid #ef4444',
          color: '#991b1b',
          padding: '1rem',
          borderRadius: '8px',
          marginBottom: '1rem'
        }}>
          {error}
        </div>
      )}

      {success && (
        <div style={{ 
          background: '#d1fae5', 
          border: '1px solid #10b981',
          color: '#065f46',
          padding: '1rem',
          borderRadius: '8px',
          marginBottom: '1rem'
        }}>
          {success}
        </div>
      )}

      {/* Tabs */}
      <div style={{ 
        borderBottom: '2px solid #e5e7eb',
        marginBottom: '2rem',
        display: 'flex',
        gap: '1rem'
      }}>
        <button
          onClick={() => setActiveTab('inventory')}
          style={{
            padding: '0.75rem 1.5rem',
            border: 'none',
            background: 'transparent',
            borderBottom: activeTab === 'inventory' ? '3px solid #10b981' : '3px solid transparent',
            fontWeight: activeTab === 'inventory' ? '600' : '400',
            color: activeTab === 'inventory' ? '#10b981' : '#6b7280',
            cursor: 'pointer',
            fontSize: '1rem'
          }}
        >
          📦 Hub Inventory
        </button>
        <button
          onClick={() => setActiveTab('requests')}
          style={{
            padding: '0.75rem 1.5rem',
            border: 'none',
            background: 'transparent',
            borderBottom: activeTab === 'requests' ? '3px solid #10b981' : '3px solid transparent',
            fontWeight: activeTab === 'requests' ? '600' : '400',
            color: activeTab === 'requests' ? '#10b981' : '#6b7280',
            cursor: 'pointer',
            fontSize: '1rem',
            position: 'relative'
          }}
        >
          🔔 Restock Requests
          {restockRequests.filter(r => r.status === 'PENDING').length > 0 && (
            <span style={{
              position: 'absolute',
              top: '0.5rem',
              right: '0.5rem',
              background: '#ef4444',
              color: 'white',
              borderRadius: '50%',
              width: '1.5rem',
              height: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.75rem'
            }}>
              {restockRequests.filter(r => r.status === 'PENDING').length}
            </span>
          )}
        </button>
      </div>

      {/* Hub Inventory Tab */}
      {activeTab === 'inventory' && (
        <>
          {/* Hub Selector */}
          <div style={{ marginBottom: '2rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
              Select Hub:
            </label>
            <select
              value={selectedHub || ''}
              onChange={(e) => setSelectedHub(e.target.value)}
              style={{
                padding: '0.75rem',
                borderRadius: '8px',
                border: '1px solid #d1d5db',
                fontSize: '1rem',
                width: '100%',
                maxWidth: '400px'
              }}
            >
              {hubs.map(hub => (
                <option key={hub._id} value={hub._id}>
                  {hub.name} - {hub.district}
                </option>
              ))}
            </select>
          </div>

          {/* Inventory Table */}
          {inventoryLoading ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <RefreshCw className="animate-spin" size={32} style={{ color: '#10b981' }} />
              <p>Loading inventory...</p>
            </div>
          ) : inventory.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
              <Package size={64} />
              <p style={{ marginTop: '1rem' }}>No inventory data for this hub</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                    <th style={{ padding: '1rem', textAlign: 'left' }}>Product</th>
                    <th style={{ padding: '1rem', textAlign: 'center' }}>Total Stock</th>
                    <th style={{ padding: '1rem', textAlign: 'center' }}>Reserved</th>
                    <th style={{ padding: '1rem', textAlign: 'center' }}>Available</th>
                    <th style={{ padding: '1rem', textAlign: 'center' }}>Status</th>
                    <th style={{ padding: '1rem', textAlign: 'left' }}>Last Restocked</th>
                  </tr>
                </thead>
                <tbody>
                  {inventory.map(item => {
                    const available = item.quantity - item.reservedQuantity;
                    const isLowStock = available < 10;
                    
                    return (
                      <tr key={item._id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                        <td style={{ padding: '1rem' }}>
                          <div style={{ fontWeight: '600' }}>{item.product?.name}</div>
                        </td>
                        <td style={{ padding: '1rem', textAlign: 'center', fontWeight: '600' }}>
                          {item.quantity}
                        </td>
                        <td style={{ padding: '1rem', textAlign: 'center', color: '#f59e0b' }}>
                          {item.reservedQuantity}
                        </td>
                        <td style={{ padding: '1rem', textAlign: 'center', fontWeight: '600', color: isLowStock ? '#ef4444' : '#10b981' }}>
                          {available}
                        </td>
                        <td style={{ padding: '1rem', textAlign: 'center' }}>
                          {isLowStock ? (
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                              color: '#ef4444',
                              fontWeight: '600'
                            }}>
                              <AlertTriangle size={16} />
                              Low Stock
                            </span>
                          ) : (
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                              color: '#10b981',
                              fontWeight: '600'
                            }}>
                              <CheckCircle size={16} />
                              In Stock
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '1rem', fontSize: '0.875rem', color: '#6b7280' }}>
                          {item.lastRestocked 
                            ? new Date(item.lastRestocked).toLocaleDateString()
                            : 'Never'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Restock Requests Tab */}
      {activeTab === 'requests' && (
        <>
          {restockRequests.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
              <Package size={64} />
              <p style={{ marginTop: '1rem' }}>No restock requests</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                    <th style={{ padding: '1rem', textAlign: 'left' }}>Hub</th>
                    <th style={{ padding: '1rem', textAlign: 'left' }}>Product</th>
                    <th style={{ padding: '1rem', textAlign: 'center' }}>Quantity</th>
                    <th style={{ padding: '1rem', textAlign: 'center' }}>Priority</th>
                    <th style={{ padding: '1rem', textAlign: 'center' }}>Status</th>
                    <th style={{ padding: '1rem', textAlign: 'left' }}>Reason</th>
                    <th style={{ padding: '1rem', textAlign: 'left' }}>Requested</th>
                    <th style={{ padding: '1rem', textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {restockRequests.map(request => (
                    <tr key={request._id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ fontWeight: '600' }}>{request.requestingHub?.name}</div>
                        <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                          {request.requestingHub?.district}
                        </div>
                      </td>
                      <td style={{ padding: '1rem', fontWeight: '600' }}>
                        {request.product?.name}
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'center', fontWeight: '600' }}>
                        {request.requestedQuantity}
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'center' }}>
                        <span style={{
                          padding: '0.25rem 0.75rem',
                          borderRadius: '9999px',
                          fontSize: '0.875rem',
                          fontWeight: '600',
                          color: 'white',
                          background: getPriorityColor(request.priority)
                        }}>
                          {request.priority}
                        </span>
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'center' }}>
                        <span style={{
                          padding: '0.25rem 0.75rem',
                          borderRadius: '9999px',
                          fontSize: '0.875rem',
                          fontWeight: '600',
                          color: 'white',
                          background: getStatusColor(request.status)
                        }}>
                          {request.status}
                        </span>
                      </td>
                      <td style={{ padding: '1rem', fontSize: '0.875rem' }}>
                        {request.reason || '-'}
                      </td>
                      <td style={{ padding: '1rem', fontSize: '0.875rem', color: '#6b7280' }}>
                        {new Date(request.createdAt).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'center' }}>
                        {request.status === 'PENDING' && (
                          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                            <button
                              onClick={() => handleApproveRestock(request._id)}
                              style={{
                                padding: '0.5rem 1rem',
                                background: '#10b981',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '0.875rem',
                                fontWeight: '600'
                              }}
                            >
                              ✓ Approve
                            </button>
                            <button
                              onClick={() => handleRejectRestock(request._id)}
                              style={{
                                padding: '0.5rem 1rem',
                                background: '#ef4444',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '0.875rem',
                                fontWeight: '600'
                              }}
                            >
                              ✗ Reject
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
