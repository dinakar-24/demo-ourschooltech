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

const DEFAULT_TIMEOUT_MS = 12_000;

/**
 * Invoke a Supabase Edge Function with automatic error extraction and timeout.
 *
 * On success the full `data` payload is returned (typed as `T`).
 * On failure a user-friendly `Error` is thrown — callers can let it propagate
 * to `useMutation.onError` or catch it in components.
 */
export async function invokeEdgeFunction<T = any>(
  functionName: string,
  body: Record<string, any>,
  options?: { timeoutMs?: number },
): Promise<T> {
  const timeoutMs = options?.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  const result = await Promise.race([
    supabase.functions.invoke(functionName, { body }),
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('TIMEOUT')), timeoutMs),
    ),
  ]);

  // `result` is { data, error } from supabase
  const errorMsg = await extractEdgeFunctionError(result);
  if (errorMsg) {
    throw new Error(errorMsg);
  }

  return result.data as T;
}
