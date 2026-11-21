import React, { useState } from 'react';
import { Search, Sparkles, X, ArrowRight, Loader2 } from 'lucide-react';
import { TranslationSelector } from './TranslationSelector';

const SEARCH_EXAMPLES = [
  { label: 'John 3:16', ref: 'John 3:16' },
  { label: 'Psalm 23', ref: 'Psalm 23' },
  { label: 'Romans 8:28', ref: 'Romans 8:28' },
  { label: 'Genesis 1:1–5', ref: 'Genesis 1:1-5' },
];

/**
 * BibleSearchForm
 *
 * Search input form for Bible references and translations.
 * Includes one-click quick pills for common references.
 *
 * Props:
 *   onSearch            – Callback receiving (reference, translation)
 *   loading             – Boolean indicating active search
 *   translation         – Current translation code
 *   onTranslationChange – Callback for translation change
 */
export function BibleSearchForm({
  onSearch,
  loading = false,
  translation = 'kjv',
  onTranslationChange,
}) {
  const [query, setQuery] = useState('');

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (!query.trim() || loading) return;
    onSearch(query.trim(), translation);
  };

  const handleExampleClick = (ref) => {
    setQuery(ref);
    if (onSearch) {
      onSearch(ref, translation);
    }
  };

  const handleClear = () => {
    setQuery('');
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 shadow-xl">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Main Search Bar Row */}
        <div className="flex flex-col sm:flex-row gap-2.5">
          {/* Reference Input */}
          <div className="relative flex-1">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Enter reference e.g. John 3:16, Psalm 23, Romans 8:28..."
              className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-lg pl-10 pr-9 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-amber-500 transition-colors"
              disabled={loading}
              autoFocus
            />
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
            {query && !loading && (
              <button
                type="button"
                onClick={handleClear}
                className="absolute right-3 top-3 text-slate-500 hover:text-slate-300 transition-colors"
                title="Clear input"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Translation Dropdown */}
          <div className="sm:w-60 shrink-0">
            <TranslationSelector
              value={translation}
              onChange={onTranslationChange}
              disabled={loading}
              className="w-full"
            />
          </div>

          {/* Search Button */}
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-50 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-lg shadow-md shadow-amber-500/20 flex items-center justify-center gap-2 transition active:scale-98 shrink-0"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Fetching...</span>
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                <span>Search Passage</span>
              </>
            )}
          </button>
        </div>

        {/* Example Pills Row */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs">
          <span className="text-slate-500 flex items-center gap-1 mr-1 text-[11px]">
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span>Quick references:</span>
          </span>
          {SEARCH_EXAMPLES.map((ex) => (
            <button
              key={ex.ref}
              type="button"
              onClick={() => handleExampleClick(ex.ref)}
              disabled={loading}
              className="px-2.5 py-1 rounded-md bg-slate-800/80 hover:bg-amber-500/20 hover:text-amber-300 border border-slate-700 hover:border-amber-500/30 text-[11px] font-medium text-slate-300 transition-all active:scale-95 disabled:opacity-50"
            >
              {ex.label}
            </button>
          ))}
        </div>
      </form>
    </div>
  );
}
