

## Optimize React Query Configuration for Large-Scale Usage

### Current State

- **QueryClient** is already configured in `App.tsx` with reasonable defaults: `staleTime: 5min`, `gcTime: 30min`, `retry: 1`, `refetchOnWindowFocus: false`.
- **35+ hooks** define per-query `staleTime` overrides (1–10 min depending on data volatility).
- **Query keys** are mostly well-structured with `schoolId` included, but some `invalidateQueries` calls use partial keys without `schoolId` (e.g., `['students']` instead of `['students', schoolId]`), which works but is less precise.
- **No global error handler** — every mutation individually does `onError: (e) => toast.error(e.message)`.
- **No dashboard prefetching** after login — the user lands on the dashboard and waits for data to load.

### Plan

#### 1. Enhanced QueryClient configuration

Update `App.tsx` QueryClient with:
- **Global `onError` for mutations**: Automatically toast `friendlyErrorMessage(error.message)` so individual hooks can drop their `onError` handlers (they remain as overrides if needed).
- **Smarter retry**: `retry: (failureCount, error) => …` — retry once on network errors, never on 4xx auth errors.
- **`refetchOnReconnect: true`** — refetch stale data when user comes back online.
- Keep existing `staleTime`/`gcTime` defaults as they're already good.

#### 2. Create query key constants

Create `src/lib/query-keys.ts` with a factory pattern for the most-used keys:

```typescript
export const queryKeys = {
  students: (schoolId: string, filters?: any) => ['students', schoolId, filters],
  studentStats: (schoolId: string) => ['student-stats', schoolId],
  adminDashboard: (schoolId: string) => ['admin-dashboard-stats', schoolId],
  teachers: (schoolId: string) => ['teachers', schoolId],
  feeInvoices: (schoolId: string, filters?: any) => ['fee-invoices', schoolId, filters],
  attendance: (schoolId: string, date: string) => ['attendance', schoolId, date],
  announcements: (schoolId: string) => ['announcements', schoolId],
  // ... etc
};
```

Update the top ~10 most-used hooks to use these constants. This prevents typo-based cache misses and ensures `schoolId` is always included.

#### 3. Dashboard data prefetching after login

Extend the existing `usePrefetchRoutes` hook (or create a companion `usePrefetchDashboardData`) that, after login, silently prefetches the role's dashboard RPC data using `queryClient.prefetchQuery()`:

- **school_admin**: `get_admin_dashboard_stats`, `get_attendance_summary`
- **teacher**: `get_teacher_dashboard_stats`
- **super_admin**: `get_super_admin_stats`
- **parent/student**: their respective child/attendance data

This runs via `requestIdleCallback` so the data is warm by the time the dashboard renders.

#### 4. Global mutation error handler

Add to QueryClient `defaultOptions.mutations.onError`:
```typescript
mutations: {
  onError: (error: Error) => {
    toast.error(friendlyErrorMessage(error.message));
  },
}
```

Then remove the ~30 identical `onError: (e) => toast.error(e.message)` handlers from individual hooks. Hooks that need custom error messages (e.g., "Approval failed: …") keep their overrides — the global handler is only a fallback.

#### Files to modify

| File | Change |
|------|--------|
| `src/App.tsx` | Enhanced QueryClient config with global mutation error handler, smart retry |
| `src/lib/query-keys.ts` | **New** — query key factory constants |
| `src/hooks/usePrefetchRoutes.ts` | Add dashboard data prefetching alongside chunk preloading |
| `src/hooks/useStudents.ts` | Use `queryKeys.students()` / `queryKeys.studentStats()` |
| `src/hooks/useTeachers.ts` | Use `queryKeys.teachers()` |
| `src/hooks/useFeeInvoices.ts` | Use `queryKeys.feeInvoices()` |
| `src/hooks/useAttendance.ts` | Use `queryKeys.attendance()` |
| `src/hooks/useAnnouncements.ts` | Use `queryKeys.announcements()` |
| ~10 mutation hooks | Remove redundant `onError` handlers (keep custom ones) |

