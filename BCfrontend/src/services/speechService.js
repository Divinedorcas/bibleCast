import api from './api';

/**
 * speechService
 *
 * API client for BibleCast's spoken scripture detection and
 * human-in-the-loop operator approval gate.
 */
export const speechService = {
  /**
   * Run the 6-step transcription detection pipeline on a speech chunk.
   * Creates a pending detection awaiting explicit operator approval.
   *
   * @param {string} transcript
   * @param {number|null} [serviceId=null]
   * @param {string} [translation='kjv']
   * @returns {Promise<Object>}
   */
  async processTranscript(transcript, serviceId = null, translation = 'kjv') {
    const response = await api.post('/speech/process-transcript', {
      transcript,
      service_id: serviceId,
      translation,
    });
    return response.data;
  },

  /**
   * Fetch pending spoken detections awaiting review.
   *
   * @param {number} [limit=20]
   * @param {number|null} [serviceId=null]
   * @returns {Promise<Object>}
   */
  async getPendingDetections(limit = 20, serviceId = null) {
    const response = await api.get('/speech/detections', {
      params: {
        status: 'pending',
        limit,
        ...(serviceId ? { service_id: serviceId } : {}),
      },
    });
    return response.data;
  },

  /**
   * Record a client-detected scripture citation into the pending approval queue.
   *
   * @param {Object} payload { transcript_snippet, detected_reference, confidence_score, service_id, translation_code }
   * @returns {Promise<Object>}
   */
  async recordDetection(payload) {
    const response = await api.post('/speech/detections', payload);
    return response.data;
  },

  /**
   * Submit an operator review decision ('approve' or 'reject') for a detection.
   * Only approved detections are allowed onto the projector display.
   *
   * @param {number|string} detectionId
   * @param {'approve'|'reject'} action
   * @returns {Promise<Object>}
   */
  async reviewDetection(detectionId, action) {
    const response = await api.post(`/speech/detections/${detectionId}/review`, {
      action,
    });
    return response.data;
  },
};
