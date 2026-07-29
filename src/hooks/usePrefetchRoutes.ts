import { useEffect } from 'react';
import type { UserRole } from '@/contexts/AuthContext';

// ─────────────────────────────────────────────────────────────────────────
// Lazy-chunk preloading only. The data-prefetch block that used to live here
// was removed rather than migrated:
//
//   get_admin_dashboard_stats  → no equivalent; /api/superadmin/dashboard is
//                                platform-wide, not school-scoped
//   get_teacher_dashboard_stats → no equivalent; /api/teacher has no stats route
//   get_attendance_summary     → /api/school/attendance/summary exists, but its
//                                consumer (useAttendance.ts) is still on
//                                Supabase, so prefetching an Express-shaped
//                                payload into queryKeys.attendanceSummary would
//                                shadow it with a mismatched shape
//
// Restore each one alongside its consuming hook, not before.
// ─────────────────────────────────────────────────────────────────────────

// Maps each role to the lazy import functions for its key pages
const roleImports: Record<string, (() => Promise<any>)[]> = {
  super_admin: [
    () => import('@/pages/super-admin/SuperAdminDashboard'),
    () => import('@/pages/super-admin/SchoolsPage'),
    () => import('@/pages/super-admin/SchoolAdminsPage'),
    () => import('@/pages/super-admin/AllUsersPage'),
  ],
  school_admin: [
    () => import('@/pages/admin/AdminDashboard'),
    () => import('@/pages/admin/StudentsPage'),
    () => import('@/pages/admin/TeachersPage'),
    () => import('@/pages/admin/AttendancePage'),
    () => import('@/pages/admin/FeesPage'),
    () => import('@/pages/admin/ClassesPage'),
  ],
  teacher: [
    () => import('@/pages/teacher/TeacherDashboard'),
    () => import('@/pages/teacher/TeacherAttendance'),
    () => import('@/pages/teacher/TeacherHomework'),
    () => import('@/pages/teacher/TeacherStudents'),
    () => import('@/pages/teacher/TeacherMarks'),
  ],
  parent: [
    () => import('@/pages/parent/ParentDashboard'),
    () => import('@/pages/parent/ParentAttendance'),
    () => import('@/pages/parent/ParentFees'),
    () => import('@/pages/parent/ParentHomework'),
    () => import('@/pages/parent/ParentResults'),
  ],
  student: [
    () => import('@/pages/student/StudentDashboard'),
    () => import('@/pages/student/StudentAttendance'),
    () => import('@/pages/student/StudentHomework'),
    () => import('@/pages/student/StudentResults'),
    () => import('@/pages/student/StudentTimetable'),
  ],
};

/**
 * After login, silently preloads the lazy chunks for the user's
 * role-specific pages AND prefetches dashboard data so navigation
 * feels instant.
 */
export function usePrefetchRoutes(role?: UserRole) {
  useEffect(() => {
    if (!role) return;

    const imports = roleImports[role];
    if (!imports) return;

    const cancel = typeof cancelIdleCallback === 'function'
      ? cancelIdleCallback
      : clearTimeout;

    // Stagger chunk imports to avoid blocking
    const handles: number[] = [];
    imports.forEach((importFn, i) => {
      const cb = () => {
        importFn().catch(() => {/* chunk load failure is non-critical */});
      };
      const h = (typeof requestIdleCallback === 'function'
        ? requestIdleCallback(cb, { timeout: 3000 + i * 500 })
        : setTimeout(cb, 200 + i * 300)) as unknown as number;
      handles.push(h);
    });

    return () => handles.forEach(h => cancel(h));
  }, [role]);
}
