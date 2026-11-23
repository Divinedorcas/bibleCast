import React, { useState, useEffect } from 'react';
import { Maximize2, Minimize2, EyeOff, XCircle, Sparkles } from 'lucide-react';

/**
 * ProjectorLayout
 *
 * Full-screen presentation container for JE displays.
 * Includes auto-hiding cursor and subtle floating controls for media operators.
 */
export function ProjectorLayout({ children, onBlackout, onClear, isBlackout = false }) {
  const [isFullscreen, setIsFullscreen] = useState(Boolean(document.fullscreenElement));
  const [showControls, setShowControls] = useState(false);

  // Monitor fullscreen change events
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Auto-hide controls and cursor after 3 seconds of inactivity
  useEffect(() => {
    let timer;

    const handleMouseMove = () => {
      setShowControls(true);
      clearTimeout(timer);
      timer = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      clearTimeout(timer);
    };
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.warn('Fullscreen request failed:', err);
    }
  };

  return (
    <div
      className={`fixed inset-0 w-screen h-screen bg-[#05080C] overflow-hidden select-none ${
        showControls ? 'cursor-default' : 'cursor-none'
      }`}
    >
      {/* Main JE Display Content */}
      <div className="w-full h-full flex flex-col justify-center items-center">
        {children}
      </div>

      {/* Floating Operator Controls (Visible only on mouse activity) */}
      <div
        className={`fixed top-4 right-4 z-50 flex items-center gap-2 bg-slate-900/80 hover:bg-slate-900 backdrop-blur-md border border-slate-800 rounded-xl p-1.5 shadow-2xl transition-all duration-300 ${
          showControls ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'
        }`}
      >
        {/* Blackout Toggle Button */}
        {onBlackout && (
          <button
            type="button"
            onClick={onBlackout}
            title={isBlackout ? 'Restore screen (B)' : 'Blackout screen (B)'}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              isBlackout
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <EyeOff className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{isBlackout ? 'Blackout ON' : 'Blackout'}</span>
          </button>
        )}

        {/* Clear Screen Button */}
        {onClear && (
          <button
            type="button"
            onClick={onClear}
            title="Clear scripture text (C)"
            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-rose-400 hover:bg-slate-800 flex items-center gap-1.5 transition-colors"
          >
            <XCircle className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Clear</span>
          </button>
        )}

        {/* Fullscreen Toggle Button */}
        <button
          type="button"
          onClick={toggleFullscreen}
          title={isFullscreen ? 'Exit Fullscreen (F)' : 'Enter Fullscreen (F)'}
          className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-slate-800 transition-colors"
          aria-label="Toggle Fullscreen"
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}
