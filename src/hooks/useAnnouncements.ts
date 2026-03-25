import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useEffectiveSchoolId } from '@/hooks/useEffectiveSchoolId';
import { toast } from 'sonner';
import { Database } from '@/integrations/supabase/types';
import { getSupabaseRange } from './usePagination';
import { sendNotification } from '@/lib/send-notification';
import { queryKeys } from '@/lib/query-keys';

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
  image_url: string | null;
}

export interface AnnouncementFormData {
  title: string;
  content: string;
  target_roles: AppRole[];
  target_classes?: string[];
  expires_at?: string;
  is_active: boolean;
  image_url?: string | null;
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
    queryKey: queryKeys.announcements(schoolId, filters),
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
    queryKey: queryKeys.announcementStats(schoolId),
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
          image_url: formData.image_url || null,
          school_id: schoolId,
          created_by: user?.id || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.allAnnouncements });
      queryClient.invalidateQueries({ queryKey: queryKeys.allAnnouncementStats });
      toast.success(variables.is_active ? 'Announcement published!' : 'Announcement saved as draft');

      // Notify targeted users when announcement is active
      if (variables.is_active && schoolId && data) {
        const targetRoles = variables.target_roles;

        if (targetRoles?.length) {
          // Get all users with the targeted roles in this school
          supabase
            .from('user_roles')
            .select('user_id')
            .in('role', targetRoles)
            .then(({ data: roleUsers }) => {
              if (!roleUsers?.length) return;

              const roleUserIds = roleUsers.map(r => r.user_id);

              // Filter to users in this school
              supabase
                .from('profiles')
                .select('id')
                .eq('school_id', schoolId)
                .in('id', roleUserIds)
                .then(({ data: schoolUsers }) => {
                  if (!schoolUsers?.length) return;

                  const userIds = schoolUsers.map(u => u.id);

                  sendNotification({
                    userIds,
                    title: 'New Announcement',
                    body: variables.title,
                    type: 'announcement',
                    referenceId: data.id,
                    schoolId,
                  });
                });
            });
        }
      }
    },
    // Global mutation error handler provides fallback toast
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
      queryClient.invalidateQueries({ queryKey: queryKeys.allAnnouncements });
      queryClient.invalidateQueries({ queryKey: queryKeys.allAnnouncementStats });
      toast.success('Announcement updated');
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
    // Optimistic: remove from cache immediately
    onMutate: async (announcementId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.allAnnouncements });
      const previousQueries = queryClient.getQueriesData({ queryKey: queryKeys.allAnnouncements });
      previousQueries.forEach(([key, data]: [any, any]) => {
        if (data?.data && Array.isArray(data.data)) {
          queryClient.setQueryData(key, {
            ...data,
            data: data.data.filter((a: any) => a.id !== announcementId),
            totalCount: Math.max(0, (data.totalCount || 0) - 1),
          });
        }
      });
      return { previousQueries };
    },
    onError: (_err, _id, context) => {
      if (context?.previousQueries) {
        context.previousQueries.forEach(([key, data]: [any, any]) => {
          queryClient.setQueryData(key, data);
        });
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.allAnnouncements });
      queryClient.invalidateQueries({ queryKey: queryKeys.allAnnouncementStats });
      toast.success('Announcement deleted');
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
      queryClient.invalidateQueries({ queryKey: queryKeys.allAnnouncements });
      queryClient.invalidateQueries({ queryKey: queryKeys.allAnnouncementStats });
      toast.success(variables.isActive ? 'Announcement published' : 'Announcement unpublished');
    },
  });
}
