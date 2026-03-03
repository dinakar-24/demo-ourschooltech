

# Scale Login for 200K+ Concurrent Users — Maximum Speed

## Current State
The login flow is already well-optimized: cache-first auth, splash bypass for returning users, deferred theme queries, neutral HTML shell. But there are still bottlenecks when 200K+ users hit the system simultaneously.

## Remaining Bottlenecks

| Issue | Impact |
|-------|--------|
| `lookup_user_by_email` RPC does a `LEFT JOIN` on profiles + schools + user_roles with no guaranteed index on `profiles.email` | Slow under load — full table scan on 200K+ profiles |
| `get_user_auth_data` RPC joins profiles + user_roles + schools every refresh | Redundant when cache is fresh — still fires on every page load |
| ThemeProvider calls `supabase.auth.getSession()` independently from AuthContext — duplicate network call | 2x auth round-trips on boot |
| `LoginPage` eagerly imports `SuperAdminOTPLogin`, `ForgotPasswordDialog`, `LoginSplash` — only needed conditionally | Bloats initial JS bundle for 99% of users |
| TenantContext fires `get_school_by_code` RPC on every load even on non-subdomain (exits early but still initializes) | Minor but unnecessary |
| AuthContext `fetchUserData` runs on every `SIGNED_IN` / `TOKEN_REFRESHED` event even when data hasn't changed | Redundant RPC calls under token refresh storms |

## Plan

### 1. Add Database Index on `profiles.email`
Create a migration adding a unique index on `profiles.email`. The `lookup_user_by_email` RPC filters by `p.email = _email` — without an index this is a sequential scan on 200K+ rows.

```sql
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
```

### 2. Skip `fetchUserData` on Token Refresh
In `AuthContext.tsx`, when `onAuthStateChange` fires with `TOKEN_REFRESHED` event and we already have a valid cached user, skip the RPC call entirely. Only re-fetch on `SIGNED_IN` / `SIGNED_OUT`.

### 3. Eliminate Duplicate `getSession()` in ThemeProvider
ThemeProvider currently calls `supabase.auth.getSession()` to determine `hasAuth`. Instead, accept auth state from AuthContext or listen only to `onAuthStateChange` without the initial `getSession()` call (since AuthContext already handles that). Use a simple ref to track if any SIGNED_IN event has occurred.

### 4. Lazy-Load Conditional Login Components
Split `SuperAdminOTPLogin`, `ForgotPasswordDialog`, and `LoginSplash` into lazy imports within `LoginPage.tsx`. These are used by <1% of login attempts but currently loaded for every user.

```tsx
const SuperAdminOTPLogin = lazy(() => import('@/components/auth/SuperAdminOTPLogin'));
const ForgotPasswordDialog = lazy(() => import('@/components/auth/ForgotPasswordDialog'));
const LoginSplash = lazy(() => import('@/components/login/LoginSplash'));
```

### 5. Debounce/Deduplicate Auth State Handling
When multiple tabs or token refreshes cause rapid `onAuthStateChange` events, batch them with a short debounce (50ms) to prevent RPC storms against `get_user_auth_data`.

### 6. Cache `lookup_user_by_email` Result in SessionStorage
After a successful email lookup, cache the result keyed by email. On the next login attempt with the same email (e.g., after a password error), skip the RPC entirely and use the cached school info. Clear on logout.

## Files to Change

| File | Change |
|------|--------|
| Migration SQL | Add index on `profiles.email` |
| `src/contexts/AuthContext.tsx` | Skip fetchUserData on TOKEN_REFRESHED when cached; debounce auth events |
| `src/components/ThemeProvider.tsx` | Remove duplicate `getSession()`, use only `onAuthStateChange` |
| `src/pages/LoginPage.tsx` | Lazy-load SuperAdminOTPLogin, ForgotPasswordDialog, LoginSplash; cache email lookup |

## Expected Impact
- **Email lookup**: O(1) indexed lookup vs sequential scan — 100x faster at scale
- **Token refresh**: Zero RPC calls (cached) vs 1 RPC per refresh
- **Initial bundle**: ~30-50KB less JS parsed on login page
- **Auth boot**: 1 `getSession()` call instead of 2
- **Repeated login attempts**: Instant school branding from cache

