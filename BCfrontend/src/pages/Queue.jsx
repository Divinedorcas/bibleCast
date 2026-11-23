import React, { useState } from 'react';
import { QueueManager } from '../components/queue/QueueManager';
import { Layers, Tv, Radio, BookOpen, ExternalLink } from 'lucide-react';

export function Queue() {
  const [lastProjected, setLastProjected] = useState(null);

  const openProjectorWindow = () => {
    const w = 1280;
    const h = 720;
    const l = window.screen.width ? (window.screen.width - w) / 2 : 100;
    const t = window.screen.height ? (window.screen.height - h) / 2 : 100;
    window.open(
      '/projector',
      'BibleCastProjectorWindow',
      `width=${w},height=${h},left=${l},top=${t},menubar=no,toolbar=no,location=no,status=no,resizable=yes`
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-amber-500/10 via-slate-900 to-slate-900 border border-amber-500/20 rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl">
        <div className="space-y-2 max-w-xl">
          <div className="flex items-center gap-2 text-amber-400 font-mono text-xs uppercase tracking-wider font-semibold">
            <Layers className="w-4 h-4" />
            <span>Service Projection Lineup</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-slate-100">
            Scripture Projection Queue
          </h1>
          <p className="text-sm text-slate-400 leading-relaxed">
            Manage your service scripture order. Add passages in advance, reorder sequence on the fly, and project selected scriptures to sanctuary displays with 1 click.
          </p>
        </div>

        {/* Quick Launch Sanctuary Display */}
        <div className="shrink-0 flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={openProjectorWindow}
            className="px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-amber-500/40 text-xs font-bold text-slate-200 hover:text-amber-300 transition flex items-center gap-2 shadow-lg group"
          >
            <Tv className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
            <span>Open Projector Window</span>
            <ExternalLink className="w-3 h-3 text-slate-500" />
          </button>
        </div>
      </div>

      {/* Main Queue Management Interface */}
      <QueueManager onProjected={(item) => setLastProjected(item)} />
    </div>
  );
}
