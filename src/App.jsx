import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { CartProvider } from './store/CartContext';
import Login from './pages/Login';
import DashboardLayout from './components/layouts/DashboardLayout';
import Suppliers from './pages/Suppliers';
import Products from './pages/Products';
import Categories from './pages/Categories';
import Dashboard from './pages/Dashboard';
import Orders from './pages/Orders';
import Settings from './pages/Settings';
import Cart from './pages/Cart';
import Transporters from './pages/Transporters';
import OrderTracking from './pages/OrderTracking';

function App() {
  return (
    <>
      <CartProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />

            {/* Protected Routes using Layout */}
            <Route element={<DashboardLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/suppliers" element={<Suppliers />} />
              <Route path="/products" element={<Products />} />
              <Route path="/categories" element={<Categories />} />
              <Route path="/orders" element={<Orders />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/transporters" element={<Transporters />} />
              <Route path="/order-tracking" element={<OrderTracking />} />
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
