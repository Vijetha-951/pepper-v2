import { useEffect, useState } from "react";
import { Truck, Package, MapPin, CheckCircle, Clock, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import authService from "../services/authService";

export default function DeliveryDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('deliveries');
  const [stats, setStats] = useState({
    todayDeliveries: 8,
    pending: 3,
    completed: 5
  });

  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    if (!currentUser) {
      window.location.href = '/login';
      return;
    }
    setUser(currentUser);
  }, []);

  const handleLogout = async () => {
    // show inline banner and delay redirect
    const banner = document.createElement('div');
    banner.textContent = 'You have been logged out. Redirecting to login...';
    banner.style.cssText = 'position:fixed;top:12px;left:50%;transform:translateX(-50%);background:#f0fdf4;color:#166534;border:1px solid #bbf7d0;padding:10px 14px;border-radius:8px;z-index:9999;box-shadow:0 6px 18px rgba(0,0,0,0.08)';
    document.body.appendChild(banner);
    const result = await authService.logoutNoRedirect();
    if (result?.success) {
      setTimeout(() => {
        window.location.href = '/login';
      }, 1500);
    } else {
      banner.textContent = 'Logout failed. Please try again.';
      banner.style.background = '#fef2f2';
      banner.style.border = '1px solid #fecaca';
      banner.style.color = '#dc2626';
      setTimeout(() => banner.remove(), 3000);
    }
  };

  if (!user) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#f9fafb' }}>
        <div style={{ width: '3rem', height: '3rem', border: '4px solid #10b981', borderTop: '4px solid transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
      </div>
    );
  }

  const sidebarStyle = {
    width: '280px',
    background: 'linear-gradient(135deg, #0ea5e9, #0284c7)',
    color: 'white',
    padding: '2rem',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '4px 0 20px rgba(0, 0, 0, 0.1)',
    position: 'relative',
    overflow: 'hidden'
  };

  const mainContentStyle = { flex: 1, background: '#f9fafb', padding: '2rem', overflowY: 'auto' };
  const cardStyle = { background: 'white', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)', border: '1px solid #e5e7eb' };
  const statCardStyle = { ...cardStyle, textAlign: 'center' };

  const deliveriesList = [
    { id: 'DL-001', item: 'Thekkan 1', qty: 5, address: 'MG Road, Kochi', status: 'Pending' },
    { id: 'DL-002', item: 'karimunda', qty: 2, address: 'Fort, Thrissur', status: 'In Transit' },
    { id: 'DL-003', item: 'Panniyur 3', qty: 3, address: 'Vyttila, Kochi', status: 'Pending' }
  ];

  const menuItems = [
    { id: 'deliveries', label: 'Deliveries', icon: Truck },
    { id: 'routes', label: 'Routes', icon: MapPin },
    { id: 'history', label: 'History', icon: CheckCircle }
  ];

  const handleStatusClick = () => {
    navigate('/deliveryboy/status');
  };

  const renderDeliveries = () => (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={statCardStyle}>
          <Truck size={28} color="#0ea5e9" style={{ marginBottom: '0.5rem' }} />
          <h3 style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>{stats.todayDeliveries}</h3>
          <p style={{ color: '#6b7280', margin: 0 }}>Today</p>
        </div>
        <div style={statCardStyle}>
          <Clock size={28} color="#f59e0b" style={{ marginBottom: '0.5rem' }} />
          <h3 style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>{stats.pending}</h3>
          <p style={{ color: '#6b7280', margin: 0 }}>Pending</p>
        </div>
        <div style={statCardStyle}>
          <CheckCircle size={28} color="#10b981" style={{ marginBottom: '0.5rem' }} />
          <h3 style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>{stats.completed}</h3>
          <p style={{ color: '#6b7280', margin: 0 }}>Completed</p>
        </div>
      </div>

      <div style={cardStyle}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '1rem' }}>Assigned Deliveries</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {deliveriesList.map((d) => (
            <div key={d.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', border: '1px solid #e5e7eb', borderRadius: '10px', background: '#fff' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Package size={20} color="#0ea5e9" />
                <div>
                  <div style={{ fontWeight: 600, color: '#111827' }}>{d.item} <span style={{ color: '#6b7280' }}>x{d.qty}</span></div>
                  <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>{d.address}</div>
                </div>
              </div>
              <button style={{ padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #e5e7eb', background: '#f9fafb', cursor: 'pointer' }}>{d.status}</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'deliveries':
        return renderDeliveries();
      case 'routes':
        return <div style={cardStyle}>Route planning coming soon.</div>;
      case 'history':
        return <div style={cardStyle}>History coming soon.</div>;

      default:
        return renderDeliveries();
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <div style={sidebarStyle}>
        <div style={{ marginBottom: '2rem', textAlign: 'center', position: 'relative', zIndex: 10 }}>
          <div style={{ width: '60px', height: '60px', background: 'rgba(255, 255, 255, 0.2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', backdropFilter: 'blur(16px)' }}>
            <Truck color="white" size={28} />
          </div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: 0 }}>Delivery Dashboard</h1>
          <h2 style={{ fontSize: '1rem', margin: '0.25rem 0 0', opacity: 0.9 }}>
            {user?.firstName || user?.lastName ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : (user?.displayName || user?.email || 'User')}
          </h2>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', zIndex: 10 }}>
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.75rem 1rem',
                borderRadius: '10px',
                border: 'none',
                background: activeTab === item.id ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
                color: 'white',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <item.icon size={18} /> {item.label}
            </button>
          ))}
          
          {/* Update Status Button */}
          <button
            onClick={handleStatusClick}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.75rem 1rem',
              borderRadius: '10px',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              background: 'rgba(255, 255, 255, 0.1)',
              color: 'white',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              marginTop: '0.5rem'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'rgba(255, 255, 255, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'rgba(255, 255, 255, 0.1)';
            }}
          >
            <Package size={18} /> Update Status
          </button>
        </div>

        <div style={{ marginTop: 'auto', zIndex: 10 }}>
          <button 
            onClick={handleLogout} 
            style={{ 
              width: '100%', 
              padding: '0.75rem 1rem', 
              borderRadius: '10px', 
              border: '1px solid rgba(255,255,255,0.3)', 
              background: 'rgba(255,255,255,0.1)', 
              color: 'white', 
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'rgba(255,255,255,0.2)';
              e.target.style.transform = 'scale(1.02)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'rgba(255,255,255,0.1)';
              e.target.style.transform = 'scale(1)';
            }}
          >
            <LogOut size={16} style={{ marginRight: '0.5rem' }} /> Logout
          </button>
        </div>
      </div>

      {/* Main content */}
      <div style={mainContentStyle}>{renderContent()}</div>
    </div>
  );
}