import React from 'react';
import AdminDashboard from './AdminDashboard';
import SupplierDashboard from './SupplierDashboard';

const Dashboard = () => {
  const userString = localStorage.getItem('user');
  const user = userString ? JSON.parse(userString) : null;

  if (user?.role === 'SUPPLIER') {
    return <SupplierDashboard />;
  }

  return <AdminDashboard />;
};

export default Dashboard;
