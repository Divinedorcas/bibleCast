import React from 'react';

/**
 * Card — reusable dark panel container
 *
 * Props:
 *   className   – extra Tailwind classes
 *   header      – optional JSX rendered in a styled header row
 *   icon        – Lucide icon element shown in the header
 *   title       – string title shown in the header
 *   action      – optional JSX rendered to the right of the header (e.g. a link)
 *   noPadding   – skip default inner padding (useful for tables / full-bleed content)
 *   children    – body content
 */
export function Card({ className = '', header, icon, title, action, noPadding = false, children }) {
  const hasHeader = header || icon || title;

  return (
    <div className={`bg-slate-900 border border-slate-800 rounded-xl shadow-sm ${className}`}>
      {hasHeader && (
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800">
          <div className="flex items-center gap-2">
            {icon && <span className="text-amber-400">{icon}</span>}
            {title && (
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                {title}
              </h3>
            )}
            {header}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      <div className={noPadding ? '' : 'p-5'}>{children}</div>
    </div>
  );
}
