

## Production Monitoring and Observability

### Current State

- **Error handling** is centralized (`error-utils.ts`, `api.ts`) but errors are only shown to users via toasts -- nothing is logged server-side for later analysis.
- **Audit logs** exist for CRUD operations (via DB triggers) but not for API errors, edge function failures, or auth issues.
- **Login attempts** are tracked in a `login_attempts` table (used for rate limiting) but not surfaced in any dashboard.
- **No React Error Boundary** exists anywhere in the app.
- **No system health dashboard** -- the Super Admin dashboard shows business stats only.

### Plan

#### 1. Create `error_logs` table for centralized server-side error logging

A new database table to capture API errors, edge function failures, and auth issues:

```sql
CREATE TABLE public.error_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  error_type text NOT NULL,        -- 'edge_function' | 'rpc' | 'auth' | 'frontend_crash' | 'network'
  error_message text NOT NULL,
  error_context jsonb DEFAULT '{}', -- function name, route, user agent, stack trace, etc.
  user_id uuid,
  school_id uuid,
  severity text NOT NULL DEFAULT 'error'  -- 'warning' | 'error' | 'critical'
);
```

RLS: Super admins can SELECT; authenticated users can INSERT (so the client can log errors). No UPDATE/DELETE.

#### 2. Create `src/lib/logger.ts` -- Client-side logging utility

A lightweight module that writes to `error_logs` via a fire-and-forget Supabase insert:

- `logError(type, message, context?)` -- inserts into `error_logs`, never throws
- Batches logs (debounced 2s) to avoid spamming the DB on cascading failures
- Automatically attaches `user_id`, `school_id` from auth context, plus `user_agent` and current route

#### 3. Integrate logging into existing error infrastructure

| Location | What gets logged |
|----------|-----------------|
| `src/lib/api.ts` (`invokeEdgeFunction`) | Edge function errors with function name, status, duration |
| `src/App.tsx` (QueryClient `mutations.onError`) | All mutation failures |
| `src/contexts/AuthContext.tsx` (`login`) | Failed login attempts with email (not password) |
| `src/lib/error-utils.ts` (`extractEdgeFunctionError`) | Raw error details before mapping to friendly message |

The existing user-facing behavior (toasts) stays unchanged. Logging is additive, not replacing anything.

#### 4. Add performance tracking to `invokeEdgeFunction`

Extend `src/lib/api.ts` to measure duration of each edge function call and log slow calls (>5s) as warnings. This uses `performance.now()` -- zero overhead for fast calls.

#### 5. Create global React Error Boundary

New `src/components/ErrorBoundary.tsx`:
- Catches unhandled React render errors
- Logs the error + component stack to `error_logs` with type `'frontend_crash'`
- Shows a friendly fallback UI with "Reload" button
- Wrap the app in `App.tsx` around `<AppRoutes />`

#### 6. Create Super Admin System Health page

New route `/super-admin/system-health` with `SystemHealthPage.tsx`:

- **Error Rate Chart**: Count of errors per hour (last 24h) using recharts (already installed)
- **Recent Errors Table**: Last 50 errors with type, message, user, timestamp -- filterable by type/severity
- **Login Activity**: Failed login count from `login_attempts` table (last 24h)
- **Edge Function Performance**: Average/p95 duration from logged metrics
- Add link to Super Admin sidebar navigation

#### Files to create/modify

| File | Change |
|------|--------|
| **Database migration** | Create `error_logs` table + RLS policies |
| `src/lib/logger.ts` | **New** -- fire-and-forget error logging utility |
| `src/components/ErrorBoundary.tsx` | **New** -- global React error boundary |
| `src/pages/super-admin/SystemHealthPage.tsx` | **New** -- monitoring dashboard |
| `src/lib/api.ts` | Add duration tracking + error logging |
| `src/App.tsx` | Wrap with ErrorBoundary, add SystemHealth route, add logging to global mutation handler |
| `src/contexts/AuthContext.tsx` | Log failed login attempts |
| `src/components/layout/SuperAdminLayout.tsx` | Add "System Health" menu item |

