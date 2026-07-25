import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface SchoolAiSettings {
  enabled: boolean;
  model: 'auto' | 'flash' | 'pro';
  tone: 'friendly' | 'formal' | 'concise' | 'playful';
  custom_instructions: string;
  allowed_roles: string[];
}

const DEFAULTS: SchoolAiSettings = {
  enabled: true,
  model: 'auto',
  tone: 'friendly',
  custom_instructions: '',
  allowed_roles: ['parent', 'student', 'teacher', 'school_admin', 'super_admin'],
};

export function useSchoolAiSettings() {
  const { user, school } = useAuth();
  const schoolId = school?.id ?? user?.school_id ?? null;

  const { data } = useQuery({
    queryKey: ['school-ai-settings', schoolId],
    enabled: !!schoolId,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_school_ai_settings' as any, { _school_id: schoolId });
      if (error) throw error;
      return { ...DEFAULTS, ...(data as Partial<SchoolAiSettings> || {}) };
    },
  });

  // Super admin has no school context; always allow
  const settings: SchoolAiSettings = !schoolId
    ? DEFAULTS
    : (data as SchoolAiSettings) ?? DEFAULTS;

  return {
    settings,
    enabled: settings.enabled,
    allowedForRole: (role?: string) => !role || settings.allowed_roles.includes(role),
  };
}