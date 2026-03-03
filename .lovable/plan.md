

# Fix: AuthContext `isLoading` Stuck True — Deadlock in `onAuthStateChange`

## Root Cause

The `onAuthStateChange` callback in `AuthContext.tsx` is declared `async` (line 233). According to the Supabase client internals and the known deadlock pattern:

1. `supabase.auth.onAuthStateChange(async (event, session) => {...})` is registered
2. Supabase immediately fires `INITIAL_SESSION` through this callback
3. Because the callback is `async`, it returns a Promise. The Supabase client **awaits** this Promise before releasing its internal lock
4. When `getSession()` is then called (or is already waiting), it tries to acquire the same lock → **deadlock**

Even though the `INITIAL_SESSION` event returns early (line 236), the fact that the callback is `async` means it returns `Promise<undefined>` instead of `undefined`. The client waits for the promise, and if there's any lock contention, it hangs.

For users WITH a stale localStorage token, `getSession()` is called AND `onAuthStateChange` is active → deadlock. The 4-second safety timeout eventually fires, but by then the UX is broken.

For users WITHOUT a localStorage token, `getSession()` is skipped, but `onAuthStateChange` still fires `INITIAL_SESSION` which can cause lock contention with other Supabase client operations.

## Fix

### `src/contexts/AuthContext.tsx`

1. **Make `onAuthStateChange` callback synchronous** — Remove `async` from the callback. Use fire-and-forget pattern for side effects (wrap async work in a non-awaited function call)
2. **Set up subscription BEFORE calling `getSession()`** — This is the Supabase-recommended order to avoid missing events and lock races
3. **Remove the debounce setTimeout with async callback** — Replace with synchronous state update from session, defer data fetching to a non-blocking helper

The key change pattern:
```typescript
// BEFORE (deadlock-prone):
const { data: { subscription } } = supabase.auth.onAuthStateChange(
  async (event, session) => {  // ← async causes deadlock
    const data = await fetchUserData(session.user);  // ← awaited inside callback
  }
);

// AFTER (deadlock-free):
const { data: { subscription } } = supabase.auth.onAuthStateChange(
  (_event, session) => {  // ← synchronous, no deadlock
    if (_event === 'INITIAL_SESSION') return;
    if (session?.user) {
      // Fire and forget — do NOT await
      fetchAndSetUser(session.user);
    } else {
      setUser(null);
      setSchool(null);
      setIsLoading(false);
    }
  }
);
```

## Files to Change

| File | Change |
|------|--------|
| `src/contexts/AuthContext.tsx` | Make `onAuthStateChange` callback synchronous; reorder subscription before `getSession()`; fire-and-forget async side effects |

## Expected Result
- No more deadlock — `isLoading` resolves in <100ms for unauthenticated users
- Authenticated users with stale tokens resolve within 1-2 seconds (no 4-second safety timeout needed)
- The loading spinner on `/` disappears immediately, redirecting to `/login`

