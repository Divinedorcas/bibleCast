import React from 'react';

/**
 * ProjectionDisplay
 *
 * Dedicated sanctuary stage screen presentation component.
 * Designed for 1080p / 4K sanctuary projectors and secondary stage displays.
 *
 * Features:
 *   - Bible reference in high-contrast sanctuary gold (#E5C76B)
 *   - Translation tag (KJV, WEB, etc.)
 *   - Large readable serif typography with dynamic text size clamping
 *   - Visual states: projected scripture, cleared screen, blackout
 *
 * Props:
 *   projection – { reference, translation, text, verses, status, mode }
 */
export function ProjectionDisplay({ projection }) {
  const status = projection?.status || 'cleared';
  const text = projection?.text || '';
  const reference = projection?.reference || '';
  const translation = (projection?.translation || 'kjv').toUpperCase();
  const verses = projection?.verses || [];

  // 1. Blackout state: Total screen darkness (no text, no light)
  if (status === 'blackout') {
    return (
      <div className="w-full h-full bg-black flex items-center justify-center select-none" />
    );
  }

  // 2. Cleared state: Soft ambient stage backdrop with watermark
  if (status === 'cleared' || !text) {
    return (
      <div className="relative w-full h-full flex flex-col items-center justify-center bg-[#05080C] text-slate-400 select-none overflow-hidden">
        {/* Soft background ambient gradient */}
        <div className="absolute inset-0 bg-radial from-amber-950/10 via-transparent to-transparent pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center justify-center opacity-40 hover:opacity-70 transition-opacity duration-500">
          <div className="w-16 h-16 rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-center text-amber-400 font-serif text-3xl mb-4 shadow-xl">
            ✝
          </div>
          <h1 className="text-xl sm:text-2xl font-serif text-slate-300 tracking-wider font-light">
            Bible<span className="text-amber-400 font-semibold">Cast</span>
          </h1>
          <p className="text-xs font-mono uppercase tracking-widest text-slate-400 mt-2">
            Sanctuary Stage Display &bull; Standby
          </p>
        </div>
      </div>
    );
  }

  // 3. Dynamic font size computation based on scripture length
  const textLength = text.length;
  let fontSizeClass = 'text-3xl sm:text-4xl md:text-5xl lg:text-6xl';
  let lineHeightClass = 'leading-tight sm:leading-snug';

  if (textLength > 350) {
    fontSizeClass = 'text-2xl sm:text-3xl md:text-4xl lg:text-5xl';
    lineHeightClass = 'leading-snug';
  } else if (textLength > 200) {
    fontSizeClass = 'text-3xl sm:text-4xl md:text-5xl lg:text-5xl';
    lineHeightClass = 'leading-snug';
  } else if (textLength < 80) {
    fontSizeClass = 'text-4xl sm:text-5xl md:text-6xl lg:text-7xl';
    lineHeightClass = 'leading-tight';
  }

  return (
    <div className="relative w-full h-full flex flex-col justify-between bg-[#05080C] text-slate-100 select-none overflow-hidden p-8 sm:p-14 lg:p-20">
      {/* Background ambient lighting */}
      <div className="absolute inset-0 bg-radial from-amber-500/5 via-transparent to-transparent pointer-events-none" />

      {/* Top Banner Strip */}
      <div className="relative z-10 flex items-center justify-between text-xs sm:text-sm font-mono uppercase tracking-widest text-slate-400">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-sm shadow-emerald-400" />
          <span className="text-slate-300 font-semibold">Live Scripture</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-slate-400 font-mono">Translation:</span>
          <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
            {translation}
          </span>
        </div>
      </div>

      {/* Center: Main Scripture Passage (Large readable font) */}
      <main className="relative z-10 my-auto w-full max-w-7xl mx-auto px-4 sm:px-8 text-center flex flex-col justify-center">
        {verses.length > 1 ? (
          /* Multi-verse layout with subtle verse markers */
          <div className="space-y-4 max-h-[70vh] overflow-y-auto no-scrollbar py-2">
            <p className={`font-serif text-slate-50 drop-shadow-lg tracking-wide ${fontSizeClass} ${lineHeightClass}`}>
              {verses.map((v, i) => (
                <span key={i} className="inline">
                  <sup className="text-amber-400/80 font-mono text-sm sm:text-lg md:text-xl font-bold mr-1.5 select-none align-super">
                    [{v.verse}]
                  </sup>
                  <span className="mr-3">{v.text.trim()}</span>
                </span>
              ))}
            </p>
          </div>
        ) : (
          /* Single verse presentation */
          <div className="py-2">
            <p className={`font-serif text-slate-50 drop-shadow-xl tracking-wide ${fontSizeClass} ${lineHeightClass}`}>
              &ldquo;{text.trim()}&rdquo;
            </p>
          </div>
        )}
      </main>

      {/* Bottom: Bible Reference & Translation Citation */}
      <footer className="relative z-10 flex items-end justify-between pt-6 border-t border-slate-800/60">
        <div className="text-[11px] sm:text-xs font-mono text-slate-400 uppercase tracking-widest">
          BibleCast Sanctuary Projection
        </div>

        <div className="text-right">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-serif font-bold text-[#E5C76B] tracking-wider drop-shadow-md">
            &mdash; {reference}
          </h2>
          <p className="text-xs sm:text-sm font-mono uppercase tracking-widest text-slate-400 mt-1 font-semibold">
            Holy Bible &bull; {translation}
          </p>
        </div>
      </footer>
    </div>
  );
}
