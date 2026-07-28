/**
 * Client-side performance tracker.
 * 
 * Tracks slow Supabase queries and logs them via safe_log_client_event RPC.
 * Fire-and-forget — never blocks the main flow.
 */

import { supabase } from '@/integrations/supabase/client';

const SLOW_QUERY_THRESHOLD_MS = 500;
let pendingLogs: Array<{ source: string; duration_ms: number; details: Record<string, any> }> = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;

async function flush() {
  if (pendingLogs.length === 0) return;
  const batch = pendingLogs.splice(0, 10);

  for (const log of batch) {
    try {
      await supabase.rpc('safe_log_client_event', {
        _event_type: 'slow_query',
        _source: log.source.slice(0, 200),
        _duration_ms: Math.min(log.duration_ms, 600000),
        _details: log.details,
      });
    } catch {
      // Silently discard — performance logging must never crash
    }
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
    source: source.slice(0, 200),
    duration_ms: Math.round(durationMs),
    details: details ?? {},
  });

  // Cap pending logs to prevent memory bloat
  if (pendingLogs.length > 50) {
    pendingLogs = pendingLogs.slice(-50);
  }

  scheduleFlush();
}
