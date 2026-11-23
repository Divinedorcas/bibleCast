import React, { useState, useEffect, useCallback } from 'react';
import { ProjectorLayout } from '../layouts/ProjectorLayout';
import { ProjectionDisplay } from '../components/projection/ProjectionDisplay';
import { projectionService } from '../services/projectionService';

export function Projector() {
  const [projection, setProjection] = useState({
    reference: '',
    translation: 'kjv',
    text: '',
    verses: [],
    status: 'cleared',
  });

  const [previousStatus, setPreviousStatus] = useState('projected');

  // Load current projection on mount & sync
  useEffect(() => {
    let isMounted = true;

    // 1. Initial fetch from local or backend
    projectionService.getCurrent().then((res) => {
      if (isMounted && res?.data) {
        setProjection(res.data);
      }
    });

    // 2. BroadcastChannel for sub-millisecond tab/window updates
    let channel = null;
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      channel = new BroadcastChannel('biblecast_projection_channel');
      channel.onmessage = (event) => {
        if (!isMounted) return;
        const { type, payload } = event.data || {};
        if (type === 'PROJECT_SCRIPTURE' && payload) {
          setProjection(payload);
          setPreviousStatus('projected');
        } else if (type === 'CLEAR_PROJECTION') {
          setProjection((prev) => ({ ...prev, status: 'cleared' }));
          setPreviousStatus('cleared');
        } else if (type === 'BLACKOUT_PROJECTION') {
          setProjection((prev) => ({ ...prev, status: 'blackout' }));
        }
      };
    }

    // 3. Storage event listener (multi-window sync across different origins or tabs)
    const handleStorage = (e) => {
      if (e.key === 'biblecast_active_projection' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          setProjection(parsed);
          if (parsed.status !== 'blackout') {
            setPreviousStatus(parsed.status || 'projected');
          }
        } catch (_) {}
      }
    };
    window.addEventListener('storage', handleStorage);

    // 4. Custom event for intra-window updates
    const handleLocalProjection = (e) => {
      if (e.detail) {
        setProjection(e.detail);
        if (e.detail.status !== 'blackout') {
          setPreviousStatus(e.detail.status || 'projected');
        }
      }
    };
    window.addEventListener('biblecast:projection_updated', handleLocalProjection);

    // 5. Periodic polling fallback (every 4 seconds) to ensure synchronization
    const interval = setInterval(() => {
      projectionService.getCurrent().then((res) => {
        if (!isMounted || !res?.data) return;
        setProjection((prev) => {
          // Only update if reference or status changed
          if (
            prev.reference !== res.data.reference ||
            prev.status !== res.data.status ||
            prev.text !== res.data.text
          ) {
            return res.data;
          }
          return prev;
        });
      });
    }, 4000);

    return () => {
      isMounted = false;
      if (channel) channel.close();
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('biblecast:projection_updated', handleLocalProjection);
      clearInterval(interval);
    };
  }, []);

  // Keyboard shortcut actions
  const handleToggleBlackout = useCallback(() => {
    setProjection((prev) => {
      if (prev.status === 'blackout') {
        const restored = { ...prev, status: previousStatus || 'projected' };
        projectionService.projectScripture(restored);
        return restored;
      } else {
        setPreviousStatus(prev.status);
        const blacked = { ...prev, status: 'blackout' };
        projectionService.blackout();
        return blacked;
      }
    });
  }, [previousStatus]);

  const handleClear = useCallback(() => {
    setProjection((prev) => ({ ...prev, status: 'cleared' }));
    setPreviousStatus('cleared');
    projectionService.clear();
  }, []);

  // Keyboard navigation shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignore if user is in an input field
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      if (e.key === 'b' || e.key === 'B') {
        e.preventDefault();
        handleToggleBlackout();
      } else if (e.key === 'c' || e.key === 'C') {
        e.preventDefault();
        handleClear();
      } else if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(() => {});
        } else {
          document.exitFullscreen().catch(() => {});
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleToggleBlackout, handleClear]);

  return (
    <ProjectorLayout
      onBlackout={handleToggleBlackout}
      onClear={handleClear}
      isBlackout={projection.status === 'blackout'}
    >
      <ProjectionDisplay projection={projection} />
    </ProjectorLayout>
  );
}
