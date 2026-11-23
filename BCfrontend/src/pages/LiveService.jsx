import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAudioInput } from '../hooks/useAudioInput';
import { AudioControls } from '../components/speech/AudioControls';
import { bibleService } from '../services/bibleService';
import { projectionService } from '../services/projectionService';
import { queueService } from '../services/queueService';
import {
  Radio,
  Tv,
  CheckCircle2,
  XCircle,
  Plus,
  AlertCircle,
  Sparkles,
  BookOpen,
  Layers,
  Clock,
  Eye,
  ExternalLink,
  Volume2,
  Trash2,
  Search,
  Check,
} from 'lucide-react';

export function LiveService() {
  // Service elapsed timer
  const [serviceSeconds, setServiceSeconds] = useState(0);

  // Auto-detection setting
  const [autoDetectEnabled, setAutoDetectEnabled] = useState(true);

  // Active sanctuary projection state
  const [currentProjection, setCurrentProjection] = useState(null);

  // Detected references queue (Human-in-the-loop review)
  const [detections, setDetections] = useState([]);

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
    } catch (_) {}
  }, []);

  useEffect(() => {
    syncCurrentProjection();

    const handleProjectionUpdated = (e) => {
      if (e.detail) {
        setCurrentProjection(e.detail);
      }
    };

    window.addEventListener('biblecast:projection_updated', handleProjectionUpdated);
    return () => {
      window.removeEventListener('biblecast:projection_updated', handleProjectionUpdated);
    };
  }, [syncCurrentProjection]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  };

  // ─── Scripture Reference Detection Engine ─────────────────────────────────
  const processTranscriptChunk = useCallback(
    async (finalPhrase, fullTranscript) => {
      if (!autoDetectEnabled || !finalPhrase) return;

      const cleaned = finalPhrase.trim();
      if (cleaned.length < 4 || processedTranscriptsRef.current.has(cleaned)) return;
      processedTranscriptsRef.current.add(cleaned);

      try {
        // Call backend regex and tokenizer parser
        const res = await bibleService.parseReference(cleaned);
        const data = res?.data;

        if (data && data.detected && data.reference) {
          const matchedRef = data.reference;

          // Check if this reference is already in suggestions
          setDetections((prev) => {
            if (prev.some((d) => d.reference.toLowerCase() === matchedRef.toLowerCase())) {
              return prev;
            }

            const newDetection = {
              id: 'det_' + Date.now(),
              reference: matchedRef,
              transcriptSnippet: cleaned,
              translation: defaultTranslation,
              confidence: data.confidence || 0.95,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              passage: null,
              loadingPassage: true,
            };

            // Immediately background-fetch full passage text so it's ready for instant projection
            bibleService
              .getPassage(matchedRef, defaultTranslation)
              .then((pRes) => {
                if (pRes?.data) {
                  setDetections((current) =>
                    current.map((item) =>
                      item.id === newDetection.id
                        ? { ...item, passage: pRes.data, loadingPassage: false }
                        : item
                    )
                  );
                }
              })
              .catch(() => {
                setDetections((current) =>
                  current.map((item) =>
                    item.id === newDetection.id ? { ...item, loadingPassage: false } : item
                  )
                );
              });

            return [newDetection, ...prev].slice(0, 10);
          });
        }
      } catch (err) {
        console.warn('Scripture reference parse check error:', err);
      }
    },
    [autoDetectEnabled, defaultTranslation]
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

  // ─── Operator Actions ──────────────────────────────────────────────────────

  // 1. Approve & Project Live to Sanctuary Screens
  const handleApproveAndProject = async (detection) => {
    try {
      let passageToProject = detection.passage;

      if (!passageToProject) {
        const res = await bibleService.getPassage(detection.reference, detection.translation);
        passageToProject = res?.data;
      }

      if (passageToProject) {
        await projectionService.projectScripture({
          reference: passageToProject.reference,
          translation_code: passageToProject.translation || detection.translation,
          passage_text: passageToProject.text,
          verses_json: passageToProject.verses || [],
          mode: 'voice_detected',
        });
        showToast(`"${passageToProject.reference}" is now LIVE on sanctuary screens!`);
        setCurrentProjection({
          reference: passageToProject.reference,
          translation: passageToProject.translation || detection.translation,
          text: passageToProject.text,
          status: 'projected',
        });
      }
    } catch (err) {
      console.error('Failed to project scripture:', err);
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

  // 3. Dismiss Detection
  const handleDismiss = (id) => {
    setDetections((prev) => prev.filter((d) => d.id !== id));
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
        const newDetection = {
          id: 'manual_' + Date.now(),
          reference: res.data.reference,
          transcriptSnippet: 'Operator manual lookup',
          translation: defaultTranslation,
          confidence: 1.0,
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
              <span className="flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Service Active
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-2 font-mono">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>Elapsed: {formatTimer(serviceSeconds)}</span>
              <span>&bull;</span>
              <span>KJV / WEB Auto-Resolver</span>
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
        {/* Left Column (7 cols): Spoken Audio Stream & Human-in-the-Loop Suggestions */}
        <div className="lg:col-span-7 space-y-6">
          {/* Detected Scripture Suggestions Panel (Human-in-the-Loop Gate) */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-slate-100">
                  Detected Scripture Suggestions
                </h3>
              </div>
              <span className="text-xs font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                {detections.length} pending approval
              </span>
            </div>

            {detections.length === 0 ? (
              <div className="py-10 text-center text-slate-500 space-y-2">
                <BookOpen className="w-10 h-10 mx-auto text-slate-700" />
                <p className="text-sm font-medium text-slate-400">
                  Awaiting spoken scripture references...
                </p>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  When the pastor cites scripture (e.g. &ldquo;Turn to John 3:16&rdquo;), detected passages will appear here for operator approval.
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                {detections.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 bg-slate-950 border border-amber-500/30 rounded-xl space-y-3 shadow-lg hover:border-amber-500 transition"
                  >
                    {/* Header: Reference + Spoken Context */}
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-lg font-serif font-bold text-amber-300">
                            {item.reference}
                          </h4>
                          <span className="text-[10px] font-mono uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.5 rounded font-bold">
                            {(item.passage?.translation || item.translation || 'kjv').toUpperCase()}
                          </span>
                          <span className="text-[10px] font-mono text-slate-500">
                            {item.timestamp}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 font-mono mt-1 italic">
                          Heard: &ldquo;{item.transcriptSnippet}&rdquo;
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDismiss(item.id)}
                        className="text-slate-500 hover:text-rose-400 p-1 rounded transition"
                        title="Dismiss suggestion"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Scripture Preview Body */}
                    {item.passage ? (
                      <p className="text-sm text-slate-200 font-serif leading-relaxed italic border-l-2 border-amber-500/40 pl-3 py-0.5 bg-slate-900/60 rounded-r">
                        &ldquo;{item.passage.text}&rdquo;
                      </p>
                    ) : (
                      <div className="text-xs text-slate-500 italic flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                        <span>Resolving scripture text from Bible provider...</span>
                      </div>
                    )}

                    {/* Operator Action Buttons (Approval Gate) */}
                    <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-900">
                      <button
                        type="button"
                        onClick={() => handleAddToQueue(item)}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition"
                      >
                        <Layers className="w-3.5 h-3.5" />
                        <span>Add to Queue</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleApproveAndProject(item)}
                        className="px-4 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition shadow-md shadow-emerald-500/20 active:scale-98"
                      >
                        <Tv className="w-3.5 h-3.5" />
                        <span>Approve &amp; Project Live</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

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
          </div>

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
