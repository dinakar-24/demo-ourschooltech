import { useEffect } from 'react';
import type { UserRole } from '@/contexts/AuthContext';

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
 * role-specific pages using requestIdleCallback so navigation
 * feels instant.
 */
export function usePrefetchRoutes(role?: UserRole) {
  useEffect(() => {
    if (!role) return;

    const imports = roleImports[role];
    if (!imports) return;

    const schedule = typeof requestIdleCallback === 'function'
      ? requestIdleCallback
      : (cb: () => void) => setTimeout(cb, 200);

    const cancel = typeof cancelIdleCallback === 'function'
      ? cancelIdleCallback
      : clearTimeout;

    // Stagger imports to avoid blocking
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
