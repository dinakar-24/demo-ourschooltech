import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface Homework {
  id: string;
  school_id: string;
  class_id: string;
  section_id: string | null;
  subject: string;
  title: string;
  description: string | null;
  due_date: string;
  assigned_by: string | null;
  attachments: string[] | null;
  created_at: string;
  class?: {
    id: string;
    name: string;
  };
  section?: {
    id: string;
    name: string;
  } | null;
}

export function useHomework(filters?: {
  classId?: string;
  sectionId?: string;
  subject?: string;
}) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['homework', user?.schoolId, filters],
    queryFn: async () => {
      if (!user?.schoolId) throw new Error('No school ID');

      let query = supabase
        .from('homework')
        .select(`
          *,
          class:classes(id, name),
          section:sections(id, name)
        `)
        .eq('school_id', user.schoolId)
        .order('due_date', { ascending: true });

      if (filters?.classId) {
        query = query.eq('class_id', filters.classId);
      }

      if (filters?.sectionId) {
        query = query.eq('section_id', filters.sectionId);
      }

      if (filters?.subject) {
        query = query.eq('subject', filters.subject);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as Homework[];
    },
    enabled: !!user?.schoolId,
  });
}

export function useTeacherHomework() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['teacher-homework', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('No user ID');

      const { data, error } = await supabase
        .from('homework')
        .select(`
          *,
          class:classes(id, name),
          section:sections(id, name)
        `)
        .eq('assigned_by', user.id)
        .order('due_date', { ascending: true });

      if (error) throw error;
      return data as Homework[];
    },
    enabled: !!user?.id,
  });
}

export function useCreateHomework() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (homeworkData: {
      class_id: string;
      section_id?: string;
      subject: string;
      title: string;
      description?: string;
      due_date: string;
      attachments?: string[];
    }) => {
      if (!user?.schoolId || !user?.id) throw new Error('No user context');

      const { data, error } = await supabase
        .from('homework')
        .insert({
          ...homeworkData,
          school_id: user.schoolId,
          assigned_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['homework'] });
      queryClient.invalidateQueries({ queryKey: ['teacher-homework'] });
      toast.success('Homework posted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to post homework');
    },
  });
}

export function useUpdateHomework() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Homework> & { id: string }) => {
      const { data, error } = await supabase
        .from('homework')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['homework'] });
      queryClient.invalidateQueries({ queryKey: ['teacher-homework'] });
      toast.success('Homework updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update homework');
    },
  });
}

export function useDeleteHomework() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (homeworkId: string) => {
      const { error } = await supabase
        .from('homework')
        .delete()
        .eq('id', homeworkId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['homework'] });
      queryClient.invalidateQueries({ queryKey: ['teacher-homework'] });
      toast.success('Homework deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete homework');
    },
  });
}
