import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type UserRole = 'school_admin' | 'teacher' | 'parent' | 'student';

interface CreateUserData {
  email: string;
  password: string;
  full_name: string;
  phone?: string;
  role: UserRole;
  school_id: string;
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
      const { data: result, error } = await supabase.functions.invoke('create-school-user', {
        body: data,
      });

      if (error) {
        throw new Error(error.message);
      }

      if (!result.success) {
        throw new Error(result.error || 'Failed to create user');
      }

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
