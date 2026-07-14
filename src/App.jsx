import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { CartProvider } from './store/CartContext';
import Login from './pages/Login';
import DashboardLayout from './components/layouts/DashboardLayout';
import Suppliers from './pages/Suppliers';
import Products from './pages/Products';
import AdminSupplierProducts from './pages/AdminSupplierProducts';
import Categories from './pages/Categories';
import Dashboard from './pages/Dashboard';
import Orders from './pages/Orders';
import Settings from './pages/Settings';
import Cart from './pages/Cart';
import Transporters from './pages/Transporters';
import OrderTracking from './pages/OrderTracking';
import ForgotPassword from './pages/ForgotPassword';
import VerifyOtp from './pages/VerifyOtp';
import ResetPassword from './pages/ResetPassword';
import Users from './pages/Users';
import ActivityLogs from './pages/ActivityLogs';
import Notifications from './pages/Notifications';

function App() {
  return (
    <>
      <CartProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/verify-otp" element={<VerifyOtp />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* Protected Routes using Layout */}
            <Route element={<DashboardLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/suppliers" element={<Suppliers />} />
              <Route path="/products" element={<Products />} />
              <Route path="/supplier-products" element={<AdminSupplierProducts />} />
              <Route path="/categories" element={<Categories />} />
              <Route path="/orders" element={<Orders />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/transporters" element={<Transporters />} />
              <Route path="/order-tracking" element={<OrderTracking />} />
              <Route path="/staff" element={<Users />} />
              <Route path="/activity-logs" element={<ActivityLogs />} />
              <Route path="/notifications" element={<Notifications />} />
            </Route>

            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Router>
      </CartProvider>
      <Toaster position="top-center" reverseOrder={false} />
    </>
  );
}

export default App;
