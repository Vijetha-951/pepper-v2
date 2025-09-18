import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import Home from "./pages/Home.jsx";
import AddProducts from "./pages/AddProducts.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import RoleBasedDashboard from "./pages/RoleBasedDashboard.jsx";
import CompleteProfile from "./pages/CompleteProfile.jsx";
import AuthCallback from "./pages/AuthCallback.jsx";
import AdminUserManagement from "./pages/AdminUserManagement.jsx";
import AdminProductManagement from "./pages/AdminProductManagement.jsx";
import AdminStockManagement from "./pages/AdminStockManagement.jsx";
import ForgotPassword from "./pages/ForgotPassword.jsx";

function App() {
  return (
    <Router>
      <Routes>
        {/* Public routes with navbar */}
        <Route path="/" element={
          <>
            <Navbar />
            <Home />
          </>
        } />
        <Route path="/add-products" element={
          <>
            <Navbar />
            <AddProducts />
          </>
        } />
        
        {/* Authentication routes without navbar */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/complete-profile" element={<CompleteProfile />} />
        <Route path="/auth/google/callback" element={<AuthCallback />} />
        
        {/* Protected routes without navbar */}
        <Route path="/dashboard" element={<RoleBasedDashboard />} />
        <Route path="/admin-users" element={<AdminUserManagement />} />
        <Route path="/admin-products" element={<AdminProductManagement />} />
        <Route path="/admin-stock" element={<AdminStockManagement />} />
      </Routes>
    </Router>
  );
}

export default App;
