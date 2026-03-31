import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useEffectiveSchoolId } from '@/hooks/useEffectiveSchoolId';
import { toast } from 'sonner';

export interface GalleryAlbum {
  id: string;
  school_id: string;
  title: string;
  description: string | null;
  cover_image_url: string | null;
  event_date: string | null;
  is_published: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  item_count?: number;
}

export interface GalleryItem {
  id: string;
  album_id: string;
  school_id: string;
  file_url: string;
  file_type: string;
  caption: string | null;
  display_order: number;
  uploaded_by: string | null;
  created_at: string;
}

export function useGalleryAlbums(publishedOnly = false) {
  const schoolId = useEffectiveSchoolId();

  return useQuery({
    queryKey: ['gallery-albums', schoolId, publishedOnly],
    queryFn: async () => {
      if (!schoolId) throw new Error('No school ID');
      let query = supabase
        .from('gallery_albums')
        .select('id,title,description,cover_image_url,event_date,is_published,school_id,created_at,created_by')
        .eq('school_id', schoolId)
        .order('event_date', { ascending: false, nullsFirst: false });

      if (publishedOnly) {
        query = query.eq('is_published', true);
      }

      const { data, error } = await query.limit(50);
      if (error) throw error;
      return data as GalleryAlbum[];
    },
    enabled: !!schoolId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useGalleryItems(albumId?: string) {
  const schoolId = useEffectiveSchoolId();

  return useQuery({
    queryKey: ['gallery-items', albumId],
    queryFn: async () => {
      if (!albumId) return [];
      const { data, error } = await supabase
        .from('gallery_items')
        .select('id,album_id,file_url,file_type,caption,display_order,school_id,uploaded_by,created_at')
        .eq('album_id', albumId)
        .order('display_order', { ascending: true });
      if (error) throw error;
      return data as GalleryItem[];
    },
    enabled: !!albumId,
  });
}

export function useCreateAlbum() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const schoolId = useEffectiveSchoolId();

  return useMutation({
    mutationFn: async (data: { title: string; description?: string; event_date?: string; is_published?: boolean }) => {
      if (!schoolId) throw new Error('No school ID');
      const { data: album, error } = await supabase
        .from('gallery_albums')
        .insert({ ...data, school_id: schoolId, created_by: user?.id })
        .select()
        .single();
      if (error) throw error;
      return album;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gallery-albums'] });
      toast.success('Album created');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateAlbum() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; title?: string; description?: string; event_date?: string; is_published?: boolean; cover_image_url?: string }) => {
      const { error } = await supabase.from('gallery_albums').update(data).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gallery-albums'] });
      toast.success('Album updated');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteAlbum() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('gallery_albums').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gallery-albums'] });
      toast.success('Album deleted');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUploadGalleryItem() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const schoolId = useEffectiveSchoolId();

  return useMutation({
    mutationFn: async ({ albumId, file, caption }: { albumId: string; file: File; caption?: string }) => {
      if (!schoolId) throw new Error('No school ID');
      const ext = file.name.split('.').pop();
      const path = `${schoolId}/${albumId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: uploadError } = await supabase.storage.from('gallery').upload(path, file);
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from('gallery').getPublicUrl(path);
      const fileType = file.type.startsWith('video/') ? 'video' : 'image';

      const { error } = await supabase.from('gallery_items').insert({
        album_id: albumId,
        school_id: schoolId,
        file_url: urlData.publicUrl,
        file_type: fileType,
        caption: caption || null,
        uploaded_by: user?.id,
      });
      if (error) throw error;

      // Set as cover if first item
      const { count } = await supabase.from('gallery_items').select('*', { count: 'exact', head: true }).eq('album_id', albumId);
      if (count === 1) {
        await supabase.from('gallery_albums').update({ cover_image_url: urlData.publicUrl }).eq('id', albumId);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gallery-items'] });
      queryClient.invalidateQueries({ queryKey: ['gallery-albums'] });
      toast.success('File uploaded');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteGalleryItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, albumId, fileUrl }: { id: string; albumId: string; fileUrl?: string }) => {
      // Check if this item is the album's cover image
      if (fileUrl) {
        const { data: album } = await supabase
          .from('gallery_albums')
          .select('cover_image_url')
          .eq('id', albumId)
          .single();
        if (album?.cover_image_url === fileUrl) {
          // Clear the cover image
          await supabase.from('gallery_albums').update({ cover_image_url: null }).eq('id', albumId);
        }
      }
      const { error } = await supabase.from('gallery_items').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gallery-items'] });
      queryClient.invalidateQueries({ queryKey: ['gallery-albums'] });
      toast.success('Item deleted');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
