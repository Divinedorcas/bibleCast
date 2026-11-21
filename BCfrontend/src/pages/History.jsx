import React, { useState, useEffect } from 'react';
import { projectionService } from '../services/projectionService';
import { bibleService } from '../services/bibleService';
import { ErrorAlert } from '../components/common/ErrorAlert';
import {
  History as HistoryIcon,
  Star,
  Layers,
  Trash2,
  Tv,
  Clock,
  BookOpen,
  CheckCircle2,
  RefreshCw,
  Search,
} from 'lucide-react';

export function History() {
  const [activeTab, setActiveTab] = useState('history'); // 'history' | 'saved'
  const [historyList, setHistoryList] = useState([]);
  const [savedList, setSavedList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterText, setFilterText] = useState('');
  const [notification, setNotification] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [historyRes, savedRes] = await Promise.allSettled([
        projectionService.getHistory(30),
        projectionService.getSavedPassages(),
      ]);

      if (historyRes.status === 'fulfilled' && historyRes.value?.data) {
        setHistoryList(historyRes.value.data);
      }
      if (savedRes.status === 'fulfilled' && savedRes.value?.data) {
        setSavedList(savedRes.value.data);
      }
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRemoveSaved = async (id, ref) => {
    try {
      await projectionService.removeSavedPassage(id);
      setSavedList((prev) => prev.filter((item) => item.id !== id));
      setNotification(`"${ref}" removed from favourites.`);
      setTimeout(() => setNotification(''), 3000);
    } catch (err) {
      setError(err);
    }
  };

  const handleQueuePassage = (item) => {
    try {
      bibleService.addToQueue({
        reference: item.reference,
        translation: item.translation_code || item.translation || 'kjv',
        text: item.passage_text || item.text,
        verses: item.verses_json || item.verses || [],
      });
      setNotification(`"${item.reference}" sent to projection queue!`);
      setTimeout(() => setNotification(''), 3000);
    } catch (err) {
      setError(err);
    }
  };

  const filteredHistory = historyList.filter(
    (h) =>
      h.reference?.toLowerCase().includes(filterText.toLowerCase()) ||
      h.passage_text?.toLowerCase().includes(filterText.toLowerCase())
  );

  const filteredSaved = savedList.filter(
    (s) =>
      s.reference?.toLowerCase().includes(filterText.toLowerCase()) ||
      s.label?.toLowerCase().includes(filterText.toLowerCase()) ||
      s.passage_text?.toLowerCase().includes(filterText.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <HistoryIcon className="w-6 h-6 text-amber-400" />
            Projection History &amp; Favourites
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Review past sanctuary scripture projections and manage saved favourite passages.
          </p>
        </div>

        <button
          onClick={loadData}
          disabled={loading}
          className="self-start sm:self-auto px-3 py-2 bg-slate-900 border border-slate-800 hover:border-amber-500/40 text-slate-300 hover:text-amber-300 rounded-lg text-xs font-semibold flex items-center gap-2 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-amber-400' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 rounded-lg flex items-center gap-2 text-xs font-semibold shadow-lg animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Error Alert */}
      <ErrorAlert error={error} onDismiss={() => setError(null)} />

      {/* Controls Bar: Tabs & Search Filter */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Tab Switcher */}
        <div className="inline-flex bg-slate-900 border border-slate-800 p-1 rounded-xl text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all ${
              activeTab === 'history'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Projection History ({historyList.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('saved')}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all ${
              activeTab === 'saved'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Star className="w-4 h-4" />
            <span>Saved Passages ({savedList.length})</span>
          </button>
        </div>

        {/* Filter Input */}
        <div className="relative sm:w-72">
          <input
            type="text"
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            placeholder="Filter by reference or word..."
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-amber-500 transition-colors"
          />
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
        </div>
      </div>

      {/* Tab 1: Projection History */}
      {activeTab === 'history' && (
        <div className="space-y-3">
          {filteredHistory.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center text-slate-500 space-y-2">
              <Clock className="w-8 h-8 mx-auto text-slate-600" />
              <p className="text-sm font-semibold text-slate-400">No projection history recorded yet.</p>
              <p className="text-xs">Passages projected onto sanctuary screens will appear here.</p>
            </div>
          ) : (
            filteredHistory.map((item) => (
              <div
                key={item.id}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all"
              >
                {/* Reference, Timestamp & Preview */}
                <div className="min-w-0 space-y-1.5 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-base font-bold font-serif text-slate-100">
                      {item.reference}
                    </span>
                    <span className="text-[10px] font-mono uppercase bg-slate-800 text-amber-400 px-1.5 py-0.5 rounded border border-slate-700">
                      {(item.translation_code || 'kjv').toUpperCase()}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">
                      {item.projected_at
                        ? new Date(item.projected_at).toLocaleString()
                        : new Date(item.created_at).toLocaleString()}
                    </span>
                    {item.user && (
                      <span className="text-[10px] text-slate-400 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
                        by {item.user.name}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-300 font-serif line-clamp-2 italic">
                    &ldquo;{item.passage_text}&rdquo;
                  </p>
                </div>

                {/* Quick Action: Send to Queue */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleQueuePassage(item)}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-amber-500/20 text-slate-200 hover:text-amber-300 border border-slate-700 hover:border-amber-500/30 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition active:scale-95"
                  >
                    <Layers className="w-3.5 h-3.5 text-amber-400" />
                    <span>Send to Queue</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 2: Saved Passages / Favourites */}
      {activeTab === 'saved' && (
        <div className="space-y-3">
          {filteredSaved.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center text-slate-500 space-y-2">
              <Star className="w-8 h-8 mx-auto text-slate-600" />
              <p className="text-sm font-semibold text-slate-400">No saved favourite passages yet.</p>
              <p className="text-xs">Click the star button on any scripture in Scripture Search to bookmark it.</p>
            </div>
          ) : (
            filteredSaved.map((item) => (
              <div
                key={item.id}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all"
              >
                {/* Reference, Label & Passage */}
                <div className="min-w-0 space-y-1.5 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400 shrink-0" />
                    <span className="text-base font-bold font-serif text-slate-100">
                      {item.reference}
                    </span>
                    <span className="text-[10px] font-mono uppercase bg-slate-800 text-amber-400 px-1.5 py-0.5 rounded border border-slate-700">
                      {(item.translation_code || 'kjv').toUpperCase()}
                    </span>
                    {item.label && (
                      <span className="text-[10px] text-amber-300 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded font-medium">
                        {item.label}
                      </span>
                    )}
                    <span className="text-[10px] font-mono text-slate-500">
                      Saved {new Date(item.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 font-serif line-clamp-2 italic">
                    &ldquo;{item.passage_text}&rdquo;
                  </p>
                </div>

                {/* Actions: Send to Queue & Remove Favourite */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleQueuePassage(item)}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-amber-500/20 text-slate-200 hover:text-amber-300 border border-slate-700 hover:border-amber-500/30 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition active:scale-95"
                  >
                    <Layers className="w-3.5 h-3.5 text-amber-400" />
                    <span>Send to Queue</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRemoveSaved(item.id, item.reference)}
                    className="p-1.5 bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-slate-700 rounded-lg text-xs transition"
                    title="Remove from favourites"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
