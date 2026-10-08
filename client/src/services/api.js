import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://dhanashri-healthcare-backend.vercel.app/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to append JWT token
api.interceptors.request.use(
  (config) => {
    // If Authorization is already explicitly provided, respect it
    const existingAuth = config.headers?.Authorization || 
      (typeof config.headers?.get === 'function' ? config.headers.get('Authorization') : null);
    if (existingAuth) {
      return config;
    }

    const adminToken = localStorage.getItem('dhanashri_admin_token') || localStorage.getItem('pulsebio_admin_token');
    const userToken = localStorage.getItem('dhanashri_user_token') || localStorage.getItem('pulsebio_user_token');
    const partnerToken = localStorage.getItem('dhanashri_partner_token');

    // Check if request is in partner context
    const hasPartnerHeader = Boolean(
      (typeof config.headers?.get === 'function' && 
        (config.headers.get('X-Partner-Request') || config.headers.get('x-partner-request'))) ||
      config.headers?.['X-Partner-Request'] ||
      config.headers?.['x-partner-request']
    );

    const isPartnerUrl = Boolean(
      config.url && (
        config.url.startsWith('/partners/profile') ||
        config.url.startsWith('/partners/assigned-bookings') ||
        config.url.includes('/partners/bookings')
      )
    );

    const isOnPartnerPage = typeof window !== 'undefined' && 
      window.location && 
      window.location.pathname.startsWith('/partner');

    const isPartnerContext = hasPartnerHeader || isPartnerUrl || isOnPartnerPage;

    // Check if request is in an admin context
    const hasAdminHeader = Boolean(
      (typeof config.headers?.get === 'function' && 
        (config.headers.get('X-Admin-Request') || config.headers.get('x-admin-request'))) ||
      config.headers?.['X-Admin-Request'] ||
      config.headers?.['x-admin-request']
    );

    const isAdminUrl = Boolean(
      config.url && (
        config.url.includes('/admin') || 
        config.url.includes('/dashboard/admin') ||
        config.url.startsWith('/users')
      )
    );

    const isOnAdminPage = typeof window !== 'undefined' && 
      window.location && 
      window.location.pathname.startsWith('/admin');

    const isAdminContext = hasAdminHeader || isAdminUrl || isOnAdminPage;

    // Determine appropriate token
    let token = userToken;
    if (isPartnerContext && partnerToken) {
      token = partnerToken;
    } else if (isAdminContext) {
      token = adminToken || userToken;
    } else {
      token = userToken || adminToken;
    }

    if (token) {
      if (typeof config.headers?.set === 'function') {
        config.headers.set('Authorization', `Bearer ${token}`);
      } else {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      console.warn('Unauthorized API call:', error.response.data?.message);
    }
    return Promise.reject(error);
  }
);

export default api;
