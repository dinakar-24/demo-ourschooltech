import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffectiveSchoolId } from '@/hooks/useEffectiveSchoolId';

interface ClassAttendance {
  class: string;
  present: number;
  absent: number;
  late: number;
  half_day: number;
  total: number;
  percentage: number;
}

export function useAdminAttendance(date: Date) {
  const schoolId = useEffectiveSchoolId();
  const dateStr = date.toISOString().split('T')[0];

  return useQuery({
    queryKey: ['admin-attendance', schoolId, dateStr],
    queryFn: async () => {
      if (!schoolId) return { classWise: [], totals: { present: 0, absent: 0, late: 0, half_day: 0, total: 0 } };

      const { data, error } = await supabase.rpc('get_admin_attendance_by_class' as any, {
        _school_id: schoolId,
        _date: dateStr,
      } as any);

      if (error) throw error;

      const result = data as any;
      const classWise: ClassAttendance[] = (result?.classWise || []).map((c: any) => ({
        class: c.class_name,
        present: Number(c.present ?? 0),
        absent: Number(c.absent ?? 0),
        late: Number(c.late ?? 0),
        half_day: Number(c.half_day ?? 0),
        total: Number(c.total ?? 0),
        percentage: Number(c.percentage ?? 0),
      }));

      const totals = result?.totals
        ? {
            present: Number(result.totals.present ?? 0),
            absent: Number(result.totals.absent ?? 0),
            late: Number(result.totals.late ?? 0),
            half_day: Number(result.totals.half_day ?? 0),
            total: Number(result.totals.total ?? 0),
          }
        : { present: 0, absent: 0, late: 0, half_day: 0, total: 0 };

      return { classWise, totals };
    },
    enabled: !!schoolId,
    staleTime: 2 * 60 * 1000,
  });
}
