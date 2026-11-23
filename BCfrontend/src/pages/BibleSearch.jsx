import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BibleSearchForm } from '../components/bible/BibleSearchForm';
import { PassageDisplay } from '../components/bible/PassageDisplay';
import { ErrorAlert } from '../components/common/ErrorAlert';
import { bibleService } from '../services/bibleService';
import { projectionService } from '../services/projectionService';
import { queueService } from '../services/queueService';
import {
  BookOpen,
  Layers,
  Clock,
  Sparkles,
  Trash2,
  Tv,
  ExternalLink,
  CheckCircle2,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';

export function BibleSearch() {
  const [translation, setTranslation] = useState('kjv');
  const [passage, setPassage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [queue, setQueue] = useState(() => bibleService.getQueue());
  const [recentSearches, setRecentSearches] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('biblecast_recent_searches') || '[]');
    } catch (_) {
      return [];
    }
  });
  const [toastMessage, setToastMessage] = useState('');

  // Synchronize queue state
  useEffect(() => {
    const handleQueueUpdate = (e) => {
      setQueue(e.detail || bibleService.getQueue());
    };

    window.addEventListener('biblecast:queue_updated', handleQueueUpdate);
    return () => window.removeEventListener('biblecast:queue_updated', handleQueueUpdate);
  }, []);

  // Save recent search
  const recordRecentSearch = (ref, trans) => {
    try {
      const entry = { reference: ref, translation: trans, timestamp: Date.now() };
      const filtered = recentSearches.filter(
        (s) => !(s.reference.toLowerCase() === ref.toLowerCase() && s.translation === trans)
      );
      const updated = [entry, ...filtered].slice(0, 6);
      setRecentSearches(updated);
      localStorage.setItem('biblecast_recent_searches', JSON.stringify(updated));
    } catch (_) {}
  };

  /**
   * Step 1 & 2 & 3: Retrieve the passage
   */
  const handleSearch = async (reference, selectedTranslation = translation) => {
    if (!reference?.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const response = await bibleService.getPassage(reference.trim(), selectedTranslation);
      if (response && response.data) {
        setPassage(response.data);
        recordRecentSearch(reference.trim(), selectedTranslation);
      } else {
        throw new Error('No passage returned.');
      }
    } catch (err) {
      setError(err);
      setPassage(null);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Step 5: Send passage to the projection queue
   */
  const handleAddToQueue = (passageToQueue) => {
    if (!passageToQueue) return;

    try {
      bibleService.addToQueue(passageToQueue);
      setToastMessage(`"${passageToQueue.reference}" added to projection queue!`);
      setTimeout(() => setToastMessage(''), 3500);
    } catch (err) {
      setError(err);
    }
  };

  /**
   * Live Project directly to sanctuary screen
   */
  const handleProjectNow = async (passageToProject) => {
    if (!passageToProject) return;

    try {
      await projectionService.projectScripture(passageToProject);
      setToastMessage(`"${passageToProject.reference}" is now LIVE on sanctuary screens!`);
      setTimeout(() => setToastMessage(''), 3500);
    } catch (err) {
      setError(err);
    }
  };

  const handleRemoveFromQueue = (id) => {
    queueService.removeFromQueue(id);
  };

  const handleProjectFromQueue = async (item) => {
    try {
      await queueService.projectItem(item.id);
      setToastMessage(`"${item.reference}" is now LIVE on sanctuary screens!`);
      setTimeout(() => setToastMessage(''), 3500);
    } catch (err) {
      setError(err);
    }
  };

  const handleMoveQueueItem = async (index, direction) => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= queue.length) return;

    const reordered = [...queue];
    const temp = reordered[index];
    reordered[index] = reordered[targetIndex];
    reordered[targetIndex] = temp;

    setQueue(reordered);
    await queueService.reorderQueue(reordered.map((i) => i.id));
  };

  const handleClearQueue = async () => {
    if (queue.length === 0) return;
    if (window.confirm('Clear all passages from the projection queue?')) {
      await queueService.clearQueue();
      setQueue([]);
      setToastMessage('Projection queue cleared.');
      setTimeout(() => setToastMessage(''), 3000);
    }
  };

  const isCurrentPassageQueued = Boolean(
    passage &&
      queue.some(
        (q) =>
          q.reference.toLowerCase() === passage.reference.toLowerCase() &&
          q.translation?.toLowerCase() === passage.translation?.toLowerCase()
      )
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-amber-400" />
            Scripture Search &amp; Preparation
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Look up passages across public-domain translations and send them directly to the sanctuary projection queue.
          </p>
        </div>

        {/* Live Queue Counter Pill */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 self-start sm:self-auto">
          <Layers className="w-4 h-4 text-amber-400" />
          <span>Queue Count:</span>
          <span className="font-bold font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
            {queue.length}
          </span>
        </div>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 rounded-lg flex items-center gap-2 text-xs font-semibold shadow-lg animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Step 1 & 2: Search Form with Translation Selector */}
      <BibleSearchForm
        onSearch={handleSearch}
        loading={loading}
        translation={translation}
        onTranslationChange={setTranslation}
      />

      {/* Error Alert Display */}
      <ErrorAlert error={error} onDismiss={() => setError(null)} />

      {/* Grid: Main Passage Reader / Display + Sidebar Queue Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column (2 cols): Passage Display (Step 4 & 5) */}
        <div className="lg:col-span-2 space-y-4">
          {passage ? (
            <PassageDisplay
              passage={passage}
              onAddToQueue={handleAddToQueue}
              isQueued={isCurrentPassageQueued}
              onProjectNow={handleProjectNow}
            />
          ) : (
            /* Empty State Hero */
            <div className="bg-slate-900/50 border border-slate-800/80 rounded-xl p-10 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mx-auto">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold text-slate-200">
                Ready to Search Scripture
              </h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Type any book, chapter, and verse above (e.g. <span className="text-amber-300 font-serif">Romans 8:28</span> or <span className="text-amber-300 font-serif">Genesis 1:1–5</span>) or click one of the quick reference pills to retrieve and review before projecting.
              </p>
            </div>
          )}

          {/* Recent Searches */}
          {recentSearches.length > 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-3">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                Recent Reference Lookups
              </h3>
              <div className="flex flex-wrap gap-2">
                {recentSearches.map((s, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setTranslation(s.translation);
                      handleSearch(s.reference, s.translation);
                    }}
                    className="px-2.5 py-1 rounded bg-slate-950 border border-slate-800 hover:border-amber-500/40 text-xs text-slate-300 hover:text-amber-300 flex items-center gap-1.5 transition-colors"
                  >
                    <span className="font-serif">{s.reference}</span>
                    <span className="text-[10px] uppercase font-mono text-slate-500 bg-slate-800 px-1 py-0.2 rounded">
                      {s.translation.toUpperCase()}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column (1 col): Projection Queue Widget */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-bold text-slate-100">Projection Queue</h3>
            </div>
            <div className="flex items-center gap-2">
              <Link
                to="/queue"
                className="text-[11px] text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1"
                title="Open full queue manager"
              >
                <span>Manage</span>
                <ExternalLink className="w-3 h-3" />
              </Link>
              {queue.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearQueue}
                  className="text-[11px] text-slate-500 hover:text-rose-400 transition"
                  title="Clear all"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {queue.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">
              <p>Queue is empty.</p>
              <p className="text-[11px] text-slate-600 mt-1">
                Passages you send to the queue will appear here for the media operator.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[550px] overflow-y-auto pr-1">
              {queue.map((item, index) => (
                <div
                  key={item.id}
                  className="p-3 bg-slate-950 border border-slate-800 rounded-lg group hover:border-amber-500/30 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {/* Quick Up/Down arrows */}
                        <div className="inline-flex items-center gap-0.5">
                          <button
                            type="button"
                            onClick={() => handleMoveQueueItem(index, 'up')}
                            disabled={index === 0}
                            className="text-slate-600 hover:text-amber-400 disabled:opacity-20 p-0.5"
                            title="Move Up"
                          >
                            <ArrowUp className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveQueueItem(index, 'down')}
                            disabled={index === queue.length - 1}
                            className="text-slate-600 hover:text-amber-400 disabled:opacity-20 p-0.5"
                            title="Move Down"
                          >
                            <ArrowDown className="w-3 h-3" />
                          </button>
                        </div>
                        <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded">
                          #{index + 1}
                        </span>
                        <h4 className="text-xs font-bold font-serif text-slate-200 truncate">
                          {item.reference}
                        </h4>
                        <span className="text-[9px] uppercase font-mono text-slate-400 bg-slate-800 px-1 py-0.5 rounded">
                          {(item.translation_code || item.translation || 'kjv').toUpperCase()}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 font-serif line-clamp-2 mt-1.5 italic">
                        &ldquo;{item.text || item.passage_preview}&rdquo;
                      </p>
                    </div>

                    <div className="flex items-center gap-1 shrink-0 pt-0.5">
                      {/* Project live button */}
                      <button
                        type="button"
                        onClick={() => handleProjectFromQueue(item)}
                        className="p-1 rounded bg-slate-800 hover:bg-amber-500 text-slate-400 hover:text-slate-950 transition-colors"
                        title="Project Live"
                      >
                        <Tv className="w-3.5 h-3.5" />
                      </button>

                      {/* Remove button */}
                      <button
                        type="button"
                        onClick={() => handleRemoveFromQueue(item.id)}
                        className="text-slate-600 hover:text-rose-400 p-1 rounded transition-colors"
                        title="Remove from queue"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
