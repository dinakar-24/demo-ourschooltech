import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffectiveSchoolId } from '@/hooks/useEffectiveSchoolId';
import { toast } from 'sonner';

export interface TeacherAttendanceRecord {
  id: string;
  teacher_id: string;
  date: string;
  status: string;
  notes: string | null;
}

export function useTeacherAttendance(date: Date) {
  const schoolId = useEffectiveSchoolId();
  const queryClient = useQueryClient();
  const dateStr = date.toISOString().split('T')[0];

  const query = useQuery({
    queryKey: ['teacher-attendance', schoolId, dateStr],
    queryFn: async () => {
      if (!schoolId) return { records: [], teachers: [] };

      const [{ data: teachers, error: tErr }, { data: records, error: rErr }] = await Promise.all([
        supabase.from('teachers').select('id, full_name, employee_id, avatar_url').eq('school_id', schoolId).order('full_name'),
        supabase.from('teacher_attendance' as any).select('*').eq('school_id', schoolId).eq('date', dateStr),
      ]);

      if (tErr) throw tErr;
      if (rErr) throw rErr;

      return {
        teachers: teachers || [],
        records: (records || []) as unknown as TeacherAttendanceRecord[],
      };
    },
    enabled: !!schoolId,
  });

  const saveAttendance = useMutation({
    mutationFn: async (entries: { teacher_id: string; status: string; notes?: string }[]) => {
      if (!schoolId) throw new Error('No school');
      const rows = entries.map(e => ({
        school_id: schoolId,
        teacher_id: e.teacher_id,
        date: dateStr,
        status: e.status,
        notes: e.notes || null,
      }));

      const { error } = await supabase
        .from('teacher_attendance' as any)
        .upsert(rows as any, { onConflict: 'school_id,teacher_id,date' });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-attendance'] });
      toast.success('Teacher attendance saved');
    },
    onError: (e: any) => toast.error(e.message),
  });

  return { ...query, saveAttendance };
}
