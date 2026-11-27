import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAudioInput } from '../hooks/useAudioInput';
import { AudioControls } from '../components/speech/AudioControls';
import { DetectionSuggestions } from '../components/speech/DetectionSuggestions';
import { bibleService } from '../services/bibleService';
import { speechService } from '../services/speechService';
import { serviceService } from '../services/serviceService';
import { projectionService } from '../services/projectionService';
import { queueService } from '../services/queueService';
import { detectPassageFromText } from '../utils/referenceParser';
import {
  Radio,
  Tv,
  CheckCircle2,
  Clock,
  ExternalLink,
  Volume2,
  Search,
  Calendar,
} from 'lucide-react';

export function LiveService() {
  // Service elapsed timer
  const [serviceSeconds, setServiceSeconds] = useState(0);

  // Auto-detection setting
  const [autoDetectEnabled, setAutoDetectEnabled] = useState(true);

  // Active sanctuary projection state
  const [currentProjection, setCurrentProjection] = useState(null);

  // Active church service tracking
  const [activeService, setActiveService] = useState(null);

  // Detected references queue (Human-in-the-loop review)
  const [detections, setDetections] = useState([]);
  const [reviewingState, setReviewingState] = useState({ id: null, action: null });

  // Toast alert
  const [toast, setToast] = useState('');

  // Selected translation for auto-retrieval
  const [defaultTranslation, setDefaultTranslation] = useState('kjv');

  // Manual fallback search
  const [manualQuery, setManualQuery] = useState('');
  const [manualLoading, setManualLoading] = useState(false);

  const processedTranscriptsRef = useRef(new Set());

  // Elapsed service timer
  useEffect(() => {
    const timer = setInterval(() => {
      setServiceSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTimer = (totalSec) => {
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    const pad = (n) => String(n).padStart(2, '0');
    return hrs > 0 ? `${pad(hrs)}:${pad(mins)}:${pad(secs)}` : `${pad(mins)}:${pad(secs)}`;
  };

  // Sync current active projection
  const syncCurrentProjection = useCallback(async () => {
    try {
      const res = await projectionService.getCurrent();
      if (res?.data) {
        setCurrentProjection(res.data);
      }
    } catch (_) { }
  }, []);

  const syncActiveService = useCallback(async () => {
    try {
      const res = await serviceService.getServices({ status: 'in_progress' });
      const active = Array.isArray(res?.data) ? res.data[0] || null : null;
      setActiveService(active);
    } catch (_) {}
  }, []);

  useEffect(() => {
    syncCurrentProjection();
    syncActiveService();

    // Hydrate any pending backend speech detections awaiting operator review
    speechService
      .getPendingDetections(10)
      .then((res) => {
        const items = res?.data || [];
        if (Array.isArray(items) && items.length > 0) {
          setDetections((prev) => {
            const existingRefs = new Set(prev.map((d) => d.reference.toLowerCase()));
            const mapped = items
              .filter((row) => row.detected_reference && !existingRefs.has(row.detected_reference.toLowerCase()))
              .map((row) => ({
                id: `db_${row.id}`,
                detectionId: row.id,
                reference: row.detected_reference,
                transcriptSnippet: row.transcript_snippet || '',
                translation: row.translation_code || 'kjv',
                confidence: typeof row.confidence_score === 'number' ? row.confidence_score : 0.9,
                timestamp: row.created_at
                  ? new Date(row.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  : '',
                passage: row.passage_text
                  ? {
                      reference: row.detected_reference,
                      translation: row.translation_code || 'kjv',
                      text: row.passage_text,
                      verses: row.verses_json || [],
                    }
                  : null,
                loadingPassage: false,
              }));
            return [...prev, ...mapped].slice(0, 10);
          });
        }
      })
      .catch(() => {});

    const handleProjectionUpdated = (e) => {
      if (e.detail) {
        setCurrentProjection(e.detail);
      }
    };

    const handleServiceUpdated = () => {
      syncActiveService();
    };

    window.addEventListener('biblecast:projection_updated', handleProjectionUpdated);
    window.addEventListener('biblecast:service_updated', handleServiceUpdated);
    return () => {
      window.removeEventListener('biblecast:projection_updated', handleProjectionUpdated);
      window.removeEventListener('biblecast:service_updated', handleServiceUpdated);
    };
  }, [syncCurrentProjection, syncActiveService]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  };

  // ─── Scripture Reference Detection Engine ─────────────────────────────────
  const queueDetectedPassage = useCallback(
    (matchedRef, snippet, matchConfidence = 0.95, preResolvedPassage = null, meta = {}) => {
      if (!matchedRef) return;

      const cardId = meta.detectionId ? `db_${meta.detectionId}` : `det_${Date.now()}`;

      setDetections((prev) => {
        const existingIndex = prev.findIndex(
          (d) => d.reference.toLowerCase() === matchedRef.toLowerCase()
        );

        // If card already exists (e.g. optimistic card waiting for backend record/passage), hydrate it
        if (existingIndex !== -1) {
          return prev.map((item, idx) =>
            idx === existingIndex
              ? {
                  ...item,
                  detectionId: meta.detectionId || item.detectionId,
                  matchType: meta.matchType || item.matchType,
                  confidence: matchConfidence ?? item.confidence,
                  passage: preResolvedPassage || item.passage,
                  loadingPassage: preResolvedPassage ? false : item.loadingPassage,
                }
              : item
          );
        }

        const newDetection = {
          id: cardId,
          detectionId: meta.detectionId || null,
          reference: matchedRef,
          transcriptSnippet: snippet,
          translation: defaultTranslation,
          confidence: matchConfidence,
          matchType: meta.matchType || null,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          passage: preResolvedPassage || null,
          loadingPassage: !preResolvedPassage,
        };

        return [newDetection, ...prev].slice(0, 10);
      });
    },
    [defaultTranslation]
  );

  const resolvePassageFallback = useCallback(
    (matchedRef) => {
      bibleService
        .getPassage(matchedRef, defaultTranslation)
        .then((pRes) => {
          setDetections((current) =>
            current.map((item) =>
              item.reference.toLowerCase() === matchedRef.toLowerCase()
                ? { ...item, passage: pRes?.data || item.passage, loadingPassage: false }
                : item
            )
          );
        })
        .catch(() => {
          setDetections((current) =>
            current.map((item) =>
              item.reference.toLowerCase() === matchedRef.toLowerCase()
                ? { ...item, loadingPassage: false }
                : item
            )
          );
        });
    },
    [defaultTranslation]
  );

  const processTranscriptChunk = useCallback(
    async (finalPhrase, fullTranscript) => {
      if (!autoDetectEnabled || !finalPhrase) return;

      const cleaned = finalPhrase.trim();
      if (cleaned.length < 4 || processedTranscriptsRef.current.has(cleaned)) return;
      processedTranscriptsRef.current.add(cleaned);

      // Build candidate windows: latest finalized chunk first, then trailing context window
      // (handles mid-verse pauses where speech recognition splits a verse across two chunks)
      const trailingWindow = (fullTranscript || '').trim().slice(-240).trim();
      const candidateInputs =
        trailingWindow && trailingWindow.length > cleaned.length
          ? [cleaned, trailingWindow]
          : [cleaned];

      try {
        // 1. Fast client-side detection (citations & instant sermon concordance)
        for (const candidateText of candidateInputs) {
          const localMatch = detectPassageFromText(candidateText);
          if (localMatch?.detected && localMatch?.reference) {
            queueDetectedPassage(
              localMatch.reference,
              cleaned,
              localMatch.confidence || 0.98,
              null,
              { matchType: localMatch.matchType || 'citation' }
            );

            // Persist pending detection via backend 6-step workflow and resolve full passage
            speechService
              .processTranscript(candidateText, activeService?.id || null, defaultTranslation)
              .then((res) => {
                const payload = res?.data;
                if (res?.detected && payload?.reference && payload?.passage?.text) {
                  queueDetectedPassage(
                    payload.reference,
                    cleaned,
                    payload.confidence || localMatch.confidence || 0.98,
                    payload.passage,
                    { detectionId: payload.detection_id, matchType: payload.match_type }
                  );
                } else {
                  resolvePassageFallback(localMatch.reference);
                }
              })
              .catch(() => {
                resolvePassageFallback(localMatch.reference);
              });
            return;
          }
        }

        // 2. Backend 6-step pipeline (local DB + concordance + full-text Bible search)
        const queryText = candidateInputs[candidateInputs.length - 1];
        if (queryText.split(/\s+/).length >= 3) {
          const res = await speechService.processTranscript(
            queryText,
            activeService?.id || null,
            defaultTranslation
          );
          const payload = res?.data;
          if (res?.detected && res?.valid !== false && payload?.reference) {
            queueDetectedPassage(
              payload.reference,
              cleaned,
              payload.confidence || 0.9,
              payload.passage?.text ? payload.passage : null,
              { detectionId: payload.detection_id, matchType: payload.match_type }
            );

            if (!payload.passage?.text) {
              resolvePassageFallback(payload.reference);
            }
          }
        }
      } catch (err) {
        console.warn('Scripture reference parse check error:', err);
      }
    },
    [autoDetectEnabled, defaultTranslation, activeService, queueDetectedPassage, resolvePassageFallback]
  );

  // Hook into live audio input & Web Speech API
  const {
    devices,
    selectedDeviceId,
    setSelectedDeviceId,
    refreshDevices,
    isListening,
    toggleListening,
    audioLevel,
    isClipping,
    transcript,
    interimTranscript,
    clearTranscript,
    isSpeechSupported,
    isRecognizing,
    error: audioError,
  } = useAudioInput({
    onTranscript: processTranscriptChunk,
  });

  // ─── Operator Actions (Approval Gate) ──────────────────────────────────────

  // 1. Approve & Project Live to JE Display
  const handleApproveAndProject = async (detection) => {
    if (!detection || reviewingState.id) return;

    setReviewingState({ id: detection.id, action: 'approve' });
    try {
      let passageToProject = detection.passage;

      if (!passageToProject?.text) {
        const res = await bibleService.getPassage(detection.reference, detection.translation);
        passageToProject = res?.data;
      }

      if (!passageToProject?.text) {
        showToast(`Cannot project "${detection.reference}" until passage text is resolved.`);
        return;
      }

      if (detection.detectionId) {
        // Persist operator approval & Projection via SpeechController (avoids duplicate DB records)
        const reviewRes = await speechService.reviewDetection(detection.detectionId, 'approve');
        const serverProjection = reviewRes?.data?.projection;

        const synced = projectionService.syncDisplayLocally({
          reference: serverProjection?.reference || passageToProject.reference,
          translation_code: serverProjection?.translation_code || passageToProject.translation || detection.translation,
          passage_text: serverProjection?.passage_text || passageToProject.text,
          verses_json: serverProjection?.verses_json || passageToProject.verses || [],
          mode: 'voice_detected',
          status: 'projected',
          projected_at: serverProjection?.projected_at,
        });
        setCurrentProjection(synced);
      } else {
        await projectionService.projectScripture({
          reference: passageToProject.reference,
          translation_code: passageToProject.translation || detection.translation,
          passage_text: passageToProject.text,
          verses_json: passageToProject.verses || [],
          service_id: activeService?.id || null,
          mode: 'voice_detected',
        });
        setCurrentProjection({
          reference: passageToProject.reference,
          translation: passageToProject.translation || detection.translation,
          text: passageToProject.text,
          status: 'projected',
        });
      }

      setDetections((prev) => prev.filter((d) => d.id !== detection.id));
      showToast(`"${passageToProject.reference}" approved and LIVE on JE display!`);
    } catch (err) {
      console.error('Failed to project scripture:', err);
      showToast('Failed to approve passage for projection.');
    } finally {
      setReviewingState({ id: null, action: null });
    }
  };

  // 2. Add to Projection Queue
  const handleAddToQueue = async (detection) => {
    try {
      let passage = detection.passage;
      if (!passage) {
        const res = await bibleService.getPassage(detection.reference, detection.translation);
        passage = res?.data;
      }

      if (passage) {
        await queueService.addToQueue(passage);
        showToast(`Added "${passage.reference}" to service queue.`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // 3. Reject Detection (Block False Detection from Projector)
  const handleReject = async (detection) => {
    if (!detection || reviewingState.id) return;

    setReviewingState({ id: detection.id, action: 'reject' });
    try {
      if (detection.detectionId) {
        await speechService.reviewDetection(detection.detectionId, 'reject');
      }
      setDetections((prev) => prev.filter((d) => d.id !== detection.id));
      showToast(`Rejected "${detection.reference}" — blocked from display.`);
    } catch (err) {
      console.warn('Reject detection warning:', err);
      setDetections((prev) => prev.filter((d) => d.id !== detection.id));
    } finally {
      setReviewingState({ id: null, action: null });
    }
  };

  const handleRejectAll = async () => {
    const itemsToReject = detections.filter((d) => d.detectionId);
    setDetections([]);
    showToast('Cleared all pending detections.');

    if (itemsToReject.length > 0) {
      await Promise.allSettled(
        itemsToReject.map((item) => speechService.reviewDetection(item.detectionId, 'reject'))
      );
    }
  };

  // 4. Quick Clear / Blackout
  const handleClearDisplay = async () => {
    await projectionService.clear();
    setCurrentProjection((prev) => (prev ? { ...prev, status: 'cleared' } : null));
    showToast('JE display cleared.');
  };

  const handleBlackoutDisplay = async () => {
    await projectionService.blackout();
    setCurrentProjection((prev) => (prev ? { ...prev, status: 'blackout' } : null));
    showToast('JE display blacked out.');
  };

  // 5. Manual Scripture Lookup
  const handleManualSearch = async (e) => {
    e.preventDefault();
    if (!manualQuery.trim()) return;

    setManualLoading(true);
    try {
      const res = await bibleService.getPassage(manualQuery.trim(), defaultTranslation);
      if (res?.data) {
        // Manual fallback suggestion stays inside Approval Gate until approved
        const newDetection = {
          id: 'manual_' + Date.now(),
          detectionId: null,
          reference: res.data.reference,
          transcriptSnippet: 'Operator manual lookup',
          translation: defaultTranslation,
          confidence: 1.0,
          matchType: 'manual',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          passage: res.data,
          loadingPassage: false,
        };
        setDetections((prev) => [newDetection, ...prev]);
        setManualQuery('');
        showToast(`Found "${res.data.reference}".`);
      }
    } catch (_) {
      showToast('Could not find requested scripture.');
    } finally {
      setManualLoading(false);
    }
  };

  const openProjectorWindow = () => {
    const w = 1280;
    const h = 720;
    const l = window.screen.width ? (window.screen.width - w) / 2 : 100;
    const t = window.screen.height ? (window.screen.height - h) / 2 : 100;
    window.open(
      '/projector',
      'BibleCastProjectorWindow',
      `width=${w},height=${h},left=${l},top=${t},menubar=no,toolbar=no,location=no,status=no,resizable=yes`
    );
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-500 text-slate-950 font-bold px-4 py-2.5 rounded-lg shadow-xl flex items-center gap-2 animate-bounce text-sm">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      {/* Top Banner: Service Session & Live Stage Status */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 flex flex-wrap items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-slate-950 font-black shadow-md shadow-amber-500/20">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold font-serif text-slate-100">
                Live Sanctuary Console
              </h2>
              {activeService ? (
                <span className="flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  {activeService.name}
                </span>
              ) : (
                <Link
                  to="/services"
                  className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 hover:bg-amber-500/20 transition"
                >
                  Start a Service
                </Link>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-2 font-mono">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>Elapsed: {formatTimer(serviceSeconds)}</span>
              <span>&bull;</span>
              <Link to="/services" className="text-amber-400 hover:text-amber-300 inline-flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Manage Services
              </Link>
            </p>
          </div>
        </div>

        {/* Emergency Projection Controls & Projector Window Link */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={openProjectorWindow}
            className="px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 hover:border-amber-500/40 text-xs font-semibold text-slate-300 hover:text-amber-300 transition flex items-center gap-1.5"
            title="Open projector screen in new window"
          >
            <Tv className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Projector Screen</span>
            <ExternalLink className="w-3 h-3 text-slate-500" />
          </button>

          <button
            type="button"
            onClick={handleClearDisplay}
            className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition"
            title="Clear text from projector screen"
          >
            Clear Screen
          </button>

          <button
            type="button"
            onClick={handleBlackoutDisplay}
            className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-rose-950 text-rose-300 text-xs font-semibold border border-slate-700 hover:border-rose-500/30 transition"
            title="Blackout projector screen"
          >
            Blackout
          </button>
        </div>
      </div>

      {/* Audio Ingestion & Controls Section */}
      <AudioControls
        isListening={isListening}
        onToggleListening={toggleListening}
        devices={devices}
        selectedDeviceId={selectedDeviceId}
        onSelectDevice={setSelectedDeviceId}
        onRefreshDevices={refreshDevices}
        audioLevel={audioLevel}
        isClipping={isClipping}
        isSpeechSupported={isSpeechSupported}
        isRecognizing={isRecognizing}
        autoDetectEnabled={autoDetectEnabled}
        onToggleAutoDetect={() => setAutoDetectEnabled(!autoDetectEnabled)}
        onClearTranscript={clearTranscript}
        error={audioError}
      />

      {/* Main Live Workspace: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 cols): Operator Approval Gate & Spoken Audio Stream */}
        <div className="lg:col-span-7 space-y-6">
          {/* Detected Scripture Suggestions Panel (Human-in-the-Loop Gate) */}
          <DetectionSuggestions
            detections={detections}
            onApprove={handleApproveAndProject}
            onReject={handleReject}
            onRejectAll={handleRejectAll}
            onAddToQueue={handleAddToQueue}
            reviewingId={reviewingState.id}
            reviewAction={reviewingState.action}
            defaultTranslation={defaultTranslation}
            onChangeTranslation={setDefaultTranslation}
          >
            {/* Quick Manual Search Bar in Suggestions Panel */}
            <form onSubmit={handleManualSearch} className="pt-2 border-t border-slate-800 flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={manualQuery}
                  onChange={(e) => setManualQuery(e.target.value)}
                  placeholder="Manual lookup (e.g. Psalm 23, Romans 8:28)..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-2 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-amber-500"
                />
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
              </div>
              <button
                type="submit"
                disabled={manualLoading || !manualQuery.trim()}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition disabled:opacity-50"
              >
                {manualLoading ? 'Searching...' : 'Lookup'}
              </button>
            </form>
          </DetectionSuggestions>

          {/* Live Transcript Stream */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <div className="flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-slate-100">
                  Preacher Audio Speech-to-Text Stream
                </h3>
              </div>
              <span className="text-[10px] font-mono text-slate-400">
                {isRecognizing ? 'Real-time Web Speech' : 'Stream Paused'}
              </span>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 min-h-[140px] max-h-[220px] overflow-y-auto space-y-2 font-serif text-sm leading-relaxed">
              {transcript ? (
                <p className="text-slate-300 whitespace-pre-wrap">
                  {transcript}
                  {interimTranscript && (
                    <span className="text-amber-400 font-semibold bg-amber-500/10 px-1 rounded ml-1 animate-pulse">
                      {interimTranscript}
                    </span>
                  )}
                </p>
              ) : interimTranscript ? (
                <p className="text-amber-400 font-semibold bg-amber-500/10 px-1 rounded animate-pulse">
                  {interimTranscript}
                </p>
              ) : (
                <p className="text-slate-600 text-xs italic font-sans pt-6 text-center">
                  {isListening
                    ? 'Listening to preacher audio. Spoken words will stream here continuously...'
                    : 'Audio capture is paused. Click "Start Listening" above to begin real-time speech transcription.'}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Right Column (5 cols): Live JE Display Projector Preview */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Tv className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-slate-100">
                  Live JE Display Screen
                </h3>
              </div>
              <span className="text-[10px] font-mono font-bold uppercase text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                1080p Mirror
              </span>
            </div>

            {/* 16:9 JE Display Simulation */}
            <div className="relative aspect-video bg-slate-950 border border-amber-500/20 rounded-xl p-6 flex flex-col justify-between shadow-2xl overflow-hidden">
              {currentProjection?.status === 'blackout' ? (
                <div className="my-auto text-center space-y-1">
                  <span className="text-xs font-mono font-bold uppercase text-rose-400 tracking-wider">
                    Blackout Mode
                  </span>
                  <p className="text-xs text-slate-500">Display is completely dark</p>
                </div>
              ) : currentProjection?.status === 'projected' ? (
                <>
                  <div className="flex items-center justify-between text-[11px] font-mono text-amber-400">
                    <span className="flex items-center gap-1.5 font-bold uppercase">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      Live on Screen
                    </span>
                    <span className="uppercase text-slate-400">
                      {(currentProjection.translation || 'kjv').toUpperCase()}
                    </span>
                  </div>

                  {/* Centered Scripture Text */}
                  <div className="my-auto text-center px-2">
                    <p className="text-base sm:text-lg font-serif text-slate-100 leading-relaxed drop-shadow line-clamp-4">
                      &ldquo;{currentProjection.text}&rdquo;
                    </p>
                  </div>

                  {/* Reference Citation */}
                  <div className="text-right">
                    <p className="text-sm sm:text-base font-bold font-serif text-amber-300">
                      &mdash; {currentProjection.reference}
                    </p>
                  </div>
                </>
              ) : (
                <div className="my-auto text-center space-y-1">
                  <span className="text-xs font-mono font-bold uppercase text-slate-500 tracking-wider">
                    Screen Blank / Cleared
                  </span>
                  <p className="text-xs text-slate-600">No scripture currently projected</p>
                </div>
              )}
            </div>

            {/* Stage Projection Quick Actions */}
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={handleClearDisplay}
                className="py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition text-center"
              >
                Clear Screen (C)
              </button>
              <button
                type="button"
                onClick={handleBlackoutDisplay}
                className="py-2 px-3 rounded-lg bg-slate-800 hover:bg-rose-950 text-xs font-semibold text-rose-300 border border-slate-700 hover:border-rose-500/30 transition text-center"
              >
                Blackout (B)
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
