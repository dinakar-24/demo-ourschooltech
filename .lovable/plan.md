

## Parent App Production Optimization for 200K+ Users

### 1. Add Query Limits, staleTime, and refetchOnWindowFocus to All Hooks

**Files: `src/hooks/useParentData.ts`, `src/hooks/useStudentData.ts`, `src/hooks/useFeedback.ts`, `src/hooks/useSupportQueries.ts`, `src/hooks/useOnlineClasses.ts`, `src/hooks/useParentInvoices.ts`**

Add the following to every query used by parent pages:
- `staleTime: 2 * 60 * 1000` (2 min) for most queries
- `staleTime: 10 * 60 * 1000` (10 min) for `useParentChild` (child profile rarely changes)
- `refetchOnWindowFocus: false` on all parent-facing queries
- `.limit(50)` on all list queries (feedback, support queries, online classes, results, homework, announcements, invoices, fees)
- `placeholderData: keepPreviousData` where appropriate for instant page renders

Specific changes per hook:
- **useParentData.ts**: `useParentChild` gets 10min staleTime. `useChildFeeStats` and `useChildAttendanceStats` get 2min staleTime. Remove `useParentData` composite hook's redundant all-fees query (dashboard only needs stats). Add `.limit(50)` to `useChildHomework`.
- **useStudentData.ts**: Add `school_id` filter to `useStudentHomework` class lookup (multi-tenant fix). Add `.limit(50)` to `useStudentResults`. Add staleTime to all queries.
- **useFeedback.ts**: Add `.limit(30)` and `staleTime: 2min` to `useFeedbackList`.
- **useSupportQueries.ts**: Add `.limit(30)` and `staleTime: 2min` to `useSupportQueryList`.
- **useOnlineClasses.ts**: Add `.limit(50)` and `staleTime: 2min` to `useOnlineClasses` and `useTeacherOnlineClasses`.
- **useParentInvoices.ts**: Add `.limit(30)` (already has 2min staleTime). Add `refetchOnWindowFocus: false`.

### 2. Fix MobileNav Routing

**File: `src/components/layout/MobileNav.tsx`**

Change parent "More" path from `/announcements` to `/more` so it correctly opens `ParentMorePage`.

### 3. Optimize Parent Pages with staleTime and Limits

**Files: `src/pages/parent/ParentResults.tsx`, `src/pages/parent/ParentAnnouncements.tsx`, `src/pages/parent/ParentOnlineClasses.tsx`**

- **ParentResults.tsx**: Add `.limit(100)` and `staleTime: 3min` to inline `useChildResults` query.
- **ParentAnnouncements.tsx**: Increase limit from 25 to 50 (accounts for client-side filtering). Already has staleTime.
- **ParentOnlineClasses.tsx**: Already uses `useOnlineClasses` hook (fixed above).

### 4. Add Database Indexes for Scale

**New migration file**

```sql
CREATE INDEX IF NOT EXISTS idx_attendance_school_student ON attendance(school_id, student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_school_date ON attendance(school_id, date);
CREATE INDEX IF NOT EXISTS idx_fees_school_student ON fees(school_id, student_id);
CREATE INDEX IF NOT EXISTS idx_homework_class_due ON homework(class_id, due_date);
CREATE INDEX IF NOT EXISTS idx_results_student ON results(student_id);
CREATE INDEX IF NOT EXISTS idx_feedback_school_created ON feedback(school_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_support_queries_school ON support_queries(school_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_online_classes_school ON online_classes(school_id, scheduled_at DESC);
CREATE INDEX IF NOT EXISTS idx_fee_invoices_student ON fee_invoices(student_id, due_date DESC);
CREATE INDEX IF NOT EXISTS idx_announcements_school_active ON announcements(school_id, is_active, created_at DESC);
```

### 5. Bump APP_VERSION for Cache Bust

**File: `index.html`**

Increment `APP_VERSION` to `2026022804` to force users to get the optimized version.

### Summary

| Change | Impact |
|--------|--------|
| staleTime on all queries | Eliminates redundant refetches for 200K users |
| refetchOnWindowFocus: false | Prevents query storms on tab switches |
| .limit() on all list queries | Prevents slow loads as data grows |
| school_id filter on homework | Fixes multi-tenant data leakage |
| MobileNav routing fix | "More" button works correctly |
| Database indexes | Sub-50ms query times at scale |
| APP_VERSION bump | All users get the new version |

Total files modified: ~10 files + 1 migration.

