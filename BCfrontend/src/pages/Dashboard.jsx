import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { ErrorAlert } from '../components/common/ErrorAlert';
import { bibleService } from '../services/bibleService';
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
    bibleService.getTranslations()
      .then((res) => {
        if (isMounted && res?.data && res.data.length > 0) {
          setAvailableTranslations(res.data);
          const def = res.data.find((t) => t.is_default);
          if (def) setTranslation(def.code);
        }
      })
      .catch(() => {
        // Fallback to defaults already in state
      });
    return () => { isMounted = false; };
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
  const [isListening, setIsListening] = useState(false);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isListening ? (
            <>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-semibold text-emerald-400">Listening Active</span>
            </>
          ) : (
            <>
              <span className="w-2.5 h-2.5 rounded-full bg-slate-600" />
              <span className="text-xs font-semibold text-slate-400">Microphone Off</span>
            </>
          )}
        </div>
        <button
          onClick={() => setIsListening((v) => !v)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            isListening
              ? 'bg-rose-600/20 border border-rose-500/40 text-rose-300 hover:bg-rose-600/30'
              : 'bg-emerald-600/20 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-600/30'
          }`}
        >
          {isListening ? (
            <>
              <MicOff className="w-3.5 h-3.5" />
              Stop Capture
            </>
          ) : (
            <>
              <Mic className="w-3.5 h-3.5" />
              Start Capture
            </>
          )}
        </button>
      </div>

      {/* VU Meter placeholder */}
      <div className="bg-slate-950 rounded-lg p-3 border border-slate-800">
        <div className="flex gap-1 mb-1.5">
          {Array.from({ length: 16 }, (_, i) => (
            <div
              key={i}
              className={`flex-1 h-2.5 rounded-sm transition-colors duration-100 ${
                isListening
                  ? i < 10
                    ? 'bg-emerald-500 opacity-70 animate-pulse'
                    : i < 13
                    ? 'bg-amber-400 opacity-50'
                    : 'bg-rose-500 opacity-30'
                  : 'bg-slate-800'
              }`}
            />
          ))}
        </div>
        <p className="text-[11px] text-slate-500 font-mono">
          {isListening ? 'Monitoring for Bible citations...' : 'No audio input'}
        </p>
      </div>

      <div className="flex items-center justify-between text-xs text-slate-400">
        <span>Speech Engine</span>
        <span className="font-mono text-slate-300">Web Speech API</span>
      </div>
      <div className="flex items-center justify-between text-xs text-slate-400">
        <span>Citation Detection</span>
        <span className={isListening ? 'text-emerald-400 font-semibold' : 'text-slate-500'}>
          {isListening ? 'Active — human review gated' : 'Paused'}
        </span>
      </div>

      <div className="mt-1">
        <Link
          to="/live"
          className="inline-flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 transition-colors"
        >
          Go to Live Console <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}

// ─── Main Dashboard Page ──────────────────────────────────────────────────────
export function Dashboard() {
  const { user } = useAuth();

  const getRoleTitle = (role) => {
    switch (role) {
      case 'admin':     return 'System Administrator';
      case 'presenter': return 'Pastor / Service Presenter';
      default:          return 'Media Booth Operator';
    }
  };

  const openProjectorWindow = () => {
    const w = 1280, h = 720;
    const l = window.screen.width ? (window.screen.width - w) / 2 : 100;
    const t = window.screen.height ? (window.screen.height - h) / 2 : 100;
    window.open(
      '/projector',
      'BibleCastProjectorWindow',
      `width=${w},height=${h},left=${l},top=${t},menubar=no,toolbar=no,location=no,status=no,resizable=yes`
    );
  };

  // ── Mock data (replace with API calls once backend endpoints are ready) ──
  const stats = [
    {
      label: 'Total Projections',
      value: '247',
      sub: 'All-time service sessions',
      icon: <TrendingUp className="w-5 h-5" />,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10 border-amber-500/20',
    },
    {
      label: 'Current Service',
      value: 'Sunday AM',
      sub: 'Started 10:04 AM',
      icon: <BookOpen className="w-5 h-5" />,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10 border-emerald-500/20',
    },
    {
      label: 'Recent Projections',
      value: '12',
      sub: 'In this session',
      icon: <BookMarked className="w-5 h-5" />,
      color: 'text-sky-400',
      bg: 'bg-sky-500/10 border-sky-500/20',
    },
    {
      label: 'Active Operators',
      value: '3',
      sub: 'Booth & stage crew online',
      icon: <Users className="w-5 h-5" />,
      color: 'text-purple-400',
      bg: 'bg-purple-500/10 border-purple-500/20',
    },
  ];

  const recentProjections = [
    { ref: 'John 3:16',     translation: 'KJV', time: '10:42 AM', operator: 'Dorcas O.' },
    { ref: 'Romans 8:28',   translation: 'KJV', time: '10:38 AM', operator: 'Dorcas O.' },
    { ref: 'Psalm 23:1',    translation: 'WEB', time: '10:31 AM', operator: 'Dorcas O.' },
    { ref: 'Isaiah 40:31',  translation: 'KJV', time: '10:25 AM', operator: 'Mike A.'  },
    { ref: 'Phil 4:13',     translation: 'KJV', time: '10:17 AM', operator: 'Mike A.'  },
  ];

  const activeOperators = [
    { name: 'Dorcas O.', role: 'operator', status: 'active',  since: '10:00 AM' },
    { name: 'Mike A.',   role: 'operator', status: 'active',  since: '10:00 AM' },
    { name: 'Pastor Ben', role: 'presenter', status: 'active', since: '09:55 AM' },
  ];

  return (
    <div className="space-y-6">
      {/* ── Welcome Hero Banner ── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/40 border border-slate-800 p-6 lg:p-8 shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-semibold mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              Sanctuary Projection Console
            </div>
            <h1 className="text-2xl lg:text-3xl font-bold text-slate-100 tracking-tight">
              Welcome, <span className="text-amber-400">{user?.name?.split(' ')[0] || 'Operator'}</span>
            </h1>
            <p className="text-sm text-slate-400 mt-1.5">
              Signed in as <strong className="text-slate-200">{getRoleTitle(user?.role)}</strong> &bull;
              All systems ready for service.
            </p>
          </div>
          <Button variant="primary" size="md" icon={<Tv className="w-4 h-4" />} onClick={openProjectorWindow}>
            Launch Projector Screen
          </Button>
        </div>
        <div className="absolute right-0 top-0 -mt-16 -mr-16 w-72 h-72 bg-amber-500/8 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* ── Section 1: Stats Row ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col gap-3"
          >
            <div className={`w-9 h-9 rounded-lg border flex items-center justify-center ${s.bg} ${s.color}`}>
              {s.icon}
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-100 leading-none">{s.value}</p>
              <p className="text-xs font-semibold text-slate-300 mt-1">{s.label}</p>
              <p className="text-[11px] text-slate-500 mt-0.5">{s.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Sections 2 & 3 — Two column: Recent Projections + Active Operators ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Section 2: Recent Projections */}
        <Card
          icon={<BookMarked className="w-4 h-4" />}
          title="Recent Projections"
          action={
            <Link to="/history" className="text-[11px] text-amber-400 hover:text-amber-300 flex items-center gap-1 transition-colors">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          }
          noPadding
        >
          <div className="divide-y divide-slate-800/60">
            {recentProjections.map((p, i) => (
              <div key={i} className="flex items-center justify-between px-5 py-3 hover:bg-slate-800/20 transition-colors">
                <div>
                  <p className="text-sm font-semibold text-amber-300 font-serif">{p.ref}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {p.operator} &bull; {p.translation}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-mono">
                  <Clock className="w-3 h-3" />
                  {p.time}
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Section 3: Active Media Operators */}
        <Card
          icon={<Users className="w-4 h-4" />}
          title="Active Media Operators"
          action={
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
              {activeOperators.length} online
            </span>
          }
          noPadding
        >
          <div className="divide-y divide-slate-800/60">
            {activeOperators.map((op, i) => (
              <div key={i} className="flex items-center justify-between px-5 py-3.5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-slate-300">
                    {op.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-200">{op.name}</p>
                    <span
                      className={`text-[10px] font-mono uppercase px-1.5 py-0.5 rounded border ${
                        op.role === 'admin'
                          ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                          : op.role === 'presenter'
                          ? 'bg-sky-500/20 text-sky-300 border-sky-500/30'
                          : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                      }`}
                    >
                      {op.role}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 justify-end">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[11px] text-emerald-400 font-medium">Active</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5 font-mono">since {op.since}</p>
                </div>
              </div>
            ))}
          </div>
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
            <span className="text-[11px] text-slate-400 font-mono">Web Speech API</span>
          }
        >
          <LiveListeningStatus />
        </Card>
      </div>
    </div>
  );
}
