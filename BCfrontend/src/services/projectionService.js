import api from './api';

export const projectionService = {
  // ─── Saved Passages / Favourites ──────────────────────────────────────────

  /**
   * Get list of saved / favourite passages.
   *
   * @returns {Promise<Array>} List of saved passages
   */
  async getSavedPassages() {
    const response = await api.get('/saved-passages');
    return response.data;
  },

  /**
   * Save a passage to favourites.
   *
   * @param {Object} data { reference, translation_code, label, passage_text, verses_json }
   * @returns {Promise<Object>} Created saved passage
   */
  async savePassage(data) {
    const response = await api.post('/saved-passages', data);
    return response.data;
  },

  /**
   * Remove a passage from favourites.
   *
   * @param {number|string} id
   * @returns {Promise<Object>} Response status
   */
  async removeSavedPassage(id) {
    const response = await api.delete(`/saved-passages/${id}`);
    return response.data;
  },

  // ─── Projections & Projection History ────────────────────────────────────

  /**
   * Get projection history.
   *
   * @param {number} [limit=20]
   * @returns {Promise<Array>} List of historical projections
   */
  async getHistory(limit = 20) {
    const response = await api.get('/projections/history', {
      params: { limit },
    });
    return response.data;
  },

  /**
   * Record a new scripture projection.
   *
   * @param {Object} data { reference, translation_code, passage_text, verses_json, mode, service_id }
   * @returns {Promise<Object>}
   */
  async projectScripture(data) {
    const response = await api.post('/projections', data);
    return response.data;
  },

  /**
   * Get current active projection.
   *
   * @returns {Promise<Object>}
   */
  async getCurrent() {
    const response = await api.get('/projections/current');
    return response.data;
  },

  /**
   * Clear the projection display.
   *
   * @returns {Promise<Object>}
   */
  async clear() {
    const response = await api.post('/projections/clear');
    return response.data;
  },
};
