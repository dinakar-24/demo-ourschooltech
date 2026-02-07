import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { getSupabaseRange } from './usePagination';

export interface Teacher {
  id: string;
  user_id: string | null;
  school_id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  employee_id: string;
  subjects: string[] | null;
  classes: string[] | null;
  qualification: string | null;
  joining_date: string | null;
  created_at: string;
}

interface TeacherFilters {
  search?: string;
  subject?: string;
  page?: number;
  pageSize?: number;
}

export interface PaginatedTeachers {
  data: Teacher[];
  totalCount: number;
}

export function useTeachers(filters?: TeacherFilters) {
  const { user } = useAuth();
  const page = filters?.page || 1;
  const pageSize = filters?.pageSize || 25;

  return useQuery({
    queryKey: ['teachers', user?.schoolId, filters],
    queryFn: async (): Promise<PaginatedTeachers> => {
      if (!user?.schoolId) throw new Error('No school ID');

      let query = supabase
        .from('teachers')
        .select('*', { count: 'exact' })
        .eq('school_id', user.schoolId)
        .order('full_name', { ascending: true });

      if (filters?.search) {
        query = query.or(
          `full_name.ilike.%${filters.search}%,employee_id.ilike.%${filters.search}%,email.ilike.%${filters.search}%`
        );
      }

      if (filters?.subject && filters.subject !== 'All Subjects') {
        query = query.contains('subjects', [filters.subject]);
      }

      const { from, to } = getSupabaseRange(page, pageSize);
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;
      return { data: (data || []) as Teacher[], totalCount: count || 0 };
    },
    enabled: !!user?.schoolId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useTeacherStats() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['teacher-stats', user?.schoolId],
    queryFn: async () => {
      if (!user?.schoolId) throw new Error('No school ID');

      const { count: total, error: totalError } = await supabase
        .from('teachers')
        .select('*', { count: 'exact', head: true })
        .eq('school_id', user.schoolId);

      if (totalError) throw totalError;

      return { total: total || 0 };
    },
    enabled: !!user?.schoolId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useTeacherSubjects() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['teacher-subjects', user?.schoolId],
    queryFn: async () => {
      if (!user?.schoolId) throw new Error('No school ID');

      const { data, error } = await supabase
        .from('teachers')
        .select('subjects')
        .eq('school_id', user.schoolId);

      if (error) throw error;

      const allSubjects = new Set<string>();
      data?.forEach(t => {
        t.subjects?.forEach(s => allSubjects.add(s));
      });

      return ['All Subjects', ...Array.from(allSubjects).sort()];
    },
    enabled: !!user?.schoolId,
    staleTime: 10 * 60 * 1000,
  });
}

export function useCreateTeacher() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (teacherData: {
      full_name: string;
      employee_id: string;
      email?: string;
      phone?: string;
      subjects?: string[];
      classes?: string[];
      qualification?: string;
      joining_date?: string;
    }) => {
      if (!user?.schoolId) throw new Error('No school ID');

      const { data, error } = await supabase
        .from('teachers')
        .insert({
          ...teacherData,
          school_id: user.schoolId,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
      queryClient.invalidateQueries({ queryKey: ['teacher-stats'] });
      queryClient.invalidateQueries({ queryKey: ['teacher-subjects'] });
      toast.success('Teacher added successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to add teacher');
    },
  });
}

export function useUpdateTeacher() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Teacher> & { id: string }) => {
      const { data, error } = await supabase
        .from('teachers')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
      queryClient.invalidateQueries({ queryKey: ['teacher-subjects'] });
      toast.success('Teacher updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update teacher');
    },
  });
}

export function useDeleteTeacher() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (teacherId: string) => {
      const { error } = await supabase
        .from('teachers')
        .delete()
        .eq('id', teacherId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
      queryClient.invalidateQueries({ queryKey: ['teacher-stats'] });
      queryClient.invalidateQueries({ queryKey: ['teacher-subjects'] });
      toast.success('Teacher deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete teacher');
    },
  });
}
