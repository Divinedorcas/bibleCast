import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * useAudioInput
 *
 * Custom hook for:
 * 1. Audio input device enumeration and selection (USB mixer, line-in, microphone).
 * 2. Web Audio API live signal level metering (RMS 0-100, peak, clipping).
 * 3. Continuous Web Speech API transcription with interim and final results.
 */
export function useAudioInput({ onTranscript } = {}) {
  // Device & Stream States
  const [devices, setDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [error, setError] = useState(null);

  // Audio Metering States
  const [audioLevel, setAudioLevel] = useState(0); // 0 to 100
  const [isClipping, setIsClipping] = useState(false);

  // Speech Recognition States
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [isSpeechSupported, setIsSpeechSupported] = useState(false);
  const [isRecognizing, setIsRecognizing] = useState(false);

  // Audio Context & Nodes Refs
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const animFrameRef = useRef(null);
  const recognitionRef = useRef(null);
  const isListeningRef = useRef(false);

  // Check speech recognition browser support
  useEffect(() => {
    const SpeechRecognition =
      typeof window !== 'undefined' &&
      (window.SpeechRecognition || window.webkitSpeechRecognition);
    setIsSpeechSupported(Boolean(SpeechRecognition));
  }, []);

  // Enumerate Audio Devices
  const enumerateDevices = useCallback(async () => {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.enumerateDevices) {
      return;
    }

    try {
      const allDevices = await navigator.mediaDevices.enumerateDevices();
      const audioInputs = allDevices
        .filter((d) => d.kind === 'audioinput')
        .map((d, index) => ({
          deviceId: d.deviceId,
          label: d.label || `Microphone ${index + 1} (${d.deviceId.slice(0, 5)}...)`,
          groupId: d.groupId,
        }));

      setDevices(audioInputs);

      // Default to first device or 'default' if not chosen
      if (!selectedDeviceId && audioInputs.length > 0) {
        setSelectedDeviceId(audioInputs[0].deviceId);
      }
    } catch (err) {
      console.warn('Failed to enumerate audio devices:', err);
    }
  }, [selectedDeviceId]);

  // Request initial permissions and enumerate devices
  useEffect(() => {
    enumerateDevices();

    // Listen for device change events (e.g. plugging in a USB interface)
    if (typeof navigator !== 'undefined' && navigator.mediaDevices) {
      navigator.mediaDevices.addEventListener('devicechange', enumerateDevices);
      return () => {
        navigator.mediaDevices.removeEventListener('devicechange', enumerateDevices);
      };
    }
  }, [enumerateDevices]);

  // ─── Web Audio API Level Meter Loop ────────────────────────────────────────
  const startMetering = useCallback(() => {
    if (!analyserRef.current) return;

    const analyser = analyserRef.current;
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.5;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const updateMeter = () => {
      if (!isListeningRef.current || !analyserRef.current) {
        setAudioLevel(0);
        setIsClipping(false);
        return;
      }

      analyser.getByteFrequencyData(dataArray);

      // Calculate Root Mean Square (RMS) volume
      let sum = 0;
      for (let i = 0; i < bufferLength; i++) {
        sum += dataArray[i] * dataArray[i];
      }
      const rms = Math.sqrt(sum / bufferLength);

      // Normalize to 0 - 100 with exponential perceptual scaling
      const normalized = Math.min(100, Math.round((rms / 128) * 100));

      setAudioLevel((prev) => {
        // Smooth decay if volume dropped
        if (normalized < prev) {
          return Math.max(0, Math.round(prev * 0.85));
        }
        return normalized;
      });

      setIsClipping(normalized > 92);

      animFrameRef.current = requestAnimationFrame(updateMeter);
    };

    updateMeter();
  }, []);

  // ─── Web Speech Recognition Setup ──────────────────────────────────────────
  const startSpeechRecognition = useCallback(() => {
    const SpeechRecognition =
      typeof window !== 'undefined' &&
      (window.SpeechRecognition || window.webkitSpeechRecognition);

    if (!SpeechRecognition) return;

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsRecognizing(true);
      };

      recognition.onresult = (event) => {
        let interim = '';
        let final = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const trans = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            final += trans + ' ';
          } else {
            interim += trans;
          }
        }

        if (interim) {
          setInterimTranscript(interim);
        }

        if (final) {
          setTranscript((prev) => {
            const updated = (prev + ' ' + final).trim();
            if (onTranscript) onTranscript(final.trim(), updated);
            return updated;
          });
          setInterimTranscript('');
        }
      };

      recognition.onerror = (e) => {
        // Ignore aborted error which happens on manual stop
        if (e.error !== 'aborted') {
          console.warn('Speech recognition warning:', e.error);
        }
      };

      recognition.onend = () => {
        setIsRecognizing(false);
        // Automatically restart speech recognition if user still has listening on
        if (isListeningRef.current) {
          try {
            recognition.start();
          } catch (_) {}
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.warn('Speech recognition start failed:', err);
    }
  }, [onTranscript]);

  // ─── Start Audio Capture ───────────────────────────────────────────────────
  const startListening = useCallback(async () => {
    setError(null);

    try {
      // 1. Request microphone or line-in media stream
      const constraints = {
        audio: selectedDeviceId
          ? { deviceId: { exact: selectedDeviceId }, echoCancellation: true, noiseSuppression: true }
          : { echoCancellation: true, noiseSuppression: true },
        video: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      mediaStreamRef.current = stream;
      setPermissionGranted(true);
      await enumerateDevices(); // Re-enumerate now that permissions grant labels

      // 2. Initialize Web Audio API
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioCtx();
      audioContextRef.current = ctx;

      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      source.connect(analyser);
      analyserRef.current = analyser;

      isListeningRef.current = true;
      setIsListening(true);

      // 3. Start Level Metering
      startMetering();

      // 4. Start Speech Recognition
      startSpeechRecognition();
    } catch (err) {
      console.error('Failed to start audio input:', err);
      setError(err?.message || 'Permission denied or microphone unavailable.');
      isListeningRef.current = false;
      setIsListening(false);
    }
  }, [selectedDeviceId, enumerateDevices, startMetering, startSpeechRecognition]);

  // ─── Stop Audio Capture ────────────────────────────────────────────────────
  const stopListening = useCallback(() => {
    isListeningRef.current = false;
    setIsListening(false);
    setAudioLevel(0);
    setIsClipping(false);
    setIsRecognizing(false);

    // Stop metering loop
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }

    // Stop speech recognition
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (_) {}
      recognitionRef.current = null;
    }

    // Stop media stream tracks
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }

    // Close Audio Context
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
  }, []);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  const clearTranscript = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopListening();
    };
  }, [stopListening]);

  return {
    // Device selection
    devices,
    selectedDeviceId,
    setSelectedDeviceId,
    refreshDevices: enumerateDevices,

    // Audio stream & metering
    isListening,
    startListening,
    stopListening,
    toggleListening,
    audioLevel,
    isClipping,

    // Speech recognition
    transcript,
    interimTranscript,
    clearTranscript,
    isSpeechSupported,
    isRecognizing,

    // Permissions & Error
    permissionGranted,
    error,
  };
}
