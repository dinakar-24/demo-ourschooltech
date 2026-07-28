import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffectiveSchoolId } from '@/hooks/useEffectiveSchoolId';
import { toast } from 'sonner';

export interface OnlineClass {
  id: string;
  school_id: string;
  title: string;
  description: string | null;
  platform: string;
  meeting_url: string | null;
  meeting_id: string | null;
  password: string | null;
  class_name: string | null;
  section: string | null;
  subject: string | null;
  teacher_id: string | null;
  scheduled_at: string;
  duration_minutes: number;
  status: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  teacher?: { id: string; full_name: string } | null;
}

export type OnlineClassInsert = Omit<OnlineClass, 'id' | 'created_at' | 'updated_at' | 'teacher'>;

export function useOnlineClasses(filters?: { status?: string; class_name?: string }) {
  const schoolId = useEffectiveSchoolId();

  return useQuery({
    queryKey: ['online-classes', schoolId, filters],
    queryFn: async () => {
      if (!schoolId) return [];
      let query = supabase
        .from('online_classes')
        .select('*, teacher:teachers(id, full_name)')
        .eq('school_id', schoolId)
        .order('scheduled_at', { ascending: false });

      if (filters?.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }
      if (filters?.class_name && filters.class_name !== 'All Classes') {
        query = query.eq('class_name', filters.class_name);
      }

      const { data, error } = await query.limit(50);
      if (error) throw error;
      return (data || []) as OnlineClass[];
    },
    enabled: !!schoolId,
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

export function useTeacherOnlineClasses(teacherUserId?: string) {
  const schoolId = useEffectiveSchoolId();

  return useQuery({
    queryKey: ['teacher-online-classes', schoolId, teacherUserId],
    queryFn: async () => {
      if (!schoolId || !teacherUserId) return [];

      // Get teacher record first
      const { data: teacher } = await supabase
        .from('teachers')
        .select('id')
        .eq('user_id', teacherUserId)
        .eq('school_id', schoolId)
        .maybeSingle();

      if (!teacher) return [];

      const { data, error } = await supabase
        .from('online_classes')
        .select('*, teacher:teachers(id, full_name)')
        .eq('school_id', schoolId)
        .eq('teacher_id', teacher.id)
        .order('scheduled_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return (data || []) as OnlineClass[];
    },
    enabled: !!schoolId && !!teacherUserId,
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

export function useCreateOnlineClass() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: OnlineClassInsert) => {
      const { error } = await supabase.from('online_classes').insert(data as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['online-classes'] });
      queryClient.invalidateQueries({ queryKey: ['teacher-online-classes'] });
      toast.success('Online class created successfully');
    },
    onError: (err: any) => toast.error(err.message),
  });
}

export function useUpdateOnlineClass() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<OnlineClass> & { id: string }) => {
      const { teacher, ...updateData } = data as any;
      const { error } = await supabase.from('online_classes').update(updateData).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['online-classes'] });
      queryClient.invalidateQueries({ queryKey: ['teacher-online-classes'] });
      toast.success('Online class updated');
    },
    onError: (err: any) => toast.error(err.message),
  });
}

export function useDeleteOnlineClass() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('online_classes').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['online-classes'] });
      queryClient.invalidateQueries({ queryKey: ['teacher-online-classes'] });
      toast.success('Online class deleted');
    },
    onError: (err: any) => toast.error(err.message),
  });
}
