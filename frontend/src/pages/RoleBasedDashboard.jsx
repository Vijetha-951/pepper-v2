import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import authService from "../services/authService";
import Dashboard from "./Dashboard.jsx";
import DeliveryDashboard from "./DeliveryDashboard.jsx";
import HubManagerDashboard from "./HubManagerDashboard.jsx";
import DistrictSelection from "./DistrictSelection.jsx";

export default function RoleBasedDashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    console.log('RoleBasedDashboard mounted/updated');
    console.log('Selected district from sessionStorage:', sessionStorage.getItem('selectedDistrict'));
    console.log('Location state:', location.state);
    
    // If coming to /dashboard without the state flag and user is hub manager, clear district selection
    // This handles back button navigation
    if (location.pathname === '/dashboard' && !location.state?.fromDistrictSelection) {
      const storedDistrict = sessionStorage.getItem('selectedDistrict');
      if (storedDistrict) {
        console.log('Back navigation detected - clearing district selection');
        sessionStorage.removeItem('selectedDistrict');
        sessionStorage.removeItem('selectedHub');
      }
    }
    
    const loadUserWithRefresh = async () => {
      const u = authService.getCurrentUser();
      if (!u) {
        window.location.href = '/login';
        return;
      }
      
      // Refresh profile from backend to get latest role information
      await authService.refreshUserProfile();
      
      // Get updated user after refresh
      const refreshedUser = authService.getCurrentUser();
      setUser(refreshedUser || u);
      
      setLoading(false);
    };

    loadUserWithRefresh();

    // Set up periodic role checking every 5 minutes (reduced frequency to avoid token refresh errors)
    const roleCheckInterval = setInterval(async () => {
      try {
        const roleChanged = await authService.checkForRoleChange();
        if (roleChanged) {
          // The checkForRoleChange method handles the redirect
          return;
        }
        // Update local user state if role hasn't changed but other data might have
        const currentUser = authService.getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        console.warn('Role check failed (non-critical):', error);
        // Don't throw error, just log it - this is a background check
      }
    }, 300000); // Check every 5 minutes (300000ms) instead of 30 seconds

    // Cleanup interval on component unmount
    return () => clearInterval(roleCheckInterval);
  }, [location]); // Re-run when location changes

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#f9fafb' }}>
        <div style={{ width: '3rem', height: '3rem', border: '4px solid #10b981', borderTop: '4px solid transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
      </div>
    );
  }

  if (!user) return null;

  // Check district selection every render for hub managers
  const needsDistrictSelection = user.role === 'hubmanager' && !sessionStorage.getItem('selectedDistrict');

  if (user.role === 'deliveryboy') {
    return <DeliveryDashboard />;
  } else if (user.role === 'hubmanager') {
    // Check if district selection is needed
    if (needsDistrictSelection) {
      return <DistrictSelection />;
    }
    return <HubManagerDashboard />;
  } else {
    return <Dashboard />;
  }
}