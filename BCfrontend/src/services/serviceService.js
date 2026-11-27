import api from './api';

const emitServiceUpdated = (service = null) => {
  try {
    window.dispatchEvent(
      new CustomEvent('biblecast:service_updated', { detail: service })
    );
  } catch (_) {}
};

/**
 * serviceService
 *
 * REST API client for Church Service Management:
 * Create, Edit, Schedule, Start, End, and View Previous Services.
 */
export const serviceService = {
  async getServices(params = {}) {
    const response = await api.get('/services', { params });
    return response.data;
  },

  async getPreviousServices(limit = 25) {
    const response = await api.get('/services/previous', { params: { limit } });
    return response.data;
  },

  async getService(id) {
    const response = await api.get(`/services/${id}`);
    return response.data;
  },

  async createService(payload) {
    const response = await api.post('/services', payload);
    emitServiceUpdated(response.data?.data);
    return response.data;
  },

  async updateService(id, payload) {
    const response = await api.put(`/services/${id}`, payload);
    emitServiceUpdated(response.data?.data);
    return response.data;
  },

  async scheduleService(id, payload) {
    const response = await api.post(`/services/${id}/schedule`, payload);
    emitServiceUpdated(response.data?.data);
    return response.data;
  },

  async startService(id) {
    const response = await api.post(`/services/${id}/start`);
    emitServiceUpdated(response.data?.data);
    return response.data;
  },

  async endService(id) {
    const response = await api.post(`/services/${id}/end`);
    emitServiceUpdated(response.data?.data);
    return response.data;
  },

  async deleteService(id) {
    const response = await api.delete(`/services/${id}`);
    emitServiceUpdated(null);
    return response.data;
  },
};
