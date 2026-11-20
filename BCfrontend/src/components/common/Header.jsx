import React, { useState, useEffect } from 'react';
import { Menu, Clock, Bell } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

/**
 * Header — top bar for the dashboard layout.
 *
 * Props:
 *   title      – page title shown in the bar
 *   onMenuClick – opens the mobile sidebar
 */
export function Header({ title = 'Dashboard', onMenuClick }) {
  const { user } = useAuth();
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <header className="sticky top-0 z-20 bg-slate-950/90 backdrop-blur border-b border-slate-800 px-4 lg:px-6 py-3 flex items-center justify-between gap-4">
      {/* Left: hamburger (mobile) + page title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-md transition-colors"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <h2 className="text-sm font-semibold text-slate-200 tracking-tight">{title}</h2>
      </div>

      {/* Right: live clock + greeting */}
      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-1.5 text-xs font-mono text-slate-400 bg-slate-800/60 px-2.5 py-1 rounded border border-slate-700/50">
          <Clock className="w-3 h-3" />
          <span>{currentTime}</span>
        </div>

        <div className="hidden md:flex items-center gap-2 text-xs text-slate-400">
          <span>Service:</span>
          <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Live
          </span>
        </div>
      </div>
    </header>
  );
}
