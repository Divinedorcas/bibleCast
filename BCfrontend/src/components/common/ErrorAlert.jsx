import React from 'react';
import {
  AlertCircle,
  WifiOff,
  ServerCrash,
  ShieldAlert,
  AlertTriangle,
  Info,
  X,
} from 'lucide-react';
import { ERROR_KIND } from '../../utils/errorHandler';

/**
 * ErrorAlert
 *
 * Renders a styled, dismissible alert banner for an AppError.
 * The icon, colour scheme, and label adjust automatically based on
 * the error kind (network / server / auth / validation / client / unknown).
 *
 * Props:
 *   error      – AppError instance from classifyError(), or null/undefined
 *   onDismiss  – Optional callback to clear the error (shows ✕ button)
 *   className  – Extra Tailwind classes for the wrapper div
 *   showFields – Whether to list per-field validation errors (default true)
 */
export function ErrorAlert({ error, onDismiss, className = '', showFields = true }) {
  if (!error) return null;

  const config = getConfig(error.kind);

  return (
    <div
      role="alert"
      className={`rounded-lg border p-3 flex items-start gap-2.5 text-xs animate-in fade-in ${config.wrapper} ${className}`}
    >
      {/* Icon */}
      <config.Icon className={`w-4 h-4 shrink-0 mt-0.5 ${config.icon}`} />

      {/* Body */}
      <div className="flex-1 min-w-0">
        {/* Kind badge + headline */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className={`text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded ${config.badge}`}>
            {config.label}
          </span>
          <span className={config.text}>{error.message}</span>
        </div>

        {/* Per-field validation list (422 only) */}
        {showFields && error.hasFieldErrors && (
          <ul className={`mt-1.5 space-y-0.5 list-disc list-inside ${config.text} opacity-80`}>
            {Object.entries(error.fields).map(([field, msg]) => (
              <li key={field}>
                <span className="font-semibold capitalize">{field.replace(/_/g, ' ')}</span>
                {': '}
                {msg}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Dismiss button */}
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className={`shrink-0 p-0.5 rounded hover:bg-white/10 transition-colors ${config.text}`}
          aria-label="Dismiss error"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}

// ─── Visual config per error kind ────────────────────────────────────────────

function getConfig(kind) {
  switch (kind) {
    case ERROR_KIND.NETWORK:
      return {
        Icon:    WifiOff,
        label:   'No Connection',
        wrapper: 'bg-orange-500/10 border-orange-500/30',
        icon:    'text-orange-400',
        badge:   'bg-orange-500/20 text-orange-300',
        text:    'text-orange-300',
      };

    case ERROR_KIND.SERVER:
      return {
        Icon:    ServerCrash,
        label:   'Server Error',
        wrapper: 'bg-red-500/10 border-red-500/30',
        icon:    'text-red-400',
        badge:   'bg-red-500/20 text-red-300',
        text:    'text-red-300',
      };

    case ERROR_KIND.AUTH:
      return {
        Icon:    ShieldAlert,
        label:   'Unauthorised',
        wrapper: 'bg-amber-500/10 border-amber-500/30',
        icon:    'text-amber-400',
        badge:   'bg-amber-500/20 text-amber-300',
        text:    'text-amber-300',
      };

    case ERROR_KIND.VALIDATION:
      return {
        Icon:    AlertTriangle,
        label:   'Validation',
        wrapper: 'bg-yellow-500/10 border-yellow-500/30',
        icon:    'text-yellow-400',
        badge:   'bg-yellow-500/20 text-yellow-300',
        text:    'text-yellow-300',
      };

    case ERROR_KIND.CLIENT:
      return {
        Icon:    Info,
        label:   'Request Error',
        wrapper: 'bg-sky-500/10 border-sky-500/30',
        icon:    'text-sky-400',
        badge:   'bg-sky-500/20 text-sky-300',
        text:    'text-sky-300',
      };

    default:
      return {
        Icon:    AlertCircle,
        label:   'Error',
        wrapper: 'bg-rose-500/10 border-rose-500/30',
        icon:    'text-rose-400',
        badge:   'bg-rose-500/20 text-rose-300',
        text:    'text-rose-300',
      };
  }
}
