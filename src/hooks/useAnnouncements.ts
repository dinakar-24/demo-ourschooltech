import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Database } from '@/integrations/supabase/types';

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

export function useAnnouncements() {
  const { school, user } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    thisMonth: 0,
  });

  const fetchAnnouncements = useCallback(async () => {
    if (!school?.id) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setAnnouncements(data || []);

      // Calculate stats
      const today = new Date();
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      
      const active = (data || []).filter(a => a.is_active).length;
      const inactive = (data || []).filter(a => !a.is_active).length;
      const thisMonth = (data || []).filter(a => new Date(a.created_at) >= monthStart).length;

      setStats({
        total: data?.length || 0,
        active,
        inactive,
        thisMonth,
      });
    } catch (error) {
      console.error('Error fetching announcements:', error);
      toast.error('Failed to load announcements');
    } finally {
      setLoading(false);
    }
  }, [school?.id]);

  const createAnnouncement = async (formData: AnnouncementFormData) => {
    if (!school?.id) {
      toast.error('No school selected');
      return false;
    }

    try {
      const { error } = await supabase
        .from('announcements')
        .insert({
          title: formData.title,
          content: formData.content,
          target_roles: formData.target_roles,
          target_classes: formData.target_classes || null,
          expires_at: formData.expires_at || null,
          is_active: formData.is_active,
          school_id: school.id,
          created_by: user?.id || null,
        });

      if (error) throw error;

      toast.success(formData.is_active ? 'Announcement published!' : 'Announcement saved as draft');
      await fetchAnnouncements();
      return true;
    } catch (error) {
      console.error('Error creating announcement:', error);
      toast.error('Failed to create announcement');
      return false;
    }
  };

  const updateAnnouncement = async (id: string, formData: Partial<AnnouncementFormData>) => {
    try {
      const { error } = await supabase
        .from('announcements')
        .update(formData)
        .eq('id', id);

      if (error) throw error;

      toast.success('Announcement updated');
      await fetchAnnouncements();
      return true;
    } catch (error) {
      console.error('Error updating announcement:', error);
      toast.error('Failed to update announcement');
      return false;
    }
  };

  const deleteAnnouncement = async (id: string) => {
    try {
      const { error } = await supabase
        .from('announcements')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Announcement deleted');
      await fetchAnnouncements();
      return true;
    } catch (error) {
      console.error('Error deleting announcement:', error);
      toast.error('Failed to delete announcement');
      return false;
    }
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('announcements')
        .update({ is_active: isActive })
        .eq('id', id);

      if (error) throw error;

      toast.success(isActive ? 'Announcement published' : 'Announcement unpublished');
      await fetchAnnouncements();
      return true;
    } catch (error) {
      console.error('Error toggling announcement:', error);
      toast.error('Failed to update announcement');
      return false;
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  return {
    announcements,
    loading,
    stats,
    fetchAnnouncements,
    createAnnouncement,
    updateAnnouncement,
    deleteAnnouncement,
    toggleActive,
  };
}
