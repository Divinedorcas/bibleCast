import axios from 'axios';
import { classifyError } from '../utils/errorHandler';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// ─── Request interceptor ─────────────────────────────────────────────────────
// Attach the Bearer token stored after login.
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('biblecast_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(classifyError(error))
);

// ─── Response interceptor ────────────────────────────────────────────────────
// 1. Classify every error into a typed AppError before it reaches any caller.
// 2. For 401, dispatch a global event so AuthContext can wipe the session.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const appError = classifyError(error);

    if (appError.status === 401) {
      // Clear persisted credentials
      localStorage.removeItem('biblecast_token');
      localStorage.removeItem('biblecast_user');
      // Notify AuthContext to reset its state
      window.dispatchEvent(new CustomEvent('biblecast:unauthorized', { detail: appError }));
    }

    // Replace the raw axios error with our structured AppError so every
    // catch block receives a consistent, typed object.
    return Promise.reject(appError);
  }
);

export default api;
