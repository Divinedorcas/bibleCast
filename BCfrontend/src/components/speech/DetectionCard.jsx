import React from 'react';
import {
  CheckCircle2,
  XCircle,
  Layers,
  AlertTriangle,
  ShieldAlert,
  BookOpen,
  Loader2,
} from 'lucide-react';

const MATCH_TYPE_LABELS = {
  citation: 'Spoken Citation',
  sermon_concordance: 'Sermon Quote',
  database_passage: 'Saved Match',
  provider_search: 'Text Search',
  manual: 'Manual Lookup',
};

function getConfidenceMeta(rawConfidence) {
  const numeric = typeof rawConfidence === 'number' && !Number.isNaN(rawConfidence)
    ? rawConfidence
    : 0.95;
  const percent = Math.max(0, Math.min(100, Math.round(numeric <= 1 ? numeric * 100 : numeric)));

  if (percent >= 90) {
    return {
      percent,
      label: 'High Confidence',
      badgeClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
      barClass: 'bg-emerald-500',
      cardBorderClass: 'border-amber-500/30 hover:border-amber-500',
      isLow: false,
    };
  }

  if (percent >= 75) {
    return {
      percent,
      label: 'Moderate Confidence',
      badgeClass: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
      barClass: 'bg-amber-500',
      cardBorderClass: 'border-amber-500/40 hover:border-amber-400',
      isLow: false,
    };
  }

  return {
    percent,
    label: 'Low Confidence',
    badgeClass: 'bg-rose-500/15 text-rose-300 border-rose-500/40',
    barClass: 'bg-rose-500',
    cardBorderClass: 'border-rose-500/50 hover:border-rose-400',
    isLow: true,
  };
}

/**
 * DetectionCard
 *
 * Single pending scripture detection card inside the operator approval gate.
 * Displays detected reference, confidence level, retrieved passage, translation,
 * and explicit Approve / Reject actions so false detections never reach the projector.
 */
export function DetectionCard({
  detection,
  onApprove,
  onReject,
  onAddToQueue = null,
  isReviewing = false,
  reviewAction = null,
}) {
  if (!detection) return null;

  const reference = detection.reference || detection.detected_reference || 'Unknown Reference';
  const translation = (
    detection.passage?.translation ||
    detection.translation ||
    detection.translation_code ||
    'kjv'
  ).toUpperCase();
  const translationName = detection.passage?.translation_name || translation;

  const passageText = detection.passage?.text || detection.passage_text || '';
  const isLoadingPassage = Boolean(detection.loadingPassage);
  const snippet = detection.transcriptSnippet || detection.transcript_snippet || '';
  const matchLabel = MATCH_TYPE_LABELS[detection.matchType || detection.match_type] || null;
  const confidence = getConfidenceMeta(detection.confidence ?? detection.confidence_score);

  const canApprove = !isReviewing && !isLoadingPassage && Boolean(passageText.trim());

  return (
    <div
      className={`p-4 bg-slate-950 border rounded-xl space-y-3 shadow-lg transition ${confidence.cardBorderClass}`}
      data-testid="detection-card"
    >
      {/* Header: Detected Reference, Translation Badge, Confidence Level */}
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="space-y-1 min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="text-lg font-serif font-bold text-amber-300">
              {reference}
            </h4>

            <span
              title={translationName}
              className="text-[10px] font-mono uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.5 rounded font-bold"
            >
              {translation}
            </span>

            {matchLabel && (
              <span className="text-[10px] font-mono bg-slate-800 text-slate-300 border border-slate-700 px-1.5 py-0.5 rounded">
                {matchLabel}
              </span>
            )}

            {detection.timestamp && (
              <span className="text-[10px] font-mono text-slate-500">
                {detection.timestamp}
              </span>
            )}
          </div>

          {snippet && (
            <p className="text-xs text-slate-400 font-mono italic truncate" title={snippet}>
              Heard: &ldquo;{snippet}&rdquo;
            </p>
          )}
        </div>

        {/* Confidence Badge + Slim Progress Meter */}
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span
            className={`inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${confidence.badgeClass}`}
          >
            {confidence.isLow && <AlertTriangle className="w-3 h-3" />}
            <span>{confidence.percent}% &bull; {confidence.label}</span>
          </span>
          <div
            className="w-28 h-1 bg-slate-800 rounded-full overflow-hidden"
            aria-label={`Confidence ${confidence.percent}%`}
          >
            <div
              className={`h-full transition-all duration-300 ${confidence.barClass}`}
              style={{ width: `${confidence.percent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Low-Confidence False-Detection Warning */}
      {confidence.isLow && (
        <div className="flex items-center gap-2 text-xs text-rose-300 bg-rose-500/10 border border-rose-500/30 rounded-lg px-3 py-1.5">
          <ShieldAlert className="w-3.5 h-3.5 shrink-0 text-rose-400" />
          <span>Low match confidence — verify scripture text before approving to projector.</span>
        </div>
      )}

      {/* Retrieved Passage Text */}
      {isLoadingPassage ? (
        <div className="text-xs text-slate-400 italic flex items-center gap-2 py-2 px-3 bg-slate-900/60 rounded-lg border border-slate-800">
          <Loader2 className="w-3.5 h-3.5 text-amber-400 animate-spin" />
          <span>Retrieving {translation} passage text...</span>
        </div>
      ) : passageText ? (
        <blockquote className="text-sm text-slate-200 font-serif leading-relaxed italic border-l-2 border-amber-500/50 pl-3 py-1.5 bg-slate-900/60 rounded-r">
          &ldquo;{passageText}&rdquo;
        </blockquote>
      ) : (
        <div className="text-xs text-amber-300/90 flex items-center gap-2 py-2 px-3 bg-amber-500/10 rounded-lg border border-amber-500/30">
          <BookOpen className="w-3.5 h-3.5 shrink-0 text-amber-400" />
          <span>
            Passage text could not be retrieved. Reject this suggestion or verify via manual search.
          </span>
        </div>
      )}

      {/* Operator Gate Actions: Reject / Queue / Approve */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-900">
        <button
          type="button"
          onClick={() => onReject(detection)}
          disabled={isReviewing}
          aria-label={`Reject ${reference}`}
          className="px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 hover:border-rose-500/50 text-xs font-semibold flex items-center gap-1.5 transition disabled:opacity-50"
        >
          {isReviewing && reviewAction === 'reject' ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <XCircle className="w-3.5 h-3.5" />
          )}
          <span>{isReviewing && reviewAction === 'reject' ? 'Rejecting...' : 'Reject'}</span>
        </button>

        <div className="flex items-center gap-2">
          {onAddToQueue && (
            <button
              type="button"
              onClick={() => onAddToQueue(detection)}
              disabled={isReviewing || isLoadingPassage || !passageText.trim()}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition disabled:opacity-50"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Add to Queue</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => onApprove(detection)}
            disabled={!canApprove}
            aria-label={`Approve ${reference}`}
            className="px-4 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition shadow-md shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isReviewing && reviewAction === 'approve' ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <CheckCircle2 className="w-3.5 h-3.5" />
            )}
            <span>
              {isReviewing && reviewAction === 'approve' ? 'Approving...' : 'Approve'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
