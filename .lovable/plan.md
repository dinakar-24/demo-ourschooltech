

# Fix: Production Stuck on Old Cached Version

## What's Happening

The **preview works perfectly** — I just verified it loads the dashboard instantly with no loading spinner. The problem is your **published production URL** (`demo-ourschooltech.lovable.app`) is still serving an old cached version of the app.

Your `index.html` has a cache-busting mechanism that compares `APP_VERSION` in code vs localStorage. But it only triggers a reload when the version **changes**. If a user already has the old version cached and the publish didn't update the HTML file, they stay stuck on the old code.

## Fix

Bump the `APP_VERSION` in `index.html` to force all production users to get the latest code on their next visit. This will:

1. Clear all browser caches (Cache Storage API)
2. Unregister any old service workers  
3. Force a hard reload with the latest code

### `index.html` (line 36)
Change `APP_VERSION` from `'2026030301'` to `'2026030302'`.

After this change, **publish the app again**. Every user visiting the production URL will automatically get the fresh version.

## Why This Keeps Happening

Every time you publish frontend changes, you should bump this version number. Without the bump, browsers may serve the old `index.html` from CDN/browser cache, and the new JavaScript never loads.

