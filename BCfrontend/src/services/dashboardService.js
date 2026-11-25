import api from './api';

export const dashboardService = {
  /**
   * Fetch real dashboard metrics:
   * - Total Projections done (real database count)
   * - Current Active Service (1st service, 2nd service, tuesday service, thursday service)
   * - Recent Projections list
   * - Active Operators (signed in users)
   */
  async getStats() {
    try {
      const response = await api.get('/dashboard/stats');
      return response.data;
    } catch (err) {
      console.warn('Backend dashboard stats fetch warning:', err);
      throw err;
    }
  },

  /**
   * Switch active service to 1st service, 2nd service, tuesday service, or thursday service.
   *
   * @param {string} serviceKey '1st_service' | '2nd_service' | 'tuesday_service' | 'thursday_service'
   */
  async switchService(serviceKey) {
    const response = await api.post('/services/switch', {
      service_key: serviceKey,
    });
    return response.data;
  },

  /**
   * Get all services list.
   */
  async getServices() {
    const response = await api.get('/services');
    return response.data;
  },
};
