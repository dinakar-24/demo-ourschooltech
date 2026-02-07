import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function useAvatarUpload() {
  const [uploading, setUploading] = useState(false);

  const uploadAvatar = async (file: File, folder: string = 'users'): Promise<string | null> => {
    try {
      setUploading(true);

      // Validate file
      if (!file.type.startsWith('image/')) {
        toast.error('Please upload an image file');
        return null;
      }
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Image must be less than 2MB');
        return null;
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${folder}/${crypto.randomUUID()}.${fileExt}`;

      const { error } = await supabase.storage.from('avatars').upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
      });

      if (error) throw error;

      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(fileName);
      return urlData.publicUrl;
    } catch (err: any) {
      toast.error('Failed to upload image');
      console.error('Avatar upload error:', err);
      return null;
    } finally {
      setUploading(false);
    }
  };

  const deleteAvatar = async (url: string): Promise<boolean> => {
    try {
      // Extract path from URL
      const path = url.split('/avatars/')[1];
      if (!path) return false;

      const { error } = await supabase.storage.from('avatars').remove([path]);
      if (error) throw error;
      return true;
    } catch (err) {
      console.error('Avatar delete error:', err);
      return false;
    }
  };

  return { uploadAvatar, deleteAvatar, uploading };
}
