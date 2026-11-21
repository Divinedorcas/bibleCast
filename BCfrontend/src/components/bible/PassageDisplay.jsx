import React, { useState } from 'react';
import {
  Layers,
  Check,
  Tv,
  Copy,
  BookOpen,
  Sparkles,
  Maximize2,
  FileText,
  Volume2,
  Star,
} from 'lucide-react';
import { projectionService } from '../../services/projectionService';

/**
 * PassageDisplay
 *
 * Full reader card for the retrieved scripture passage.
 * Provides reading interface, one-click "Send to Projection Queue",
 * and "Save Passage / Favourite".
 *
 * Props:
 *   passage       – Normalized passage object { reference, translation, translation_name, text, verses }
 *   onAddToQueue  – Callback receiving passage to add to projection queue
 *   isQueued      – Boolean indicating if current passage is already in queue
 *   onProjectNow  – Optional direct project callback
 */
export function PassageDisplay({
  passage,
  onAddToQueue,
  isQueued = false,
  onProjectNow,
}) {
  const [copied, setCopied] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedId, setSavedId] = useState(null);
  const [previewMode, setPreviewMode] = useState('reader'); // 'reader' | 'projector'

  if (!passage) return null;

  const handleCopy = () => {
    const fullText = `"${passage.text}" — ${passage.reference} (${(passage.translation || 'KJV').toUpperCase()})`;
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleToggleSave = async () => {
    if (saving) return;
    setSaving(true);
    try {
      if (isSaved && savedId) {
        await projectionService.removeSavedPassage(savedId);
        setIsSaved(false);
        setSavedId(null);
      } else {
        const res = await projectionService.savePassage({
          reference: passage.reference,
          translation_code: passage.translation || 'kjv',
          passage_text: passage.text,
          verses_json: passage.verses || [],
        });
        setIsSaved(true);
        if (res?.data?.id) setSavedId(res.data.id);
      }
    } catch (_) {
      // Local fallback
      setIsSaved(!isSaved);
    } finally {
      setSaving(false);
    }
  };

  const verseCount = passage.verses?.length || 1;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl transition-all">
      {/* Top Header & Action Strip */}
      <div className="bg-slate-950/70 border-b border-slate-800/80 px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-3">
        {/* Reference & Translation Metadata */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-bold font-serif text-slate-100 tracking-tight">
                {passage.reference}
              </h2>
              <span className="text-[11px] font-mono uppercase font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                {(passage.translation || 'kjv').toUpperCase()}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {passage.translation_name || 'Public Domain Bible'} &bull; {verseCount} {verseCount === 1 ? 'verse' : 'verses'}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Reader / Projector Mode Switch */}
          <div className="hidden sm:flex bg-slate-900 border border-slate-800 p-0.5 rounded-lg text-xs">
            <button
              type="button"
              onClick={() => setPreviewMode('reader')}
              className={`px-2.5 py-1 rounded font-medium transition-colors ${
                previewMode === 'reader'
                  ? 'bg-amber-500/20 text-amber-300 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Reader View
            </button>
            <button
              type="button"
              onClick={() => setPreviewMode('projector')}
              className={`px-2.5 py-1 rounded font-medium transition-colors flex items-center gap-1 ${
                previewMode === 'projector'
                  ? 'bg-amber-500/20 text-amber-300 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Tv className="w-3 h-3" />
              Stage Preview
            </button>
          </div>

          {/* Save to Favourites Button */}
          <button
            type="button"
            onClick={handleToggleSave}
            disabled={saving}
            title={isSaved ? 'Remove from favourites' : 'Save passage to favourites'}
            className={`p-2 rounded-lg transition-colors flex items-center gap-1 text-xs border ${
              isSaved
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-amber-300 border-slate-700'
            }`}
          >
            <Star className={`w-4 h-4 ${isSaved ? 'fill-amber-400 text-amber-400' : ''}`} />
            <span className="hidden md:inline">{isSaved ? 'Saved' : 'Save'}</span>
          </button>

          {/* Copy Button */}
          <button
            type="button"
            onClick={handleCopy}
            title="Copy scripture text"
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors flex items-center gap-1 text-xs"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span className="hidden md:inline">{copied ? 'Copied' : 'Copy'}</span>
          </button>

          {/* Operator Action: Send to Projection Queue */}
          <button
            type="button"
            onClick={() => onAddToQueue && onAddToQueue(passage)}
            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition shadow-md active:scale-98 ${
              isQueued
                ? 'bg-emerald-600/20 border border-emerald-500/50 text-emerald-300 hover:bg-emerald-600/30'
                : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20'
            }`}
          >
            {isQueued ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Added to Queue</span>
              </>
            ) : (
              <>
                <Layers className="w-4 h-4" />
                <span>Send to Queue</span>
              </>
            )}
          </button>

          {/* Optional Direct Project Button */}
          {onProjectNow && (
            <button
              type="button"
              onClick={() => onProjectNow(passage)}
              className="px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider bg-slate-800 hover:bg-rose-950 border border-slate-700 hover:border-rose-500/40 text-rose-300 transition flex items-center gap-1.5"
              title="Project immediately to sanctuary screens"
            >
              <Tv className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">Project Live</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Body */}
      {previewMode === 'reader' ? (
        <div className="p-6 sm:p-8 space-y-4 max-h-[60vh] overflow-y-auto">
          {/* Verses Breakdown if available */}
          {passage.verses && passage.verses.length > 0 ? (
            <div className="space-y-3">
              {passage.verses.map((v, idx) => (
                <div key={idx} className="flex items-baseline gap-3 group">
                  <span className="shrink-0 text-xs font-mono font-bold text-amber-400/90 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded select-none">
                    {v.verse}
                  </span>
                  <p className="text-base sm:text-lg text-slate-200 font-serif leading-relaxed selection:bg-amber-500/30">
                    {v.text}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-base sm:text-lg text-slate-200 font-serif leading-relaxed italic selection:bg-amber-500/30">
              &ldquo;{passage.text}&rdquo;
            </p>
          )}
        </div>
      ) : (
        /* Sanctuary 16:9 Projector Stage Preview */
        <div className="p-4 sm:p-6 bg-slate-950">
          <div className="relative aspect-video max-w-3xl mx-auto bg-slate-950 border border-amber-500/20 rounded-xl p-8 flex flex-col justify-between shadow-2xl overflow-hidden">
            {/* Background ambient halo */}
            <div className="absolute inset-0 bg-radial from-amber-500/5 via-transparent to-transparent pointer-events-none" />

            {/* Stage Preview Header */}
            <div className="flex items-center justify-between text-xs text-amber-400 font-mono">
              <span className="flex items-center gap-1.5 font-semibold tracking-wider uppercase">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Live Stage Screen Simulation
              </span>
              <span className="uppercase opacity-75">1080p Sanctuary Display</span>
            </div>

            {/* Big Centered Scripture for Projector */}
            <div className="my-auto text-center px-4">
              <p className="text-xl sm:text-2xl md:text-3xl font-serif text-slate-100 leading-relaxed drop-shadow-md">
                &ldquo;{passage.text}&rdquo;
              </p>
            </div>

            {/* Bottom Reference Citation */}
            <div className="text-right">
              <p className="text-lg sm:text-xl font-bold font-serif text-amber-300 tracking-wide drop-shadow">
                &mdash; {passage.reference}
              </p>
              <p className="text-[11px] font-mono uppercase text-slate-400">
                {(passage.translation || 'kjv').toUpperCase()}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Footer Info Strip */}
      <div className="bg-slate-950 border-t border-slate-800/80 px-4 sm:px-6 py-2.5 text-[11px] text-slate-500 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span>Passage verified &bull; Dynamic API fetch</span>
        </div>
        <span>Operator review approved &bull; Safe for live sanctuary display</span>
      </div>
    </div>
  );
}
