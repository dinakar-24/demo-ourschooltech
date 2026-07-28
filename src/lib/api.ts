/**
 * Centralized Edge Function API wrapper.
 *
 * – Calls `supabase.functions.invoke()` internally
 * – Adds a configurable timeout (default 12 s)
 * – Runs the response through `extractEdgeFunctionError()` and throws friendly errors
 * – Returns typed `data` on success
 * – Supports exponential backoff retry for transient failures
 * – Deduplicates concurrent identical requests
 */

import { supabase } from '@/integrations/supabase/client';
import { extractEdgeFunctionError, friendlyErrorMessage } from '@/lib/error-utils';
import { logError } from '@/lib/logger';

const DEFAULT_TIMEOUT_MS = 12_000;
const SLOW_THRESHOLD_MS = 5_000;

// ── Request deduplication ────────────────────────────────────────────
const inflightRequests = new Map<string, Promise<any>>();

function getDedupeKey(fn: string, body: Record<string, any>): string {
  try {
    return `${fn}:${JSON.stringify(body)}`;
  } catch {
    return `${fn}:${Date.now()}`;
  }
}

// ── Retry helpers ────────────────────────────────────────────────────
const RETRYABLE_PATTERNS = /timeout|network|fetch|econnreset|socket hang up|5\d{2}|service unavailable/i;
const NON_RETRYABLE_PATTERNS = /40[0-3]|unauthorized|forbidden|not found|validation|invalid|already exists/i;

function isRetryable(error: Error): boolean {
  const msg = error.message || '';
  if (NON_RETRYABLE_PATTERNS.test(msg)) return false;
  if (RETRYABLE_PATTERNS.test(msg)) return true;
  return false;
}

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

interface InvokeOptions {
  timeoutMs?: number;
  /** Max retries for transient failures (default 2) */
  maxRetries?: number;
  /** Skip deduplication (for mutations) */
  skipDedupe?: boolean;
}

/**
 * Invoke a Supabase Edge Function with automatic error extraction, timeout,
 * performance tracking, exponential backoff retry, and request deduplication.
 */
export async function invokeEdgeFunction<T = any>(
  functionName: string,
  body: Record<string, any>,
  options?: InvokeOptions,
): Promise<T> {
  const { timeoutMs = DEFAULT_TIMEOUT_MS, maxRetries = 2, skipDedupe = false } = options ?? {};

  // Deduplication: if an identical request is already in flight, reuse it
  const dedupeKey = skipDedupe ? null : getDedupeKey(functionName, body);
  if (dedupeKey && inflightRequests.has(dedupeKey)) {
    return inflightRequests.get(dedupeKey)!;
  }

  const execute = async (): Promise<T> => {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      if (attempt > 0) {
        // Exponential backoff: 500ms, 1500ms
        const delay = Math.min(500 * Math.pow(2, attempt - 1), 5000);
        await sleep(delay + Math.random() * 200); // jitter
      }

      const start = performance.now();
      try {
        const result = await Promise.race([
          supabase.functions.invoke(functionName, { body }),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('TIMEOUT')), timeoutMs),
          ),
        ]);

        const duration = Math.round(performance.now() - start);

        // Log slow calls as warnings
        if (duration > SLOW_THRESHOLD_MS) {
          logError('edge_function', `Slow edge function: ${functionName} (${duration}ms)`, {
            functionName, duration_ms: duration, attempt,
          }, 'warning');
        }

        const errorMsg = await extractEdgeFunctionError(result);
        if (errorMsg) {
          const err = new Error(errorMsg);
          if (attempt < maxRetries && isRetryable(err)) {
            lastError = err;
            continue;
          }
          logError('edge_function', errorMsg, { functionName, duration_ms: duration }, 'error');
          throw err;
        }

        return result.data as T;
      } catch (err) {
        const duration = Math.round(performance.now() - start);
        lastError = err as Error;

        if (attempt < maxRetries && isRetryable(lastError)) {
          logError('edge_function', `Retrying ${functionName} (attempt ${attempt + 1}): ${lastError.message}`, {
            functionName, duration_ms: duration, attempt,
          }, 'warning');
          continue;
        }

        logError('edge_function', lastError.message, { functionName, duration_ms: duration, attempt }, 'error');
        throw lastError;
      }
    }

    throw lastError ?? new Error('Unknown error');
  };

  const promise = execute().finally(() => {
    if (dedupeKey) inflightRequests.delete(dedupeKey);
  });

  if (dedupeKey) inflightRequests.set(dedupeKey, promise);
  return promise;
}
