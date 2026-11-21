import React, { useState } from 'react';
import { Sidebar } from '../components/common/Sidebar';
import { Header } from '../components/common/Header';

/**
 * DashboardLayout — shell for all authenticated operator pages.
 *
 * Props:
 *   title    – page title passed to Header
 *   children – page content
 */
export function DashboardLayout({ title = 'Dashboard', children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex font-sans selection:bg-amber-500/30 selection:text-amber-200">
      {/* Left Sidebar */}
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Right Content Column */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <Header title={title} onMenuClick={() => setSidebarOpen(true)} />

        {/* Page Body */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <div className="max-w-7xl mx-auto space-y-6">{children}</div>
        </main>

        {/* Footer strip */}
        <footer className="bg-slate-900/80 border-t border-slate-800/60 px-4 py-2 text-[11px] text-slate-500 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Session Active &bull; </span>
          </div>
          <span>BibleCast v1.0 &mdash; JE Media Console</span>
        </footer>
      </div>
    </div>
  );
}
