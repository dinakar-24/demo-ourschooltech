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

  useEffect(() => {
    if (!wasRefresh.current) return;

    // Once auth is no longer loading, hide after a small delay for smoothness
    if (!isAuthLoading) {
      const timer = setTimeout(() => setShowRefreshAnimation(false), 400);
      return () => clearTimeout(timer);
    }

    // Safety: max 5s display
    const maxTimer = setTimeout(() => setShowRefreshAnimation(false), 5000);
    return () => clearTimeout(maxTimer);
  }, [isAuthLoading]);

  return showRefreshAnimation;
}
