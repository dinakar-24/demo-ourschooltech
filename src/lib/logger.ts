/**
 * Centralized client-side error logger.
 *
 * Writes to the `error_logs` table via a fire-and-forget Supabase insert.
 * Batches logs (debounced 2s) to avoid spamming the DB on cascading failures.
 */

import { supabase } from '@/integrations/supabase/client';

export type ErrorType = 'edge_function' | 'rpc' | 'auth' | 'frontend_crash' | 'network' | 'mutation';
export type Severity = 'warning' | 'error' | 'critical';

interface LogEntry {
  error_type: ErrorType;
  error_message: string;
  error_context: Record<string, any>;
  severity: Severity;
  user_id?: string;
  school_id?: string;
}

// --- Batching ---
let pendingLogs: LogEntry[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;
const FLUSH_DELAY_MS = 2_000;
const MAX_BATCH_SIZE = 20;

async function flush() {
  if (pendingLogs.length === 0) return;
  const batch = pendingLogs.splice(0, MAX_BATCH_SIZE);

  try {
    await (supabase.from('error_logs' as any) as any).insert(batch);
  } catch {
    // Logging should never throw -- silently discard on failure
  }
}

function scheduleFlush() {
  if (flushTimer) return;
  flushTimer = setTimeout(() => {
    flushTimer = null;
    flush();
  }, FLUSH_DELAY_MS);
}

// --- Auth context helpers (cached, non-reactive) ---
let cachedUserId: string | undefined;
let cachedSchoolId: string | undefined;

async function refreshAuthContext() {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    cachedUserId = session?.user?.id;
    // Try to get school_id from sessionStorage cache (set by AuthContext)
    try {
      const raw = sessionStorage.getItem('ost_auth_cache');
      if (raw) {
        const parsed = JSON.parse(raw);
        cachedSchoolId = parsed?.user?.schoolId;
      }
    } catch { /* ignore */ }
  } catch { /* ignore */ }
}

// Refresh on init
refreshAuthContext();

// --- Public API ---

/**
 * Log an error to the server. Fire-and-forget -- never throws.
 */
export function logError(
  type: ErrorType,
  message: string,
  context?: Record<string, any>,
  severity: Severity = 'error',
) {
  const entry: LogEntry = {
    error_type: type,
    error_message: message.slice(0, 2000), // cap length
    error_context: {
      ...context,
      route: typeof window !== 'undefined' ? window.location.pathname : undefined,
      user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
    },
    severity,
    user_id: cachedUserId,
    school_id: cachedSchoolId,
  };

  pendingLogs.push(entry);

  // Immediate flush if batch is full
  if (pendingLogs.length >= MAX_BATCH_SIZE) {
    flush();
  } else {
    scheduleFlush();
  }
}

/**
 * Update cached auth context (call from AuthContext when user changes).
 */
export function updateLoggerContext(userId?: string, schoolId?: string) {
  cachedUserId = userId;
  cachedSchoolId = schoolId;
}
