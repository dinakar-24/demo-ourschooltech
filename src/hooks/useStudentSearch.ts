import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffectiveSchoolId } from '@/hooks/useEffectiveSchoolId';
import { useDebounce } from '@/hooks/useDebounce';

interface StudentSearchResult {
  id: string;
  full_name: string;
  admission_number: string;
  class_name: string;
  section: string;
}

/**
 * Lightweight student search hook for dropdowns/selectors.
 * Only fetches up to 20 matches based on search input — never loads the full student list.
 */
export function useStudentSearch() {
  const schoolId = useEffectiveSchoolId();
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebounce(searchInput, 400);

  const { data: students = [], isLoading } = useQuery({
    queryKey: ['student-search', schoolId, debouncedSearch],
    queryFn: async (): Promise<StudentSearchResult[]> => {
      if (!schoolId || !debouncedSearch || debouncedSearch.length < 2) return [];

      const { data, error } = await supabase
        .from('students')
        .select('id, full_name, admission_number, class_name, section')
        .eq('school_id', schoolId)
        .eq('status', 'active')
        .or(`full_name.ilike.%${debouncedSearch}%,admission_number.ilike.%${debouncedSearch}%`)
        .order('full_name')
        .limit(20);

      if (error) throw error;
      return data || [];
    },
    enabled: !!schoolId && debouncedSearch.length >= 2,
    staleTime: 30 * 1000,
  });

  return {
    students,
    isLoading,
    searchInput,
    setSearchInput,
    hasSearched: debouncedSearch.length >= 2,
  };
}
