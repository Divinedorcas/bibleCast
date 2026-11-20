import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Radio,
  Search,
  Layers,
  History,
  Settings,
  Tv,
  LogOut,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const NAV_ITEMS = [
  { to: '/dashboard', icon: <LayoutDashboard className="w-4 h-4" />, label: 'Dashboard' },
  { to: '/live', icon: <Radio className="w-4 h-4" />, label: 'Live Console' },
  { to: '/search', icon: <Search className="w-4 h-4" />, label: 'Scripture Search' },
  { to: '/queue', icon: <Layers className="w-4 h-4" />, label: 'Service Queue' },
  { to: '/history', icon: <History className="w-4 h-4" />, label: 'History' },
  { to: '/settings', icon: <Settings className="w-4 h-4" />, label: 'Settings' },
];

const getRoleBadge = (role) => {
  switch (role) {
    case 'admin':
      return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
    case 'presenter':
      return 'bg-sky-500/20 text-sky-300 border-sky-500/30';
    default:
      return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
  }
};

/**
 * Sidebar — left navigation panel.
 *
 * Props:
 *   open     – whether the sidebar is visible (mobile)
 *   onClose  – callback to close the sidebar on mobile overlay click
 */
export function Sidebar({ open = true, onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const openProjector = () => {
    const w = 1280, h = 720;
    const l = window.screen.width ? (window.screen.width - w) / 2 : 100;
    const t = window.screen.height ? (window.screen.height - h) / 2 : 100;
    window.open(
      '/projector',
      'BibleCastProjectorWindow',
      `width=${w},height=${h},left=${l},top=${t},menubar=no,toolbar=no,location=no,status=no,resizable=yes`
    );
  };

  return (
    <>
      {/* Mobile overlay backdrop */}
      {open && (
        <div
          className="fixed inset-0 bg-slate-950/70 z-30 lg:hidden"
          onClick={onClose}
          aria-hidden
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={`
          fixed top-0 left-0 h-full z-40 flex flex-col
          w-60 bg-slate-900 border-r border-slate-800
          transition-transform duration-200
          ${open ? 'translate-x-0' : '-translate-x-full'}
          lg:relative lg:translate-x-0 lg:flex
        `}
      >
        {/* Brand */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-slate-950 font-black text-lg shadow-md shadow-amber-500/20">
              ✝
            </div>
            <div>
              <span className="font-bold text-base text-slate-100 leading-none">
                Bible<span className="text-amber-400">Cast</span>
              </span>
              <p className="text-[10px] text-slate-500 mt-0.5">Booth v1.0</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden text-slate-500 hover:text-slate-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
          {NAV_ITEMS.map(({ to, icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/dashboard'}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`
              }
            >
              {icon}
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Launch Projector */}
        <div className="px-3 py-2 border-t border-slate-800">
          <button
            onClick={openProjector}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-amber-300 bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 transition-colors"
          >
            <Tv className="w-4 h-4" />
            Launch Projector Screen
          </button>
        </div>

        {/* User profile */}
        <div className="border-t border-slate-800 px-3 py-3 flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-slate-200 truncate">{user?.name || 'Operator'}</p>
            <span
              className={`inline-block text-[10px] font-mono uppercase px-1.5 py-0.5 rounded border mt-0.5 ${getRoleBadge(user?.role)}`}
            >
              {user?.role || 'operator'}
            </span>
          </div>
          <button
            onClick={handleLogout}
            title="Sign out"
            className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors shrink-0"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>
    </>
  );
}
