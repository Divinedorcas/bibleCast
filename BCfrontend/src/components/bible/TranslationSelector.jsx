import React, { useEffect, useState } from 'react';
import { bibleService } from '../../services/bibleService';
import { Globe, Loader2 } from 'lucide-react';

const FALLBACK_TRANSLATIONS = [
  { code: 'kjv', name: 'King James Version', is_default: true },
  { code: 'web', name: 'World English Bible', is_default: false },
  { code: 'bbe', name: 'Bible in Basic English', is_default: false },
  { code: 'oeb-cw', name: 'Open English Bible (Commonwealth)', is_default: false },
  { code: 'webbe', name: 'World English Bible (British)', is_default: false },
];

/**
 * TranslationSelector
 *
 * Dropdown selector for available Bible translations.
 * Automatically fetches active translations from backend database or bible-api.com.
 *
 * Props:
 *   value       – Selected translation code (e.g. 'kjv')
 *   onChange    – Callback receiving new translation code
 *   disabled    – Boolean flag
 *   className   – Optional styling overrides
 */
export function TranslationSelector({
  value = 'kjv',
  onChange,
  disabled = false,
  className = '',
}) {
  const [translations, setTranslations] = useState(FALLBACK_TRANSLATIONS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    bibleService
      .getTranslations()
      .then((res) => {
        if (!isMounted) return;
        const list = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
        if (list.length > 0) {
          setTranslations(list);
          // If current value is not in fetched list, switch to default
          const hasCurrent = list.some((t) => t.code === value);
          if (!hasCurrent) {
            const def = list.find((t) => t.is_default) || list[0];
            if (def && onChange) onChange(def.code);
          }
        }
      })
      .catch(() => {
        // Fallback list already populated in state
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className={`relative inline-flex items-center ${className}`}>
      <select
        value={value}
        onChange={(e) => onChange && onChange(e.target.value)}
        disabled={disabled || loading}
        className="w-full appearance-none bg-slate-900 border border-slate-700 hover:border-slate-600 focus:border-amber-500 rounded-lg pl-9 pr-8 py-2 text-xs font-semibold text-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-500 transition-colors disabled:opacity-50 cursor-pointer"
        aria-label="Select Bible Translation"
      >
        {translations.map((t) => (
          <option key={t.code} value={t.code} className="bg-slate-900 text-slate-200">
            {t.code.toUpperCase()} &mdash; {t.name}
          </option>
        ))}
      </select>
      <div className="absolute left-2.5 pointer-events-none text-slate-400">
        {loading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
        ) : (
          <Globe className="w-3.5 h-3.5 text-amber-400/80" />
        )}
      </div>
      <div className="absolute right-2.5 pointer-events-none text-slate-500 text-[10px]">
        ▼
      </div>
    </div>
  );
}
