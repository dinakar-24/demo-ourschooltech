import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { getSupabaseRange } from './usePagination';

interface School {
  id: string;
  name: string;
  code: string;
}

interface SchoolAdmin {
  id: string;
  email: string;
  full_name: string;
  school_id: string | null;
  school?: School;
}

interface UseSchoolAdminsOptions {
  page: number;
  pageSize: number;
  searchQuery: string;
}

export function useSchoolAdmins({ page, pageSize, searchQuery }: UseSchoolAdminsOptions) {
  const [admins, setAdmins] = useState<SchoolAdmin[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const schoolsCache = useRef<Map<string, School>>(new Map());

  const fetchSchools = useCallback(async () => {
    if (schoolsCache.current.size > 0) return;
    const { data } = await supabase.from('schools').select('id, name, code').order('name');
    (data || []).forEach(s => schoolsCache.current.set(s.id, s));
    setSchools(data || []);
  }, []);

  const fetchAdmins = useCallback(async () => {
    setLoading(true);
    try {
      await fetchSchools();

      // Get all school_admin user IDs
      const { data: rolesData } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'school_admin');

      if (!rolesData || rolesData.length === 0) {
        setAdmins([]);
        setTotalCount(0);
        setLoading(false);
        return;
      }

      const userIds = rolesData.map(r => r.user_id);

      // Build paginated profiles query
      let query = supabase
        .from('profiles')
        .select('id, email, full_name, school_id', { count: 'exact' })
        .in('id', userIds);

      if (searchQuery) {
        query = query.or(`full_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`);
      }

      const { from, to } = getSupabaseRange(page, pageSize);
      const { data: profiles, count, error } = await query
        .order('full_name')
        .range(from, to);

      if (error) throw error;

      const adminsWithSchools = (profiles || []).map(admin => ({
        ...admin,
        school: admin.school_id ? schoolsCache.current.get(admin.school_id) : undefined,
      }));

      setAdmins(adminsWithSchools);
      setTotalCount(count || 0);
    } catch (error) {
      console.error('Error fetching admins:', error);
      toast.error('Failed to load school admins');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, searchQuery, fetchSchools]);

  useEffect(() => {
    fetchAdmins();
  }, [fetchAdmins]);

  const removeAdmin = useCallback((userId: string) => {
    setAdmins(prev => prev.filter(a => a.id !== userId));
    setTotalCount(prev => Math.max(0, prev - 1));
  }, []);

  return { admins, schools, totalCount, loading, refetch: fetchAdmins, removeAdmin };
}
