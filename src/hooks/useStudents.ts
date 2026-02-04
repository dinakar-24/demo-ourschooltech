import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

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

export function useStudents(filters?: { 
  className?: string; 
  section?: string;
  status?: string;
  search?: string;
}) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['students', user?.schoolId, filters],
    queryFn: async () => {
      if (!user?.schoolId) throw new Error('No school ID');

      let query = supabase
        .from('students')
        .select('*')
        .eq('school_id', user.schoolId)
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

      const { data, error } = await query;

      if (error) throw error;
      return data as Student[];
    },
    enabled: !!user?.schoolId,
  });
}

export function useStudentStats() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['student-stats', user?.schoolId],
    queryFn: async (): Promise<StudentStats> => {
      if (!user?.schoolId) throw new Error('No school ID');

      // Get all students
      const { data: students, error } = await supabase
        .from('students')
        .select('status, created_at')
        .eq('school_id', user.schoolId);

      if (error) throw error;

      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const stats: StudentStats = {
        total: students?.length || 0,
        active: students?.filter(s => s.status === 'active').length || 0,
        inactive: students?.filter(s => s.status !== 'active').length || 0,
        newThisMonth: students?.filter(s => new Date(s.created_at) >= startOfMonth).length || 0,
      };

      return stats;
    },
    enabled: !!user?.schoolId,
  });
}

export function useCreateStudent() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

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
      parent_email?: string;
      address?: string;
    }) => {
      if (!user?.schoolId) throw new Error('No school ID');

      const { data, error } = await supabase
        .from('students')
        .insert({
          ...studentData,
          school_id: user.schoolId,
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
    mutationFn: async (studentId: string) => {
      // Soft delete - set status to deactivated
      const { error } = await supabase
        .from('students')
        .update({ status: 'deactivated' })
        .eq('id', studentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['student-stats'] });
      toast.success('Student deactivated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to deactivate student');
    },
  });
}
