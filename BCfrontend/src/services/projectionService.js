import api from './api';

const PROJECTION_STORAGE_KEY = 'biblecast_active_projection';
const broadcastChannel =
  typeof window !== 'undefined' && 'BroadcastChannel' in window
    ? new BroadcastChannel('biblecast_projection_channel')
    : null;

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
   * Record a new scripture projection and broadcast live to sanctuary screens.
   *
   * @param {Object} data { reference, translation_code, passage_text, verses_json, mode, service_id }
   * @returns {Promise<Object>}
   */
  async projectScripture(data) {
    const projectionPayload = {
      reference: data.reference,
      translation: data.translation_code || data.translation || 'kjv',
      text: data.passage_text || data.text,
      verses: data.verses_json || data.verses || [],
      status: 'projected',
      mode: data.mode || 'manual',
      projected_at: new Date().toISOString(),
    };

    // 1. Immediately store in localStorage for multi-window / cross-tab sync
    try {
      localStorage.setItem(PROJECTION_STORAGE_KEY, JSON.stringify(projectionPayload));
      window.dispatchEvent(
        new CustomEvent('biblecast:projection_updated', { detail: projectionPayload })
      );
    } catch (_) {}

    // 2. Broadcast immediately over BroadcastChannel
    if (broadcastChannel) {
      broadcastChannel.postMessage({
        type: 'PROJECT_SCRIPTURE',
        payload: projectionPayload,
      });
    }

    // 3. Persist to backend database for audit and history
    try {
      const response = await api.post('/projections', {
        reference: projectionPayload.reference,
        translation_code: projectionPayload.translation,
        passage_text: projectionPayload.text,
        verses_json: projectionPayload.verses,
        mode: projectionPayload.mode,
        service_id: data.service_id || null,
      });
      return response.data;
    } catch (err) {
      console.warn('Backend projection log warning (display updated locally):', err);
      return { success: true, data: projectionPayload };
    }
  },

  /**
   * Get current active projection from local cache or backend.
   *
   * @returns {Promise<Object>}
   */
  async getCurrent() {
    // Check local storage first
    try {
      const local = localStorage.getItem(PROJECTION_STORAGE_KEY);
      if (local) {
        const parsed = JSON.parse(local);
        return { success: true, data: parsed };
      }
    } catch (_) {}

    // Fallback to backend API
    const response = await api.get('/projections/current');
    if (response?.data?.data) {
      const data = response.data.data;
      const formatted = {
        reference: data.reference,
        translation: data.translation_code || 'kjv',
        text: data.passage_text,
        verses: data.verses_json || [],
        status: data.status || 'projected',
        projected_at: data.projected_at,
      };
      localStorage.setItem(PROJECTION_STORAGE_KEY, JSON.stringify(formatted));
      return { success: true, data: formatted };
    }

    return response.data;
  },

  /**
   * Clear the projection display (shows blank sanctuary background).
   *
   * @returns {Promise<Object>}
   */
  async clear() {
    const payload = { status: 'cleared', cleared_at: new Date().toISOString() };

    try {
      localStorage.setItem(PROJECTION_STORAGE_KEY, JSON.stringify(payload));
      window.dispatchEvent(
        new CustomEvent('biblecast:projection_updated', { detail: payload })
      );
    } catch (_) {}

    if (broadcastChannel) {
      broadcastChannel.postMessage({ type: 'CLEAR_PROJECTION', payload });
    }

    try {
      const response = await api.post('/projections/clear');
      return response.data;
    } catch (_) {
      return { success: true };
    }
  },

  /**
   * Blackout the projection display (completely dark screen).
   *
   * @returns {Promise<Object>}
   */
  async blackout() {
    const payload = { status: 'blackout', cleared_at: new Date().toISOString() };

    try {
      localStorage.setItem(PROJECTION_STORAGE_KEY, JSON.stringify(payload));
      window.dispatchEvent(
        new CustomEvent('biblecast:projection_updated', { detail: payload })
      );
    } catch (_) {}

    if (broadcastChannel) {
      broadcastChannel.postMessage({ type: 'BLACKOUT_PROJECTION', payload });
    }

    return { success: true };
  },
};
