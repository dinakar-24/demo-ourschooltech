

## Problem: "Finding account..." hangs — Real Root Cause

The stale token fix is working (no token refresh requests in network logs). The actual problem is different:

1. **Pre-warm HEAD requests compete with the lookup request** — they fire simultaneously at page load and on click, consuming browser connections
2. **The 10-second AbortController timeout per retry** means the user waits up to 23 seconds (3 retries × timeout + delays) before seeing any error
3. **The Supabase project may be cold/paused**, and the pre-warm doesn't help because it fails too
4. I confirmed the `lookup_user_by_email` RPC works correctly on the server — this is a client-side network timing issue

## Solution

### 1. Remove pre-warm HEAD requests (`LoginPage.tsx`, lines 81-91)
These provide zero value when they fail (which they do). They consume browser connections that the actual lookup needs. Delete the entire `useEffect` block and `warmedRef`.

### 2. Simplify and speed up the lookup (`LoginPage.tsx`, lines 163-226)
- Reduce timeout from **10 seconds → 5 seconds** per attempt
- Reduce retries from **3 → 2** (max wait ~12s instead of ~33s)
- Use the **Supabase SDK** (`supabase.rpc()`) instead of raw `fetch()` — the SDK handles connection pooling and retries more efficiently, and avoids potential CORS or connection-sharing issues with manual fetch

### 3. Clean up stale token useEffect (`LoginPage.tsx`, lines 63-79)
Keep but simplify — the `index.html` script already handles this, so make this a lightweight safety net only.

### Changes Summary

**`src/pages/LoginPage.tsx`**:
- Delete pre-warm HEAD useEffect (lines 81-91)
- Replace raw `fetch()` lookup with `supabase.rpc('lookup_user_by_email', { _email })` — simpler, uses the SDK's built-in connection management
- Reduce timeout to 5 seconds, retries to 2
- If the first attempt gets a network error, retry once after 1 second, then show error immediately

The key insight: using `supabase.rpc()` instead of raw `fetch()` leverages the SDK's connection pool which is already established, rather than competing for new connections.

