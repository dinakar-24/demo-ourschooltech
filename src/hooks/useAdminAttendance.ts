import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffectiveSchoolId } from '@/hooks/useEffectiveSchoolId';

interface ClassAttendance {
  class: string;
  present: number;
  absent: number;
  late: number;
  total: number;
  percentage: number;
}

export function useAdminAttendance(date: Date) {
  const schoolId = useEffectiveSchoolId();
  const dateStr = date.toISOString().split('T')[0];

  return useQuery({
    queryKey: ['admin-attendance', schoolId, dateStr],
    queryFn: async () => {
      if (!schoolId) return { classWise: [], totals: { present: 0, absent: 0, late: 0, total: 0 } };

      const { data: students, error: studentsError } = await supabase
        .from('students')
        .select('id, class_name')
        .eq('school_id', schoolId)
        .eq('status', 'active');

      if (studentsError) throw studentsError;

      const { data: attendance, error: attendanceError } = await supabase
        .from('attendance')
        .select('student_id, status')
        .eq('school_id', schoolId)
        .eq('date', dateStr);

      if (attendanceError) throw attendanceError;

      const attendanceMap = new Map(attendance?.map(a => [a.student_id, a.status]) || []);

      const classGroups = new Map<string, { present: number; absent: number; late: number; total: number }>();

      students?.forEach(student => {
        const className = student.class_name;
        if (!classGroups.has(className)) {
          classGroups.set(className, { present: 0, absent: 0, late: 0, total: 0 });
        }
        
        const group = classGroups.get(className)!;
        group.total++;
        
        const status = attendanceMap.get(student.id);
        if (status === 'present') group.present++;
        else if (status === 'absent') group.absent++;
        else if (status === 'late') group.late++;
      });

      const classWise: ClassAttendance[] = Array.from(classGroups.entries())
        .map(([className, stats]) => ({
          class: className,
          ...stats,
          percentage: stats.total > 0 ? Number(((stats.present / stats.total) * 100).toFixed(1)) : 0,
        }))
        .sort((a, b) => a.class.localeCompare(b.class, undefined, { numeric: true }));

      const totals = classWise.reduce(
        (acc, curr) => ({
          present: acc.present + curr.present,
          absent: acc.absent + curr.absent,
          late: acc.late + curr.late,
          total: acc.total + curr.total,
        }),
        { present: 0, absent: 0, late: 0, total: 0 }
      );

      return { classWise, totals };
    },
    enabled: !!schoolId,
  });
}
