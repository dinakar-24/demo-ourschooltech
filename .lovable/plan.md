

## Problem Analysis

The "Finding account..." hang is **not** a code bug in the lookup logic. The network logs reveal the root cause:

**A stale refresh token** (`jhubcdf4vpan`) is stuck in localStorage. The Supabase auth client endlessly retries refreshing this expired token (~every 7-10 seconds), generating 20+ failing requests that saturate the browser's network connection pool. This blocks the `lookup_user_by_email` call from completing (it gets aborted with "signal is aborted without reason").

## Solution

**Clear stale auth sessions on the login page.** When the user is on the login page and is NOT authenticated, proactively sign out to purge the dead refresh token from localStorage. This stops the retry storm and frees the network for the email lookup.

### Changes

**1. `src/pages/LoginPage.tsx`** — Add a one-time cleanup effect at the top of the component:

```tsx
// Clear any stale/expired auth session that causes retry storms
useEffect(() => {
  if (!isAuthenticated && !authLoading) {
    const storageKey = `sb-${import.meta.env.VITE_SUPABASE_PROJECT_ID}-auth-token`;
    const hasStaleSession = !!localStorage.getItem(storageKey);
    if (hasStaleSession) {
      // Sign out to clear the dead refresh token
      supabase.auth.signOut().catch(() => {});
    }
  }
}, [isAuthenticated, authLoading]);
```

This adds the `supabase` import and a single `useEffect` that runs once when the login page loads. If the user isn't authenticated but there's a leftover session token, it clears it immediately, stopping the endless retry loop.

**2. `src/contexts/AuthContext.tsx`** — In the `INITIAL_SESSION` handler, when there's no valid session, explicitly clear localStorage to prevent the Supabase client from retrying with a dead token:

```tsx
if (!session?.user) {
  // Clear stale tokens that cause infinite retry loops
  const storageKey = `sb-${import.meta.env.VITE_SUPABASE_PROJECT_ID}-auth-token`;
  localStorage.removeItem(storageKey);
  setUser(null);
  setSchool(null);
  clearAuthCache();
  setIsLoading(false);
}
```

### Why this works

- The Supabase JS client stores the refresh token in localStorage and retries it aggressively on failure
- When the token is truly expired/invalid, these retries never succeed but never stop either
- Each retry consumes one of the browser's limited concurrent connections (6 per domain)
- The email lookup fetch gets queued behind these retries and times out
- Clearing the dead token on the login page stops the storm immediately

