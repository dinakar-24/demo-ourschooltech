import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useEffectiveSchoolId } from '@/hooks/useEffectiveSchoolId';
import { toast } from 'sonner';
import { sendNotification } from '@/lib/send-notification';

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
  const schoolId = useEffectiveSchoolId();

  return useQuery({
    queryKey: ['homework', schoolId, filters],
    queryFn: async () => {
      if (!schoolId) throw new Error('No school ID');

      let query = supabase
        .from('homework')
        .select(`
          *,
          class:classes(id, name),
          section:sections(id, name)
        `)
        .eq('school_id', schoolId)
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

      const { data, error } = await query.limit(50);

      if (error) throw error;
      return data as Homework[];
    },
    enabled: !!schoolId,
    staleTime: 2 * 60 * 1000,
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
        .order('due_date', { ascending: true })
        .limit(50);

      if (error) throw error;
      return data as Homework[];
    },
    enabled: !!user?.id,
    staleTime: 2 * 60 * 1000,
  });
}

export function useCreateHomework() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const schoolId = useEffectiveSchoolId();

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
      if (!schoolId || !user?.id) throw new Error('No user context');

      const { data, error } = await supabase
        .from('homework')
        .insert({
          ...homeworkData,
          school_id: schoolId,
          assigned_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['homework'] });
      queryClient.invalidateQueries({ queryKey: ['teacher-homework'] });
      toast.success('Homework posted successfully');

      // Notify students in the target class
      if (schoolId && data) {
        // Get class name for the notification
        supabase
          .from('classes')
          .select('name')
          .eq('id', variables.class_id)
          .single()
          .then(({ data: classData }) => {
            const className = classData?.name || 'your class';

            // Find student user_ids in this class
            let studentQuery = supabase
              .from('students')
              .select('user_id')
              .eq('school_id', schoolId)
              .eq('status', 'active')
              .not('user_id', 'is', null);

            if (classData?.name) {
              studentQuery = studentQuery.eq('class_name', classData.name);
            }

            studentQuery.then(({ data: students }) => {
              if (!students?.length) return;

              const studentUserIds = students
                .map(s => s.user_id)
                .filter(Boolean) as string[];

              if (studentUserIds.length > 0) {
                sendNotification({
                  userIds: studentUserIds,
                  title: 'New Homework',
                  body: `${variables.title} - ${variables.subject} (Due: ${variables.due_date})`,
                  type: 'homework',
                  referenceId: data.id,
                  schoolId,
                });
              }
            });
          });
      }
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
