import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Radio, 
  Search, 
  Layers, 
  History, 
  Tv, 
  ExternalLink, 
  Clock, 
  LogOut, 
  ShieldCheck, 
  Activity,
  User as UserIcon,
  LayoutDashboard
} from 'lucide-react';

export function DashboardLayout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

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

  const getRoleBadge = (role) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/40';
      case 'presenter':
        return 'bg-sky-500/20 text-sky-300 border-sky-500/40';
      default:
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500/30 selection:text-amber-200">
      {/* Top Media Console Header */}
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-50 px-4 lg:px-6 py-2.5">
        <div className="flex items-center justify-between gap-4">
          {/* Brand Identity */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20 text-slate-950 font-black text-xl">
              ✝
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-lg text-slate-100 tracking-tight leading-none">
                  Bible<span className="text-amber-400">Cast</span>
                </h1>
                <span className="text-[10px] font-mono tracking-wider uppercase px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700/60">
                  Booth v1.0
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 hidden sm:block">
                Sanctuary AI Speech-to-Scripture Operator
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-950/60 p-1 rounded-lg border border-slate-800">
            <NavLink
              to="/dashboard"
              end
              className={({ isActive }) =>
                `px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`
              }
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              Dashboard
            </NavLink>
            <NavLink
              to="/live"
              className={({ isActive }) =>
                `px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`
              }
            >
              <Radio className="w-3.5 h-3.5" />
              Live Console
            </NavLink>
            <NavLink
              to="/search"
              className={({ isActive }) =>
                `px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`
              }
            >
              <Search className="w-3.5 h-3.5" />
              Scripture Search
            </NavLink>
            <NavLink
              to="/queue"
              className={({ isActive }) =>
                `px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`
              }
            >
              <Layers className="w-3.5 h-3.5" />
              Service Queue
            </NavLink>
          </nav>

          {/* Right User & Utility Controls */}
          <div className="flex items-center gap-3">
            {/* Live Clock */}
            <div className="hidden lg:flex items-center gap-1.5 text-xs font-mono text-slate-400 bg-slate-800/60 px-2.5 py-1 rounded border border-slate-700/50">
              <Clock className="w-3 h-3 text-slate-400" />
              <span>{currentTime}</span>
            </div>

            {/* Launch Screen Button */}
            <button
              onClick={openProjectorWindow}
              title="Open Projector Stage Screen in a new window"
              className="px-2.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs rounded-md shadow-md flex items-center gap-1.5 transition active:scale-95"
            >
              <Tv className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Launch Screen</span>
              <ExternalLink className="w-3 h-3 opacity-70" />
            </button>

            {/* User Profile Pill */}
            {user && (
              <div className="flex items-center gap-2 bg-slate-950/80 border border-slate-800 pl-2.5 pr-1.5 py-1 rounded-lg">
                <div className="flex flex-col text-right">
                  <span className="text-xs font-semibold text-slate-200 leading-tight">
                    {user.name}
                  </span>
                  <span className={`text-[10px] font-mono uppercase px-1.5 rounded-full border self-end mt-0.5 ${getRoleBadge(user.role)}`}>
                    {user.role || 'operator'}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  title="Sign out of media booth"
                  className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Body */}
      <main className="flex-1 p-4 lg:p-6 overflow-y-auto">
        <div className="max-w-7xl mx-auto">{children}</div>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900/80 border-t border-slate-800/60 px-4 py-2 text-xs text-slate-500 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Backend Session: Authenticated &bull; Token Active</span>
        </div>
        <div className="flex items-center gap-3">
          <span>Role: <strong className="text-slate-400 uppercase">{user?.role || 'operator'}</strong></span>
          <span>&bull;</span>
          <span>BibleCast v1.0</span>
        </div>
      </footer>
    </div>
  );
}
