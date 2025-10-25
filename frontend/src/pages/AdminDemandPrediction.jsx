import { useState, useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import authService from "../services/authService";
import DemandPredictionWidget from "../components/DemandPredictionWidget";

export default function AdminDemandPrediction() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const initializeUser = async () => {
      let currentUser = authService.getCurrentUser();
      if (!currentUser) {
        window.location.href = '/login';
        return;
      }

      if (!currentUser.role) {
        const refreshed = await authService.refreshUserProfile();
        currentUser = refreshed || currentUser;
      }

      if (currentUser.role !== 'admin') {
        navigate('/dashboard');
        return;
      }

      setUser(currentUser);
    };

    initializeUser();
  }, [navigate]);

  if (!user) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: '#f9fafb'
      }}>
        <div style={{
          width: '3rem',
          height: '3rem',
          border: '4px solid #10b981',
          borderTop: '4px solid transparent',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
      </div>
    );
  }

  const headerStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem'
  };



  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100vh',
      background: '#f9fafb'
    }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #10b981, #059669)',
        color: 'white',
        padding: '2rem',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
      }}>
        <div style={headerStyle}>
          <button
            onClick={() => navigate('/dashboard')}
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              border: 'none',
              color: 'white',
              width: '2.5rem',
              height: '2.5rem',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.3)'}
            onMouseLeave={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.2)'}
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 style={{ margin: '0 0 0.25rem 0', fontSize: '1.875rem', fontWeight: 'bold' }}>
              📊 Stock Demand Prediction
            </h1>
            <p style={{ margin: '0', fontSize: '0.875rem', opacity: '0.9' }}>
              Analyze product demand and optimize stock levels
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, padding: '2rem' }}>

        {/* Demand Prediction Widget */}
        <div style={{ marginBottom: '2rem' }}>
          <DemandPredictionWidget />
        </div>
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}