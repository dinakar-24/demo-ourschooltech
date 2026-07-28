import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface AttendanceRecord {
  date: string;
  status: 'present' | 'absent' | 'late' | 'half_day';
}

export function useStudentAttendanceHistory(studentId?: string) {
  return useQuery({
    queryKey: ['student-attendance-history', studentId],
    queryFn: async (): Promise<{ records: AttendanceRecord[]; percentage: number }> => {
      if (!studentId) throw new Error('No student ID');

      const { data, error } = await supabase
        .from('attendance')
        .select('date, status')
        .eq('student_id', studentId)
        .order('date', { ascending: false });

      if (error) throw error;

      const records: AttendanceRecord[] = (data || []).map(r => ({
        date: r.date,
        status: r.status as AttendanceRecord['status'],
      }));

      const total = records.length;
      const present = records.filter(r => r.status === 'present').length;
      const late = records.filter(r => r.status === 'late').length;
      const halfDay = records.filter(r => r.status === 'half_day').length;
      // Half day counts as 0.5 attendance
      const percentage = total > 0 ? Math.round(((present + late + halfDay * 0.5) / total) * 100 * 10) / 10 : 0;

      return { records, percentage };
    },
    enabled: !!studentId,
    staleTime: 5 * 60 * 1000,
  });
}
