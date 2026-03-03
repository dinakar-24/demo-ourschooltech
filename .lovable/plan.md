

# Fix: Eliminate Loading Flash on Refresh + Optimize for 200K+ Users

## Problem

When refreshing on `/login`, users see three sequential loading states:
1. **HTML shell** (green header bar + spinner — looks like a dashboard, not a login page)
2. **Auth loading spinner** (dark screen with spinner while `getSession()` resolves)
3. **Splash animation** before the email input appears

For 200K+ users across 100+ schools on PWA, every millisecond counts. The current flow adds 2-4 seconds of perceived delay.

## Root Causes

1. **HTML shell in `index.html`** has a green dashboard-style header — misleading on login page
2. **LoginPage waits for `authLoading`** to finish before rendering anything (lines 89-95) — unnecessary because if there's no cached session, we should show login immediately
3. **ThemeProvider fires 2 DB queries on every page load** (`system_settings` + `school theme`) — even for unauthenticated users on login page
4. **AuthContext session cache** only checks sessionStorage, but the real bottleneck is `supabase.auth.getSession()` + the `get_user_auth_data` RPC

## Plan

### 1. Neutral HTML Loading Shell
Replace the green dashboard-header shell in `index.html` with a minimal, role-neutral spinner (just a centered spinner on a neutral background). This way any page refresh looks clean, not like a broken dashboard.

### 2. Skip Auth Loading on Login Page
In `LoginPage.tsx`, instead of showing a spinner while `authLoading` is true, immediately render the login UI. The redirect-on-auth effect already handles the case where a session exists. This eliminates the dark spinner entirely for unauthenticated users.

### 3. Defer ThemeProvider DB Queries for Unauthenticated Users
In `ThemeProvider.tsx`, make the `system_settings` and `school-theme` queries `enabled: false` until there's an authenticated session. Unauthenticated users on the login page don't need school colors — those are set by the login flow itself.

### 4. Optimize Auth Cache Restoration
In `AuthContext.tsx`, when the sessionStorage cache exists and is fresh (<5 min), skip the loading state entirely and render immediately with cached data. The background `getSession()` will silently refresh if needed. Currently the cache restores state but still sets `isLoading` during the session check.

### 5. Remove LoginSplash Delay for Returning Users
If the user has visited before (check localStorage flag), skip the splash animation and go directly to the email step. First-time visitors still see the branded splash.

## Files to Change

| File | Change |
|------|--------|
| `index.html` | Replace dashboard-style shell with neutral centered spinner |
| `src/pages/LoginPage.tsx` | Remove `authLoading` gate; skip splash for returning users |
| `src/components/ThemeProvider.tsx` | Gate DB queries behind auth state |
| `src/contexts/AuthContext.tsx` | Trust cache more aggressively — `isLoading=false` when cache is fresh |

## Expected Result
- **First paint → interactive login**: Under 500ms (currently 2-4s)
- **Returning authenticated user refresh**: Under 1s to dashboard (cache-first)
- **Zero unnecessary DB calls** for unauthenticated visitors
- **Consistent loading appearance** regardless of route

