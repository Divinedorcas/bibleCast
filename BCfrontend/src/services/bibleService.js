import api from './api';

const QUEUE_STORAGE_KEY = 'biblecast_projection_queue';
const broadcastChannel = typeof window !== 'undefined' && 'BroadcastChannel' in window
  ? new BroadcastChannel('biblecast_channel')
  : null;

export const bibleService = {
  /**
   * Fetch active Bible translations available in the system.
   *
   * @returns {Promise<Array>} Array of translation objects
   */
  async getTranslations() {
    const response = await api.get('/bible/translations');
    return response.data;
  },

  /**
   * Search and fetch scripture text by reference and translation.
   *
   * @param {string} reference E.g. "John 3:16" or "Romans 8:28"
   * @param {string} [translation='kjv'] E.g. "kjv", "web"
   * @returns {Promise<Object>} Passage data with formatted verses and text
   */
  async getPassage(reference, translation = 'kjv') {
    const response = await api.get('/bible/passage', {
      params: {
        reference,
        translation,
      },
    });
    return response.data;
  },

  /**
   * Search Bible text or query scriptures.
   *
   * @param {string} query Search query or reference
   * @param {string} [translation='kjv'] E.g. "kjv", "web"
   * @returns {Promise<Object>} Search result set { query, total, results }
   */
  async search(query, translation = 'kjv') {
    const response = await api.get('/bible/search', {
      params: {
        query,
        translation,
      },
    });
    return response.data;
  },

  /**
   * Parse speech transcript snippet to extract canonical scripture reference.
   *
   * @param {string} transcript Spoken transcript text
   * @returns {Promise<Object>} Detection result { detected, reference, book, chapter, ... }
   */
  async parseReference(transcript) {
    const response = await api.post('/bible/parse-reference', {
      transcript,
    });
    return response.data;
  },

  // ─── Projection Queue Management ──────────────────────────────────────────

  /**
   * Retrieve active projection queue items.
   *
   * @returns {Array} List of queued scripture passages
   */
  getQueue() {
    try {
      const saved = localStorage.getItem(QUEUE_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (_) {
      return [];
    }
  },

  /**
   * Add a scripture passage to the projection queue.
   * Dispatches events to synchronize across tabs/screens.
   *
   * @param {Object} passage { reference, translation, text, verses }
   * @returns {Object} Newly queued item
   */
  addToQueue(passage) {
    try {
      const currentQueue = this.getQueue();
      const newItem = {
        id: 'q_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
        reference: passage.reference,
        translation: passage.translation || 'kjv',
        translation_name: passage.translation_name || '',
        text: passage.text,
        verses: passage.verses || [],
        queuedAt: new Date().toISOString(),
        status: 'queued', // 'queued' | 'projected' | 'dismissed'
      };

      const updated = [...currentQueue, newItem];
      localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(updated));

      // Notify other components & browser tabs
      window.dispatchEvent(new CustomEvent('biblecast:queue_updated', { detail: updated }));
      if (broadcastChannel) {
        broadcastChannel.postMessage({ type: 'QUEUE_UPDATED', queue: updated });
      }

      return newItem;
    } catch (err) {
      console.error('Failed to add passage to queue:', err);
      throw err;
    }
  },

  /**
   * Remove a passage item from the projection queue.
   *
   * @param {string} queueId
   * @returns {Array} Updated queue
   */
  removeFromQueue(queueId) {
    try {
      const currentQueue = this.getQueue();
      const updated = currentQueue.filter((item) => item.id !== queueId);
      localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(updated));

      window.dispatchEvent(new CustomEvent('biblecast:queue_updated', { detail: updated }));
      if (broadcastChannel) {
        broadcastChannel.postMessage({ type: 'QUEUE_UPDATED', queue: updated });
      }

      return updated;
    } catch (err) {
      console.error('Failed to remove passage from queue:', err);
      return [];
    }
  },
};
