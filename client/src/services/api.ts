import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Token management
let accessToken: string | null = null;
let refreshToken: string | null = null;

export const setTokens = (access: string, refresh: string) => {
  accessToken = access;
  refreshToken = refresh;
  localStorage.setItem('accessToken', access);
  localStorage.setItem('refreshToken', refresh);
};

export const getTokens = () => {
  if (!accessToken) {
    accessToken = localStorage.getItem('accessToken');
  }
  if (!refreshToken) {
    refreshToken = localStorage.getItem('refreshToken');
  }
  return { accessToken, refreshToken };
};

export const clearTokens = () => {
  accessToken = null;
  refreshToken = null;
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
};

// Barn context management
let currentBarnId: string | null = null;

export const setCurrentBarn = (barnId: string) => {
  currentBarnId = barnId;
  localStorage.setItem('currentBarnId', barnId);
};

export const getCurrentBarn = () => {
  if (!currentBarnId) {
    currentBarnId = localStorage.getItem('currentBarnId');
  }
  return currentBarnId;
};

export const clearCurrentBarn = () => {
  currentBarnId = null;
  localStorage.removeItem('currentBarnId');
};

// Request interceptor
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const { accessToken } = getTokens();
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    const barnId = getCurrentBarn();
    if (barnId) {
      config.headers['X-Barn-Id'] = barnId;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for token refresh
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // If error is 401 and we haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const { refreshToken: storedRefreshToken } = getTokens();
      if (storedRefreshToken) {
        try {
          const response = await axios.post(`${API_URL}/auth/refresh`, {
            refreshToken: storedRefreshToken,
          });

          const { accessToken: newAccessToken, refreshToken: newRefreshToken } = response.data;
          setTokens(newAccessToken, newRefreshToken);

          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return api(originalRequest);
        } catch (refreshError) {
          clearTokens();
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      }
    }

    return Promise.reject(error);
  }
);

export default api;

// ============ Auth API ============
export const authApi = {
  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },

  register: async (data: { email: string; password: string; name: string; phoneNumber: string; barnName?: string }) => {
    const response = await api.post('/auth/register', data);
    return response.data;
  },

  logout: async () => {
    await api.post('/auth/logout');
    clearTokens();
    clearCurrentBarn();
  },

  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  forgotPassword: async (email: string) => {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  },

  resetPassword: async (token: string, password: string) => {
    const response = await api.post('/auth/reset-password', { token, password });
    return response.data;
  },

  verifyEmail: async (token: string) => {
    const response = await api.post('/auth/verify-email', { token });
    return response.data;
  },
};

// ============ Users API ============
export const usersApi = {
  getAll: async (params?: { role?: string; search?: string }) => {
    const response = await api.get('/users', { params });
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },

  update: async (id: string, data: Partial<{ name: string; phoneNumber: string }>) => {
    const response = await api.put(`/users/${id}`, data);
    return response.data;
  },

  updatePermissions: async (id: string, data: { role?: string; permissions?: string[] }) => {
    const response = await api.put(`/users/${id}/permissions`, data);
    return response.data;
  },

  uploadAvatar: async (id: string, file: File) => {
    const formData = new FormData();
    formData.append('avatar', file);
    const response = await api.post(`/users/${id}/avatar`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  remove: async (id: string) => {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  },

  changePassword: async (currentPassword: string, newPassword: string) => {
    const response = await api.post('/users/change-password', { currentPassword, newPassword });
    return response.data;
  },
};

// ============ Barns API ============
export const barnsApi = {
  getAll: async () => {
    const response = await api.get('/barns');
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get(`/barns/${id}`);
    return response.data;
  },

  create: async (data: { name: string; setup?: object }) => {
    const response = await api.post('/barns', data);
    return response.data;
  },

  update: async (id: string, data: Partial<{ name: string; setup: object }>) => {
    const response = await api.put(`/barns/${id}`, data);
    return response.data;
  },

  getMembers: async (id: string) => {
    const response = await api.get(`/barns/${id}/members`);
    return response.data;
  },

  getLayout: async (id: string) => {
    const response = await api.get(`/barns/${id}/layout`);
    return response.data;
  },

  updateLayout: async (id: string, data: object) => {
    const response = await api.put(`/barns/${id}/layout`, data);
    return response.data;
  },

  getBranding: async (id: string) => {
    const response = await api.get(`/barns/${id}/branding`);
    return response.data;
  },

  updateBranding: async (id: string, data: object) => {
    const response = await api.put(`/barns/${id}/branding`, data);
    return response.data;
  },

  switchPrimary: async (id: string) => {
    const response = await api.post(`/barns/switch-primary/${id}`);
    return response.data;
  },
};

// ============ Horses API ============
export const horsesApi = {
  getAll: async (params?: { status?: string; boarderId?: string; search?: string; page?: number; limit?: number }) => {
    const response = await api.get('/horses', { params });
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get(`/horses/${id}`);
    return response.data;
  },

  create: async (data: object) => {
    const response = await api.post('/horses', data);
    return response.data;
  },

  update: async (id: string, data: object) => {
    const response = await api.put(`/horses/${id}`, data);
    return response.data;
  },

  delete: async (id: string, reason?: string) => {
    const response = await api.delete(`/horses/${id}`, { data: { reason } });
    return response.data;
  },

  addGeneticTest: async (id: string, data: object) => {
    const response = await api.post(`/horses/${id}/genetics`, data);
    return response.data;
  },

  uploadDocument: async (id: string, file: File, data: { type: string; name?: string; expirationDate?: string }) => {
    const formData = new FormData();
    formData.append('file', file);
    Object.entries(data).forEach(([key, value]) => {
      if (value) formData.append(key, value);
    });
    const response = await api.post(`/horses/${id}/documents`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  getRideLogs: async (id: string, params?: { type?: string; page?: number }) => {
    const response = await api.get(`/horses/${id}/ride-logs`, { params });
    return response.data;
  },

  getBreeds: async () => {
    const response = await api.get('/horses/options/breeds');
    return response.data;
  },

  getSexStatuses: async () => {
    const response = await api.get('/horses/options/sex-status');
    return response.data;
  },

  export: async (id: string) => {
    const response = await api.post(`/horses/${id}/export`);
    return response.data;
  },
};

// ============ Invoices API ============
export const invoicesApi = {
  getAll: async (params?: { status?: string; boarderId?: string; page?: number; limit?: number }) => {
    const response = await api.get('/invoices', { params });
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get(`/invoices/${id}`);
    return response.data;
  },

  create: async (data: object) => {
    const response = await api.post('/invoices', data);
    return response.data;
  },

  update: async (id: string, data: object) => {
    const response = await api.put(`/invoices/${id}`, data);
    return response.data;
  },

  processPayment: async (id: string, data: { method: string; paymentMethodId?: string }) => {
    const response = await api.post(`/invoices/${id}/payment`, data);
    return response.data;
  },

  markPaid: async (id: string, data: { method: string }) => {
    const response = await api.post(`/invoices/${id}/mark-paid`, data);
    return response.data;
  },

  getReceipt: async (id: string) => {
    const response = await api.get(`/invoices/${id}/receipt`);
    return response.data;
  },

  cancel: async (id: string) => {
    const response = await api.post(`/invoices/${id}/cancel`);
    return response.data;
  },
};

// ============ Tasks API ============
export const tasksApi = {
  getAll: async (params?: { status?: string; assigneeId?: string; myTasks?: boolean; page?: number }) => {
    const response = await api.get('/tasks', { params });
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get(`/tasks/${id}`);
    return response.data;
  },

  create: async (data: object) => {
    const response = await api.post('/tasks', data);
    return response.data;
  },

  update: async (id: string, data: object) => {
    const response = await api.put(`/tasks/${id}`, data);
    return response.data;
  },

  updateStatus: async (id: string, status: string) => {
    const response = await api.put(`/tasks/${id}/status`, { status });
    return response.data;
  },

  complete: async (id: string) => {
    const response = await api.post(`/tasks/${id}/complete`);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`/tasks/${id}`);
    return response.data;
  },

  getToday: async () => {
    const response = await api.get('/tasks/summary/today');
    return response.data;
  },

  getTodaysSummary: async () => {
    const response = await api.get('/tasks/summary/today');
    return response.data;
  },

  getOverdueCount: async () => {
    const response = await api.get('/tasks/summary/overdue');
    return response.data;
  },
};

// ============ Lessons API ============
export const lessonsApi = {
  getAll: async (params?: { status?: string; trainerId?: string; startDate?: string; endDate?: string; limit?: number }) => {
    const response = await api.get('/lessons', { params });
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get(`/lessons/${id}`);
    return response.data;
  },

  request: async (data: object) => {
    const response = await api.post('/lessons/request', data);
    return response.data;
  },

  create: async (data: object) => {
    const response = await api.post('/lessons', data);
    return response.data;
  },

  update: async (id: string, data: object) => {
    const response = await api.put(`/lessons/${id}`, data);
    return response.data;
  },

  approve: async (id: string) => {
    const response = await api.put(`/lessons/${id}/approve`);
    return response.data;
  },

  reject: async (id: string, reason?: string) => {
    const response = await api.put(`/lessons/${id}/reject`, { reason });
    return response.data;
  },

  counter: async (id: string, proposedDate: string, notes?: string) => {
    const response = await api.put(`/lessons/${id}/counter`, { proposedDate, notes });
    return response.data;
  },

  complete: async (id: string) => {
    const response = await api.put(`/lessons/${id}/complete`);
    return response.data;
  },

  cancel: async (id: string, reason?: string) => {
    const response = await api.put(`/lessons/${id}/cancel`, { reason });
    return response.data;
  },

  getAvailability: async (trainerId: string) => {
    const response = await api.get(`/lessons/availability/${trainerId}`);
    return response.data;
  },

  setAvailability: async (trainerId: string, availability: object[]) => {
    const response = await api.put(`/lessons/availability/${trainerId}`, { availability });
    return response.data;
  },
};

// ============ Ride Logs API ============
export const rideLogsApi = {
  getAll: async (params?: { horseId?: string; type?: string; page?: number }) => {
    const response = await api.get('/ride-logs', { params });
    return response.data;
  },

  getByHorse: async (horseId: string, params?: { type?: string; page?: number }) => {
    const response = await api.get(`/horses/${horseId}/ride-logs`, { params });
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get(`/ride-logs/${id}`);
    return response.data;
  },

  create: async (data: object) => {
    const response = await api.post('/ride-logs', data);
    return response.data;
  },

  update: async (id: string, data: object) => {
    const response = await api.put(`/ride-logs/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`/ride-logs/${id}`);
    return response.data;
  },

  getStats: async (horseId: string) => {
    const response = await api.get(`/ride-logs/stats/${horseId}`);
    return response.data;
  },
};

// ============ Invitations API ============
export const invitationsApi = {
  getAll: async (params?: { active?: boolean }) => {
    const response = await api.get('/invitations', { params });
    return response.data;
  },

  create: async (data: { email?: string; accountType?: string; role?: string; permissions?: string[] }) => {
    const response = await api.post('/invitations', data);
    return response.data;
  },

  createBulk: async (data: { accountType: string; expiresInHours?: number; maxUses?: number; permissions?: string[] }) => {
    const response = await api.post('/invitations/bulk', data);
    return response.data;
  },

  validate: async (token: string) => {
    const response = await api.get(`/invitations/validate/${token}`);
    return response.data;
  },

  accept: async (token: string, data: { email?: string; name: string; password: string; phoneNumber?: string }) => {
    const response = await api.post(`/invitations/accept/${token}`, data);
    return response.data;
  },

  resend: async (id: string) => {
    const response = await api.post(`/invitations/${id}/resend`);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`/invitations/${id}`);
    return response.data;
  },
};

// ============ Notifications API ============
export const notificationsApi = {
  getAll: async (params?: { unreadOnly?: boolean; type?: string; page?: number }) => {
    const response = await api.get('/notifications', { params });
    return response.data;
  },

  markAsRead: async (id: string) => {
    const response = await api.put(`/notifications/${id}/read`);
    return response.data;
  },

  markAllAsRead: async () => {
    const response = await api.post('/notifications/read-all');
    return response.data;
  },

  getPreferences: async () => {
    const response = await api.get('/notifications/preferences');
    return response.data;
  },

  updatePreferences: async (data: object) => {
    const response = await api.put('/notifications/preferences', data);
    return response.data;
  },

  registerDevice: async (token: string, platform: string) => {
    const response = await api.post('/notifications/register-device', { token, platform });
    return response.data;
  },
};

// ============ Subscriptions API ============
export const subscriptionsApi = {
  getPlans: async () => {
    const response = await api.get('/subscriptions/plans');
    return response.data;
  },

  getCurrent: async () => {
    const response = await api.get('/subscriptions');
    return response.data;
  },

  getUsage: async () => {
    const response = await api.get('/subscriptions/usage');
    return response.data;
  },

  checkFeature: async (feature: string) => {
    const response = await api.get(`/subscriptions/features/${feature}`);
    return response.data;
  },

  subscribe: async (tier: string, billingInterval?: string) => {
    const response = await api.post('/subscriptions', { tier, billingInterval });
    return response.data;
  },

  createCheckoutSession: async (data: { tier: string; billingInterval: string }) => {
    const response = await api.post('/subscriptions/checkout', data);
    return response.data;
  },

  createPortalSession: async () => {
    const response = await api.post('/subscriptions/portal');
    return response.data;
  },

  cancel: async () => {
    const response = await api.delete('/subscriptions');
    return response.data;
  },
};

// ============ Vendors API ============
export const vendorsApi = {
  search: async (params?: { type?: string; search?: string; city?: string; state?: string }) => {
    const response = await api.get('/vendors', { params });
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get(`/vendors/${id}`);
    return response.data;
  },

  getProfile: async () => {
    const response = await api.get('/vendors/profile');
    return response.data;
  },

  updateProfile: async (data: object) => {
    const response = await api.put('/vendors/profile', data);
    return response.data;
  },

  connectToBarn: async (barnId: string) => {
    const response = await api.post(`/vendors/connect/${barnId}`);
    return response.data;
  },

  getBarnConnections: async () => {
    const response = await api.get('/vendors/barns');
    return response.data;
  },

  getAppointments: async (params?: { status?: string; startDate?: string; endDate?: string }) => {
    const response = await api.get('/vendors/appointments', { params });
    return response.data;
  },

  createAppointment: async (data: object) => {
    const response = await api.post('/vendors/appointments', data);
    return response.data;
  },

  updateAppointment: async (id: string, data: object) => {
    const response = await api.put(`/vendors/appointments/${id}`, data);
    return response.data;
  },
};

// ============ Auth API additional methods ============
(authApi as any).changePassword = async (currentPassword: string, newPassword: string) => {
  const response = await api.post('/auth/change-password', { currentPassword, newPassword });
  return response.data;
};
