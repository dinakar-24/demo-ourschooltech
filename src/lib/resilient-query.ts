/**
 * Resilient query utilities.
 *
 * Provides helpers for React Query to gracefully handle failures:
 * - Show stale/cached data when network fails
 * - Safe defaults for missing data
 * - Network-aware query options
 */

import { useEffect, useState } from 'react';

// ── Network status ──────────────────────────────────────────────────

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  return isOnline;
}

// ── Safe data accessors ─────────────────────────────────────────────

/** Returns data or a fallback, preventing UI crashes from null/undefined. */
export function safeData<T>(data: T | undefined | null, fallback: T): T {
  return data ?? fallback;
}

/** Safely access nested properties without crashing. */
export function safeGet<T>(obj: any, path: string, fallback: T): T {
  try {
    const value = path.split('.').reduce((acc, key) => acc?.[key], obj);
    return value ?? fallback;
  } catch {
    return fallback;
  }
}

// ── Resilient query config presets ──────────────────────────────────

/** Query options for critical data that must show even if stale. */
export const criticalQueryOptions = {
  staleTime: 10 * 60 * 1000,       // 10 min - keep showing longer
  gcTime: 60 * 60 * 1000,          // 1 hour - preserve cache longer
  refetchOnMount: true,
  retry: 2,
  retryDelay: (attempt: number) => Math.min(1000 * Math.pow(2, attempt), 10000),
} as const;

/** Query options for non-critical data that can fail silently. */
export const optionalQueryOptions = {
  staleTime: 15 * 60 * 1000,
  gcTime: 30 * 60 * 1000,
  refetchOnMount: false,
  retry: 1,
  meta: { suppressErrors: true },
} as const;

/** Query options for real-time data that needs to be fresh. */
export const realtimeQueryOptions = {
  staleTime: 30 * 1000,            // 30 seconds
  gcTime: 5 * 60 * 1000,
  refetchOnMount: 'always' as const,
  refetchInterval: 60 * 1000,      // Auto-refresh every minute
  retry: 1,
} as const;
