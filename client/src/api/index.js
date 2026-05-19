import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth
export const login = (email, password) => api.post('/auth/login', { email, password });
export const getMe = () => api.get('/auth/me');
export const register = (data) => api.post('/auth/register', data);

// Dashboard
export const getDashboardStats = () => api.get('/dashboard/stats');
export const getNotifications = () => api.get('/dashboard/notifications');
export const markNotificationRead = (id) => api.put(`/dashboard/notifications/${id}/read`);

// Users
export const getUsers = () => api.get('/users');
export const getUsersByRole = (role) => api.get(`/users/role/${role}`);
export const getUser = (id) => api.get(`/users/${id}`);
export const updateUser = (id, data) => api.put(`/users/${id}`, data);

// Clients
export const getClients = () => api.get('/clients');
export const getClient = (id) => api.get(`/clients/${id}`);
export const createClient = (data) => api.post('/clients', data);
export const updateClient = (id, data) => api.put(`/clients/${id}`, data);
export const deleteClient = (id) => api.delete(`/clients/${id}`);

// Projects
export const getProjects = (params) => api.get('/projects', { params });
export const getProject = (id) => api.get(`/projects/${id}`);
export const createProject = (data) => api.post('/projects', data);
export const updateProject = (id, data) => api.put(`/projects/${id}`, data);
export const deleteProject = (id) => api.delete(`/projects/${id}`);

// Design Tasks
export const getDesignTasks = (params) => api.get('/design/tasks', { params });
export const getDesignTask = (id) => api.get(`/design/tasks/${id}`);
export const createDesignTask = (data) => api.post('/design/tasks', data);
export const updateDesignTask = (id, data) => api.put(`/design/tasks/${id}`, data);
export const uploadDesignFile = (id, file) => {
  const formData = new FormData();
  formData.append('file', file);
  return api.post(`/design/tasks/${id}/upload`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};
export const getDesigners = () => api.get('/design/designers');

// Site Reports
export const getSiteReports = (params) => api.get('/execution/reports', { params });
export const getSiteReport = (id) => api.get(`/execution/reports/${id}`);
export const createSiteReport = (data) => api.post('/execution/reports', data);
export const updateSiteReport = (id, data) => api.put(`/execution/reports/${id}`, data);
export const uploadReportImages = (id, files) => {
  const formData = new FormData();
  files.forEach(file => formData.append('images', file));
  return api.post(`/execution/reports/${id}/images`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

// Site Images
export const uploadSiteImages = (projectId, files, description) => {
  const formData = new FormData();
  formData.append('project_id', projectId);
  formData.append('description', description);
  files.forEach(file => formData.append('images', file));
  return api.post('/execution/images', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};
export const getSiteImages = (projectId) => api.get(`/execution/images/${projectId}`);

// Payment Requests
export const getPaymentRequests = (params) => api.get('/execution/payment-requests', { params });
export const createPaymentRequest = (data) => api.post('/execution/payment-requests', data);
export const updatePaymentRequest = (id, data) => api.put(`/execution/payment-requests/${id}`, data);

// Payments
export const getPayments = (params) => api.get('/accounting/payments', { params });
export const getAccountingSummary = () => api.get('/accounting/summary');
export const createPayment = (data) => api.post('/accounting/payments', data);
export const updatePayment = (id, data) => api.put(`/accounting/payments/${id}`, data);
export const uploadReceipt = (id, file) => {
  const formData = new FormData();
  formData.append('receipt', file);
  return api.post(`/accounting/payments/${id}/receipt`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

// Contracts
export const getContracts = () => api.get('/accounting/contracts');
export const getContract = (id) => api.get(`/accounting/contracts/${id}`);
export const createContract = (data) => api.post('/accounting/contracts', data);
export const updateContract = (id, data) => api.put(`/accounting/contracts/${id}`, data);

// Purchases
export const getPurchases = (params) => api.get('/purchasing', { params });
export const createPurchase = (data) => api.post('/purchasing', data);
export const updatePurchase = (id, data) => api.put(`/purchasing/${id}`, data);
export const deletePurchase = (id) => api.delete(`/purchasing/${id}`);
export const getPurchaseSummary = () => api.get('/purchasing/summary');

// Messages
export const getConversations = () => api.get('/messages/conversations');
export const getProjectMessages = (projectId) => api.get(`/messages/project/${projectId}`);
export const getUserMessages = (userId) => api.get(`/messages/user/${userId}`);
export const sendMessage = (data) => api.post('/messages', data);
export const getContacts = () => api.get('/messages/contacts');

export default api;