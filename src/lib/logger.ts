/**
 * Centralized client-side error logger.
 *
 * Writes to the `error_logs` table via safe_log_client_error RPC.
 * Batches logs (debounced 2s) to avoid spamming the DB on cascading failures.
 * Never exposes sensitive data in logs.
 */

import { supabase } from '@/integrations/supabase/client';

export type ErrorType = 'edge_function' | 'rpc' | 'auth' | 'frontend_crash' | 'network' | 'mutation';
export type Severity = 'warning' | 'error' | 'critical';

interface LogEntry {
  error_type: ErrorType;
  error_message: string;
  error_context: Record<string, any>;
  severity: Severity;
}

// --- Batching ---
let pendingLogs: LogEntry[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;
const FLUSH_DELAY_MS = 2_000;
const MAX_BATCH_SIZE = 20;

/** Sanitize context to remove sensitive data before logging */
function sanitizeContext(ctx: Record<string, any>): Record<string, any> {
  const sanitized: Record<string, any> = {};
  const SENSITIVE_KEYS = new Set(['password', 'token', 'secret', 'authorization', 'cookie', 'otp', 'api_key']);
  
  for (const [key, value] of Object.entries(ctx)) {
    if (SENSITIVE_KEYS.has(key.toLowerCase())) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'string' && value.length > 500) {
      sanitized[key] = value.slice(0, 500) + '...';
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

async function flush() {
  if (pendingLogs.length === 0) return;
  const batch = pendingLogs.splice(0, MAX_BATCH_SIZE);

  for (const entry of batch) {
    try {
      await supabase.rpc('safe_log_client_error', {
        _error_type: entry.error_type.slice(0, 100),
        _error_message: entry.error_message.slice(0, 1000),
        _severity: entry.severity === 'critical' ? 'error' : entry.severity,
        _context: entry.error_context,
      });
    } catch {
      // Logging should never throw -- silently discard on failure
    }
  }
}

function scheduleFlush() {
  if (flushTimer) return;
  flushTimer = setTimeout(() => {
    flushTimer = null;
    flush();
  }, FLUSH_DELAY_MS);
}

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
    error_message: message.slice(0, 1000),
    error_context: sanitizeContext({
      ...context,
      route: typeof window !== 'undefined' ? window.location.pathname : undefined,
    }),
    severity,
  };

  pendingLogs.push(entry);

  // Cap to prevent memory bloat
  if (pendingLogs.length > 100) {
    pendingLogs = pendingLogs.slice(-50);
  }

  // Immediate flush if batch is full
  if (pendingLogs.length >= MAX_BATCH_SIZE) {
    flush();
  } else {
    scheduleFlush();
  }
}

/**
 * Update cached auth context (call from AuthContext when user changes).
 * Note: user_id and school_id are now set automatically by the RPC using auth.uid()
 */
export function updateLoggerContext(_userId?: string, _schoolId?: string) {
  // No-op: the safe_log_client_error RPC automatically uses auth.uid()
}
