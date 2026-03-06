import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { invokeEdgeFunction } from '@/lib/api';
import { friendlyErrorMessage } from '@/lib/error-utils';

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
      const result = await invokeEdgeFunction<{ temp_password?: string }>('manage-user', data);

      const actionLabels: Record<Action, string> = {
        disable: 'User disabled',
        enable: 'User enabled',
        delete: 'User deleted',
        update_role: 'Role updated',
        update_profile: 'Profile updated',
        reset_password: 'Password reset',
      };

      toast.success(actionLabels[data.action] || 'Action completed');
      return { success: true, temp_password: result?.temp_password };
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Operation failed';
      toast.error(friendlyErrorMessage(msg));
      return { success: false };
    } finally {
      setIsProcessing(false);
    }
  }, []);

  return { manageUser, isProcessing };
}
