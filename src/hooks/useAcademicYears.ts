import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useEffectiveSchoolId } from '@/hooks/useEffectiveSchoolId';
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
  const schoolId = useEffectiveSchoolId();

  return useQuery({
    queryKey: ['academic-years', schoolId],
    queryFn: async () => {
      if (!schoolId) throw new Error('No school ID');

      const { data, error } = await supabase
        .from('academic_years')
        .select('*')
        .eq('school_id', schoolId)
        .order('start_date', { ascending: false });

      if (error) throw error;
      return data as AcademicYear[];
    },
    enabled: !!schoolId,
  });
}

export function useCurrentAcademicYear() {
  const schoolId = useEffectiveSchoolId();

  return useQuery({
    queryKey: ['current-academic-year', schoolId],
    queryFn: async () => {
      if (!schoolId) throw new Error('No school ID');

      const { data, error } = await supabase
        .from('academic_years')
        .select('*')
        .eq('school_id', schoolId)
        .eq('is_current', true)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data as AcademicYear | null;
    },
    enabled: !!schoolId,
  });
}

export function useCreateAcademicYear() {
  const queryClient = useQueryClient();
  const schoolId = useEffectiveSchoolId();

  return useMutation({
    mutationFn: async ({ name, startDate, endDate, isCurrent }: { 
      name: string; 
      startDate: string;
      endDate: string;
      isCurrent?: boolean;
    }) => {
      if (!schoolId) throw new Error('No school ID');

      if (isCurrent) {
        await supabase
          .from('academic_years')
          .update({ is_current: false })
          .eq('school_id', schoolId);
      }

      const { data, error } = await supabase
        .from('academic_years')
        .insert({
          school_id: schoolId,
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
  const schoolId = useEffectiveSchoolId();

  return useMutation({
    mutationFn: async (yearId: string) => {
      if (!schoolId) throw new Error('No school ID');

      await supabase
        .from('academic_years')
        .update({ is_current: false })
        .eq('school_id', schoolId);

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

export function useUpdateAcademicYear() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, name, startDate, endDate }: { 
      id: string;
      name: string; 
      startDate: string;
      endDate: string;
    }) => {
      const { data, error } = await supabase
        .from('academic_years')
        .update({
          name,
          start_date: startDate,
          end_date: endDate,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['academic-years'] });
      queryClient.invalidateQueries({ queryKey: ['current-academic-year'] });
      toast.success('Academic year updated');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update academic year');
    },
  });
}

export function useDeleteAcademicYear() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('academic_years')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['academic-years'] });
      queryClient.invalidateQueries({ queryKey: ['current-academic-year'] });
      toast.success('Academic year deleted');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete academic year');
    },
  });
}
