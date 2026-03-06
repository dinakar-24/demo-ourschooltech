/**
 * Centralized Edge Function API wrapper.
 *
 * – Calls `supabase.functions.invoke()` internally
 * – Adds a configurable timeout (default 12 s)
 * – Runs the response through `extractEdgeFunctionError()` and throws friendly errors
 * – Returns typed `data` on success
 */

import { supabase } from '@/integrations/supabase/client';
import { extractEdgeFunctionError, friendlyErrorMessage } from '@/lib/error-utils';
import { logError } from '@/lib/logger';

const DEFAULT_TIMEOUT_MS = 12_000;
const SLOW_THRESHOLD_MS = 5_000;

/**
 * Invoke a Supabase Edge Function with automatic error extraction, timeout,
 * performance tracking, and centralized error logging.
 */
export async function invokeEdgeFunction<T = any>(
  functionName: string,
  body: Record<string, any>,
  options?: { timeoutMs?: number },
): Promise<T> {
  const timeoutMs = options?.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const start = performance.now();

  let result: any;
  try {
    result = await Promise.race([
      supabase.functions.invoke(functionName, { body }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('TIMEOUT')), timeoutMs),
      ),
    ]);
  } catch (err) {
    const duration = Math.round(performance.now() - start);
    const msg = (err as Error).message || 'Unknown error';
    logError('edge_function', msg, { functionName, duration_ms: duration }, 'error');
    throw err;
  }

  const duration = Math.round(performance.now() - start);

  // Log slow calls as warnings
  if (duration > SLOW_THRESHOLD_MS) {
    logError('edge_function', `Slow edge function: ${functionName} (${duration}ms)`, {
      functionName, duration_ms: duration,
    }, 'warning');
  }

  const errorMsg = await extractEdgeFunctionError(result);
  if (errorMsg) {
    logError('edge_function', errorMsg, {
      functionName, duration_ms: duration,
    }, 'error');
    throw new Error(errorMsg);
  }

  return result.data as T;
}
