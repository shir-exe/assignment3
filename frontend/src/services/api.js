import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Automatically inject JWT token into outgoing requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('drivealert_token') || localStorage.getItem('focusflow_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 unauthorized responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('drivealert_token');
      localStorage.removeItem('drivealert_user');
      localStorage.removeItem('focusflow_token');
      localStorage.removeItem('focusflow_user');
      if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const authService = {
  login: async (credentials) => {
    const res = await api.post('/auth/login', credentials);
    return res.data;
  },
  register: async (userData) => {
    const res = await api.post('/auth/register', userData);
    return res.data;
  },
  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      // Ignore network errors on logout
    }
    localStorage.removeItem('drivealert_token');
    localStorage.removeItem('drivealert_user');
  },
  getMe: async () => {
    const res = await api.get('/auth/me');
    return res.data;
  },
};

export const userService = {
  getMe: async () => {
    const res = await api.get('/users/me');
    return res.data;
  },
  getStats: async () => {
    const res = await api.get('/users/stats');
    return res.data;
  },
  updateProfile: async (data) => {
    const res = await api.put('/users/profile', data);
    return res.data;
  },
};

export const contentService = {
  getAll: async (category = '') => {
    const url = category && category !== 'הכל' ? `/content?category=${encodeURIComponent(category)}` : '/content';
    const res = await api.get(url);
    return res.data;
  },
  getById: async (id) => {
    const res = await api.get(`/content/${id}`);
    return res.data;
  },
};

export const routeService = contentService;

export const sessionService = {
  startSession: async (data) => {
    const res = await api.post('/sessions', data);
    return res.data;
  },
  sendReadings: async (sessionId, readings) => {
    const res = await api.post(`/sessions/${sessionId}/readings`, readings);
    return res.data;
  },
  updateSession: async (id, data) => {
    const res = await api.put(`/sessions/${id}`, data);
    return res.data;
  },
  getAllSessions: async () => {
    const res = await api.get('/sessions');
    return res.data;
  },
  getSessionDetail: async (id) => {
    const res = await api.get(`/sessions/${id}`);
    return res.data;
  },
};

export default api;
