import axios from 'axios';
import toast from 'react-hot-toast';

const getBaseURL = () => {
  // If explicitly configured via Vite env var (e.g. in Vercel settings or .env)
  if (import.meta.env.VITE_API_URL) {
    const url = import.meta.env.VITE_API_URL.replace(/\/+$/, '');
    return url.endsWith('/api') ? url : `${url}/api`;
  }
  // In production builds (deployed to Vercel), default to the deployed Render backend
  if (import.meta.env.PROD) {
    return 'https://corporate-travel-management.onrender.com/api';
  }
  // In local development, fallback to '/api' (handled by Vite dev proxy)
  return '/api';
};

const api = axios.create({
  baseURL: getBaseURL(),
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' }
});

// Attach JWT on every request
api.interceptors.request.use(config => {
  const token = localStorage.getItem('ctm_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Global error handling
api.interceptors.response.use(
  res => res,
  err => {
    const msg = err.response?.data?.message || 'Network error — please try again';
    const url = err.config?.url || '';

    // Only clear tokens + redirect for expired-session 401s,
    // NOT for login/register endpoints where 401 is a normal business response
    const isAuthEndpoint = url.includes('/auth/');
    if (err.response?.status === 401 && !isAuthEndpoint) {
      localStorage.removeItem('ctm_token');
      localStorage.removeItem('ctm_user');
      localStorage.removeItem('ctm_company');
      window.location.href = '/login';
    }
    if (err.response?.status !== 404) toast.error(msg);
    return Promise.reject(err);
  }
);

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authAPI = {
  registerCompany: (data) => api.post('/auth/register-company', data),
  employeeLogin:   (data) => api.post('/auth/employee-login', data),
  adminLogin:      (data) => api.post('/auth/admin-login', data),
  listCompanies:   ()     => api.get('/auth/companies'),
  syncSheets:      ()     => api.post('/auth/sync-sheets'),
  me:              ()     => api.get('/auth/me'),
  updateMe:        (data) => api.put('/auth/me', data),
  reactivateAdmin: (data) => api.post('/auth/reactivate-admin', data),
  requestReactivation: (data) => api.post('/auth/request-reactivation', data)
};

// ── Trips ─────────────────────────────────────────────────────────────────────
export const tripAPI = {
  request:     (data)            => api.post('/trip/request', data),
  myTrips:     ()                => api.get('/trip/my'),
  getById:     (tripId)          => api.get(`/trip/${tripId}`),
  getPlans:    (tripId)          => api.get(`/trip/plans/${tripId}`),
  chat:        (tripId, message) => api.post('/trip/chat', { tripId, message }),
  book:        (tripId, planId)  => api.post('/trip/book', { tripId, planId }),
  selectPlan:  (tripId, planId)  => api.patch(`/trip/${tripId}/select-plan`, { planId }),
  getHotels:   (city)            => api.get(`/hotels/${encodeURIComponent(city)}`),
  selectHotel: (tripId, data)    => api.patch(`/trip/${tripId}/select-hotel`, data),
  sendApproval: (tripId)         => api.post(`/trip/${tripId}/send-approval`),
  cancel:      (tripId)          => api.delete(`/trip/${tripId}`),
  // Approvals
  managerApprove: (data)         => api.post('/trip/approve/manager', data),
  financeApprove: (data)         => api.post('/trip/approve/finance', data),
  // Pending queues
  pendingManager: ()             => api.get('/trip/pending/manager'),
  pendingFinance: ()             => api.get('/trip/pending/finance')
};

// ── Finance ───────────────────────────────────────────────────────────────────
export const financeAPI = {
  report:            ()           => api.get('/finance/report'),
  monthlySpend:      ()           => api.get('/finance/monthly-spend'),
  departmentSummary: ()           => api.get('/finance/department-summary'),
  tripsSummary:      ()           => api.get('/finance/trips-summary'),
  checkBudget:       (params)     => api.get('/finance/budget/check', { params }),
  employeeHistory:   (empId)      => api.get(`/finance/employee-history/${empId}`)
};

// ── Admin ─────────────────────────────────────────────────────────────────────
export const adminAPI = {
  dashboard:      ()           => api.get('/admin/dashboard'),
  users:          ()           => api.get('/admin/users'),
  allTrips:       (params)     => api.get('/admin/trips', { params }),
  auditLogs:      (params)     => api.get('/admin/audit-logs', { params }),
  updateRole:     (id, role)   => api.patch(`/admin/users/${id}/role`, { role }),
  toggleActive:   (id)         => api.patch(`/admin/users/${id}/toggle`)
};

export default api;
