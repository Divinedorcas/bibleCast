import React from 'react';
import { Sparkles, ShieldCheck, BookOpen, Trash2 } from 'lucide-react';
import { DetectionCard } from './DetectionCard';

const TRANSLATION_OPTIONS = [
  { code: 'kjv', label: 'KJV' },
  { code: 'web', label: 'WEB' },
  { code: 'bbe', label: 'BBE' },
];

/**
 * DetectionSuggestions
 *
 * Operator approval queue (human-in-the-loop gate) for speech-detected Bible references.
 * Ensures false detections never reach the live sanctuary projector without explicit review.
 */
export function DetectionSuggestions({
  detections = [],
  onApprove,
  onReject,
  onRejectAll = null,
  onAddToQueue = null,
  reviewingId = null,
  reviewAction = null,
  defaultTranslation = 'kjv',
  onChangeTranslation = null,
  children = null,
}) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
      {/* Header: Title, Safety Gate Badge, Translation Toggle, Pending Count */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-100">
                Detected Scripture Suggestions
              </h3>
              <span
                className="hidden sm:inline-flex items-center gap-1 text-[10px] font-mono font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded"
                title="Passages require operator approval before reaching the projector"
              >
                <ShieldCheck className="w-3 h-3" />
                Approval Gate
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onChangeTranslation && (
            <select
              aria-label="Default detection translation"
              value={defaultTranslation}
              onChange={(e) => onChangeTranslation(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-xs font-mono text-amber-300 rounded px-2 py-1 focus:outline-none focus:border-amber-500"
            >
              {TRANSLATION_OPTIONS.map((t) => (
                <option key={t.code} value={t.code}>
                  {t.label}
                </option>
              ))}
            </select>
          )}

          <span className="text-xs font-mono text-slate-400 bg-slate-950 px-2 py-1 rounded border border-slate-800">
            {detections.length} pending approval
          </span>

          {onRejectAll && detections.length > 1 && (
            <button
              type="button"
              onClick={onRejectAll}
              className="text-xs text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 px-2 py-1 rounded flex items-center gap-1 transition"
              title="Reject all pending suggestions"
            >
              <Trash2 className="w-3 h-3" />
              <span className="hidden sm:inline">Reject All</span>
            </button>
          )}
        </div>
      </div>

      {/* Pending Detection List or Empty State */}
      {detections.length === 0 ? (
        <div className="py-10 text-center text-slate-500 space-y-2">
          <BookOpen className="w-10 h-10 mx-auto text-slate-700" />
          <p className="text-sm font-medium text-slate-400">
            Awaiting spoken scripture references...
          </p>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Nothing reaches the projector automatically. Spoken citations and sermon quotes will wait here for your explicit approval or rejection.
          </p>
        </div>
      ) : (
        <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
          {detections.map((item) => {
            const isItemReviewing = reviewingId !== null && reviewingId === item.id;
            return (
              <DetectionCard
                key={item.id}
                detection={item}
                onApprove={onApprove}
                onReject={onReject}
                onAddToQueue={onAddToQueue}
                isReviewing={isItemReviewing}
                reviewAction={isItemReviewing ? reviewAction : null}
              />
            );
          })}
        </div>
      )}

      {/* Optional Footer Slot (e.g. Manual Lookup Fallback) */}
      {children}
    </div>
  );
}
