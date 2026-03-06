import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { extractEdgeFunctionError } from '@/lib/error-utils';

type UserRole = 'school_admin' | 'teacher' | 'parent' | 'student';

interface CreateUserData {
  email: string;
  password: string;
  full_name: string;
  phone?: string;
  role: UserRole;
  school_id: string;
  avatar_url?: string;
  employee_id?: string;
  subjects?: string[];
  classes?: string[];
  class_name?: string;
  section?: string;
  admission_number?: string;
}

export function useCreateSchoolUser() {
  const [isCreating, setIsCreating] = useState(false);

  const createUser = useCallback(async (data: CreateUserData): Promise<boolean> => {
    setIsCreating(true);
    try {
      const response = await supabase.functions.invoke('create-school-user', {
        body: data,
      });

      const errorMsg = await extractEdgeFunctionError(response);
      if (errorMsg) throw new Error(errorMsg);

      toast.success(`${data.role.replace('_', ' ')} account created successfully`);
      return true;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create user';
      toast.error(errorMessage);
      console.error('Create user error:', error);
      return false;
    } finally {
      setIsCreating(false);
    }
  }, []);

  return { createUser, isCreating };
}
