import api from './api';
import { queueService } from './queueService';

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
    return queueService.getCachedQueue();
  },

  /**
   * Add a scripture passage to the projection queue.
   * Dispatches events to synchronize across tabs/screens.
   *
   * @param {Object} passage { reference, translation, text, verses }
   * @returns {Object} Newly queued item
   */
  addToQueue(passage) {
    return queueService.addToQueue(passage);
  },

  /**
   * Remove a passage item from the projection queue.
   *
   * @param {string|number} queueId
   * @returns {Array} Updated queue
   */
  removeFromQueue(queueId) {
    return queueService.removeFromQueue(queueId);
  },
};
