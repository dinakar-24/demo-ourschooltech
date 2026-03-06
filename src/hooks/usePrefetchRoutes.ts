import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffectiveSchoolId } from '@/hooks/useEffectiveSchoolId';
import { queryKeys } from '@/lib/query-keys';
import type { UserRole } from '@/contexts/AuthContext';
import { format } from 'date-fns';

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
  const queryClient = useQueryClient();
  const schoolId = useEffectiveSchoolId();

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

    // Prefetch dashboard data for the role
    if (schoolId) {
      const today = format(new Date(), 'yyyy-MM-dd');

      const prefetchData = () => {
        if (role === 'school_admin') {
          queryClient.prefetchQuery({
            queryKey: queryKeys.adminDashboard(schoolId),
            queryFn: async () => {
              const { data, error } = await supabase.rpc('get_admin_dashboard_stats' as any, {
                _school_id: schoolId,
              } as any);
              if (error) throw error;
              return data;
            },
            staleTime: 5 * 60 * 1000,
          });
          queryClient.prefetchQuery({
            queryKey: queryKeys.attendanceSummary(schoolId, today),
            queryFn: async () => {
              const { data, error } = await supabase.rpc('get_attendance_summary' as any, {
                _school_id: schoolId,
                _date: today,
              } as any);
              if (error) throw error;
              return data;
            },
            staleTime: 2 * 60 * 1000,
          });
        } else if (role === 'teacher') {
          queryClient.prefetchQuery({
            queryKey: ['teacher-dashboard-stats', schoolId],
            queryFn: async () => {
              const { data, error } = await supabase.rpc('get_teacher_dashboard_stats' as any, {
                _school_id: schoolId,
              } as any);
              if (error) throw error;
              return data;
            },
            staleTime: 5 * 60 * 1000,
          });
        }
      };

      const dataHandle = (typeof requestIdleCallback === 'function'
        ? requestIdleCallback(prefetchData, { timeout: 4000 })
        : setTimeout(prefetchData, 500)) as unknown as number;
      handles.push(dataHandle);
    }

    return () => handles.forEach(h => cancel(h));
  }, [role, schoolId, queryClient]);
}
