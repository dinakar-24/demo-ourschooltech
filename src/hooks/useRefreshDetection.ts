import { useState, useEffect, useRef } from 'react';

/** Detect if current page load is a browser refresh */
function isPageRefresh(): boolean {
  try {
    const entries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
    if (entries.length > 0) {
      return entries[0].type === 'reload';
    }
  } catch {
    // fallback
  }
  return false;
}

/**
 * Returns `true` while a refresh is in progress.
 * Auto-dismisses after auth settles or after a max timeout.
 */
export function useRefreshDetection(isAuthLoading: boolean) {
  const wasRefresh = useRef(isPageRefresh());
  const [showRefreshAnimation, setShowRefreshAnimation] = useState(wasRefresh.current);
  const startTime = useRef(Date.now());

  useEffect(() => {
    if (!wasRefresh.current) return;

    // Ensure minimum 800ms display so animation is visible even with cached auth
    const elapsed = Date.now() - startTime.current;
    const minDisplayMs = 800;

    if (!isAuthLoading) {
      const remaining = Math.max(minDisplayMs - elapsed, 100);
      const timer = setTimeout(() => setShowRefreshAnimation(false), remaining);
      return () => clearTimeout(timer);
    }

    // Safety: max 5s display
    const maxTimer = setTimeout(() => setShowRefreshAnimation(false), 5000);
    return () => clearTimeout(maxTimer);
  }, [isAuthLoading]);

  return showRefreshAnimation;
}
