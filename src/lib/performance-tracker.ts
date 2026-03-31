/**
 * Client-side performance tracker.
 * 
 * Tracks slow Supabase queries and logs them to the performance_logs table.
 * Fire-and-forget — never blocks the main flow.
 */

import { supabase } from '@/integrations/supabase/client';

const SLOW_QUERY_THRESHOLD_MS = 500;
let pendingLogs: Array<{ source: string; duration_ms: number; details: Record<string, any> }> = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;

async function flush() {
  if (pendingLogs.length === 0) return;
  const batch = pendingLogs.splice(0, 10);

  try {
    await supabase.from('performance_logs' as any).insert(
      batch.map(log => ({
        log_type: 'slow_query',
        source: log.source,
        duration_ms: log.duration_ms,
        details: log.details,
      }))
    );
  } catch {
    // Silently discard — performance logging must never crash
  }
}

function scheduleFlush() {
  if (flushTimer) return;
  flushTimer = setTimeout(() => {
    flushTimer = null;
    flush();
  }, 5000);
}

/**
 * Track a query/operation duration. Only logs if it exceeds the slow threshold.
 * Fire-and-forget — never throws.
 */
export function trackPerformance(
  source: string,
  durationMs: number,
  details?: Record<string, any>,
) {
  if (durationMs < SLOW_QUERY_THRESHOLD_MS) return;

  pendingLogs.push({
    source,
    duration_ms: Math.round(durationMs),
    details: {
      ...details,
      route: typeof window !== 'undefined' ? window.location.pathname : undefined,
    },
  });

  if (pendingLogs.length >= 10) {
    flush();
  } else {
    scheduleFlush();
  }
}

/**
 * Wrap a Supabase query with automatic performance tracking.
 */
export async function trackedQuery<T>(
  name: string,
  queryFn: () => Promise<T>,
): Promise<T> {
  const start = performance.now();
  try {
    const result = await queryFn();
    trackPerformance(name, performance.now() - start);
    return result;
  } catch (err) {
    trackPerformance(name, performance.now() - start, { error: (err as Error).message });
    throw err;
  }
}
