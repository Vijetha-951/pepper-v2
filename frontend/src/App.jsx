import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import Home from "./pages/Home.jsx";
import AddProducts from "./pages/AddProducts.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import RoleBasedDashboard from "./pages/RoleBasedDashboard.jsx";
import CompleteProfile from "./pages/CompleteProfile.jsx";

// Direct dashboards for backend redirect paths
import Dashboard from "./pages/Dashboard.jsx";
import DeliveryDashboard from "./pages/DeliveryDashboard.jsx";

import AdminUserManagement from "./pages/AdminUserManagement.jsx";
import AdminProductManagement from "./pages/AdminProductManagement.jsx";
import AdminStockManagement from "./pages/AdminStockManagement.jsx";
import AdminAllOrders from "./pages/AdminAllOrders.jsx";
import AdminOrderDetail from "./pages/AdminOrderDetail.jsx";
import AdminDeliveryStatus from "./pages/AdminDeliveryStatus.jsx";
import AdminDemandPrediction from "./pages/AdminDemandPrediction.jsx";
import AdminCustomerSegmentation from "./pages/AdminCustomerSegmentation.jsx";
import AdminCustomerReviews from "./pages/AdminCustomerReviews.jsx";
import AdminHubInventory from "./pages/AdminHubInventory.jsx";
import DeliveryBoyStatus from "./pages/DeliveryBoyStatus.jsx";
import ForgotPassword from "./pages/ForgotPassword.jsx";

// Shopping flow pages
import Cart from "./pages/Cart.jsx";
import Wishlist from "./pages/Wishlist.jsx";
import Checkout from "./pages/Checkout.jsx";
import Orders from "./pages/Orders.jsx";
import PaymentSuccess from "./pages/PaymentSuccess.jsx";
import HubSelection from "./pages/HubSelection.jsx";
import CollectionVerification from "./pages/CollectionVerification.jsx";
import OrderTracking from "./pages/OrderTracking.jsx";

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
        <Route path="/cart" element={
          <>
            <Navbar />
            <Dashboard />
          </>
        } />
        <Route path="/wishlist" element={
          <>
            <Navbar />
            <Wishlist />
          </>
        } />
        <Route path="/checkout" element={
          <>
            <Navbar />
            <Checkout />
          </>
        } />
        <Route path="/hub-selection" element={
          <>
            <Navbar />
            <HubSelection />
          </>
        } />
        <Route path="/collection-verification/:orderId" element={
          <>
            <Navbar />
            <CollectionVerification />
          </>
        } />
        <Route path="/orders" element={<Orders />} />
        <Route path="/my-orders" element={<Orders />} />
        <Route path="/order-tracking/:orderId" element={<OrderTracking />} />
        <Route path="/payment-success" element={
          <>
            <Navbar />
            <PaymentSuccess />
          </>
        } />
        
        {/* Authentication routes without navbar */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/complete-profile" element={<CompleteProfile />} />
        
        
        {/* Protected routes without navbar */}
        <Route path="/dashboard" element={<RoleBasedDashboard />} />
        {/* Direct dashboard routes for explicit backend redirects */}
        <Route path="/user/dashboard" element={<Dashboard />} />
        <Route path="/deliveryboy/dashboard" element={<DeliveryDashboard />} />
        <Route path="/deliveryboy/status" element={<DeliveryBoyStatus />} />
        {/* Admin management routes (require auth checks inside components) */}
        <Route path="/admin/dashboard" element={<AdminUserManagement />} />
        <Route path="/admin-users" element={<AdminUserManagement />} />
        <Route path="/admin-products" element={<AdminProductManagement />} />
        <Route path="/admin-stock" element={<AdminStockManagement />} />
        <Route path="/admin-hub-inventory" element={<AdminHubInventory />} />
        <Route path="/admin/hub-inventory" element={<AdminHubInventory />} />
        <Route path="/admin-demand-predictions" element={<AdminDemandPrediction />} />
        <Route path="/admin-customer-segmentation" element={<AdminCustomerSegmentation />} />
        <Route path="/admin-customer-reviews" element={<AdminCustomerReviews />} />
        <Route path="/admin/reviews" element={<AdminCustomerReviews />} />
        <Route path="/admin-orders" element={<AdminAllOrders />} />
        <Route path="/admin/orders" element={<AdminAllOrders />} />
        <Route path="/admin/orders/:id" element={<AdminOrderDetail />} />
        <Route path="/admin-delivery-status" element={<AdminDeliveryStatus />} />
      </Routes>
    </Router>
  );
}

export default App;
