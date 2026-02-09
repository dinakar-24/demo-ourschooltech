import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffectiveSchoolId } from '@/hooks/useEffectiveSchoolId';

interface ReportStats {
  totalStudents: number;
  totalTeachers: number;
  totalFeeCollected: number;
  totalFeePending: number;
  attendanceToday: { present: number; absent: number; total: number };
}

export function useSchoolReportStats() {
  const schoolId = useEffectiveSchoolId();

  return useQuery({
    queryKey: ['school-report-stats', schoolId],
    queryFn: async (): Promise<ReportStats> => {
      if (!schoolId) throw new Error('No school ID');

      const today = new Date().toISOString().split('T')[0];

      const [studentsRes, teachersRes, feePaidRes, feePendingRes, attendanceRes] = await Promise.all([
        supabase
          .from('students')
          .select('*', { count: 'exact', head: true })
          .eq('school_id', schoolId)
          .eq('status', 'active'),
        supabase
          .from('teachers')
          .select('*', { count: 'exact', head: true })
          .eq('school_id', schoolId),
        supabase
          .from('fees')
          .select('amount')
          .eq('school_id', schoolId)
          .eq('status', 'paid'),
        supabase
          .from('fees')
          .select('amount')
          .eq('school_id', schoolId)
          .in('status', ['pending', 'overdue']),
        supabase
          .from('attendance')
          .select('status')
          .eq('school_id', schoolId)
          .eq('date', today),
      ]);

      const totalFeeCollected = feePaidRes.data?.reduce((s, f) => s + f.amount, 0) || 0;
      const totalFeePending = feePendingRes.data?.reduce((s, f) => s + f.amount, 0) || 0;
      const present = attendanceRes.data?.filter(a => a.status === 'present').length || 0;
      const absent = attendanceRes.data?.filter(a => a.status === 'absent').length || 0;

      return {
        totalStudents: studentsRes.count || 0,
        totalTeachers: teachersRes.count || 0,
        totalFeeCollected,
        totalFeePending,
        attendanceToday: { present, absent, total: attendanceRes.data?.length || 0 },
      };
    },
    enabled: !!schoolId,
    staleTime: 5 * 60 * 1000,
  });
}
