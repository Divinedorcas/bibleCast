import React, { useState, useEffect, useCallback } from 'react';
import {
  Layers,
  Tv,
  Trash2,
  ArrowUp,
  ArrowDown,
  Plus,
  RefreshCw,
  Search,
  BookOpen,
  CheckCircle2,
  Clock,
  Sparkles,
  AlertCircle,
  X,
  Maximize2,
  ListOrdered,
  Eye,
} from 'lucide-react';
import { queueService } from '../../services/queueService';
import { projectionService } from '../../services/projectionService';
import { bibleService } from '../../services/bibleService';

export function QueueManager({ onProjected }) {
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeProjection, setActiveProjection] = useState(null);
  const [filter, setFilter] = useState('all'); // 'all' | 'pending' | 'projected'
  const [toast, setToast] = useState('');
  const [previewPassage, setPreviewPassage] = useState(null);

  // Add passage modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchRef, setSearchRef] = useState('');
  const [searchTranslation, setSearchTranslation] = useState('kjv');
  const [availableTranslations, setAvailableTranslations] = useState([
    { code: 'kjv', name: 'King James Version' },
    { code: 'web', name: 'World English Bible' },
  ]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchedPassage, setSearchedPassage] = useState(null);
  const [searchError, setSearchError] = useState('');
  const [actionInProgress, setActionInProgress] = useState(null);

  // Load translations for add modal
  useEffect(() => {
    let mounted = true;
    bibleService.getTranslations().then((res) => {
      if (mounted && res?.data && res.data.length > 0) {
        setAvailableTranslations(res.data);
      }
    }).catch(() => {});
    return () => { mounted = false; };
  }, []);

  // Fetch queue items and current projection
  const loadQueue = useCallback(async () => {
    setLoading(true);
    try {
      const items = await queueService.getQueue();
      setQueue(items || []);
    } catch (_) {
      setQueue(queueService.getCachedQueue());
    } finally {
      setLoading(false);
    }
  }, []);

  const loadActiveProjection = useCallback(async () => {
    try {
      const res = await projectionService.getCurrent();
      if (res?.data) {
        setActiveProjection(res.data);
      }
    } catch (_) {}
  }, []);

  useEffect(() => {
    loadQueue();
    loadActiveProjection();

    // Listen for queue updates across windows/tabs
    const handleQueueUpdated = (e) => {
      if (e.detail) {
        setQueue(e.detail);
      } else {
        loadQueue();
      }
    };

    const handleProjectionUpdated = (e) => {
      if (e.detail) {
        setActiveProjection(e.detail);
      }
    };

    window.addEventListener('biblecast:queue_updated', handleQueueUpdated);
    window.addEventListener('biblecast:projection_updated', handleProjectionUpdated);

    return () => {
      window.removeEventListener('biblecast:queue_updated', handleQueueUpdated);
      window.removeEventListener('biblecast:projection_updated', handleProjectionUpdated);
    };
  }, [loadQueue, loadActiveProjection]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  };

  // ─── Actions ───────────────────────────────────────────────────────────────

  // 1. Remove passage
  const handleRemove = async (id, ref) => {
    try {
      setActionInProgress(`delete_${id}`);
      await queueService.removeFromQueue(id);
      showToast(`Removed "${ref}" from queue.`);
    } catch (err) {
      console.error(err);
    } finally {
      setActionInProgress(null);
    }
  };

  // 2. Reorder passages
  const handleMove = async (index, direction) => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= queue.length) return;

    const reordered = [...queue];
    const temp = reordered[index];
    reordered[index] = reordered[targetIndex];
    reordered[targetIndex] = temp;

    setQueue(reordered);
    const orderedIds = reordered.map((item) => item.id);
    await queueService.reorderQueue(orderedIds);
    showToast('Queue order updated.');
  };

  // 3. Project selected passage
  const handleProjectSelected = async (item) => {
    try {
      setActionInProgress(`project_${item.id}`);
      await queueService.projectItem(item.id);
      showToast(`"${item.reference}" is now LIVE on sanctuary screens!`);
      if (onProjected) onProjected(item);
    } catch (err) {
      console.error(err);
    } finally {
      setActionInProgress(null);
    }
  };

  // 4. Clear queue
  const handleClearQueue = async () => {
    if (queue.length === 0) return;
    if (!window.confirm('Are you sure you want to clear the entire projection queue?')) {
      return;
    }
    try {
      setActionInProgress('clear_all');
      await queueService.clearQueue();
      setQueue([]);
      showToast('Projection queue cleared.');
    } catch (err) {
      console.error(err);
    } finally {
      setActionInProgress(null);
    }
  };

  // 5. Add passage lookup & submit
  const handleSearchPassage = async (e) => {
    e?.preventDefault();
    if (!searchRef.trim()) return;

    setSearchLoading(true);
    setSearchError('');
    setSearchedPassage(null);

    try {
      const res = await bibleService.getPassage(searchRef.trim(), searchTranslation);
      if (res?.data) {
        setSearchedPassage(res.data);
      } else {
        setSearchError('Passage could not be found.');
      }
    } catch (err) {
      setSearchError(err?.message || 'Error fetching scripture passage.');
    } finally {
      setSearchLoading(false);
    }
  };

  const handleAddSearchedPassage = async () => {
    if (!searchedPassage) return;
    try {
      setActionInProgress('adding');
      await queueService.addToQueue(searchedPassage);
      showToast(`Added "${searchedPassage.reference}" to queue.`);
      setIsAddModalOpen(false);
      setSearchedPassage(null);
      setSearchRef('');
      loadQueue();
    } catch (err) {
      setSearchError('Failed to add passage to queue.');
    } finally {
      setActionInProgress(null);
    }
  };

  // Filtered queue items
  const filteredQueue = queue.filter((item) => {
    if (filter === 'pending') return item.status === 'pending';
    if (filter === 'projected') return item.status === 'projected';
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-500 text-slate-950 font-bold px-4 py-2.5 rounded-lg shadow-xl flex items-center gap-2 animate-bounce text-sm">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      {/* Action Bar & Stats */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4">
        {/* Left: Summary and Filter Tabs */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-lg">
            <Layers className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-semibold text-slate-200">
              {queue.length} {queue.length === 1 ? 'passage' : 'passages'}
            </span>
          </div>

          {/* Filter Pills */}
          <div className="flex bg-slate-950 border border-slate-800 p-1 rounded-lg text-xs">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 rounded font-medium transition ${
                filter === 'all'
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All ({queue.length})
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`px-3 py-1 rounded font-medium transition ${
                filter === 'pending'
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Pending ({queue.filter((q) => q.status === 'pending').length})
            </button>
            <button
              onClick={() => setFilter('projected')}
              className={`px-3 py-1 rounded font-medium transition ${
                filter === 'projected'
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Projected ({queue.filter((q) => q.status === 'projected').length})
            </button>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={loadQueue}
            disabled={loading}
            title="Refresh queue"
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-amber-400' : ''}`} />
          </button>

          <button
            onClick={handleClearQueue}
            disabled={queue.length === 0 || actionInProgress === 'clear_all'}
            className="px-3 py-2 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 border border-slate-700 hover:border-rose-500/30 transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
            title="Clear entire queue"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Queue</span>
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20 transition flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Add Passage</span>
          </button>
        </div>
      </div>

      {/* Queue Items List */}
      {loading && queue.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center text-slate-500">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-amber-400 mb-3" />
          <p className="text-sm font-medium">Loading projection queue...</p>
        </div>
      ) : filteredQueue.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center text-slate-500">
          <Layers className="w-12 h-12 mx-auto text-slate-700 mb-3" />
          <h3 className="text-base font-semibold text-slate-300 mb-1">
            {filter === 'all'
              ? 'Projection Queue is Empty'
              : `No ${filter} passages found in queue`}
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
            Add scripture passages to the lineup so the media team can project them with 1-click during service.
          </p>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold uppercase tracking-wider rounded-lg transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add First Passage</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredQueue.map((item, index) => {
            const isLiveNow =
              activeProjection &&
              activeProjection.status === 'projected' &&
              activeProjection.reference?.toLowerCase() === item.reference?.toLowerCase() &&
              (activeProjection.translation || 'kjv').toLowerCase() ===
                (item.translation_code || item.translation || 'kjv').toLowerCase();

            return (
              <div
                key={item.id}
                className={`bg-slate-900 border rounded-xl p-4 sm:p-5 transition-all shadow-md group ${
                  isLiveNow
                    ? 'border-amber-500 ring-1 ring-amber-500/50 bg-amber-500/5'
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  {/* Left: Reorder Controls + Reference + Text */}
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    {/* Reorder Buttons (Up / Down) */}
                    <div className="flex flex-col items-center gap-1 shrink-0 bg-slate-950 border border-slate-800/80 p-1 rounded-lg">
                      <button
                        type="button"
                        onClick={() => handleMove(index, 'up')}
                        disabled={index === 0}
                        title="Move Up"
                        className="p-1 rounded text-slate-500 hover:text-amber-400 disabled:opacity-20 disabled:hover:text-slate-500 transition"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-[10px] font-mono font-bold text-slate-400">
                        #{index + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleMove(index, 'down')}
                        disabled={index === queue.length - 1}
                        title="Move Down"
                        className="p-1 rounded text-slate-500 hover:text-amber-400 disabled:opacity-20 disabled:hover:text-slate-500 transition"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Passage Details */}
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base sm:text-lg font-serif font-bold text-slate-100 truncate">
                          {item.reference}
                        </h3>
                        <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                          {(item.translation_code || item.translation || 'kjv').toUpperCase()}
                        </span>

                        {/* Status Badges */}
                        {isLiveNow ? (
                          <span className="flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 animate-pulse">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-ping" />
                            Live on Screen
                          </span>
                        ) : item.status === 'projected' ? (
                          <span className="flex items-center gap-1 text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <CheckCircle2 className="w-3 h-3" />
                            Projected
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                            <Clock className="w-3 h-3" />
                            Pending
                          </span>
                        )}
                      </div>

                      {/* Passage Preview */}
                      <p className="text-xs sm:text-sm text-slate-300 font-serif leading-relaxed line-clamp-2 italic">
                        &ldquo;{item.text || item.passage_preview || item.passage_text}&rdquo;
                      </p>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    {/* Preview Button */}
                    <button
                      type="button"
                      onClick={() => setPreviewPassage(item)}
                      title="Inspect full scripture text"
                      className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                    </button>

                    {/* Delete Item */}
                    <button
                      type="button"
                      onClick={() => handleRemove(item.id, item.reference)}
                      disabled={actionInProgress === `delete_${item.id}`}
                      title="Remove from queue"
                      className="p-2 rounded-lg bg-slate-800 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 border border-slate-700 hover:border-rose-500/30 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    {/* Project Live Button */}
                    <button
                      type="button"
                      onClick={() => handleProjectSelected(item)}
                      disabled={actionInProgress === `project_${item.id}`}
                      className={`px-3.5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition shadow-md ${
                        isLiveNow
                          ? 'bg-rose-600 text-white shadow-rose-600/30 hover:bg-rose-500'
                          : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20'
                      }`}
                    >
                      <Tv className="w-3.5 h-3.5" />
                      <span>{isLiveNow ? 'Re-Project' : 'Project Live'}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Passage Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl relative">
            <button
              onClick={() => {
                setIsAddModalOpen(false);
                setSearchedPassage(null);
                setSearchError('');
              }}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-100">Add Passage to Queue</h3>
                <p className="text-xs text-slate-400">
                  Search a scripture reference to queue for projection.
                </p>
              </div>
            </div>

            {/* Search Input Form */}
            <form onSubmit={handleSearchPassage} className="space-y-3">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={searchRef}
                    onChange={(e) => setSearchRef(e.target.value)}
                    placeholder="e.g. John 3:16, Romans 8:28..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-amber-500"
                    autoFocus
                  />
                  <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
                </div>
                <select
                  value={searchTranslation}
                  onChange={(e) => setSearchTranslation(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5 text-xs font-semibold text-amber-400 focus:outline-none focus:border-amber-500 cursor-pointer"
                >
                  {availableTranslations.map((t) => (
                    <option key={t.code} value={t.code}>
                      {t.code.toUpperCase()}
                    </option>
                  ))}
                </select>
                <button
                  type="submit"
                  disabled={searchLoading || !searchRef.trim()}
                  className="px-4 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold uppercase text-slate-200 transition disabled:opacity-50"
                >
                  {searchLoading ? 'Searching...' : 'Lookup'}
                </button>
              </div>
            </form>

            {searchError && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{searchError}</span>
              </div>
            )}

            {/* Found Scripture Preview */}
            {searchedPassage && (
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-serif font-bold text-slate-100 text-base">
                    {searchedPassage.reference}
                  </h4>
                  <span className="text-[10px] font-mono uppercase bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded font-bold">
                    {(searchedPassage.translation || 'kjv').toUpperCase()}
                  </span>
                </div>
                <p className="text-xs text-slate-300 font-serif line-clamp-4 italic leading-relaxed">
                  &ldquo;{searchedPassage.text}&rdquo;
                </p>
                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={handleAddSearchedPassage}
                    disabled={actionInProgress === 'adding'}
                    className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold uppercase tracking-wider transition flex items-center gap-1.5 shadow-md shadow-amber-500/20"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add to Lineup</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Full Preview Modal */}
      {previewPassage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl relative max-h-[85vh] flex flex-col">
            <button
              onClick={() => setPreviewPassage(null)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-amber-400" />
              <h3 className="text-xl font-serif font-bold text-slate-100">
                {previewPassage.reference}
              </h3>
              <span className="text-xs font-mono uppercase bg-amber-500/10 text-amber-300 border border-amber-500/20 px-2 py-0.5 rounded">
                {(previewPassage.translation_code || previewPassage.translation || 'kjv').toUpperCase()}
              </span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-2 py-2">
              {previewPassage.verses && previewPassage.verses.length > 0 ? (
                previewPassage.verses.map((v, i) => (
                  <div key={i} className="flex items-baseline gap-2 text-sm text-slate-200 font-serif leading-relaxed">
                    <span className="text-xs font-mono font-bold text-amber-400 shrink-0">
                      {v.verse}
                    </span>
                    <p>{v.text}</p>
                  </div>
                ))
              ) : (
                <p className="text-base text-slate-200 font-serif leading-relaxed italic">
                  &ldquo;{previewPassage.text || previewPassage.passage_preview}&rdquo;
                </p>
              )}
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setPreviewPassage(null)}
                className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  handleProjectSelected(previewPassage);
                  setPreviewPassage(null);
                }}
                className="px-4 py-2 rounded-lg bg-amber-500 text-slate-950 text-xs font-bold uppercase tracking-wider hover:bg-amber-400 flex items-center gap-1.5"
              >
                <Tv className="w-3.5 h-3.5" />
                <span>Project Live</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
