import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useEffectiveSchoolId } from '@/hooks/useEffectiveSchoolId';
import { toast } from 'sonner';
import { Database } from '@/integrations/supabase/types';
import { getSupabaseRange } from './usePagination';

type AppRole = Database['public']['Enums']['app_role'];

export interface Announcement {
  id: string;
  title: string;
  content: string;
  is_active: boolean;
  expires_at: string | null;
  target_roles: AppRole[] | null;
  target_classes: string[] | null;
  created_by: string | null;
  created_at: string;
  school_id: string;
}

export interface AnnouncementFormData {
  title: string;
  content: string;
  target_roles: AppRole[];
  target_classes?: string[];
  expires_at?: string;
  is_active: boolean;
}

interface AnnouncementFilters {
  status?: 'active' | 'inactive' | 'all';
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface PaginatedAnnouncements {
  data: Announcement[];
  totalCount: number;
}

export function useAnnouncements(filters?: AnnouncementFilters) {
  const schoolId = useEffectiveSchoolId();
  const page = filters?.page || 1;
  const pageSize = filters?.pageSize || 25;

  return useQuery({
    queryKey: ['announcements', schoolId, filters],
    queryFn: async (): Promise<PaginatedAnnouncements> => {
      if (!schoolId) throw new Error('No school ID');

      let query = supabase
        .from('announcements')
        .select('*', { count: 'exact' })
        .eq('school_id', schoolId)
        .order('created_at', { ascending: false });

      if (filters?.status === 'active') {
        query = query.eq('is_active', true);
      } else if (filters?.status === 'inactive') {
        query = query.eq('is_active', false);
      }

      if (filters?.search) {
        query = query.or(`title.ilike.%${filters.search}%,content.ilike.%${filters.search}%`);
      }

      const { from, to } = getSupabaseRange(page, pageSize);
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;
      return { data: (data || []) as Announcement[], totalCount: count || 0 };
    },
    enabled: !!schoolId,
    staleTime: 2 * 60 * 1000,
  });
}

export function useAnnouncementStats() {
  const schoolId = useEffectiveSchoolId();

  return useQuery({
    queryKey: ['announcement-stats', schoolId],
    queryFn: async () => {
      if (!schoolId) throw new Error('No school ID');

      const monthStart = new Date();
      monthStart.setDate(1);
      const monthStartStr = monthStart.toISOString();

      const [totalResult, activeResult, thisMonthResult] = await Promise.all([
        supabase.from('announcements').select('*', { count: 'exact', head: true }).eq('school_id', schoolId),
        supabase.from('announcements').select('*', { count: 'exact', head: true }).eq('school_id', schoolId).eq('is_active', true),
        supabase.from('announcements').select('*', { count: 'exact', head: true }).eq('school_id', schoolId).gte('created_at', monthStartStr),
      ]);

      return {
        total: totalResult.count || 0,
        active: activeResult.count || 0,
        inactive: (totalResult.count || 0) - (activeResult.count || 0),
        thisMonth: thisMonthResult.count || 0,
      };
    },
    enabled: !!schoolId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateAnnouncement() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const schoolId = useEffectiveSchoolId();

  return useMutation({
    mutationFn: async (formData: AnnouncementFormData) => {
      if (!schoolId) throw new Error('No school ID');

      const { data, error } = await supabase
        .from('announcements')
        .insert({
          title: formData.title,
          content: formData.content,
          target_roles: formData.target_roles,
          target_classes: formData.target_classes || null,
          expires_at: formData.expires_at || null,
          is_active: formData.is_active,
          school_id: schoolId,
          created_by: user?.id || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      queryClient.invalidateQueries({ queryKey: ['announcement-stats'] });
      toast.success(variables.is_active ? 'Announcement published!' : 'Announcement saved as draft');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create announcement');
    },
  });
}

export function useUpdateAnnouncement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...formData }: Partial<AnnouncementFormData> & { id: string }) => {
      const { data, error } = await supabase
        .from('announcements')
        .update(formData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      queryClient.invalidateQueries({ queryKey: ['announcement-stats'] });
      toast.success('Announcement updated');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update announcement');
    },
  });
}

export function useDeleteAnnouncement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (announcementId: string) => {
      const { error } = await supabase
        .from('announcements')
        .delete()
        .eq('id', announcementId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      queryClient.invalidateQueries({ queryKey: ['announcement-stats'] });
      toast.success('Announcement deleted');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete announcement');
    },
  });
}

export function useToggleAnnouncement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { error } = await supabase
        .from('announcements')
        .update({ is_active: isActive })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      queryClient.invalidateQueries({ queryKey: ['announcement-stats'] });
      toast.success(variables.isActive ? 'Announcement published' : 'Announcement unpublished');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update announcement');
    },
  });
}
