

## Fix: Stale App Loading from Old Service Worker Cache

### Root Cause
The old PWA service worker cached `index.html` and all JS bundles. When users open the app, the old service worker intercepts the request and serves the OLD cached files -- meaning the new cleanup code in `main.tsx` never executes. It's a loop: new code can't run because old code is being served.

### Solution
Move the service worker unregistration and cache cleanup into an **inline script in `index.html`** that runs BEFORE the app's JavaScript loads. Since `index.html` is always fetched fresh (we have no-cache headers), this guarantees the cleanup runs immediately.

### Changes

**1. `index.html` -- Add inline cleanup script before the app script**
- Add a `<script>` block (not module) at the top of `<body>` that:
  - Unregisters ALL service workers
  - Clears ALL Cache Storage entries  
  - If any service worker was found and unregistered, force-reloads the page to bypass the SW cache
- This runs before React loads, ensuring the old SW is killed first

**2. `src/main.tsx` -- Keep the cleanup as a safety net (no changes needed)**
- The existing cleanup in main.tsx stays as a backup
- No modifications required

### How It Works

```text
User opens app:
  1. Browser fetches index.html (no-cache headers force fresh fetch)
  2. Inline script runs IMMEDIATELY
  3. Finds old service worker -> unregisters it
  4. Clears all caches
  5. Forces page reload (bypassing SW)
  6. Second load: no SW, fresh JS bundles loaded from server
  7. App shows latest version
```

### For Existing Users
- First visit after this deploy: page will do one quick auto-reload to clear the old SW
- Every visit after that: loads instantly with latest code
- No manual cache clearing needed

