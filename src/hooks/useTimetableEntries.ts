import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffectiveSchoolId } from '@/hooks/useEffectiveSchoolId';
import { toast } from 'sonner';

export interface TimetableEntry {
  id: string;
  school_id: string;
  class_name: string;
  section: string;
  period_number: number;
  day_of_week: string;
  subject: string;
  teacher_id: string | null;
  start_time: string;
  end_time: string;
  is_lunch: boolean;
  created_at: string;
  updated_at: string;
  teacher?: { id: string; full_name: string } | null;
}

export interface TimetablePeriod {
  id: string;
  school_id: string;
  period_number: number;
  start_time: string;
  end_time: string;
  is_lunch: boolean;
  label: string;
  created_at: string;
}

export const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function useTimetableEntries(className: string, section: string) {
  const schoolId = useEffectiveSchoolId();

  return useQuery({
    queryKey: ['timetable-entries', schoolId, className, section],
    queryFn: async () => {
      if (!schoolId || !className) return [];
      const { data, error } = await supabase
        .from('timetable_entries' as any)
        .select('*')
        .eq('school_id', schoolId)
        .eq('class_name', className)
        .eq('section', section)
        .order('period_number', { ascending: true });
      if (error) throw error;

      // Fetch teacher names
      const entries = (data || []) as unknown as TimetableEntry[];
      const teacherIds = [...new Set(entries.filter(e => e.teacher_id).map(e => e.teacher_id!))];
      let teacherMap: Record<string, string> = {};
      if (teacherIds.length > 0) {
        const { data: teachers } = await supabase
          .from('teachers')
          .select('id, full_name')
          .in('id', teacherIds);
        (teachers || []).forEach(t => { teacherMap[t.id] = t.full_name; });
      }

      return entries.map(e => ({
        ...e,
        teacher: e.teacher_id ? { id: e.teacher_id, full_name: teacherMap[e.teacher_id] || '' } : null,
      }));
    },
    enabled: !!schoolId && !!className,
  });
}

export function useTimetablePeriods() {
  const schoolId = useEffectiveSchoolId();

  return useQuery({
    queryKey: ['timetable-periods', schoolId],
    queryFn: async () => {
      if (!schoolId) return [];
      const { data, error } = await supabase
        .from('timetable_periods' as any)
        .select('*')
        .eq('school_id', schoolId)
        .order('period_number', { ascending: true });
      if (error) throw error;
      return (data || []) as unknown as TimetablePeriod[];
    },
    enabled: !!schoolId,
  });
}

export function useUpsertTimetableEntry() {
  const schoolId = useEffectiveSchoolId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (entry: {
      class_name: string;
      section: string;
      period_number: number;
      day_of_week: string;
      subject: string;
      teacher_id: string | null;
      start_time: string;
      end_time: string;
      is_lunch: boolean;
      apply_all_days?: boolean;
    }) => {
      if (!schoolId) throw new Error('No school ID');

      const days = entry.apply_all_days ? DAYS_OF_WEEK : [entry.day_of_week];
      
      for (const day of days) {
        const { error } = await supabase
          .from('timetable_entries' as any)
          .upsert({
            school_id: schoolId,
            class_name: entry.class_name,
            section: entry.section,
            period_number: entry.period_number,
            day_of_week: day,
            subject: entry.is_lunch ? 'LUNCH' : entry.subject,
            teacher_id: entry.is_lunch ? null : entry.teacher_id,
            start_time: entry.start_time,
            end_time: entry.end_time,
            is_lunch: entry.is_lunch,
          } as any, { onConflict: 'school_id,class_name,section,period_number,day_of_week' });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timetable-entries'] });
      toast.success('Timetable updated');
    },
    onError: (err: any) => toast.error(err.message || 'Failed to update'),
  });
}

export function useDeleteTimetableEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('timetable_entries' as any)
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timetable-entries'] });
      toast.success('Entry removed');
    },
    onError: (err: any) => toast.error(err.message || 'Failed to delete'),
  });
}

export function useUpsertTimetablePeriod() {
  const schoolId = useEffectiveSchoolId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (period: {
      period_number: number;
      start_time: string;
      end_time: string;
      is_lunch: boolean;
      label: string;
    }) => {
      if (!schoolId) throw new Error('No school ID');
      const { error } = await supabase
        .from('timetable_periods' as any)
        .upsert({
          school_id: schoolId,
          ...period,
        } as any, { onConflict: 'school_id,period_number' });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timetable-periods'] });
    },
    onError: (err: any) => toast.error(err.message || 'Failed to save period'),
  });
}
