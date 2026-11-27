import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { ErrorAlert } from '../components/common/ErrorAlert';
import { bibleService } from '../services/bibleService';
import { dashboardService } from '../services/dashboardService';
import {
  Tv,
  Radio,
  Search,
  Layers,
  Users,
  Mic,
  MicOff,
  BookOpen,
  TrendingUp,
  Clock,
  CheckCircle2,
  Loader2,
  BookMarked,
  ArrowRight,
  Sparkles,
  Activity,
  Calendar,
  ChevronDown,
} from 'lucide-react';

// ─── Quick Bible Search Widget ────────────────────────────────────────────────
function QuickBibleSearch() {
  const [query, setQuery] = useState('');
  const [translation, setTranslation] = useState('kjv');
  const [availableTranslations, setAvailableTranslations] = useState([
    { code: 'kjv', name: 'King James Version' },
    { code: 'web', name: 'World English Bible' },
  ]);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    bibleService
      .getTranslations()
      .then((res) => {
        if (isMounted && res?.data && res.data.length > 0) {
          setAvailableTranslations(res.data);
          const def = res.data.find((t) => t.is_default);
          if (def) setTranslation(def.code);
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await bibleService.getPassage(query.trim(), translation);
      if (response && response.data) {
        setResult(response.data);
      } else {
        throw new Error('No passage found.');
      }
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSearch} className="space-y-3">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. John 3:16, Psalm 23..."
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
          />
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
        </div>
        <select
          value={translation}
          onChange={(e) => setTranslation(e.target.value)}
          className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-semibold text-amber-400 focus:outline-none focus:border-amber-500 cursor-pointer"
        >
          {availableTranslations.map((t) => (
            <option key={t.code} value={t.code}>
              {t.code.toUpperCase()}
            </option>
          ))}
        </select>
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="px-3 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold text-xs rounded-lg flex items-center gap-1 transition active:scale-98"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
        </button>
      </div>

      <ErrorAlert error={error} onDismiss={() => setError(null)} />

      {result && (
        <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-amber-300 font-serif">{result.reference}</span>
            <span className="text-[10px] uppercase font-mono text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded">
              {result.translation?.toUpperCase() || translation.toUpperCase()}
            </span>
          </div>
          <p className="text-sm text-slate-200 font-serif leading-relaxed italic">
            &ldquo;{result.text?.trim()}&rdquo;
          </p>
          <div className="mt-2 pt-2 border-t border-slate-800">
            <Link
              to="/search"
              className="text-[11px] text-amber-400 hover:text-amber-300 flex items-center gap-1 transition-colors"
            >
              Open in Scripture Search <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      )}
    </form>
  );
}

// ─── Live Listening Status Widget ────────────────────────────────────────────
function LiveListeningStatus() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-semibold text-emerald-400">Speech Engine Ready</span>
        </div>
        <Link
          to="/live"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600/20 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-600/30 transition-all"
        >
          <Radio className="w-3.5 h-3.5" />
          Open Live Console
        </Link>
      </div>

      {/* Visual audio monitor bar */}
      <div className="bg-slate-950 rounded-lg p-3 border border-slate-800 space-y-1.5">
        <div className="flex gap-1">
          {Array.from({ length: 16 }, (_, i) => (
            <div
              key={i}
              className={`flex-1 h-2 rounded-sm ${
                i < 10 ? 'bg-emerald-500/40' : i < 14 ? 'bg-amber-400/40' : 'bg-rose-500/30'
              }`}
            />
          ))}
        </div>
        <p className="text-[11px] text-slate-500 font-mono">
          Preacher voice line-in &bull; Web Speech API ready
        </p>
      </div>

      <div className="space-y-1.5 text-xs text-slate-400">
        <div className="flex items-center justify-between">
          <span>Continuous Engine</span>
          <span className="font-mono text-slate-200">Browser Web Speech API</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Scripture Auto-Detection</span>
          <span className="text-emerald-400 font-semibold flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Enabled (Human-in-the-loop gated)
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Main Dashboard Page ──────────────────────────────────────────────────────
export function Dashboard() {
  const { user } = useAuth();

  // Real data state from backend
  const [statsData, setStatsData] = useState({
    total_projections: 0,
    recent_projections_count: 0,
    recent_projections: [],
    current_service: {
      name: '1st Service',
      service_key: '1st_service',
      status: 'in_progress',
      start_time: '08:00:00',
    },
    services: [
      { id: 1, name: '1st Service', service_key: '1st_service', status: 'in_progress' },
      { id: 2, name: '2nd Service', service_key: '2nd_service', status: 'scheduled' },
      { id: 3, name: 'Tuesday Service', service_key: 'tuesday_service', status: 'scheduled' },
      { id: 4, name: 'Thursday Service', service_key: 'thursday_service', status: 'scheduled' },
    ],
    active_operators: [],
    active_operators_count: 0,
  });

  const [loading, setLoading] = useState(true);
  const [switching, setSwitching] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

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

  const openProjectorWindow = () => {
    const w = 1280,
      h = 720;
    const l = window.screen.width ? (window.screen.width - w) / 2 : 100;
    const t = window.screen.height ? (window.screen.height - h) / 2 : 100;
    window.open(
      '/projector',
      'BibleCastProjectorWindow',
      `width=${w},height=${h},left=${l},top=${t},menubar=no,toolbar=no,location=no,status=no,resizable=yes`
    );
  };

  // Fetch real statistics from backend API
  const loadStats = useCallback(async () => {
    try {
      const res = await dashboardService.getStats();
      if (res?.data) {
        setStatsData(res.data);
      }
    } catch (err) {
      console.warn('Failed to load real dashboard stats:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();

    // Re-fetch stats when new projections occur
    const handleProjectionUpdated = () => {
      loadStats();
    };

    window.addEventListener('biblecast:projection_updated', handleProjectionUpdated);
    window.addEventListener('biblecast:queue_updated', handleProjectionUpdated);
    window.addEventListener('biblecast:service_updated', handleProjectionUpdated);

    return () => {
      window.removeEventListener('biblecast:projection_updated', handleProjectionUpdated);
      window.removeEventListener('biblecast:queue_updated', handleProjectionUpdated);
      window.removeEventListener('biblecast:service_updated', handleProjectionUpdated);
    };
  }, [loadStats]);

  // Handle service switching (1st service, 2nd service, tuesday service, thursday service)
  const handleServiceChange = async (serviceKey) => {
    if (
      !serviceKey ||
      (statsData.current_service?.status === 'in_progress' &&
        serviceKey === statsData.current_service?.service_key)
    ) {
      return;
    }

    setSwitching(true);
    try {
      const res = await dashboardService.switchService(serviceKey);
      if (res?.data) {
        setStatsData((prev) => ({
          ...prev,
          current_service: res.data.current_service,
          services: res.data.services || prev.services,
        }));
        setToastMessage(`Switched active service to "${res.data.current_service?.name}"!`);
        setTimeout(() => setToastMessage(''), 3500);
      }
    } catch (err) {
      console.error('Failed to switch service:', err);
    } finally {
      setSwitching(false);
    }
  };

  const currentServiceName = statsData.current_service?.name || '1st Service';

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-500 text-slate-950 font-bold px-4 py-2.5 rounded-lg shadow-xl flex items-center gap-2 animate-bounce text-sm">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ── Welcome Hero Banner ── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/40 border border-slate-800 p-6 lg:p-8 shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-semibold mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              JE Display Projection Console
            </div>
            <h1 className="text-2xl lg:text-3xl font-bold text-slate-100 tracking-tight">
              Welcome, <span className="text-amber-400">{user?.name?.split(' ')[0] || 'Operator'}</span>
            </h1>
            <p className="text-sm text-slate-400 mt-1.5">
              Signed in as <strong className="text-slate-200">{getRoleTitle(user?.role)}</strong> &bull;{' '}
              All systems live for <span className="text-amber-400 font-semibold">{currentServiceName}</span>.
            </p>
          </div>
          <Button variant="primary" size="md" icon={<Tv className="w-4 h-4" />} onClick={openProjectorWindow}>
            Launch JE Display Screen
          </Button>
        </div>
        <div className="absolute right-0 top-0 -mt-16 -mr-16 w-72 h-72 bg-amber-500/8 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* ── Section 1: Real Stats Row ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Projections done (Real) */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between gap-3 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Total Projections Done</span>
            <div className="w-9 h-9 rounded-lg border bg-amber-500/10 border-amber-500/20 text-amber-400 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-bold text-slate-100 leading-none">
              {loading ? '--' : statsData.total_projections}
            </p>
            <p className="text-[11px] text-slate-500 mt-1.5">All-time database projection records</p>
          </div>
        </div>

        {/* Card 2: Current Service with Real Switcher (1st, 2nd, Tuesday, Thursday) */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between gap-3 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Current Service</span>
            <div className="w-9 h-9 rounded-lg border bg-emerald-500/10 border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
          </div>
          <div className="space-y-1.5">
            <div className="relative">
              <select
                value={
                  statsData.current_service?.status === 'in_progress'
                    ? statsData.current_service.service_key
                    : ''
                }
                onChange={(e) => handleServiceChange(e.target.value)}
                disabled={switching}
                className="w-full bg-slate-950 border border-slate-700 hover:border-amber-500/60 text-slate-100 text-sm font-bold rounded-lg px-2.5 py-1.5 pr-8 appearance-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-amber-500"
              >
                {statsData.current_service?.status !== 'in_progress' && (
                  <option value="" disabled>
                    Select service to start...
                  </option>
                )}
                {(statsData.services && statsData.services.filter((s) => s.status !== 'completed').length > 0
                  ? statsData.services.filter((s) => s.status !== 'completed')
                  : [
                      { service_key: '1st_service', name: '1st Service' },
                      { service_key: '2nd_service', name: '2nd Service' },
                      { service_key: 'tuesday_service', name: 'Tuesday Service' },
                      { service_key: 'thursday_service', name: 'Thursday Service' },
                    ]
                ).map((svc) => (
                  <option key={svc.service_key || svc.id} value={svc.service_key}>
                    {svc.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-3 pointer-events-none" />
            </div>
            <div className="flex items-center justify-between gap-2">
              <p className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {statsData.current_service?.status === 'in_progress' ? 'Active service' : 'No active service'}
              </p>
              <Link
                to="/services"
                className="text-[11px] text-amber-400 hover:text-amber-300 font-semibold transition-colors"
              >
                Manage &rarr;
              </Link>
            </div>
          </div>
        </div>

        {/* Card 3: Recent Projections Count (Real) */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between gap-3 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Recent Projections</span>
            <div className="w-9 h-9 rounded-lg border bg-sky-500/10 border-sky-500/20 text-sky-400 flex items-center justify-center">
              <BookMarked className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-bold text-slate-100 leading-none">
              {loading ? '--' : statsData.recent_projections?.length || statsData.recent_projections_count}
            </p>
            <p className="text-[11px] text-slate-500 mt-1.5">Recorded in recent session</p>
          </div>
        </div>

        {/* Card 4: Active Operators (Real signed in users) */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between gap-3 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Active Operators</span>
            <div className="w-9 h-9 rounded-lg border bg-purple-500/10 border-purple-500/20 text-purple-400 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-bold text-slate-100 leading-none">
              {loading ? '--' : statsData.active_operators_count}
            </p>
            <p className="text-[11px] text-slate-500 mt-1.5">Signed in media team crew</p>
          </div>
        </div>
      </div>

      {/* ── Sections 2 & 3 — Two column: Real Recent Projections + Real Active Operators ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Section 2: Real Recent Projections */}
        <Card
          icon={<BookMarked className="w-4 h-4" />}
          title="Recent Projections"
          action={
            <Link
              to="/history"
              className="text-[11px] text-amber-400 hover:text-amber-300 flex items-center gap-1 transition-colors font-semibold"
            >
              View Full History <ArrowRight className="w-3 h-3" />
            </Link>
          }
          noPadding
        >
          {loading ? (
            <div className="p-8 text-center text-slate-500">
              <Loader2 className="w-5 h-5 animate-spin mx-auto text-amber-400 mb-2" />
              <p className="text-xs">Loading projections...</p>
            </div>
          ) : statsData.recent_projections && statsData.recent_projections.length > 0 ? (
            <div className="divide-y divide-slate-800/60 max-h-[350px] overflow-y-auto">
              {statsData.recent_projections.map((p, i) => (
                <div
                  key={p.id || i}
                  className="flex items-center justify-between px-5 py-3 hover:bg-slate-800/20 transition-colors"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-amber-300 font-serif">{p.ref}</p>
                      <span className="text-[9px] uppercase font-mono font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20 px-1.5 py-0.5 rounded">
                        {p.translation}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Operator: <span className="text-slate-200">{p.operator}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-mono">
                    <Clock className="w-3 h-3 text-slate-500" />
                    {p.time}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-slate-500 space-y-2">
              <BookMarked className="w-8 h-8 mx-auto text-slate-700" />
              <p className="text-xs">No recent scripture projections yet.</p>
              <Link
                to="/search"
                className="inline-flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 font-semibold"
              >
                Search &amp; Project Scripture <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          )}
        </Card>

        {/* Section 3: Real Active Media Operators (signed in users) */}
        <Card
          icon={<Users className="w-4 h-4" />}
          title="Active Operators (Signed in Users)"
          action={
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
              {statsData.active_operators_count} online
            </span>
          }
          noPadding
        >
          {loading ? (
            <div className="p-8 text-center text-slate-500">
              <Loader2 className="w-5 h-5 animate-spin mx-auto text-amber-400 mb-2" />
              <p className="text-xs">Loading operators...</p>
            </div>
          ) : statsData.active_operators && statsData.active_operators.length > 0 ? (
            <div className="divide-y divide-slate-800/60 max-h-[350px] overflow-y-auto">
              {statsData.active_operators.map((op, i) => (
                <div key={op.id || i} className="flex items-center justify-between px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/30 flex items-center justify-center text-xs font-bold text-amber-300 shadow-sm">
                      {op.name?.charAt(0) || 'U'}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-200">{op.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span
                          className={`text-[9px] font-mono uppercase px-1.5 py-0.2 rounded border font-bold ${
                            op.role === 'admin'
                              ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                              : op.role === 'presenter'
                              ? 'bg-sky-500/20 text-sky-300 border-sky-500/30'
                              : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                          }`}
                        >
                          {op.role}
                        </span>
                        <span className="text-[10px] text-slate-500">{op.email}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 justify-end">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-[11px] text-emerald-400 font-medium">Online</span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-0.5 font-mono">signed in</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-slate-500">
              <p className="text-xs">No active operators found.</p>
            </div>
          )}
        </Card>
      </div>

      {/* ── Sections 4 & 5 — Two column: Quick Bible Search + Live Listening Status ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Section 4: Quick Bible Search */}
        <Card icon={<Search className="w-4 h-4" />} title="Quick Bible Search">
          <QuickBibleSearch />
        </Card>

        {/* Section 5: Live Listening Status */}
        <Card
          icon={<Radio className="w-4 h-4" />}
          title="Live Listening Status"
          action={
            <span className="text-[11px] text-slate-400 font-mono">Continuous Stream</span>
          }
        >
          <LiveListeningStatus />
        </Card>
      </div>
    </div>
  );
}
