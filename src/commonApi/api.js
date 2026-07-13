import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

api.interceptors.response.use((response) => {
  return response;
}, (error) => {
  if (error.response && error.response.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    if (window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
  }
  return Promise.reject(error);
});

// ==========================
// AUTHENTICATION
// ==========================
export const loginApi = async (credentials) => {
  const response = await api.post('/auth/login', credentials);
  return response.data;
};

export const getMeApi = async () => {
  const response = await api.get('/auth/me');
  return response.data;
};

export const forgotPasswordApi = async (email) => {
  const response = await api.post('/auth/forgot-password', { email });
  return response.data;
};

export const verifyOtpApi = async (email, otp) => {
  const response = await api.post('/auth/verify-otp', { email, otp });
  return response.data;
};

export const resetPasswordApi = async (email, otp, newPassword) => {
  const response = await api.post('/auth/reset-password', { email, otp, newPassword });
  return response.data;
};

export const changePasswordApi = async (data) => {
  const response = await api.put('/auth/change-password', data);
  return response.data;
};

export const updateProfileApi = async (data) => {
  const response = await api.put('/auth/profile', data);
  return response.data;
};

// ==========================
// SUPPLIERS
// ==========================
export const getSuppliersApi = async (params = {}) => {
  const response = await api.get('/suppliers', { params });
  return response.data;
};

export const getSupplierApi = async (id) => {
  const response = await api.get(`/suppliers/${id}`);
  return response.data;
};

export const createSupplierApi = async (data) => {
  const response = await api.post('/suppliers', data);
  return response.data;
};

export const updateSupplierApi = async (id, data) => {
  const response = await api.put(`/suppliers/${id}`, data);
  return response.data;
};

export const deleteSupplierApi = async (id) => {
  const response = await api.delete(`/suppliers/${id}`);
  return response.data;
};

// ==========================
// CATEGORIES
// ==========================
export const getCategoriesApi = async () => {
  const response = await api.get('/categories');
  return response.data;
};

export const createCategoryApi = async (data) => {
  const response = await api.post('/categories', data);
  return response.data;
};

export const updateCategoryApi = async (id, data) => {
  const response = await api.put(`/categories/${id}`, data);
  return response.data;
};

export const deleteCategoryApi = async (id) => {
  const response = await api.delete(`/categories/${id}`);
  return response.data;
};

// ==========================
// PRODUCTS
// ==========================
export const getProductsApi = async (params = {}) => {
  const response = await api.get('/products', { params });
  return response.data;
};

export const createProductApi = async (formData) => {
  // formData because we upload images via Multer
  const response = await api.post('/products', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const updateProductApi = async (id, formData) => {
  const response = await api.put(`/products/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const approveProductApi = async (id, status) => {
  const response = await api.patch(`/products/${id}/approve`, { status });
  return response.data;
};

export const deleteProductApi = async (id) => {
  const response = await api.delete(`/products/${id}`);
  return response.data;
};

// ==========================
// DASHBOARD
// ==========================
export const getStatsApi = async () => {
  const response = await api.get('/dashboard/stats');
  return response.data;
};

// ==========================
// ORDERS
// ==========================
export const getOrdersApi = async (params = {}) => {
  const response = await api.get('/orders', { params });
  return response.data;
};

export const createOrderApi = async (data) => {
  const response = await api.post('/orders', data);
  return response.data;
};

export const updateOrderStatusApi = async (id, status, remarks = '') => {
  const response = await api.patch(`/orders/${id}/status`, { status, remarks });
  return response.data;
};

export const deleteOrderApi = async (id) => {
  const response = await api.delete(`/orders/${id}`);
  return response.data;
};

// ==========================
// SETTINGS
// ==========================
export const getSettingsApi = async () => {
  const response = await api.get('/settings');
  return response.data;
};

export const updateSettingsApi = async (data) => {
  const response = await api.put('/settings', data);
  return response.data;
};

// ==========================
// TRANSPORTERS
// ==========================
export const getTransportersApi = async (params = {}) => {
  const response = await api.get('/transporters', { params });
  return response.data;
};

export const createTransporterApi = async (data) => {
  const response = await api.post('/transporters', data);
  return response.data;
};

export const updateTransporterApi = async (id, data) => {
  const response = await api.put(`/transporters/${id}`, data);
  return response.data;
};

export const deleteTransporterApi = async (id) => {
  const response = await api.delete(`/transporters/${id}`);
  return response.data;
};

// --- Activity Logs ---
export const getActivityLogsApi = async (params) => {
  const response = await api.get('/activity-logs', { params });
  return response.data;
};

// --- Users (Admin/Staff) ---
export const getUsersApi = async () => {
  const response = await api.get('/users');
  return response.data;
};

export const createUserApi = async (data) => {
  const response = await api.post('/users', data);
  return response.data;
};

export const updateUserApi = async (id, data) => {
  const response = await api.put(`/users/${id}`, data);
  return response.data;
};

export const deleteUserApi = async (id) => {
  const response = await api.delete(`/users/${id}`);
  return response.data;
};

export const getRolesApi = async () => {
  const response = await api.get('/users/roles');
  return response.data;
};

export default api;
