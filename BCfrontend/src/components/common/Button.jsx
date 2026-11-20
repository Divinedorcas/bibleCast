import React from 'react';
import { Loader2 } from 'lucide-react';

/**
 * Button — themed button with variants and optional loading state
 *
 * Props:
 *   variant   – 'primary' | 'secondary' | 'danger' | 'ghost' | 'success'
 *   size      – 'xs' | 'sm' | 'md' | 'lg'
 *   loading   – show spinner and disable interaction
 *   icon      – Lucide icon element rendered before label
 *   iconRight – Lucide icon element rendered after label
 *   className – extra Tailwind classes
 *   ...rest   – forwarded to <button>
 */
export function Button({
  variant = 'primary',
  size = 'sm',
  loading = false,
  icon,
  iconRight,
  className = '',
  children,
  disabled,
  ...rest
}) {
  const baseStyles =
    'inline-flex items-center justify-center gap-2 font-semibold rounded-lg transition-all active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 disabled:opacity-50 disabled:pointer-events-none';

  const variants = {
    primary:
      'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-md shadow-amber-500/20 focus-visible:ring-amber-500',
    secondary:
      'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-slate-600 focus-visible:ring-slate-500',
    danger:
      'bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-900/20 focus-visible:ring-rose-500',
    success:
      'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-900/20 focus-visible:ring-emerald-500',
    ghost:
      'bg-transparent hover:bg-slate-800 text-slate-300 hover:text-slate-100 focus-visible:ring-slate-500',
  };

  const sizes = {
    xs: 'text-[11px] px-2.5 py-1',
    sm: 'text-xs px-3 py-1.5 uppercase tracking-wider',
    md: 'text-sm px-4 py-2',
    lg: 'text-sm px-5 py-2.5',
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
      ) : (
        icon && <span className="shrink-0">{icon}</span>
      )}
      {children}
      {!loading && iconRight && <span className="shrink-0">{iconRight}</span>}
    </button>
  );
}
