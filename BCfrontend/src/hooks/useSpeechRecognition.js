import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * useSpeechRecognition
 *
 * Dedicated React hook for browser-native Web Speech API speech recognition.
 *
 * Features:
 *   - Start listening / Stop listening
 *   - Live transcription stream (transcript, interimTranscript, finalTranscript, resetTranscript)
 *   - Listening & engine status ('idle' | 'listening' | 'recognizing' | 'error' | 'unsupported')
 *   - Microphone permission handling ('prompt' | 'granted' | 'denied')
 *   - Unsupported browser handling (isSupported boolean + descriptive error guide)
 *
 * @param {Object} options
 * @param {string} [options.lang='en-US'] Language code (e.g. 'en-US', 'en-GB', 'en-NG')
 * @param {boolean} [options.continuous=true] Whether to listen continuously
 * @param {boolean} [options.interimResults=true] Whether to yield real-time interim results
 * @param {Function} [options.onResult] Callback fired when new speech chunk arrives: (chunk, fullTranscript) => void
 * @param {Function} [options.onError] Callback fired on speech error: (error) => void
 * @param {Function} [options.onEnd] Callback fired when recognition stops
 */
export function useSpeechRecognition({
  lang = 'en-US',
  continuous = true,
  interimResults = true,
  onResult = null,
  onError = null,
  onEnd = null,
} = {}) {
  const [isSupported, setIsSupported] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [status, setStatus] = useState('idle'); // 'idle' | 'listening' | 'recognizing' | 'error' | 'unsupported'

  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [finalTranscript, setFinalTranscript] = useState('');

  const [permissionStatus, setPermissionStatus] = useState('prompt'); // 'prompt' | 'granted' | 'denied'
  const [error, setError] = useState(null);

  const recognitionRef = useRef(null);
  const shouldListenRef = useRef(false);

  // Check browser support and microphone permissions on mount
  useEffect(() => {
    const SpeechRecognition =
      typeof window !== 'undefined' &&
      (window.SpeechRecognition || window.webkitSpeechRecognition);

    if (SpeechRecognition) {
      setIsSupported(true);
      setStatus('idle');
    } else {
      setIsSupported(false);
      setStatus('unsupported');
      setError(
        'Web Speech API is not supported in this browser. Please use Google Chrome, Microsoft Edge, or a Chromium-based browser.'
      );
    }

    // Query microphone permission state if Permissions API supports it
    if (typeof navigator !== 'undefined' && navigator.permissions?.query) {
      navigator.permissions
        .query({ name: 'microphone' })
        .then((permission) => {
          setPermissionStatus(permission.state);
          permission.onchange = () => {
            setPermissionStatus(permission.state);
          };
        })
        .catch(() => {
          // Some browsers do not support microphone in permissions.query
        });
    }
  }, []);

  // Teardown recognition instance
  const cleanupRecognition = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.onstart = null;
        recognitionRef.current.onresult = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onend = null;
        recognitionRef.current.abort();
      } catch (_) {}
      recognitionRef.current = null;
    }
  }, []);

  // Stop listening
  const stopListening = useCallback(() => {
    shouldListenRef.current = false;
    setIsListening(false);
    setIsRecognizing(false);
    setStatus('idle');

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (_) {}
    }
  }, []);

  // Start listening
  const startListening = useCallback(async () => {
    const SpeechRecognition =
      typeof window !== 'undefined' &&
      (window.SpeechRecognition || window.webkitSpeechRecognition);

    if (!SpeechRecognition) {
      setIsSupported(false);
      setStatus('unsupported');
      const msg =
        'Web Speech API is not supported in this browser. Please use Google Chrome, Microsoft Edge, or a Chromium-based browser.';
      setError(msg);
      if (onError) onError(new Error(msg));
      return;
    }

    setError(null);

    // Request microphone permission first if available
    if (typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        // Release stream so SpeechRecognition can take it without conflict
        stream.getTracks().forEach((t) => t.stop());
        setPermissionStatus('granted');
      } catch (permErr) {
        setPermissionStatus('denied');
        setStatus('error');
        const msg =
          permErr.name === 'NotAllowedError' || permErr.name === 'PermissionDeniedError'
            ? 'Microphone permission was denied. Please allow microphone access in your browser settings.'
            : permErr.message || 'Microphone access failed.';
        setError(msg);
        if (onError) onError(permErr);
        return;
      }
    }

    cleanupRecognition();

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = continuous;
      recognition.interimResults = interimResults;
      recognition.lang = lang;
      recognition.maxAlternatives = 1;

      shouldListenRef.current = true;
      setIsListening(true);
      setStatus('listening');

      recognition.onstart = () => {
        setIsRecognizing(true);
        setStatus('recognizing');
      };

      recognition.onresult = (event) => {
        let currentInterim = '';
        let currentFinal = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const item = event.results[i];
          const text = item[0].transcript;
          if (item.isFinal) {
            currentFinal += text + ' ';
          } else {
            currentInterim += text;
          }
        }

        if (currentInterim) {
          setInterimTranscript(currentInterim);
        }

        if (currentFinal) {
          const trimmedFinal = currentFinal.trim();
          setFinalTranscript(trimmedFinal);
          setInterimTranscript('');

          setTranscript((prev) => {
            const updated = prev ? `${prev} ${trimmedFinal}` : trimmedFinal;
            if (onResult) onResult(trimmedFinal, updated);
            return updated;
          });
        }
      };

      recognition.onerror = (event) => {
        const errType = event.error;

        if (errType === 'not-allowed' || errType === 'service-not-allowed') {
          setPermissionStatus('denied');
          setStatus('error');
          setError(
            'Microphone permission was denied. Please allow microphone access in your browser settings.'
          );
        } else if (errType === 'no-speech') {
          // Normal pause in speech; do not treat as fatal error
        } else if (errType === 'audio-capture') {
          setStatus('error');
          setError('No microphone found or audio capture failed.');
        } else if (errType !== 'aborted') {
          setStatus('error');
          setError(`Speech recognition error: ${errType}`);
        }

        if (onError && errType !== 'no-speech' && errType !== 'aborted') {
          onError(event);
        }
      };

      recognition.onend = () => {
        setIsRecognizing(false);

        // Continuous restart if user still has listening on
        if (shouldListenRef.current) {
          try {
            recognition.start();
            setStatus('recognizing');
          } catch (_) {
            setTimeout(() => {
              if (shouldListenRef.current) {
                try {
                  recognition.start();
                  setStatus('recognizing');
                } catch (_) {}
              }
            }, 300);
          }
        } else {
          setStatus('idle');
          if (onEnd) onEnd();
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error('Failed to start speech recognition:', err);
      setError(err?.message || 'Failed to start speech recognition.');
      setStatus('error');
      setIsListening(false);
      setIsRecognizing(false);
      if (onError) onError(err);
    }
  }, [lang, continuous, interimResults, onResult, onError, onEnd, cleanupRecognition]);

  // Toggle listening helper
  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  // Reset transcript helper
  const resetTranscript = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
    setFinalTranscript('');
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      shouldListenRef.current = false;
      cleanupRecognition();
    };
  }, [cleanupRecognition]);

  return {
    // Recognition Controls
    startListening,
    stopListening,
    toggleListening,
    resetTranscript,

    // Statuses
    isListening,
    isRecognizing,
    status, // 'idle' | 'listening' | 'recognizing' | 'error' | 'unsupported'

    // Transcription Data
    transcript,
    interimTranscript,
    finalTranscript,

    // Browser Support & Permissions
    isSupported,
    permissionStatus, // 'prompt' | 'granted' | 'denied'
    error,
  };
}
