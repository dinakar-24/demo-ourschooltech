

## Problem: "Finding account..." hangs forever

The network logs confirm the **same stale refresh token** (`jhubcdf4vpan`) is still being retried endlessly, blocking the email lookup. The previous fix (useEffect in LoginPage) runs **too late** — the Supabase SDK reads the token from localStorage and starts retrying the moment its module is imported, which happens before any React component mounts.

## Root Cause

The Supabase client is created with `autoRefreshToken: true` at module import time. It finds the expired token in localStorage and immediately begins retry loops. By the time the React useEffect runs to clear it, the browser's connection pool (6 connections per domain) is already saturated. The email lookup fetch gets queued and aborted.

## Solution

Clear expired auth tokens from localStorage **before** the Supabase SDK loads, using an inline `<script>` in `index.html`. This runs synchronously before any ES module, so the SDK finds no token and never starts retrying.

### Changes

**1. `index.html`** — Add inline script before the module script:

```html
<script>
  // Clear expired Supabase auth tokens BEFORE the SDK loads
  // Prevents infinite refresh-token retry storms that block network
  try {
    for (var i = localStorage.length - 1; i >= 0; i--) {
      var k = localStorage.key(i);
      if (k && k.indexOf('sb-') === 0 && k.indexOf('-auth-token') > 0) {
        var v = JSON.parse(localStorage.getItem(k));
        if (v && v.expires_at && v.expires_at * 1000 < Date.now()) {
          localStorage.removeItem(k);
        }
      }
    }
  } catch(e) {}
</script>
```

**2. `src/pages/LoginPage.tsx`** — Keep the existing useEffect cleanup as a safety net (it already works correctly), no changes needed.

This is a one-line addition to index.html that prevents the SDK from ever seeing expired tokens, completely eliminating the retry storm before it starts.

