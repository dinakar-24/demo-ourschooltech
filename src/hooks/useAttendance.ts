import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useEffectiveSchoolId } from '@/hooks/useEffectiveSchoolId';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { sendNotification } from '@/lib/send-notification';
import { queryKeys } from '@/lib/query-keys';

export interface AttendanceRecord {
  id: string;
  student_id: string;
  school_id: string;
  date: string;
  status: 'present' | 'absent' | 'late' | 'half_day';
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
  half_day: number;
  total: number;
}

export function useAttendance(date: Date, filters?: {
  className?: string;
  section?: string;
}) {
  const schoolId = useEffectiveSchoolId();
  const dateStr = format(date, 'yyyy-MM-dd');

  return useQuery({
    queryKey: queryKeys.attendance(schoolId, dateStr, filters),
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
    queryKey: queryKeys.attendanceSummary(schoolId, dateStr),
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
        half_day: Number(result?.half_day ?? 0),
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
    queryKey: queryKeys.classAttendance(schoolId, dateStr, className, section),
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
    staleTime: 1 * 60 * 1000,
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
      records: { studentId: string; status: 'present' | 'absent' | 'late' | 'half_day'; notes?: string }[];
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
    // ── Optimistic UI: update class attendance cache instantly ──
    onMutate: async (variables) => {
      const { date, records } = variables;
      // Cancel outgoing refetches to avoid overwriting optimistic update
      await queryClient.cancelQueries({ queryKey: queryKeys.allClassAttendance });
      await queryClient.cancelQueries({ queryKey: queryKeys.allAttendanceSummary });

      // Snapshot previous class attendance data for rollback
      const previousQueries = queryClient.getQueriesData({ queryKey: queryKeys.allClassAttendance });

      // Optimistically update attendance maps in cache
      previousQueries.forEach(([key, data]: [any, any]) => {
        if (!data?.attendance || !data?.students) return;
        const newMap = new Map(data.attendance);
        records.forEach(r => {
          newMap.set(r.studentId, {
            student_id: r.studentId,
            school_id: schoolId,
            date,
            status: r.status,
            notes: r.notes || null,
            marked_by: user?.id,
          });
        });
        queryClient.setQueryData(key, {
          ...data,
          attendance: newMap,
          isMarked: true,
        });
      });

      return { previousQueries };
    },
    onError: (_err, _vars, context) => {
      // Rollback optimistic update
      if (context?.previousQueries) {
        context.previousQueries.forEach(([key, data]: [any, any]) => {
          queryClient.setQueryData(key, data);
        });
      }
      toast.error('Failed to save attendance. Changes reverted.');
    },
    onSuccess: (_data, variables) => {
      toast.success('Attendance saved successfully');

      // Notify parents of absent students (background, non-blocking)
      const absentStudentIds = variables.records
        .filter(r => r.status === 'absent')
        .map(r => r.studentId);

      if (absentStudentIds.length > 0 && schoolId) {
        supabase
          .from('students')
          .select('full_name, parent_email')
          .in('id', absentStudentIds)
          .then(({ data: students }) => {
            if (!students?.length) return;
            const parentEmails = students.map(s => s.parent_email).filter(Boolean) as string[];
            if (!parentEmails.length) return;
            supabase
              .from('profiles')
              .select('id')
              .in('email', parentEmails)
              .then(({ data: parents }) => {
                if (!parents?.length) return;
                sendNotification({
                  userIds: parents.map(p => p.id),
                  title: 'Absence Alert',
                  body: `Your child (${students.map(s => s.full_name).join(', ')}) was marked absent on ${variables.date}`,
                  type: 'attendance',
                  schoolId,
                });
              });
          });
      }
    },
    onSettled: () => {
      // Refetch in background to sync with server truth
      queryClient.invalidateQueries({ queryKey: queryKeys.allAttendance });
      queryClient.invalidateQueries({ queryKey: queryKeys.allAttendanceSummary });
      queryClient.invalidateQueries({ queryKey: queryKeys.allClassAttendance });
    },
  });
}

export function useStudentAttendance(studentId: string, startDate?: Date, endDate?: Date) {
  return useQuery({
    queryKey: queryKeys.studentAttendance(studentId, startDate, endDate),
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
    staleTime: 2 * 60 * 1000,
  });
}
