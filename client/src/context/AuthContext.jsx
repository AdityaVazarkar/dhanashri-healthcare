import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [admin, setAdmin] = useState(null);
  const [partner, setPartner] = useState(null);
  const [token, setToken] = useState(
    localStorage.getItem('dhanashri_user_token') || localStorage.getItem('pulsebio_user_token')
  );
  const [adminToken, setAdminToken] = useState(
    localStorage.getItem('dhanashri_admin_token') || localStorage.getItem('pulsebio_admin_token')
  );
  const [partnerToken, setPartnerToken] = useState(
    localStorage.getItem('dhanashri_partner_token')
  );
  const [loading, setLoading] = useState(true);

  // Initialize and verify user, admin, partner auth once on mount
  useEffect(() => {
    const initAuth = async () => {
      const savedUserToken = localStorage.getItem('dhanashri_user_token') || localStorage.getItem('pulsebio_user_token');
      const savedAdminToken = localStorage.getItem('dhanashri_admin_token') || localStorage.getItem('pulsebio_admin_token');
      const savedPartnerToken = localStorage.getItem('dhanashri_partner_token');

      if (savedUserToken) {
        try {
          const res = await api.get('/auth/me', {
            headers: { Authorization: `Bearer ${savedUserToken}` }
          });
          if (res.data.success && !res.data.isAdmin) {
            setUser(res.data.user);
          } else {
            logout();
          }
        } catch (err) {
          console.warn('User token expired or invalid');
          logout();
        }
      }

      if (savedAdminToken) {
        try {
          const res = await api.get('/auth/me', {
            headers: { 
              Authorization: `Bearer ${savedAdminToken}`,
              'X-Admin-Request': 'true'
            }
          });
          if (res.data.success && res.data.isAdmin) {
            setAdmin(res.data.user);
          } else {
            adminLogout();
          }
        } catch (err) {
          console.warn('Admin token expired or invalid');
          adminLogout();
        }
      }

      if (savedPartnerToken) {
        try {
          const res = await api.get('/partners/profile', {
            headers: {
              Authorization: `Bearer ${savedPartnerToken}`,
              'X-Partner-Request': 'true'
            }
          });
          if (res.data.success) {
            setPartner(res.data.partner);
          } else {
            partnerLogout();
          }
        } catch (err) {
          console.warn('Partner token expired or invalid');
          partnerLogout();
        }
      }

      setLoading(false);
    };

    initAuth();
  }, []);

  // User Login
  const login = async (identifier, password) => {
    const res = await api.post('/auth/login', { identifier, password });
    if (res.data.success) {
      setUser(res.data.user);
      setToken(res.data.token);
      localStorage.setItem('dhanashri_user_token', res.data.token);
      localStorage.setItem('pulsebio_user_token', res.data.token);
      return res.data;
    }
    throw new Error(res.data.message || 'Login failed');
  };

  // User Register
  const register = async (userData) => {
    const res = await api.post('/auth/register', userData);
    if (res.data.success) {
      setUser(res.data.user);
      setToken(res.data.token);
      localStorage.setItem('dhanashri_user_token', res.data.token);
      localStorage.setItem('pulsebio_user_token', res.data.token);
      return res.data;
    }
    throw new Error(res.data.message || 'Registration failed');
  };

  // User Logout
  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('dhanashri_user_token');
    localStorage.removeItem('pulsebio_user_token');
  };

  // Admin Login
  const adminLogin = async (email, password) => {
    const res = await api.post('/auth/admin-login', { email, password });
    if (res.data.success) {
      setAdmin(res.data.admin);
      setAdminToken(res.data.token);
      localStorage.setItem('dhanashri_admin_token', res.data.token);
      localStorage.setItem('pulsebio_admin_token', res.data.token);
      return res.data;
    }
    throw new Error(res.data.message || 'Admin login failed');
  };

  // Admin Logout
  const adminLogout = () => {
    setAdmin(null);
    setAdminToken(null);
    localStorage.removeItem('dhanashri_admin_token');
    localStorage.removeItem('pulsebio_admin_token');
  };

  // Partner Login
  const partnerLogin = async (identifier, password) => {
    const res = await api.post('/partners/login', { identifier, password });
    if (res.data.success) {
      setPartner(res.data.partner);
      setPartnerToken(res.data.token);
      localStorage.setItem('dhanashri_partner_token', res.data.token);
      return res.data;
    }
    throw new Error(res.data.message || 'Partner login failed');
  };

  // Partner Logout
  const partnerLogout = () => {
    setPartner(null);
    setPartnerToken(null);
    localStorage.removeItem('dhanashri_partner_token');
  };

  // Update profile
  const updateProfile = async (profileData) => {
    const res = await api.put('/auth/profile', profileData);
    if (res.data.success) {
      setUser(res.data.user);
      return res.data;
    }
    throw new Error(res.data.message || 'Profile update failed');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        admin,
        adminToken,
        isAdminAuthenticated: !!admin,
        partner,
        partnerToken,
        isPartnerAuthenticated: !!partner,
        loading,
        login,
        register,
        logout,
        adminLogin,
        adminLogout,
        partnerLogin,
        partnerLogout,
        setPartner,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
