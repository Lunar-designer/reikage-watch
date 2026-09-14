import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const cached = localStorage.getItem('rk_user');
      return cached ? JSON.parse(cached) : null;
    } catch (e) {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState('login'); // 'login' or 'signup'

  useEffect(() => {
    async function checkAuth() {
      const token = localStorage.getItem('rk_token');
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const data = await api.getMe();
        if (data && data.user) {
          setUser(data.user);
          localStorage.setItem('rk_user', JSON.stringify(data.user));
        } else {
          localStorage.removeItem('rk_token');
          localStorage.removeItem('rk_user');
          setUser(null);
        }
      } catch (err) {
        const msg = (err.message || '').toLowerCase();
        if (msg.includes('invalid') || msg.includes('expired') || msg.includes('suspended') || msg.includes('not found')) {
          console.warn('Session rejected by server, logging out:', err.message);
          localStorage.removeItem('rk_token');
          localStorage.removeItem('rk_user');
          setUser(null);
        } else {
          // Network connection issue or server waking up: preserve session and retry
          console.log('Server waking up or network pause, preserving session...');
          setTimeout(checkAuth, 3000);
        }
      } finally {
        setLoading(false);
      }
    }
    checkAuth();
  }, []);

  const login = async (username, password) => {
    const data = await api.login(username, password);
    localStorage.setItem('rk_token', data.token);
    localStorage.setItem('rk_user', JSON.stringify(data.user));
    setUser(data.user);
    setAuthModalOpen(false);
    return data.user;
  };

  const register = async (username, password, confirmPassword) => {
    const data = await api.register(username, password, confirmPassword);
    localStorage.setItem('rk_token', data.token);
    localStorage.setItem('rk_user', JSON.stringify(data.user));
    setUser(data.user);
    setAuthModalOpen(false);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem('rk_token');
    localStorage.removeItem('rk_user');
    setUser(null);
  };

  const openAuthModal = (mode = 'login') => {
    setAuthModalMode(mode);
    setAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setAuthModalOpen(false);
  };

  const refreshUser = async () => {
    try {
      const data = await api.getMe();
      if (data && data.user) {
        setUser(data.user);
        localStorage.setItem('rk_user', JSON.stringify(data.user));
      }
    } catch (err) {
      console.error('Failed to refresh user:', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        refreshUser,
        authModalOpen,
        authModalMode,
        openAuthModal,
        closeAuthModal
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
