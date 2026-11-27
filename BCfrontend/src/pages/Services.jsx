import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { serviceService } from '../services/serviceService';
import {
  Calendar,
  Clock,
  Plus,
  Play,
  Square,
  Edit3,
  History,
  Trash2,
  Search,
  Radio,
  User,
  BookMarked,
  CheckCircle2,
  AlertCircle,
  X,
  Loader2,
  Eye,
  Sparkles,
} from 'lucide-react';

const STATUS_BADGE_MAP = {
  in_progress: {
    label: 'Live In Progress',
    badgeClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    dotClass: 'bg-emerald-400 animate-pulse',
  },
  scheduled: {
    label: 'Scheduled',
    badgeClass: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    dotClass: 'bg-amber-400',
  },
  completed: {
    label: 'Completed',
    badgeClass: 'bg-slate-800 text-slate-300 border-slate-700',
    dotClass: 'bg-slate-400',
  },
};

const formatDateLabel = (dateStr) => {
  if (!dateStr) return 'Unscheduled';
  try {
    const clean = String(dateStr).slice(0, 10);
    return new Date(`${clean}T00:00:00`).toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch (_) {
    return dateStr;
  }
};

const formatTimeLabel = (timeStr) => {
  if (!timeStr) return '--:--';
  return String(timeStr).slice(0, 5);
};

const getTodayDate = () => new Date().toISOString().slice(0, 10);

const EMPTY_FORM = {
  name: '',
  preacher_name: '',
  description: '',
  service_date: getTodayDate(),
  start_time: '08:00',
  end_time: '',
  status: 'scheduled',
};

export function Services() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('upcoming'); // 'upcoming' | 'previous' | 'all'
  const [searchQuery, setSearchQuery] = useState('');

  // Feedback alerts
  const [toast, setToast] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Action busy tracker
  const [busyId, setBusyId] = useState(null);

  // Modal state: create | edit | schedule
  const [modalMode, setModalMode] = useState(null); // null | 'create' | 'edit' | 'schedule'
  const [editingService, setEditingService] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [savingForm, setSavingForm] = useState(false);

  // Detail modal for previous/service review
  const [detailService, setDetailService] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const showToast = (msg) => {
    setErrorMsg('');
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  };

  const loadServices = useCallback(async () => {
    try {
      const res = await serviceService.getServices();
      if (Array.isArray(res?.data)) {
        setServices(res.data);
      }
    } catch (err) {
      setErrorMsg(err?.response?.data?.message || 'Failed to load church services.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadServices();
  }, [loadServices]);

  const activeService = useMemo(
    () => services.find((s) => s.status === 'in_progress') || null,
    [services]
  );

  const filteredServices = useMemo(() => {
    return services.filter((svc) => {
      if (activeTab === 'upcoming' && svc.status === 'completed') return false;
      if (activeTab === 'previous' && svc.status !== 'completed') return false;

      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const hay = `${svc.name || ''} ${svc.preacher_name || ''} ${svc.description || ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }

      return true;
    });
  }, [services, activeTab, searchQuery]);

  const previousCount = useMemo(
    () => services.filter((s) => s.status === 'completed').length,
    [services]
  );

  // ─── Open Form Modal Helpers ──────────────────────────────────────────────
  const openCreateModal = (initialStatus = 'scheduled') => {
    setEditingService(null);
    setModalMode('create');
    setFormData({
      ...EMPTY_FORM,
      service_date: getTodayDate(),
      status: initialStatus,
    });
    setErrorMsg('');
  };

  const openEditModal = (svc) => {
    setEditingService(svc);
    setModalMode('edit');
    setFormData({
      name: svc.name || '',
      preacher_name: svc.preacher_name || '',
      description: svc.description || '',
      service_date: svc.service_date ? String(svc.service_date).slice(0, 10) : getTodayDate(),
      start_time: svc.start_time ? String(svc.start_time).slice(0, 5) : '',
      end_time: svc.end_time ? String(svc.end_time).slice(0, 5) : '',
      status: svc.status || 'scheduled',
    });
    setErrorMsg('');
  };

  const openScheduleModal = (svc) => {
    setEditingService(svc);
    setModalMode('schedule');
    setFormData({
      name: svc.name || '',
      preacher_name: svc.preacher_name || '',
      description: svc.description || '',
      service_date: svc.service_date ? String(svc.service_date).slice(0, 10) : getTodayDate(),
      start_time: svc.start_time ? String(svc.start_time).slice(0, 5) : '09:00',
      end_time: svc.end_time ? String(svc.end_time).slice(0, 5) : '',
      status: 'scheduled',
    });
    setErrorMsg('');
  };

  const closeModal = () => {
    setModalMode(null);
    setEditingService(null);
    setSavingForm(false);
  };

  // ─── Form Submission (Create / Edit / Schedule) ───────────────────────────
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    setSavingForm(true);
    setErrorMsg('');
    try {
      const payload = {
        name: formData.name.trim(),
        preacher_name: formData.preacher_name.trim() || null,
        description: formData.description.trim() || null,
        service_date: formData.service_date || null,
        start_time: formData.start_time || null,
        end_time: formData.end_time || null,
      };

      if (modalMode === 'create') {
        const res = await serviceService.createService({
          ...payload,
          status: formData.status,
        });
        showToast(res?.message || `Created "${payload.name}".`);
      } else if (modalMode === 'schedule' && editingService) {
        const res = await serviceService.scheduleService(editingService.id, payload);
        showToast(res?.message || `Scheduled "${payload.name}".`);
      } else if (modalMode === 'edit' && editingService) {
        const res = await serviceService.updateService(editingService.id, payload);
        showToast(res?.message || `Updated "${payload.name}".`);
      }

      closeModal();
      await loadServices();
    } catch (err) {
      setErrorMsg(err?.response?.data?.message || 'Unable to save church service details.');
    } finally {
      setSavingForm(false);
    }
  };

  // ─── Lifecycle Actions (Start / End / Delete / View Summary) ──────────────
  const handleStartService = async (svc) => {
    if (busyId) return;
    setBusyId(svc.id);
    setErrorMsg('');
    try {
      const res = await serviceService.startService(svc.id);
      showToast(res?.message || `"${svc.name}" is now LIVE.`);
      await loadServices();
    } catch (err) {
      setErrorMsg(err?.response?.data?.message || 'Could not start service.');
    } finally {
      setBusyId(null);
    }
  };

  const handleEndService = async (svc) => {
    if (busyId) return;
    setBusyId(svc.id);
    setErrorMsg('');
    try {
      const res = await serviceService.endService(svc.id);
      showToast(res?.message || `"${svc.name}" ended and archived.`);
      await loadServices();
    } catch (err) {
      setErrorMsg(err?.response?.data?.message || 'Could not end service.');
    } finally {
      setBusyId(null);
    }
  };

  const handleDeleteService = async (svc) => {
    if (busyId) return;
    setBusyId(svc.id);
    setErrorMsg('');
    try {
      const res = await serviceService.deleteService(svc.id);
      showToast(res?.message || `Deleted "${svc.name}".`);
      await loadServices();
    } catch (err) {
      setErrorMsg(err?.response?.data?.message || 'Could not delete service.');
    } finally {
      setBusyId(null);
    }
  };

  const handleViewDetails = async (svc) => {
    setLoadingDetail(true);
    setDetailService(svc);
    try {
      const res = await serviceService.getService(svc.id);
      if (res?.data) {
        setDetailService(res.data);
      }
    } catch (_) {
      // Fallback to summary row already opened
    } finally {
      setLoadingDetail(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-500 text-slate-950 font-bold px-4 py-2.5 rounded-lg shadow-xl flex items-center gap-2 text-sm">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      {/* Global Error Banner */}
      {errorMsg && (
        <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 px-4 py-3 rounded-xl flex items-center justify-between gap-3 text-sm">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMsg('')}
            className="text-rose-400 hover:text-rose-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Banner: Active Service Spotlight */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-mono font-bold uppercase px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20">
              <Sparkles className="w-3 h-3" />
              Church Service Management
            </span>
            {activeService && (
              <span className="inline-flex items-center gap-1.5 text-[11px] font-mono font-bold uppercase px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live Service Active
              </span>
            )}
          </div>

          {activeService ? (
            <>
              <h2 className="text-xl sm:text-2xl font-serif font-bold text-slate-100">
                {activeService.name}
              </h2>
              <p className="text-xs text-slate-400 flex flex-wrap items-center gap-3 font-mono">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-amber-400" />
                  {formatDateLabel(activeService.service_date)}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  Started {formatTimeLabel(activeService.start_time)}
                </span>
                {activeService.preacher_name && (
                  <span className="flex items-center gap-1 text-slate-300">
                    <User className="w-3.5 h-3.5 text-amber-400" />
                    {activeService.preacher_name}
                  </span>
                )}
                <span className="flex items-center gap-1 text-emerald-300">
                  <BookMarked className="w-3.5 h-3.5" />
                  {activeService.projections_count ?? 0} projections
                </span>
              </p>
            </>
          ) : (
            <>
              <h2 className="text-xl font-serif font-bold text-slate-200">
                No Active Service In Progress
              </h2>
              <p className="text-xs text-slate-400">
                Start a scheduled service below or create a new gathering to begin tracking projections.
              </p>
            </>
          )}
        </div>

        {/* Top-Level Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          {activeService && (
            <>
              <Link
                to="/live"
                className="px-3.5 py-2 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <Radio className="w-3.5 h-3.5" />
                Live Console
              </Link>
              <button
                type="button"
                onClick={() => handleEndService(activeService)}
                disabled={busyId === activeService.id}
                className="px-3.5 py-2 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 text-xs font-bold flex items-center gap-1.5 transition disabled:opacity-50"
              >
                {busyId === activeService.id ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Square className="w-3.5 h-3.5" />
                )}
                End Service
              </button>
            </>
          )}

          <button
            type="button"
            onClick={() => openCreateModal('scheduled')}
            className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition"
          >
            <Calendar className="w-3.5 h-3.5 text-amber-400" />
            Schedule Service
          </button>

          <button
            type="button"
            onClick={() => openCreateModal('in_progress')}
            className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition shadow-md shadow-amber-500/20"
          >
            <Plus className="w-4 h-4" />
            Create Service
          </button>
        </div>
      </div>

      {/* Tabs & Search Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="inline-flex bg-slate-900 border border-slate-800 rounded-xl p-1">
          {[
            { key: 'upcoming', label: 'Active & Scheduled', icon: Calendar },
            { key: 'previous', label: `Previous Services (${previousCount})`, icon: History },
            { key: 'all', label: `All (${services.length})`, icon: BookMarked },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => setActiveTab(key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                activeTab === key
                  ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{label}</span>
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter by service or preacher..."
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
          />
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
        </div>
      </div>

      {/* Service List */}
      {loading ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-500">
          <Loader2 className="w-6 h-6 animate-spin mx-auto text-amber-400 mb-2" />
          <p className="text-xs">Loading church services...</p>
        </div>
      ) : filteredServices.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-500 space-y-2">
          <History className="w-10 h-10 mx-auto text-slate-700" />
          <p className="text-sm font-semibold text-slate-300">
            {activeTab === 'previous'
              ? 'No previous completed services yet'
              : 'No matching services found'}
          </p>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {activeTab === 'previous'
              ? 'When an active church service is ended, its history and scripture counts appear here.'
              : 'Create or schedule a new church service to organize sermons and scripture projections.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredServices.map((svc) => {
            const statusMeta = STATUS_BADGE_MAP[svc.status] || STATUS_BADGE_MAP.scheduled;
            const isBusy = busyId === svc.id;

            return (
              <div
                key={svc.id}
                className={`bg-slate-900 border rounded-2xl p-5 flex flex-col justify-between gap-4 shadow-lg transition ${
                  svc.status === 'in_progress'
                    ? 'border-emerald-500/40'
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="space-y-2">
                  {/* Top Row: Status + Counts */}
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`inline-flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded border ${statusMeta.badgeClass}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${statusMeta.dotClass}`} />
                      {statusMeta.label}
                    </span>

                    <span className="text-[11px] font-mono text-slate-400">
                      {svc.projections_count ?? 0} projections
                    </span>
                  </div>

                  {/* Title & Theme */}
                  <div>
                    <h3 className="text-lg font-serif font-bold text-slate-100">
                      {svc.name}
                    </h3>
                    {svc.description && (
                      <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">
                        {svc.description}
                      </p>
                    )}
                  </div>

                  {/* Date, Times & Preacher */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400 font-mono pt-1">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-amber-400" />
                      {formatDateLabel(svc.service_date)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-amber-400" />
                      {formatTimeLabel(svc.start_time)}
                      {svc.end_time ? ` - ${formatTimeLabel(svc.end_time)}` : ''}
                    </span>
                    {svc.preacher_name && (
                      <span className="flex items-center gap-1 text-slate-300">
                        <User className="w-3.5 h-3.5 text-amber-400" />
                        {svc.preacher_name}
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-800/80">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => openEditModal(svc)}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1 transition"
                      title="Edit service"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => openScheduleModal(svc)}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1 transition"
                      title="Schedule or reschedule service"
                    >
                      <Calendar className="w-3.5 h-3.5 text-amber-400" />
                      <span>Schedule</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleViewDetails(svc)}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1 transition"
                      title="View service projections"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Summary</span>
                    </button>

                    {svc.status !== 'in_progress' && (
                      <button
                        type="button"
                        onClick={() => handleDeleteService(svc)}
                        disabled={isBusy}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-300 transition disabled:opacity-50"
                        title="Delete service"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Lifecycle Primary CTA */}
                  <div>
                    {svc.status === 'scheduled' && (
                      <button
                        type="button"
                        onClick={() => handleStartService(svc)}
                        disabled={isBusy}
                        className="px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition shadow-md shadow-emerald-500/20 disabled:opacity-50"
                      >
                        {isBusy ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Play className="w-3.5 h-3.5" />
                        )}
                        <span>Start Service</span>
                      </button>
                    )}

                    {svc.status === 'in_progress' && (
                      <button
                        type="button"
                        onClick={() => handleEndService(svc)}
                        disabled={isBusy}
                        className="px-3.5 py-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/40 text-xs font-bold flex items-center gap-1.5 transition disabled:opacity-50"
                      >
                        {isBusy ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Square className="w-3.5 h-3.5" />
                        )}
                        <span>End Service</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Create / Edit / Schedule Service Modal ── */}
      {modalMode && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-serif font-bold text-slate-100">
                {modalMode === 'create'
                  ? 'Create Church Service'
                  : modalMode === 'schedule'
                  ? 'Schedule Service Date & Time'
                  : 'Edit Church Service'}
              </h3>
              <button
                type="button"
                onClick={closeModal}
                className="text-slate-500 hover:text-slate-200 p-1 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Service Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Sunday 1st Service, Midweek Communion"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    required={modalMode === 'schedule'}
                    value={formData.service_date}
                    onChange={(e) => setFormData({ ...formData, service_date: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={formData.start_time}
                    onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    End Time
                  </label>
                  <input
                    type="time"
                    value={formData.end_time}
                    onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Preacher / Minister
                </label>
                <input
                  type="text"
                  value={formData.preacher_name}
                  onChange={(e) => setFormData({ ...formData, preacher_name: e.target.value })}
                  placeholder="Optional preacher name"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Sermon Theme / Notes
                </label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Optional notes, series title, or liturgy theme..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              {modalMode === 'create' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Initial State
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                  >
                    <option value="scheduled">Schedule for Later</option>
                    <option value="in_progress">Start Service Immediately (Go Live)</option>
                  </select>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingForm || !formData.name.trim()}
                  className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 disabled:opacity-50"
                >
                  {savingForm && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>
                    {modalMode === 'create'
                      ? formData.status === 'in_progress'
                        ? 'Create & Start'
                        : 'Save Scheduled Service'
                      : modalMode === 'schedule'
                      ? 'Confirm Schedule'
                      : 'Save Changes'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Service Summary / Previous Service Log Modal ── */}
      {detailService && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl p-6 space-y-4 shadow-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-start justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-lg font-serif font-bold text-amber-300">
                  {detailService.name}
                </h3>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  {formatDateLabel(detailService.service_date)} &bull;{' '}
                  {formatTimeLabel(detailService.start_time)}
                  {detailService.end_time ? ` - ${formatTimeLabel(detailService.end_time)}` : ''}
                  {detailService.preacher_name ? ` • ${detailService.preacher_name}` : ''}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDetailService(null)}
                className="text-slate-500 hover:text-slate-200 p-1 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {detailService.description && (
              <p className="text-xs text-slate-300 bg-slate-950 border border-slate-800 rounded-lg p-3">
                {detailService.description}
              </p>
            )}

            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                <span>Projected Scriptures ({detailService.projections_count ?? detailService.projections?.length ?? 0})</span>
                {loadingDetail && <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />}
              </div>

              {detailService.projections && detailService.projections.length > 0 ? (
                detailService.projections.map((p) => (
                  <div
                    key={p.id}
                    className="bg-slate-950 border border-slate-800 rounded-xl p-3 space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-serif font-bold text-amber-300">
                        {p.reference}
                      </span>
                      <span className="text-[10px] font-mono uppercase text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                        {(p.translation_code || 'kjv').toUpperCase()}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 italic line-clamp-2">
                      &ldquo;{p.passage_text}&rdquo;
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-500 py-6 text-center italic">
                  {loadingDetail
                    ? 'Loading projected scriptures...'
                    : 'No scriptures were logged under this service.'}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
