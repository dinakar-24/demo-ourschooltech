

## Production Performance Audit Results

### 1. Current Metrics (Dev Mode)

| Metric | Value | Status |
|--------|-------|--------|
| TTFB | 558ms | Good |
| First Contentful Paint | 1056ms | Good |
| DOM Interactive | 1041ms | Good |
| JS Heap | 5.9MB used / 14.4MB total | Healthy |
| DOM Nodes | 99 (login page) | Excellent |
| Total Resources | 96 scripts (dev mode) | Normal for Vite dev |
| Total Transfer | ~1.5MB | Acceptable |

### 2. Identified Bottlenecks

**Critical: Logo asset (427KB)**
- `src/assets/logo.png` is 427KB, the single largest resource, taking 837ms to load
- It's preloaded in `index.html`, so it blocks visual readiness
- **Fix**: Compress to ~30-50KB or convert to WebP

**High: Login timeout bug (still unfixed)**
- The `AbortController` on line 101-102 of `LoginPage.tsx` is not connected to the `supabase.rpc()` call — the Supabase SDK ignores `AbortSignal`
- If the RPC hangs, users see "Finding account..." forever
- **Fix**: Wrap RPC in `Promise.race` with a 12s timeout + 1 retry

**Medium: framer-motion (79KB) loaded on login page**
- `framer-motion` is imported eagerly via `LoginPage.tsx` animations
- This adds ~79KB to the critical path for the very first page users see
- **Fix**: Use CSS animations for login page, lazy-load framer-motion for dashboard pages only

**Low: lucide-react (158KB in dev)**
- In dev mode this is the largest script; in production, Vite tree-shakes it to only used icons. No action needed.

### 3. Architecture Assessment (Scaling to 200K Users)

**Already well-optimized:**
- All 50+ routes are lazy-loaded with `React.lazy`
- QueryClient has 5min staleTime / 30min gcTime — reduces redundant API calls
- `usePrefetchRoutes` silently preloads role-specific chunks after login
- Session caching via sessionStorage prevents redundant auth lookups
- CSS-only loading animation (no JS dependency for first paint)

**Recommended for 200K scale:**
- Add database connection pooling awareness (already handled by backend infrastructure)
- The 1000-row default query limit is fine for per-school queries but ensure paginated queries for cross-school super-admin reports
- Consider adding a service worker cache strategy for static assets beyond what VitePWA already provides

### 4. Plan of Action

#### Task 1: Fix login timeout with Promise.race
In `src/pages/LoginPage.tsx`, replace the broken `AbortController` pattern (lines 100-133) with:
- `Promise.race([rpcCall, timeoutPromise(12000)])`
- Add 1 automatic retry on timeout
- Show specific error: "Taking too long. Please check your connection."

#### Task 2: Optimize login page animations
In `src/pages/LoginPage.tsx`, replace framer-motion usage with CSS transitions/animations to remove the 79KB dependency from the critical rendering path. The login page only needs simple fade/slide effects.

#### Task 3: Document logo compression
Note for manual action: compress `src/assets/logo.png` from 427KB to under 50KB using TinyPNG or similar, then re-upload.

### Production Build Estimate

In production (with Vite bundling + tree-shaking):
- Initial JS bundle: ~200-250KB (gzipped)
- FCP: ~800ms on 4G
- TTI: ~1.2s on 4G
- Lighthouse score: 85-92 (estimated)

The app is **production-ready** with these two code fixes being the main actionable improvements.

