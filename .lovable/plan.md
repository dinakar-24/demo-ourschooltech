

# Fix: Login "Finding account..." Hangs Indefinitely

## Root Cause (confirmed)

The `lookup_user_by_email` RPC works perfectly at the database level (returns instantly). The problem is the **Supabase JS client internally waits for the auth session lock** (`navigator.locks`) before sending ANY request — including unauthenticated RPCs. When the AuthContext is simultaneously running `getSession()` or `onAuthStateChange`, the lock is held and the RPC call queues behind it indefinitely.

The `Promise.race` timeout (15s) then fires, showing "Request timed out." On slower devices or cold starts, the lock may not resolve at all before timeout.

## Solution: Bypass Supabase Client for Login Lookup

Since `lookup_user_by_email` is a `SECURITY DEFINER` function that doesn't need authentication, we should call it via a **direct `fetch()`** to the PostgREST endpoint instead of `supabase.rpc()`. This completely avoids the auth lock contention.

## Changes

### `src/pages/LoginPage.tsx`
Replace the `supabase.rpc('lookup_user_by_email', ...)` call with a direct fetch:

```typescript
const res = await fetch(
  `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/rpc/lookup_user_by_email`,
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    },
    body: JSON.stringify({ _email: trimmedEmail }),
  }
);
const result = await res.json();
```

This approach:
- Completely eliminates auth lock contention (no `navigator.locks` involvement)
- Uses the same anon key that `supabase.rpc()` would use
- The RPC is `SECURITY DEFINER` so it doesn't need an auth token
- Removes the need for the `Promise.race` timeout hack
- Removes the retry loop for lock errors (they can't happen anymore)
- Keeps the network error retry for genuine connectivity issues

The retry loop can be simplified to only handle actual network errors (`Failed to fetch`), and the 15-second timeout can be replaced with `AbortController` for a cleaner implementation.

## Expected Result
- "Finding account..." resolves in <1 second consistently
- No more "Request timed out" errors
- No more "Lock broken" errors
- The login flow works reliably on first attempt

