import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('biblecast_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch (_) {
      return null;
    }
  });

  const [token, setToken] = useState(() => localStorage.getItem('biblecast_token') || null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Synchronize authentication status with backend on application initialization
  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('biblecast_token');

      if (!storedToken) {
        setLoading(false);
        return;
      }

      try {
        const response = await authService.getAuthUser();
        if (response && response.data && response.data.user) {
          setUser(response.data.user);
          localStorage.setItem('biblecast_user', JSON.stringify(response.data.user));
        }
      } catch (err) {
        // If token verification fails, clear local credentials
        setToken(null);
        setUser(null);
        localStorage.removeItem('biblecast_token');
        localStorage.removeItem('biblecast_user');
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // Listen to 401 unauthorized events dispatched by axios interceptor
    const handleUnauthorized = () => {
      setToken(null);
      setUser(null);
    };

    window.addEventListener('biblecast:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('biblecast:unauthorized', handleUnauthorized);
  }, []);

  /**
   * Log in with email and password.
   * Throws an AppError on failure (already classified by api.js interceptor).
   */
  const login = useCallback(async (credentials) => {
    setError(null);
    try {
      const response = await authService.login(credentials);
      const { user: authUser, token: authToken } = response.data;

      setToken(authToken);
      setUser(authUser);

      localStorage.setItem('biblecast_token', authToken);
      localStorage.setItem('biblecast_user', JSON.stringify(authUser));

      return { success: true, user: authUser };
    } catch (appError) {
      // appError is already an AppError — set it on context and re-throw
      setError(appError);
      throw appError;
    }
  }, []);

  /**
   * Register a new user.
   * Throws an AppError on failure.
   */
  const register = useCallback(async (data) => {
    setError(null);
    try {
      const response = await authService.register(data);
      const { user: authUser, token: authToken } = response.data;

      setToken(authToken);
      setUser(authUser);

      localStorage.setItem('biblecast_token', authToken);
      localStorage.setItem('biblecast_user', JSON.stringify(authUser));

      return { success: true, user: authUser };
    } catch (appError) {
      setError(appError);
      throw appError;
    }
  }, []);

  /**
   * Log out and revoke active token
   */
  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch (_) {
      // Continue cleanup even if server endpoint fails
    } finally {
      setToken(null);
      setUser(null);
      localStorage.removeItem('biblecast_token');
      localStorage.removeItem('biblecast_user');
    }
  }, []);

  const value = {
    user,
    token,
    isAuthenticated: !!token && !!user,
    loading,
    error,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
