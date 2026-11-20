import api from './api';

export const authService = {
  /**
   * Register a new user
   * @param {Object} data - { name, email, password, password_confirmation, role }
   */
  async register(data) {
    const response = await api.post('/register', data);
    return response.data;
  },

  /**
   * Authenticate user with credentials
   * @param {Object} credentials - { email, password }
   */
  async login(credentials) {
    const response = await api.post('/login', credentials);
    return response.data;
  },

  /**
   * Fetch current authenticated user profile
   */
  async getAuthUser() {
    const response = await api.get('/user');
    return response.data;
  },

  /**
   * Revoke current session token
   */
  async logout() {
    try {
      const response = await api.post('/logout');
      return response.data;
    } finally {
      localStorage.removeItem('biblecast_token');
      localStorage.removeItem('biblecast_user');
    }
  },
};
