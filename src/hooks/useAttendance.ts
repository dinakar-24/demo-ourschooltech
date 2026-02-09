import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useEffectiveSchoolId } from '@/hooks/useEffectiveSchoolId';
import { toast } from 'sonner';
import { format } from 'date-fns';

export interface AttendanceRecord {
  id: string;
  student_id: string;
  school_id: string;
  date: string;
  status: 'present' | 'absent' | 'late';
  notes: string | null;
  marked_by: string | null;
  created_at: string;
  student?: {
    id: string;
    full_name: string;
    admission_number: string;
    roll_number: number | null;
    class_name: string;
    section: string;
  };
}

export interface AttendanceSummary {
  present: number;
  absent: number;
  late: number;
  total: number;
}

export function useAttendance(date: Date, filters?: {
  className?: string;
  section?: string;
}) {
  const schoolId = useEffectiveSchoolId();
  const dateStr = format(date, 'yyyy-MM-dd');

  return useQuery({
    queryKey: ['attendance', schoolId, dateStr, filters],
    queryFn: async () => {
      if (!schoolId) throw new Error('No school ID');

      let query = supabase
        .from('attendance')
        .select(`
          *,
          student:students!inner(id, full_name, admission_number, roll_number, class_name, section)
        `)
        .eq('school_id', schoolId)
        .eq('date', dateStr);

      if (filters?.className && filters.className !== 'All Classes') {
        query = query.eq('student.class_name', filters.className);
      }
      if (filters?.section && filters.section !== 'All Sections') {
        query = query.eq('student.section', filters.section);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as AttendanceRecord[];
    },
    enabled: !!schoolId,
    staleTime: 1 * 60 * 1000,
  });
}

export function useAttendanceSummary(date: Date) {
  const schoolId = useEffectiveSchoolId();
  const dateStr = format(date, 'yyyy-MM-dd');

  return useQuery({
    queryKey: ['attendance-summary', schoolId, dateStr],
    queryFn: async (): Promise<AttendanceSummary> => {
      if (!schoolId) throw new Error('No school ID');

      const { data, error } = await supabase.rpc('get_attendance_summary' as any, {
        _school_id: schoolId,
        _date: dateStr,
      } as any);

      if (error) throw error;

      const result = data as any;
      return {
        present: Number(result?.present ?? 0),
        absent: Number(result?.absent ?? 0),
        late: Number(result?.late ?? 0),
        total: Number(result?.total ?? 0),
      };
    },
    enabled: !!schoolId,
    staleTime: 2 * 60 * 1000,
  });
}

export function useClassAttendance(date: Date, className: string, section: string) {
  const schoolId = useEffectiveSchoolId();
  const dateStr = format(date, 'yyyy-MM-dd');

  return useQuery({
    queryKey: ['class-attendance', schoolId, dateStr, className, section],
    queryFn: async () => {
      if (!schoolId) throw new Error('No school ID');

      const { data: students, error: studentsError } = await supabase
        .from('students')
        .select('id, full_name, admission_number, roll_number')
        .eq('school_id', schoolId)
        .eq('class_name', className)
        .eq('section', section)
        .eq('status', 'active')
        .order('roll_number', { ascending: true });

      if (studentsError) throw studentsError;

      const studentIds = students?.map(s => s.id) || [];
      
      const { data: attendance, error: attendanceError } = await supabase
        .from('attendance')
        .select('*')
        .eq('school_id', schoolId)
        .eq('date', dateStr)
        .in('student_id', studentIds);

      if (attendanceError) throw attendanceError;

      const attendanceMap = new Map(attendance?.map(a => [a.student_id, a]) || []);

      return {
        students: students || [],
        attendance: attendanceMap,
        isMarked: (attendance?.length || 0) > 0,
      };
    },
    enabled: !!schoolId && !!className && !!section,
  });
}

export function useMarkAttendance() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const schoolId = useEffectiveSchoolId();

  return useMutation({
    mutationFn: async ({ 
      date, 
      records 
    }: { 
      date: string;
      records: { studentId: string; status: 'present' | 'absent' | 'late'; notes?: string }[];
    }) => {
      if (!schoolId || !user?.id) throw new Error('No user context');

      const attendanceData = records.map(r => ({
        student_id: r.studentId,
        school_id: schoolId,
        date,
        status: r.status,
        notes: r.notes || null,
        marked_by: user.id,
      }));

      const studentIds = records.map(r => r.studentId);
      await supabase
        .from('attendance')
        .delete()
        .eq('school_id', schoolId)
        .eq('date', date)
        .in('student_id', studentIds);

      const { data, error } = await supabase
        .from('attendance')
        .insert(attendanceData)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      queryClient.invalidateQueries({ queryKey: ['attendance-summary'] });
      queryClient.invalidateQueries({ queryKey: ['class-attendance'] });
      toast.success('Attendance saved successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to save attendance');
    },
  });
}

export function useStudentAttendance(studentId: string, startDate?: Date, endDate?: Date) {
  return useQuery({
    queryKey: ['student-attendance', studentId, startDate, endDate],
    queryFn: async () => {
      let query = supabase
        .from('attendance')
        .select('*')
        .eq('student_id', studentId)
        .order('date', { ascending: false });

      if (startDate) {
        query = query.gte('date', format(startDate, 'yyyy-MM-dd'));
      }
      if (endDate) {
        query = query.lte('date', format(endDate, 'yyyy-MM-dd'));
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as AttendanceRecord[];
    },
    enabled: !!studentId,
  });
}
