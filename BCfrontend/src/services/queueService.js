import api from './api';
import { projectionService } from './projectionService';

const QUEUE_STORAGE_KEY = 'biblecast_projection_queue';
const broadcastChannel =
  typeof window !== 'undefined' && 'BroadcastChannel' in window
    ? new BroadcastChannel('biblecast_projection_channel')
    : null;

/**
 * Helper to normalize queue item format between backend and frontend
 */
function normalizeItem(item) {
  if (!item) return null;
  return {
    id: item.id,
    reference: item.reference,
    translation: item.translation_code || item.translation || 'kjv',
    translation_code: item.translation_code || item.translation || 'kjv',
    text: item.passage_text || item.text || item.passage_preview || '',
    passage_text: item.passage_text || item.text || '',
    passage_preview: item.passage_preview || (item.passage_text ? item.passage_text.slice(0, 150) : ''),
    verses: item.verses_json || item.verses || [],
    verses_json: item.verses_json || item.verses || [],
    sort_order: typeof item.sort_order === 'number' ? item.sort_order : 0,
    status: item.status || 'pending',
    service_id: item.service_id || null,
    user: item.user || null,
    created_at: item.created_at || new Date().toISOString(),
  };
}

export const queueService = {
  /**
   * Get all items in the projection queue ordered by sort_order.
   */
  async getQueue() {
    try {
      const response = await api.get('/projection-queues');
      if (response?.data?.data) {
        const normalized = response.data.data.map(normalizeItem);
        try {
          localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(normalized));
        } catch (_) {}
        return normalized;
      }
    } catch (err) {
      console.warn('Backend queue fetch warning (fallback to local cache):', err);
    }

    // Fallback to local storage
    try {
      const raw = localStorage.getItem(QUEUE_STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (_) {
      return [];
    }
  },

  /**
   * Synchronous cached queue getter.
   */
  getCachedQueue() {
    try {
      const raw = localStorage.getItem(QUEUE_STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (_) {
      return [];
    }
  },

  /**
   * Add a passage to the queue.
   */
  async addToQueue(passage) {
    if (!passage) throw new Error('Passage is required to add to queue.');

    const payload = {
      reference: passage.reference,
      translation_code: (passage.translation || passage.translation_code || 'kjv').toLowerCase(),
      passage_text: passage.text || passage.passage_text || '',
      passage_preview: (passage.text || passage.passage_text || '').slice(0, 200),
      verses_json: passage.verses || passage.verses_json || [],
      service_id: passage.service_id || null,
    };

    let createdItem = null;

    try {
      const response = await api.post('/projection-queues', payload);
      if (response?.data?.data) {
        createdItem = normalizeItem(response.data.data);
      }
    } catch (err) {
      console.warn('Backend queue store warning (creating local queue item):', err);
      createdItem = {
        id: 'q_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
        ...payload,
        translation: payload.translation_code,
        text: payload.passage_text,
        verses: payload.verses_json,
        sort_order: 999,
        status: 'pending',
        created_at: new Date().toISOString(),
      };
    }

    // Update local cache
    const current = this.getCachedQueue();
    const updated = [...current.filter((i) => i.id !== createdItem.id), createdItem];
    try {
      localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(updated));
    } catch (_) {}

    // Dispatch broadcast notifications
    window.dispatchEvent(new CustomEvent('biblecast:queue_updated', { detail: updated }));
    if (broadcastChannel) {
      broadcastChannel.postMessage({ type: 'QUEUE_UPDATED', queue: updated });
    }

    return createdItem;
  },

  /**
   * Remove a passage from the queue.
   */
  async removeFromQueue(id) {
    try {
      await api.delete(`/projection-queues/${id}`);
    } catch (err) {
      console.warn('Backend remove queue item warning:', err);
    }

    const current = this.getCachedQueue();
    const updated = current.filter((item) => String(item.id) !== String(id));

    try {
      localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(updated));
    } catch (_) {}

    window.dispatchEvent(new CustomEvent('biblecast:queue_updated', { detail: updated }));
    if (broadcastChannel) {
      broadcastChannel.postMessage({ type: 'QUEUE_UPDATED', queue: updated });
    }

    return updated;
  },

  /**
   * Reorder queue passages.
   *
   * @param {Array<number|string>} orderedIds Array of IDs in new order
   */
  async reorderQueue(orderedIds) {
    // Optimistically update local cache
    const current = this.getCachedQueue();
    const itemMap = new Map(current.map((item) => [String(item.id), item]));
    const reordered = [];

    orderedIds.forEach((id, index) => {
      const item = itemMap.get(String(id));
      if (item) {
        reordered.push({ ...item, sort_order: index });
      }
    });

    try {
      localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(reordered));
    } catch (_) {}

    window.dispatchEvent(new CustomEvent('biblecast:queue_updated', { detail: reordered }));
    if (broadcastChannel) {
      broadcastChannel.postMessage({ type: 'QUEUE_UPDATED', queue: reordered });
    }

    try {
      const response = await api.post('/projection-queues/reorder', { items: orderedIds });
      if (response?.data?.data) {
        const normalized = response.data.data.map(normalizeItem);
        localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(normalized));
        return normalized;
      }
    } catch (err) {
      console.warn('Backend reorder queue warning:', err);
    }

    return reordered;
  },

  /**
   * Project selected passage from queue to sanctuary screens.
   */
  async projectItem(id) {
    const current = this.getCachedQueue();
    const item = current.find((i) => String(i.id) === String(id));

    // First broadcast live via projectionService so projector updates immediately
    if (item) {
      await projectionService.projectScripture({
        reference: item.reference,
        translation_code: item.translation_code || item.translation,
        passage_text: item.text || item.passage_text,
        verses_json: item.verses || item.verses_json,
        mode: 'queue',
      });
    }

    // Call backend endpoint to mark projected and dispatch ProjectionUpdated
    try {
      const response = await api.post(`/projection-queues/${id}/project`);

      // Update local item status
      const updated = current.map((i) =>
        String(i.id) === String(id) ? { ...i, status: 'projected' } : i
      );
      localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('biblecast:queue_updated', { detail: updated }));

      return response.data;
    } catch (err) {
      console.warn('Backend project queue item warning (handled locally):', err);
      const updated = current.map((i) =>
        String(i.id) === String(id) ? { ...i, status: 'projected' } : i
      );
      localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('biblecast:queue_updated', { detail: updated }));
      return { success: true };
    }
  },

  /**
   * Clear entire queue.
   */
  async clearQueue() {
    try {
      await api.post('/projection-queues/clear');
    } catch (err) {
      console.warn('Backend clear queue warning:', err);
    }

    try {
      localStorage.removeItem(QUEUE_STORAGE_KEY);
    } catch (_) {}

    window.dispatchEvent(new CustomEvent('biblecast:queue_updated', { detail: [] }));
    if (broadcastChannel) {
      broadcastChannel.postMessage({ type: 'QUEUE_UPDATED', queue: [] });
    }

    return [];
  },
};
