

# Ultra-Fast App Experience Optimization

## Current State Analysis

The app currently has three major performance bottlenecks:
1. **Monolithic bundle** -- All 50+ page components are eagerly imported in App.tsx, forcing every user to download the entire app regardless of role
2. **Aggressive re-fetching** -- React Query is configured with `staleTime: 0` and `refetchOnMount: 'always'`, causing redundant network requests on every navigation
3. **No data persistence** -- When users reopen the app, everything is fetched from scratch; there is no local cache

---

## Changes Overview

### 1. Lazy Loading All Page Routes (App.tsx)

Replace all 50+ static page imports with `React.lazy()` and wrap routes in `Suspense`. This alone will cut the initial JS bundle by ~60-70%.

- Keep eagerly loaded: LoginPage, SubdomainLanding, TenantErrorPage, NotFound (small, needed immediately)
- Lazy load: All admin, teacher, parent, student, and super-admin pages
- Add a minimal full-screen spinner as the Suspense fallback

### 2. Intelligent React Query Caching (App.tsx)

Update the QueryClient defaults to avoid redundant fetching:

```text
staleTime: 0          -->  5 * 60 * 1000  (5 minutes)
refetchOnMount: 'always' -->  true (only refetch if stale)
refetchOnWindowFocus: true -->  false
gcTime (new): 30 * 60 * 1000  (keep unused cache for 30 min)
```

This means previously visited pages show cached data instantly and refresh silently when stale.

### 3. Session & Auth Data Caching (AuthContext.tsx)

Cache the authenticated user's profile data in `sessionStorage` so that on app reopen:
- The cached user/school data renders instantly (no blank screen)
- A background refresh updates the data silently
- If the refresh returns different data, the state updates seamlessly

### 4. Predictive Preloading Hook (new file)

Create a `usePrefetchRoutes` hook that, after login, preloads the lazy chunks for the user's role-specific pages in the background using `requestIdleCallback`. For example, a parent login would silently load ParentDashboard, ParentAttendance, ParentFees, etc.

### 5. Stale-While-Revalidate Pattern for Key Data

For high-frequency hooks (useStudents, useAttendance, useFees, useHomework, useAnnouncements), add per-hook `staleTime` overrides:
- Dashboard stats: 2 minutes stale, background refresh
- Student lists: 5 minutes stale
- Announcements/notifications: 1 minute stale
- This ensures users see data instantly while fresh data loads silently

### 6. Optimized Initial HTML Shell (index.html)

Add an inline CSS loading skeleton directly in `index.html` inside the `#root` div. This renders a branded header + content placeholder before any JS executes, eliminating the white flash.

---

## Files to Modify

| File | Change |
|------|--------|
| `src/App.tsx` | Lazy imports, Suspense wrapper, updated QueryClient config |
| `src/contexts/AuthContext.tsx` | sessionStorage caching for instant reopen |
| `index.html` | Inline loading skeleton in #root |
| `src/hooks/usePrefetchRoutes.ts` | **New** -- predictive module preloading by role |

## What This Does NOT Include

- Offline-first with service workers (PWA was intentionally removed; adding it back requires a separate decision)
- IndexedDB data persistence (significant complexity; the sessionStorage + React Query gcTime approach covers 90% of the benefit)
- Action queuing for offline mode (requires backend changes)

These can be added as a Phase 2 if needed.

## Expected Impact

- **First paint**: Near-instant (inline skeleton in HTML)
- **Initial JS bundle**: Reduced ~60-70% via code splitting
- **Page transitions**: Instant for cached data, preloaded chunks
- **App reopen**: Cached auth + cached queries = no loading screen
- **Server pressure**: Dramatically reduced via 5-min stale windows and no window-focus refetching
- **Navigation**: No full reloads, layouts persist, data stays in cache

