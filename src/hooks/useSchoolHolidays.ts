import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffectiveSchoolId } from '@/hooks/useEffectiveSchoolId';
import { toast } from 'sonner';

export interface SchoolHoliday {
  id: string;
  school_id: string;
  title: string;
  date: string;
  event_type: string;
  created_at: string;
}

export function useSchoolHolidays(month?: number, year?: number) {
  const schoolId = useEffectiveSchoolId();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['school-holidays', schoolId, month, year],
    queryFn: async () => {
      if (!schoolId) return [];
      let q = supabase
        .from('school_holidays' as any)
        .select('*')
        .eq('school_id', schoolId)
        .order('date', { ascending: true });

      if (month !== undefined && year !== undefined) {
        const startDate = `${year}-${String(month + 1).padStart(2, '0')}-01`;
        const endDate = new Date(year, month + 1, 0).toISOString().split('T')[0];
        q = q.gte('date', startDate).lte('date', endDate);
      }

      const { data, error } = await q;
      if (error) throw error;
      return (data || []) as unknown as SchoolHoliday[];
    },
    enabled: !!schoolId,
  });

  const addHoliday = useMutation({
    mutationFn: async ({ title, date, event_type }: { title: string; date: string; event_type: string }) => {
      if (!schoolId) throw new Error('No school');
      const { error } = await supabase
        .from('school_holidays' as any)
        .insert({ school_id: schoolId, title, date, event_type } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['school-holidays'] });
      toast.success('Holiday added');
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteHoliday = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('school_holidays' as any)
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['school-holidays'] });
      toast.success('Holiday removed');
    },
    onError: (e: any) => toast.error(e.message),
  });

  return { ...query, addHoliday, deleteHoliday };
}
