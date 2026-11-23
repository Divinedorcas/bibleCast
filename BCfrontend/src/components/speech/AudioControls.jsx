import React from 'react';
import {
  Mic,
  MicOff,
  Radio,
  Sliders,
  Volume2,
  AlertCircle,
  Sparkles,
  RotateCcw,
  CheckCircle2,
} from 'lucide-react';
import { AudioLevelMeter } from './AudioLevelMeter';
import { AudioSourceSelector } from './AudioSourceSelector';

/**
 * AudioControls
 *
 * Integrated control strip for sanctuary sermon audio capture:
 * - Master Start/Stop Listening toggle
 * - Audio Source Selector (USB mixer line-in / podium mic)
 * - Real-time VU level meter
 * - Speech-to-Text engine indicators & Auto-detection switch
 *
 * Props:
 *   isListening         – Boolean: whether audio capture is actively running
 *   onToggleListening   – Function to start/stop listening
 *   devices             – Array of audioinput devices
 *   selectedDeviceId    – Selected deviceId string
 *   onSelectDevice      – Function (id) => void
 *   onRefreshDevices    – Function to rescan devices
 *   audioLevel          – Number (0 to 100) RMS volume
 *   isClipping          – Boolean: clipping warning
 *   isSpeechSupported   – Boolean: Web Speech API supported
 *   isRecognizing       – Boolean: Web Speech actively transcribing
 *   autoDetectEnabled   – Boolean: whether scripture references are auto-parsed
 *   onToggleAutoDetect  – Function to toggle auto-detect
 *   onClearTranscript   – Function to clear accumulated transcript
 *   error               – Error object or string (e.g. microphone permission denied)
 */
export function AudioControls({
  isListening = false,
  onToggleListening,
  devices = [],
  selectedDeviceId = '',
  onSelectDevice,
  onRefreshDevices,
  audioLevel = 0,
  isClipping = false,
  isSpeechSupported = true,
  isRecognizing = false,
  autoDetectEnabled = true,
  onToggleAutoDetect,
  onClearTranscript,
  error = null,
}) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-5 shadow-xl">
      {/* Top Header: Title & Auto-Detect Setting */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2.5">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors shadow-md ${
              isListening
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 shadow-rose-500/10'
                : 'bg-slate-800 text-slate-400 border border-slate-700'
            }`}
          >
            {isListening ? (
              <Radio className="w-5 h-5 animate-pulse text-rose-400" />
            ) : (
              <MicOff className="w-5 h-5 text-slate-500" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-100">
                Sermon Audio Ingestion
              </h3>
              {isListening && (
                <span className="flex items-center gap-1 text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-ping" />
                  Live Audio Capture
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Continuous line-in audio capture and scripture reference detection.
            </p>
          </div>
        </div>

        {/* Action Toggles: Auto-Detect & Clear Transcript */}
        <div className="flex items-center gap-2">
          {onToggleAutoDetect && (
            <button
              type="button"
              onClick={onToggleAutoDetect}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition flex items-center gap-1.5 ${
                autoDetectEnabled
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
              }`}
              title="Toggle automatic scripture citation extraction from transcript"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Auto-Detect Citations: {autoDetectEnabled ? 'ON' : 'OFF'}</span>
            </button>
          )}

          {onClearTranscript && (
            <button
              type="button"
              onClick={onClearTranscript}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700 transition"
              title="Clear transcript history"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Error / Permission Alert */}
      {error && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <div className="flex-1">
            <span className="font-bold">Microphone Error: </span>
            <span>{typeof error === 'string' ? error : error.message}</span>
            <span className="block text-[11px] text-rose-400/80 mt-0.5">
              Ensure browser microphone permissions are enabled on http://localhost or HTTPS.
            </span>
          </div>
        </div>
      )}

      {/* Main Controls Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
        {/* Left Column (4 cols): Device Selector */}
        <div className="md:col-span-4">
          <AudioSourceSelector
            devices={devices}
            selectedDeviceId={selectedDeviceId}
            onSelectDevice={onSelectDevice}
            onRefresh={onRefreshDevices}
            disabled={isListening}
          />
        </div>

        {/* Center Column (5 cols): Visual VU Level Meter */}
        <div className="md:col-span-5">
          <AudioLevelMeter
            level={audioLevel}
            isListening={isListening}
            isClipping={isClipping}
          />
        </div>

        {/* Right Column (3 cols): Master Listening Button */}
        <div className="md:col-span-3 flex flex-col justify-center">
          <button
            type="button"
            onClick={onToggleListening}
            className={`w-full py-3.5 px-4 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2.5 transition shadow-lg active:scale-98 ${
              isListening
                ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30 ring-2 ring-rose-500/50'
                : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20'
            }`}
          >
            {isListening ? (
              <>
                <MicOff className="w-4 h-4" />
                <span>Stop Listening</span>
              </>
            ) : (
              <>
                <Mic className="w-4 h-4 animate-bounce" />
                <span>Start Listening</span>
              </>
            )}
          </button>

          {/* Engine Status Note */}
          <div className="mt-2 text-center">
            <span className="text-[10px] font-mono text-slate-500 flex items-center justify-center gap-1">
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isRecognizing
                    ? 'bg-emerald-400 animate-pulse'
                    : isListening
                    ? 'bg-amber-400'
                    : 'bg-slate-600'
                }`}
              />
              {isRecognizing
                ? 'Web Speech Transcribing...'
                : isListening
                ? 'Audio Stream Listening'
                : 'Ready for Service'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
