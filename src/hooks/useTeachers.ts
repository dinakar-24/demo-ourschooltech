import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useEffectiveSchoolId } from '@/hooks/useEffectiveSchoolId';
import { toast } from 'sonner';
import { getSupabaseRange } from './usePagination';
import { invokeEdgeFunction } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';

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
  avatar_url?: string | null;
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
  const schoolId = useEffectiveSchoolId();
  const page = filters?.page || 1;
  const pageSize = filters?.pageSize || 25;

  return useQuery({
    queryKey: queryKeys.teachers(schoolId, filters),
    queryFn: async (): Promise<PaginatedTeachers> => {
      if (!schoolId) throw new Error('No school ID');

      let query = supabase
        .from('teachers')
        .select('id,full_name,email,phone,employee_id,subjects,classes,user_id,avatar_url,school_id', { count: 'exact' })
        .eq('school_id', schoolId)
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
    enabled: !!schoolId,
    staleTime: 5 * 60 * 1000,
  });
}

/** Lightweight hook to fetch ALL teachers (id + name only) for dropdowns/comboboxes. */
export function useAllTeachersList() {
  const schoolId = useEffectiveSchoolId();

  return useQuery({
    queryKey: queryKeys.teachersList(schoolId),
    queryFn: async (): Promise<{ id: string; full_name: string }[]> => {
      if (!schoolId) throw new Error('No school ID');

      const all: { id: string; full_name: string }[] = [];
      let offset = 0;
      const batchSize = 1000;
      let hasMore = true;

      while (hasMore) {
        const { data, error } = await supabase
          .from('teachers')
          .select('id, full_name')
          .eq('school_id', schoolId)
          .order('full_name')
          .range(offset, offset + batchSize - 1);

        if (error) throw error;
        if (data && data.length > 0) {
          all.push(...data);
          offset += batchSize;
          hasMore = data.length === batchSize;
        } else {
          hasMore = false;
        }
      }

      return all;
    },
    enabled: !!schoolId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useTeacherStats() {
  const schoolId = useEffectiveSchoolId();

  return useQuery({
    queryKey: queryKeys.teacherStats(schoolId),
    queryFn: async () => {
      if (!schoolId) throw new Error('No school ID');

      const { data, error } = await supabase.rpc('get_teacher_stats' as any, {
        _school_id: schoolId,
      } as any);

      if (error) throw error;
      const result = data as any;
      return {
        total: Number(result?.total ?? 0),
        uniqueSubjects: Number(result?.unique_subjects ?? 0),
        avgClasses: Number(result?.avg_classes ?? 0),
      };
    },
    enabled: !!schoolId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useTeacherSubjects() {
  const schoolId = useEffectiveSchoolId();

  return useQuery({
    queryKey: queryKeys.teacherSubjects(schoolId),
    queryFn: async () => {
      if (!schoolId) throw new Error('No school ID');

      const { data, error } = await supabase
        .from('teachers')
        .select('subjects')
        .eq('school_id', schoolId);

      if (error) throw error;

      const allSubjects = new Set<string>();
      data?.forEach(t => {
        t.subjects?.forEach(s => allSubjects.add(s));
      });

      return ['All Subjects', ...Array.from(allSubjects).sort()];
    },
    enabled: !!schoolId,
    staleTime: 10 * 60 * 1000,
  });
}

export function useCreateTeacher() {
  const queryClient = useQueryClient();
  const schoolId = useEffectiveSchoolId();

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
      if (!schoolId) throw new Error('No school ID');

      const { data, error } = await supabase
        .from('teachers')
        .insert({
          ...teacherData,
          school_id: schoolId,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.allTeachers });
      queryClient.invalidateQueries({ queryKey: queryKeys.allTeacherStats });
      queryClient.invalidateQueries({ queryKey: queryKeys.allTeacherSubjects });
      toast.success('Teacher added successfully');
    },
  });
}

export function useUpdateTeacher() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, avatar_url, created_at, ...updates }: Partial<Teacher> & { id: string }) => {
      const { data, error } = await supabase
        .from('teachers')
        .update(updates as any)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Sync class_teacher_id on sections when classes are updated
      if (updates.classes !== undefined && data.school_id) {
        // First, clear this teacher from ALL sections they were previously assigned to
        await supabase
          .from('sections')
          .update({ class_teacher_id: null })
          .eq('school_id', data.school_id)
          .eq('class_teacher_id', id);

        // Then assign to new sections
        const assignedClasses = updates.classes || [];
        for (const cls of assignedClasses) {
          const parts = cls.split('-');
          if (parts.length === 2) {
            const [className, sectionName] = parts;
            const { data: classRow } = await supabase
              .from('classes')
              .select('id')
              .eq('school_id', data.school_id)
              .eq('name', className)
              .maybeSingle();
            if (classRow) {
              await supabase
                .from('sections')
                .update({ class_teacher_id: id })
                .eq('class_id', classRow.id)
                .eq('name', sectionName);
            }
          }
        }
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.allTeachers });
      queryClient.invalidateQueries({ queryKey: queryKeys.allTeacherSubjects });
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      toast.success('Teacher updated successfully');
    },
  });
}

export function useDeleteTeacher() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ teacherId, userId }: { teacherId: string; userId: string | null }) => {
      await invokeEdgeFunction('delete-school-user', {
        user_id: userId,
        teacher_id: teacherId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.allTeachers });
      queryClient.invalidateQueries({ queryKey: queryKeys.allTeacherStats });
      queryClient.invalidateQueries({ queryKey: queryKeys.allTeacherSubjects });
      toast.success('Teacher deleted successfully');
    },
  });
}
