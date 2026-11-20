import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Radio, 
  Search, 
  Layers, 
  Tv, 
  Shield, 
  UserCheck, 
  Activity, 
  Clock, 
  CheckCircle2, 
  Sparkles,
  ArrowRight
} from 'lucide-react';

export function Dashboard() {
  const { user } = useAuth();

  const openProjectorWindow = () => {
    const width = 1280;
    const height = 720;
    const left = window.screen.width ? (window.screen.width - width) / 2 : 100;
    const top = window.screen.height ? (window.screen.height - height) / 2 : 100;
    window.open(
      '/projector',
      'BibleCastProjectorWindow',
      `width=${width},height=${height},left=${left},top=${top},menubar=no,toolbar=no,location=no,status=no,resizable=yes`
    );
  };

  const getRoleTitle = (role) => {
    switch (role) {
      case 'admin':
        return 'System Administrator';
      case 'presenter':
        return 'Pastor / Service Presenter';
      default:
        return 'Media Booth Operator';
    }
  };

  return (
    <div className="space-y-6">
      {/* Welcome Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/40 border border-slate-800 p-6 lg:p-8 shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-semibold mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Sanctuary Projection Console</span>
            </div>
            <h2 className="text-2xl lg:text-3xl font-bold text-slate-100 tracking-tight">
              Welcome back, <span className="text-amber-400">{user?.name || 'Operator'}</span>
            </h2>
            <p className="text-slate-400 text-sm mt-1.5 max-w-xl">
              You are signed in as <strong className="text-slate-200">{getRoleTitle(user?.role)}</strong>. 
              The live speech-to-scripture engine and presentation modules are ready for service.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={openProjectorWindow}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase tracking-wider px-4 py-3 rounded-lg shadow-lg shadow-amber-500/20 flex items-center gap-2 transition active:scale-98"
            >
              <Tv className="w-4 h-4" />
              <span>Launch Projector Screen</span>
            </button>
          </div>
        </div>

        {/* Subtle background glow */}
        <div className="absolute right-0 top-0 -mt-10 -mr-10 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Main Console Modules Grid */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
          Service Control Modules
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Live Sanctuary Console */}
          <div className="bg-slate-900 border border-slate-800 hover:border-amber-500/40 rounded-xl p-5 shadow-sm transition group flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-3 group-hover:scale-105 transition-transform">
                <Radio className="w-5 h-5" />
              </div>
              <h4 className="font-semibold text-slate-200 text-base">Live Sanctuary Console</h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Stream live preacher speech, verify AI citations with one click, and project passages.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-emerald-400 font-medium">
              <span>Ready for Audio</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 2: Scripture Search */}
          <div className="bg-slate-900 border border-slate-800 hover:border-amber-500/40 rounded-xl p-5 shadow-sm transition group flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 mb-3 group-hover:scale-105 transition-transform">
                <Search className="w-5 h-5" />
              </div>
              <h4 className="font-semibold text-slate-200 text-base">Scripture Lookup</h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Quickly search canonical Bible books across KJV and WEB translations for manual projection.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-sky-400 font-medium">
              <span>Public Bible API</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 3: Service Queue */}
          <div className="bg-slate-900 border border-slate-800 hover:border-amber-500/40 rounded-xl p-5 shadow-sm transition group flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-3 group-hover:scale-105 transition-transform">
                <Layers className="w-5 h-5" />
              </div>
              <h4 className="font-semibold text-slate-200 text-base">Service Queue</h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Pre-plan sermon passages and scriptures in advance of Sunday and midweek worship gatherings.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-purple-400 font-medium">
              <span>Saved Lists</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 4: Stage Projector Output */}
          <div className="bg-slate-900 border border-slate-800 hover:border-amber-500/40 rounded-xl p-5 shadow-sm transition group flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-3 group-hover:scale-105 transition-transform">
                <Tv className="w-5 h-5" />
              </div>
              <h4 className="font-semibold text-slate-200 text-base">Projector Route</h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Dedicated distraction-free stage screen view for extended monitor or video switcher output.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-amber-400 font-medium">
              <span>Fullscreen Stage</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      </div>

      {/* Two Column Layout: User Account Details & System Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Account Details */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800 mb-4">
            <UserCheck className="w-4 h-4 text-amber-400" />
            <h3 className="font-semibold text-sm text-slate-200 uppercase tracking-wider">
              Operator Account Profile
            </h3>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm py-1.5 border-b border-slate-800/60">
              <span className="text-slate-400">Full Name</span>
              <span className="font-medium text-slate-200">{user?.name || 'N/A'}</span>
            </div>
            <div className="flex items-center justify-between text-sm py-1.5 border-b border-slate-800/60">
              <span className="text-slate-400">Registered Email</span>
              <span className="font-medium text-slate-200">{user?.email || 'N/A'}</span>
            </div>
            <div className="flex items-center justify-between text-sm py-1.5 border-b border-slate-800/60">
              <span className="text-slate-400">Church Role</span>
              <span className="font-mono text-xs uppercase px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                {user?.role || 'operator'}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm py-1.5 border-b border-slate-800/60">
              <span className="text-slate-400">Account Status</span>
              <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Active &bull; Verified
              </span>
            </div>
            <div className="flex items-center justify-between text-sm py-1.5">
              <span className="text-slate-400">Security Guard</span>
              <span className="inline-flex items-center gap-1 text-xs text-slate-300">
                <Shield className="w-3.5 h-3.5 text-purple-400" />
                Laravel Sanctum Token
              </span>
            </div>
          </div>
        </div>

        {/* System & API Connectivity Status */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800 mb-4">
            <Activity className="w-4 h-4 text-emerald-400" />
            <h3 className="font-semibold text-sm text-slate-200 uppercase tracking-wider">
              Sanctuary System Status
            </h3>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm py-1.5 border-b border-slate-800/60">
              <span className="text-slate-400">Backend API</span>
              <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                Connected (Laravel v12)
              </span>
            </div>
            <div className="flex items-center justify-between text-sm py-1.5 border-b border-slate-800/60">
              <span className="text-slate-400">Authentication Protocol</span>
              <span className="text-xs font-mono text-slate-300">Bearer Token / REST</span>
            </div>
            <div className="flex items-center justify-between text-sm py-1.5 border-b border-slate-800/60">
              <span className="text-slate-400">Cross-Tab Window Sync</span>
              <span className="text-xs text-slate-300">BroadcastChannel API (Enabled)</span>
            </div>
            <div className="flex items-center justify-between text-sm py-1.5 border-b border-slate-800/60">
              <span className="text-slate-400">Speech Recognition Engine</span>
              <span className="text-xs text-slate-300">Web Speech API (Ready)</span>
            </div>
            <div className="flex items-center justify-between text-sm py-1.5">
              <span className="text-slate-400">Environment</span>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                Local Dev / Booth 1
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
