/**
 * Sidebar hover prefetch helpers.
 * Call prefetchForPath(path, schoolId, queryClient) on mouseEnter
 * to warm React Query cache before navigation.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * MIGRATION NOTE — read before adding entries back.
 *
 * Each entry here writes directly into a query key that a *hook* also owns.
 * If the prefetch produces a different shape than that hook produces, the
 * hook serves the prefetched value and silently renders wrong or empty data
 * for the duration of staleTime.
 *
 * So an entry may only exist here once its consuming hook is on Express, and
 * it must reuse that hook's mapping rather than re-deriving one.
 *
 * Removed until their consumers migrate (they were querying Supabase, which
 * now returns empty sets to unauthenticated requests and was caching
 * `{ data: [], totalCount: 0 }` over the real result):
 *   '/teachers'   → waiting on useTeachers.ts
 *   '/attendance' → waiting on useAttendance.ts
 *   '/fees'       → waiting on useFeeInvoices.ts
 *   '/dashboard'  → had no consumer at all; queryKeys.adminDashboard is read
 *                   by nothing, and there is no school-scoped dashboard
 *                   endpoint yet (/api/superadmin/dashboard is platform-wide).
 * ─────────────────────────────────────────────────────────────────────────
 */

import { QueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';
import { mapStudent, type RawStudent } from '@/hooks/useStudents';

const PREFETCH_STALE = 60_000; // 1 min -- don't re-prefetch if fresh
const PREFETCH_LIMIT = 50;

type PrefetchFn = (schoolId: string, qc: QueryClient) => void;

const prefetchMap: Record<string, PrefetchFn> = {
  '/students': (schoolId, qc) => {
    qc.prefetchQuery({
      // Must match useStudents' key for an undefined filter set, and its
      // PaginatedStudents return shape exactly.
      queryKey: queryKeys.students(schoolId, undefined),
      queryFn: async () => {
        const { data } = await api.get('/school/students', {
          params: { page: 1, limit: PREFETCH_LIMIT },
        });
        return {
          data: (data.students as RawStudent[]).map(mapStudent),
          totalCount: data.pagination.total as number,
        };
      },
      staleTime: PREFETCH_STALE,
    });
  },
};

/**
 * Call on sidebar link mouseEnter. Silently prefetches relevant data
 * so navigation feels instant. Safe to call frequently — respects staleTime.
 */
export function prefetchForPath(path: string, schoolId: string | undefined, qc: QueryClient) {
  if (!schoolId) return;
  const fn = prefetchMap[path];
  if (fn) fn(schoolId, qc);
}
