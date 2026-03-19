

# Cold Start Performance Fix

## Root Cause Analysis

The performance profile reveals the exact bottlenecks causing the 6+ second cold start:

### Critical Finding 1: Triple duplicate RPC calls
`get_user_auth_data` is called **3 times** on every cold start, each taking ~1.2-1.4 seconds:
- Once from `onAuthStateChange` callback (fires on INITIAL_SESSION event)  
- Once from `getSession().then()` explicit check
- Once more from a re-render triggered by state updates

This alone wastes ~2.5 seconds of network time and creates unnecessary load.

### Critical Finding 2: Blocking font import
Line 1 of `index.css` uses `@import url('https://fonts.googleapis.com/...')` which **blocks all CSS rendering** until the font stylesheet downloads (~1.4 seconds measured). Nothing paints until this completes.

### Critical Finding 3: Oversized logo preload
The preloaded logo (`/src/assets/logo.png`) is **427KB** — contending with critical resources during initial load.

### Critical Finding 4: No DNS preconnect
The Supabase domain requires a fresh DNS lookup + TLS handshake on cold start before any API call can begin.

---

## Fix Plan

### 1. Eliminate duplicate `get_user_auth_data` calls
**File: `src/contexts/AuthContext.tsx`**
- Add a `useRef` deduplication guard (`fetchInFlightRef`) so only ONE `fetchUserData` call runs at a time
- Remove the explicit `getSession().then(fetchUserData)` call — the `onAuthStateChange` with `INITIAL_SESSION` event already handles this
- Keep the sessionStorage cache for instant UI restoration; background refresh should not re-trigger if a fetch is already in progress

### 2. Move font loading to non-blocking
**File: `src/index.css`** — Remove line 1 (`@import url(...)`)
**File: `index.html`** — Add non-blocking font loading:
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="preload" as="style" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap" onload="this.onload=null;this.rel='stylesheet'">
<noscript><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap"></noscript>
```

### 3. Add DNS preconnect for backend
**File: `index.html`** — Add before other links:
```html
<link rel="preconnect" href="https://oxqkmugovmqcuosimbzz.supabase.co">
<link rel="dns-prefetch" href="https://oxqkmugovmqcuosimbzz.supabase.co">
```

### 4. Remove oversized logo preload  
**File: `index.html`** — Remove the `<link rel="preload" as="image" href="/src/assets/logo.png" />` line. A 427KB image should not compete with critical JS/CSS resources.

---

## Expected Impact

| Metric | Before | After (estimated) |
|--------|--------|-------------------|
| FCP | 1436ms | ~600-800ms |
| DOM Content Loaded | 6007ms | ~2500-3500ms |
| RPC calls | 3x | 1x |
| Font blocking time | ~1400ms | 0ms (async) |
| Preload contention | 427KB logo | Removed |

