

# Performance Audit & Optimization Plan

## Executive Summary
Your app has a solid foundation (RPC-based dashboard stats, pagination, query key factory, prefetch on login) but has several critical bottlenecks that will degrade performance at scale.

---

## CRITICAL ISSUES

### 1. FeesPage fetches 500 rows twice per load (pageSize: 500)

**Problem**: `FeesPage.tsx` loads `useFeeInvoices` AND `useFees` both with `pageSize: 500`, plus joins to students, components, and payments. This means up to 1000 rows with nested relations loaded at once — easily 1-2MB of JSON.

**Fix**: Reduce to `pageSize: 25` with proper server-side pagination. The `useInvoiceStats` RPC already provides summary stats. Remove the legacy `useFees` call entirely or merge at the database level.

```tsx
// Before
useFeeInvoices({ pageSize: 500 });
useFees({ pageSize: 500 });

// After
useFeeInvoices({ page, pageSize: 25 });
// Remove useFees — use fee_invoices as single source of truth
```

### 2. useInvoiceStats fetches ALL invoices client-side to compute stats

**Problem**: `useInvoiceStats()` pulls every `fee_invoices` row for the school (`select('total_amount, paid_amount, balance, status, due_date')`) then reduces them in JavaScript. For 5000 students × 4 terms = 20,000 rows transferred just for 4 numbers.

**Fix**: Replace with a server-side RPC (you already have `get_fee_stats` for the legacy `fees` table — create an equivalent for `fee_invoices`, or use the existing one).

```sql
-- New RPC: get_invoice_stats
CREATE OR REPLACE FUNCTION get_invoice_stats(_school_id uuid)
RETURNS json LANGUAGE sql STABLE SECURITY DEFINER SET search_path = 'public' AS $$
  SELECT json_build_object(
    'totalDue', COALESCE(SUM(total_amount), 0),
    'collected', COALESCE(SUM(paid_amount), 0),
    'pending', COALESCE(SUM(CASE WHEN status != 'paid' AND due_date >= CURRENT_DATE THEN balance ELSE 0 END), 0),
    'overdue', COALESCE(SUM(CASE WHEN status != 'paid' AND due_date < CURRENT_DATE THEN balance ELSE 0 END), 0)
  ) FROM fee_invoices WHERE school_id = _school_id;
$$;
```

### 3. TodaysSummary and PendingTasks use raw useEffect+setState (no caching)

**Problem**: Both components bypass React Query — they use `useEffect` with `useState` and make direct Supabase calls. Every re-render/navigation re-fetches. No caching, no dedup, no stale control.

**Fix**: Convert to `useQuery` hooks with proper query keys and `staleTime`.

### 4. useStudentHomework makes 3 sequential queries

**Problem**: `useStudentHomework` calls: (1) `supabase.auth.getUser()`, (2) `profiles` lookup for school_id, (3) `classes` lookup, then (4) `homework` query. Four round-trips for homework.

**Fix**: Use the school_id from AuthContext (already available) and pass class_id directly or do a single joined query.

### 5. useParentChild makes 2 sequential queries

**Problem**: First fetches parent profile to get email, then queries students by parent_email. Two round-trips every time.

**Fix**: Create a single RPC that takes user_id and returns child info, or use a database view.

---

## MODERATE ISSUES

### 6. Over-fetching with `select('*')` in 15+ hooks

**Problem**: 15 hooks use `select('*')` when they only need 3-5 columns. This transfers unnecessary data (addresses, notes, metadata) on every request.

**Fix**: Replace with explicit column selections:
```ts
// Before
.select('*').eq('student_id', studentId)
// After
.select('id, date, status').eq('student_id', studentId)
```

Key offenders: `useAttendance`, `useParentData`, `useGallery`, `useSupportQueries`, `useTransport`, `useClasses`, `useAcademicYears`.

### 7. useTeachers makes N+1 query for avatars

**Problem**: After fetching teachers, it makes a second query to `profiles` to get avatar URLs. This is an N+1 pattern.

**Fix**: Add `avatar_url` column to the `teachers` table directly, or join profiles in a single query using a database view.

### 8. Notifications query has no user_id filter in the WHERE clause

**Problem**: `useNotifications` does `.select('*').order(...).limit(50)` — the `user_id` filter relies entirely on RLS. This works but is slower than an explicit filter because RLS evaluates per-row.

**Fix**: Add `.eq('user_id', user.id)` explicitly for index usage.

### 9. Realtime subscription on notifications lacks cleanup guard

**Problem**: The realtime channel in `useNotifications` can create duplicate subscriptions during React strict mode or fast navigation.

**Fix**: Already has cleanup, but the channel name `'user-notifications'` is static — if two components mount, they'll conflict. Use user-specific channel names.

---

## MISSING DATABASE INDEXES

Based on my index audit, these are missing:

| Table | Missing Index | Queries Affected |
|---|---|---|
| `fee_invoices` | `(school_id, status, due_date)` | FeesPage filters, overdue calculation |
| `fee_invoices` | `(student_id)` | Parent/student fee lookups |
| `fees` | `(school_id, status, due_date)` | Legacy fee queries |
| `homework` | `(class_id, due_date)` | Student/parent homework |
| `notifications` | `(user_id, is_read, created_at)` | NotificationBell unread count |
| `students` | `(school_id, class_name, section, status)` | Attendance page class lists |
| `students` | `(user_id)` | Student profile lookup |
| `students` | `(parent_email)` | Parent-child linking |
| `online_classes` | `(school_id, teacher_id)` | Teacher online classes |
| `results` | `(student_id)` | Student results page |

```sql
-- Migration: Add missing performance indexes
CREATE INDEX IF NOT EXISTS idx_fee_invoices_school_status ON fee_invoices(school_id, status, due_date);
CREATE INDEX IF NOT EXISTS idx_fee_invoices_student ON fee_invoices(student_id);
CREATE INDEX IF NOT EXISTS idx_fees_school_status ON fees(school_id, status);
CREATE INDEX IF NOT EXISTS idx_homework_class_due ON homework(class_id, due_date);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_students_school_class ON students(school_id, class_name, section) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_students_user_id ON students(user_id);
CREATE INDEX IF NOT EXISTS idx_students_parent_email ON students(parent_email);
CREATE INDEX IF NOT EXISTS idx_results_student ON results(student_id);
CREATE INDEX IF NOT EXISTS idx_online_classes_teacher ON online_classes(school_id, teacher_id);
```

---

## API CALL COUNT PER PAGE

| Page | Current API Calls | Optimal | Issue |
|---|---|---|---|
| Admin Dashboard | 3 (stats RPC + PendingTasks + TodaysSummary) | 1 | Combine into single RPC |
| Fees Page | 5 (invoices + legacy fees + stats + classes + pending submissions) | 2 | Remove legacy, use RPC for stats |
| Student Dashboard | 4 (profile + attendance + homework + announcements) | 2 | Combine profile+attendance; homework is 4 sub-queries |
| Parent Dashboard | 6 (profile lookup + child + attendance + fees + homework + announcements) | 2 | Create `get_parent_dashboard` RPC |
| Attendance Page | 3 (attendance records + summary + class list) | 2 | Summary already via RPC |

---

## OPTIMIZATION STRATEGY

### Combine Dashboard APIs into single RPCs

Create `get_admin_dashboard_full` that returns stats + pending tasks + today's summary in one call instead of 3 separate queries.

### Caching Strategy Improvements

Current stale times are reasonable (2-5 min). Add these refinements:
- Set `refetchOnWindowFocus: false` on all admin data hooks (currently missing on several)
- Use `placeholderData: keepPreviousData` on paginated queries to avoid loading flashes during page changes
- Add `gcTime: 10 * 60 * 1000` to prevent garbage collection of recently viewed data

### React Re-render Prevention

- `TodaysSummary` and `PendingTasks` trigger full re-renders via `useState` — convert to React Query
- `FeesPage` re-computes `groupByStudent` on every render — already using `useMemo`, which is correct
- `formatCurrency` and `greeting` functions in `AdminDashboard` are recreated each render — move outside component or wrap in `useCallback`

---

## IMPLEMENTATION ORDER

1. **Add missing indexes** (migration — immediate 30-50% query speedup)
2. **Fix FeesPage pageSize 500 → 25** (biggest data transfer reduction)
3. **Replace useInvoiceStats with RPC** (eliminates 20K row client-side fetch)
4. **Convert TodaysSummary/PendingTasks to useQuery** (caching + dedup)
5. **Reduce select('*') to specific columns** (15 hooks)
6. **Create combined dashboard RPCs** (reduce API calls per page)
7. **Fix useStudentHomework sequential queries** (4 round-trips → 1)
8. **Add explicit user_id filter to notifications** (index utilization)

