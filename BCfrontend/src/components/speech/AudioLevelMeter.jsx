import React from 'react';
import { Activity, AlertTriangle, Mic, MicOff } from 'lucide-react';

/**
 * AudioLevelMeter
 *
 * Professional visual VU/RMS level meter for preacher audio signal verification.
 * Displays real-time audio volume with multi-segment color gradients
 * (green -> amber -> red) and clipping alerts.
 *
 * Props:
 *   level         – Number (0 to 100) representing current RMS volume
 *   isListening   – Boolean indicating whether audio capture is currently active
 *   isClipping    – Boolean indicating whether signal is clipping (>92%)
 *   compact       – Boolean for a miniature bar suitable for headers / toolbars
 *   showLabel     – Boolean to display dB / percentage text
 */
export function AudioLevelMeter({
  level = 0,
  isListening = false,
  isClipping = false,
  compact = false,
  showLabel = true,
}) {
  // Clamp level between 0 and 100
  const clampedLevel = isListening ? Math.min(100, Math.max(0, level)) : 0;

  // Approximate dB reading: 0% -> -60dB, 100% -> 0dB
  const dbApprox = clampedLevel > 0
    ? Math.round(20 * Math.log10(clampedLevel / 100))
    : -60;

  // Determine meter state color
  let statusText = 'Inactive';
  let badgeColor = 'text-slate-500 bg-slate-800';

  if (isListening) {
    if (isClipping || clampedLevel > 90) {
      statusText = 'Clipping Peak';
      badgeColor = 'text-rose-400 bg-rose-500/20 border border-rose-500/40 animate-pulse';
    } else if (clampedLevel > 50) {
      statusText = 'Optimal Speech';
      badgeColor = 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20';
    } else if (clampedLevel > 15) {
      statusText = 'Low Signal';
      badgeColor = 'text-amber-400 bg-amber-500/10 border border-amber-500/20';
    } else {
      statusText = 'Silence / Room Tone';
      badgeColor = 'text-slate-400 bg-slate-800/80';
    }
  }

  // Compact Toolbar Mode
  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5">
          {isListening ? (
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          ) : (
            <span className="w-2 h-2 rounded-full bg-slate-600" />
          )}
          <span className="text-[10px] font-mono font-semibold text-slate-400 uppercase">
            VU
          </span>
        </div>

        {/* Mini Meter Bar */}
        <div className="w-24 sm:w-32 h-2.5 bg-slate-950 border border-slate-800 rounded-full overflow-hidden p-0.5 flex items-center">
          <div
            className={`h-full rounded-full transition-all duration-75 ${
              isClipping
                ? 'bg-rose-500'
                : clampedLevel > 75
                ? 'bg-gradient-to-r from-emerald-500 via-amber-400 to-rose-500'
                : clampedLevel > 40
                ? 'bg-gradient-to-r from-emerald-500 to-amber-400'
                : 'bg-emerald-500'
            }`}
            style={{ width: `${clampedLevel}%` }}
          />
        </div>

        {showLabel && (
          <span className="text-[10px] font-mono text-slate-400 w-8 text-right">
            {isListening ? `${clampedLevel}%` : '--'}
          </span>
        )}
      </div>
    );
  }

  // Full Console VU Meter
  return (
    <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3 shadow-inner">
      {/* Header Info */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className={`w-7 h-7 rounded-lg flex items-center justify-center ${
              isListening
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : 'bg-slate-800 text-slate-500'
            }`}
          >
            {isListening ? <Activity className="w-4 h-4 animate-pulse" /> : <MicOff className="w-4 h-4" />}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                Audio Input Signal
              </h4>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${badgeColor}`}>
                {statusText}
              </span>
            </div>
            <p className="text-[10px] text-slate-500 mt-0.5">
              {isListening
                ? 'Web Audio API Real-time Signal Meter'
                : 'Audio capture is inactive. Start listening below.'}
            </p>
          </div>
        </div>

        {/* dB / Level numeric readout */}
        {showLabel && (
          <div className="text-right font-mono">
            <span
              className={`text-sm font-bold ${
                isClipping
                  ? 'text-rose-400'
                  : clampedLevel > 75
                  ? 'text-amber-400'
                  : 'text-emerald-400'
              }`}
            >
              {isListening ? `${clampedLevel}%` : '0%'}
            </span>
            <span className="text-[10px] text-slate-500 block">
              {isListening ? `${dbApprox} dBFS` : '-60 dBFS'}
            </span>
          </div>
        )}
      </div>

      {/* Main Multi-Segment LED Level Meter Bar */}
      <div className="space-y-1.5">
        <div className="h-3.5 bg-slate-900 border border-slate-800/80 rounded-md overflow-hidden p-0.5 flex items-center relative">
          {/* Subtle Segment Grid Markers */}
          <div className="absolute inset-0 flex justify-between px-1 pointer-events-none opacity-20 z-10">
            {Array.from({ length: 20 }).map((_, i) => (
              <div key={i} className="w-[1px] h-full bg-slate-400" />
            ))}
          </div>

          {/* Active Level Fill Bar */}
          <div
            className={`h-full rounded transition-all duration-75 shadow-sm ${
              isClipping
                ? 'bg-rose-500 shadow-rose-500/50'
                : clampedLevel > 80
                ? 'bg-gradient-to-r from-emerald-500 via-amber-400 to-rose-500 shadow-rose-500/20'
                : clampedLevel > 50
                ? 'bg-gradient-to-r from-emerald-500 to-amber-400 shadow-amber-500/20'
                : 'bg-emerald-500 shadow-emerald-500/20'
            }`}
            style={{ width: `${clampedLevel}%` }}
          />
        </div>

        {/* Scale labels (-40dB, -20dB, -6dB, 0dB) */}
        <div className="flex justify-between text-[9px] font-mono text-slate-500 px-0.5">
          <span>-60dB</span>
          <span>-36dB</span>
          <span>-18dB</span>
          <span>-6dB</span>
          <span className="text-amber-500">-2dB</span>
          <span className="text-rose-500 font-bold">0dB (Peak)</span>
        </div>
      </div>

      {/* Clipping Warning Alert */}
      {isClipping && (
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-rose-500/20 border border-rose-500/30 text-rose-300 text-[11px] animate-pulse">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          <span>Warning: Audio signal is clipping! Lower gain on church mixer line-out.</span>
        </div>
      )}
    </div>
  );
}
