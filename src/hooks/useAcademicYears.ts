import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface AcademicYear {
  id: string;
  school_id: string;
  name: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
  created_at: string;
  updated_at: string;
}

export function useAcademicYears() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['academic-years', user?.schoolId],
    queryFn: async () => {
      if (!user?.schoolId) throw new Error('No school ID');

      const { data, error } = await supabase
        .from('academic_years')
        .select('*')
        .eq('school_id', user.schoolId)
        .order('start_date', { ascending: false });

      if (error) throw error;
      return data as AcademicYear[];
    },
    enabled: !!user?.schoolId,
  });
}

export function useCurrentAcademicYear() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['current-academic-year', user?.schoolId],
    queryFn: async () => {
      if (!user?.schoolId) throw new Error('No school ID');

      const { data, error } = await supabase
        .from('academic_years')
        .select('*')
        .eq('school_id', user.schoolId)
        .eq('is_current', true)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data as AcademicYear | null;
    },
    enabled: !!user?.schoolId,
  });
}

export function useCreateAcademicYear() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ name, startDate, endDate, isCurrent }: { 
      name: string; 
      startDate: string;
      endDate: string;
      isCurrent?: boolean;
    }) => {
      if (!user?.schoolId) throw new Error('No school ID');

      // If this is set as current, unset other current years
      if (isCurrent) {
        await supabase
          .from('academic_years')
          .update({ is_current: false })
          .eq('school_id', user.schoolId);
      }

      const { data, error } = await supabase
        .from('academic_years')
        .insert({
          school_id: user.schoolId,
          name,
          start_date: startDate,
          end_date: endDate,
          is_current: isCurrent || false,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['academic-years'] });
      queryClient.invalidateQueries({ queryKey: ['current-academic-year'] });
      toast.success('Academic year created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create academic year');
    },
  });
}

export function useSetCurrentAcademicYear() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (yearId: string) => {
      if (!user?.schoolId) throw new Error('No school ID');

      // Unset all current years for this school
      await supabase
        .from('academic_years')
        .update({ is_current: false })
        .eq('school_id', user.schoolId);

      // Set the selected year as current
      const { data, error } = await supabase
        .from('academic_years')
        .update({ is_current: true })
        .eq('id', yearId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['academic-years'] });
      queryClient.invalidateQueries({ queryKey: ['current-academic-year'] });
      toast.success('Current academic year updated');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update academic year');
    },
  });
}
