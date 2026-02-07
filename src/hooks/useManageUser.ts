import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type Action = 'disable' | 'enable' | 'delete' | 'update_role' | 'update_profile' | 'reset_password';

interface ManageUserData {
  action: Action;
  user_id: string;
  full_name?: string;
  phone?: string;
  school_id?: string;
  new_role?: string;
  old_role?: string;
}

export function useManageUser() {
  const [isProcessing, setIsProcessing] = useState(false);

  const manageUser = useCallback(async (data: ManageUserData): Promise<{ success: boolean; temp_password?: string }> => {
    setIsProcessing(true);
    try {
      const response = await supabase.functions.invoke('manage-user', { body: data });

      if (response.error) {
        throw new Error(response.error.message || 'Failed to call server function');
      }

      if (!response.data?.success) {
        throw new Error(response.data?.error || 'Operation failed');
      }

      const actionLabels: Record<Action, string> = {
        disable: 'User disabled',
        enable: 'User enabled',
        delete: 'User deleted',
        update_role: 'Role updated',
        update_profile: 'Profile updated',
        reset_password: 'Password reset',
      };

      toast.success(actionLabels[data.action] || 'Action completed');
      return { success: true, temp_password: response.data?.temp_password };
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Operation failed';
      toast.error(msg);
      return { success: false };
    } finally {
      setIsProcessing(false);
    }
  }, []);

  return { manageUser, isProcessing };
}
