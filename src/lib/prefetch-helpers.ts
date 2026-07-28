/**
 * Sidebar hover prefetch helpers.
 * Call prefetchForPath(path, schoolId, queryClient) on mouseEnter
 * to warm React Query cache before navigation.
 */

import { QueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { queryKeys } from '@/lib/query-keys';
import { format } from 'date-fns';

const PREFETCH_STALE = 60_000; // 1 min -- don't re-prefetch if fresh

type PrefetchFn = (schoolId: string, qc: QueryClient) => void;

const prefetchMap: Record<string, PrefetchFn> = {
  '/students': (schoolId, qc) => {
    qc.prefetchQuery({
      queryKey: queryKeys.students(schoolId, undefined),
      queryFn: async () => {
        const { data } = await supabase
          .from('students')
          .select('id, full_name, class_name, section, roll_number, admission_number, status, avatar_url')
          .eq('school_id', schoolId)
          .eq('status', 'active')
          .order('full_name')
          .limit(50);
        return { data: data || [], totalCount: data?.length || 0 };
      },
      staleTime: PREFETCH_STALE,
    });
  },
  '/teachers': (schoolId, qc) => {
    qc.prefetchQuery({
      queryKey: queryKeys.teachers(schoolId, undefined),
      queryFn: async () => {
        const { data } = await supabase
          .from('teachers')
          .select('id, full_name, email, phone, subjects, classes, employee_id, avatar_url')
          .eq('school_id', schoolId)
          .order('full_name')
          .limit(50);
        return { data: data || [], totalCount: data?.length || 0 };
      },
      staleTime: PREFETCH_STALE,
    });
  },
  '/attendance': (schoolId, qc) => {
    const today = format(new Date(), 'yyyy-MM-dd');
    qc.prefetchQuery({
      queryKey: queryKeys.attendanceSummary(schoolId, today),
      queryFn: async () => {
        const { data } = await supabase.rpc('get_attendance_summary' as any, {
          _school_id: schoolId,
          _date: today,
        } as any);
        return data;
      },
      staleTime: PREFETCH_STALE,
    });
  },
  '/fees': (schoolId, qc) => {
    qc.prefetchQuery({
      queryKey: queryKeys.invoiceStats(schoolId),
      queryFn: async () => {
        const { data } = await supabase.rpc('get_invoice_stats' as any, {
          _school_id: schoolId,
        } as any);
        return data;
      },
      staleTime: PREFETCH_STALE,
    });
  },
  '/dashboard': (schoolId, qc) => {
    qc.prefetchQuery({
      queryKey: queryKeys.adminDashboard(schoolId),
      queryFn: async () => {
        const { data } = await supabase.rpc('get_admin_dashboard_stats' as any, {
          _school_id: schoolId,
        } as any);
        return data;
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
