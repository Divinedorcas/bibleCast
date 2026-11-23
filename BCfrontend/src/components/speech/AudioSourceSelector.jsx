import React from 'react';
import { Mic, RefreshCw, Volume2, Usb, Sliders } from 'lucide-react';

/**
 * AudioSourceSelector
 *
 * Allows media operators to select the incoming audio capture source:
 * - Church Sound Mixer / USB Audio Interface (Line-In)
 * - Podium / Dedicated Microphone
 * - Default System Input
 *
 * Props:
 *   devices            – Array of { deviceId, label }
 *   selectedDeviceId   – Currently chosen audioinput device ID
 *   onSelectDevice     – Callback (deviceId) => void
 *   onRefresh          – Callback to trigger device re-enumeration
 *   disabled           – Boolean to disable changing while actively streaming
 */
export function AudioSourceSelector({
  devices = [],
  selectedDeviceId = '',
  onSelectDevice,
  onRefresh,
  disabled = false,
}) {
  const getDeviceIcon = (label = '') => {
    const lower = label.toLowerCase();
    if (lower.includes('usb') || lower.includes('scarlett') || lower.includes('behringer') || lower.includes('interface')) {
      return <Usb className="w-3.5 h-3.5 text-amber-400" />;
    }
    if (lower.includes('line') || lower.includes('mixer')) {
      return <Sliders className="w-3.5 h-3.5 text-emerald-400" />;
    }
    return <Mic className="w-3.5 h-3.5 text-slate-400" />;
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <label
          htmlFor="audio-source-select"
          className="font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5"
        >
          <Mic className="w-3.5 h-3.5 text-amber-400" />
          <span>Audio Input Source</span>
        </label>

        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            title="Scan for connected audio devices (USB audio interfaces / mixer lines)"
            className="text-[11px] text-slate-400 hover:text-amber-400 flex items-center gap-1 transition"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Rescan</span>
          </button>
        )}
      </div>

      <div className="relative">
        <select
          id="audio-source-select"
          value={selectedDeviceId}
          onChange={(e) => onSelectDevice && onSelectDevice(e.target.value)}
          disabled={disabled || devices.length === 0}
          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-xs font-semibold text-slate-200 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed pr-8 appearance-none"
        >
          {devices.length === 0 ? (
            <option value="">Default System Microphone (No devices listed)</option>
          ) : (
            devices.map((device, index) => {
              const label = device.label || `Audio Input ${index + 1}`;
              const isUsb = label.toLowerCase().includes('usb') || label.toLowerCase().includes('interface');
              return (
                <option key={device.deviceId || index} value={device.deviceId}>
                  {isUsb ? `[USB Mixer] ${label}` : label}
                </option>
              );
            })
          )}
        </select>

        {/* Custom Dropdown Arrow Icon */}
        <div className="absolute right-3 top-3 pointer-events-none text-slate-500">
          <Volume2 className="w-3.5 h-3.5" />
        </div>
      </div>

      <p className="text-[10px] text-slate-500 flex items-center gap-1">
        <span>Connect sound mixer line-out to a USB audio interface for optimal detection.</span>
      </p>
    </div>
  );
}
