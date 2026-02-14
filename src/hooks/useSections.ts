import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffectiveSchoolId } from '@/hooks/useEffectiveSchoolId';

/**
 * Returns all unique sections used across students in the current school.
 * Falls back to A-D if no students exist yet.
 */
export function useSections() {
  const schoolId = useEffectiveSchoolId();

  return useQuery({
    queryKey: ['sections', schoolId],
    queryFn: async () => {
      if (!schoolId) return ['A', 'B', 'C', 'D'];

      const { data, error } = await supabase
        .from('students')
        .select('section')
        .eq('school_id', schoolId);

      if (error) throw error;

      const unique = [...new Set((data || []).map(d => d.section).filter(Boolean))].sort();
      return unique.length > 0 ? unique : ['A', 'B', 'C', 'D'];
    },
    enabled: !!schoolId,
    staleTime: 5 * 60 * 1000,
  });
}
