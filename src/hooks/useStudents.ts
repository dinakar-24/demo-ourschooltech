import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useEffectiveSchoolId } from '@/hooks/useEffectiveSchoolId';
import { toast } from 'sonner';
import { getSupabaseRange } from './usePagination';

export interface Student {
  id: string;
  admission_number: string;
  full_name: string;
  class_name: string;
  section: string;
  roll_number: number | null;
  gender: string | null;
  date_of_birth: string | null;
  parent_name: string | null;
  parent_phone: string | null;
  parent_email: string | null;
  address: string | null;
  status: string;
  school_id: string;
  user_id: string | null;
  academic_year_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface StudentStats {
  total: number;
  active: number;
  inactive: number;
  newThisMonth: number;
}

export interface PaginatedStudents {
  data: Student[];
  totalCount: number;
}

export function useStudents(filters?: { 
  className?: string; 
  section?: string;
  status?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}) {
  const { user } = useAuth();
  const schoolId = useEffectiveSchoolId();
  const page = filters?.page || 1;
  const pageSize = filters?.pageSize || 25;

  return useQuery({
    queryKey: ['students', schoolId, filters],
    queryFn: async (): Promise<PaginatedStudents> => {
      if (!schoolId) throw new Error('No school ID');

      let query = supabase
        .from('students')
        .select('*, profiles:user_id(avatar_url)', { count: 'exact' })
        .eq('school_id', schoolId)
        .order('full_name', { ascending: true });

      if (filters?.className && filters.className !== 'All Classes') {
        query = query.eq('class_name', filters.className);
      }

      if (filters?.section && filters.section !== 'All Sections') {
        query = query.eq('section', filters.section);
      }

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      if (filters?.search) {
        query = query.or(`full_name.ilike.%${filters.search}%,admission_number.ilike.%${filters.search}%,parent_name.ilike.%${filters.search}%`);
      }

      const { from, to } = getSupabaseRange(page, pageSize);
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;
      return { data: (data || []) as Student[], totalCount: count || 0 };
    },
    enabled: !!schoolId,
  });
}

export function useStudentStats() {
  const { user } = useAuth();
  const schoolId = useEffectiveSchoolId();

  return useQuery({
    queryKey: ['student-stats', schoolId],
    queryFn: async (): Promise<StudentStats> => {
      if (!schoolId) throw new Error('No school ID');

      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

      const [totalResult, activeResult, newResult] = await Promise.all([
        supabase
          .from('students')
          .select('*', { count: 'exact', head: true })
          .eq('school_id', schoolId),
        supabase
          .from('students')
          .select('*', { count: 'exact', head: true })
          .eq('school_id', schoolId)
          .eq('status', 'active'),
        supabase
          .from('students')
          .select('*', { count: 'exact', head: true })
          .eq('school_id', schoolId)
          .gte('created_at', startOfMonth),
      ]);

      const total = totalResult.count || 0;
      const active = activeResult.count || 0;

      return {
        total,
        active,
        inactive: total - active,
        newThisMonth: newResult.count || 0,
      };
    },
    enabled: !!schoolId,
  });
}

export function useCreateStudent() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const schoolId = useEffectiveSchoolId();

  return useMutation({
    mutationFn: async (studentData: {
      full_name: string;
      admission_number: string;
      class_name: string;
      section: string;
      roll_number?: number;
      gender?: string;
      date_of_birth?: string;
      parent_name?: string;
      parent_phone?: string;
      alternate_phone?: string;
      parent_email?: string;
      address?: string;
      blood_group?: string;
    }) => {
      if (!schoolId) throw new Error('No school ID');

      const { data, error } = await supabase
        .from('students')
        .insert({
          ...studentData,
          school_id: schoolId,
          status: 'active',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['student-stats'] });
      toast.success('Student added successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to add student');
    },
  });
}

export function useUpdateStudent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Student> & { id: string }) => {
      const { data, error } = await supabase
        .from('students')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['student-stats'] });
      toast.success('Student updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update student');
    },
  });
}

export function useDeleteStudent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ studentId, userId }: { studentId: string; userId: string | null }) => {
      const { data, error } = await supabase.functions.invoke('delete-school-user', {
        body: { user_id: userId, teacher_id: null, student_id: studentId },
      });

      if (error) throw new Error(error.message || 'Failed to delete student');
      if (!data?.success) throw new Error(data?.error || 'Failed to delete student');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['student-stats'] });
      toast.success('Student deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete student');
    },
  });
}
