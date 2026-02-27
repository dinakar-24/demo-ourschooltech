

## Fix: App Always Showing Previous Cached Version

### Root Cause
The PWA service worker precaches all JS and CSS files (`globPatterns: ["**/*.{js,css,...}"]`). When a new version is deployed, the old service worker still serves cached JS bundles until it updates -- which happens asynchronously AFTER the page has already loaded with stale code.

### Solution: Remove PWA Precaching Entirely

Since this is a school management app (not an offline-first app), precaching assets causes more harm than good. Users should always get the latest build.

### Changes

**1. `vite.config.ts` -- Disable precaching, keep only runtime caching for API calls**
- Remove `globPatterns` (stops precaching JS/CSS/images)
- Remove `maximumFileSizeToCacheInBytes` (no longer needed)
- Keep `navigateFallback: null` and `NetworkOnly` for HTML
- Keep `NetworkFirst` for backend API calls only
- This means the service worker will NOT cache any app assets -- every load fetches fresh files from the server

**2. `src/main.tsx` -- Aggressively unregister old service workers and clear ALL caches**
- On every app load, unregister ALL existing service workers (not just update them)
- Delete ALL cache storage entries (not just precache/workbox ones)
- This ensures any previously installed service worker from older deploys is fully removed
- The PWA will still work for "Add to Home Screen" but won't cache stale files

### Technical Detail

```text
Before (problematic):
  User opens app -> Service worker intercepts -> Serves OLD cached JS -> Page renders OLD UI
  Service worker checks for update in background -> Downloads new SW -> Activates on NEXT visit

After (fixed):
  User opens app -> No precached assets -> Browser fetches FRESH JS from server -> Page renders LATEST UI
  Old service workers and caches are cleaned up on every load
```

### What Users Will Experience
- Every app open loads the latest version instantly
- No more "clear cache" needed after updates
- Slightly longer initial load (no precache) but always fresh -- acceptable tradeoff for 200K+ users who need accurate, up-to-date UI
- "Add to Home Screen" PWA functionality still works (manifest is kept)

