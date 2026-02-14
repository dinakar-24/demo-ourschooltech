import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffectiveSchoolId } from '@/hooks/useEffectiveSchoolId';

/**
 * Returns all unique sections used across students in the current school.
 * Optionally filter by class name.
 * Falls back to A-D if no students exist yet.
 */
export function useSections(className?: string) {
  const schoolId = useEffectiveSchoolId();

  return useQuery({
    queryKey: ['dynamic-sections', schoolId, className],
    queryFn: async () => {
      if (!schoolId) return ['A', 'B', 'C', 'D'];

      let query = supabase
        .from('students')
        .select('section')
        .eq('school_id', schoolId);

      if (className && className !== 'All Classes') {
        query = query.eq('class_name', className);
      }

      const { data, error } = await query;
      if (error) throw error;

      const unique = [...new Set((data || []).map(d => d.section).filter(Boolean))].sort();
      return unique.length > 0 ? unique : ['A', 'B', 'C', 'D'];
    },
    enabled: !!schoolId,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Returns all unique fee types used across fees in the current school.
 */
export function useFeeTypes() {
  const schoolId = useEffectiveSchoolId();

  return useQuery({
    queryKey: ['dynamic-fee-types', schoolId],
    queryFn: async () => {
      if (!schoolId) return [];

      const { data, error } = await supabase
        .from('fees')
        .select('fee_type')
        .eq('school_id', schoolId);

      if (error) throw error;

      const unique = [...new Set((data || []).map(d => d.fee_type).filter(Boolean))].sort();
      return unique;
    },
    enabled: !!schoolId,
    staleTime: 5 * 60 * 1000,
  });
}
