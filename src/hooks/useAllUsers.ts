import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { getSupabaseRange } from './usePagination';

interface UserWithRole {
  id: string;
  email: string;
  full_name: string;
  school_id: string | null;
  avatar_url: string | null;
  school_name?: string;
  roles: string[];
  linked_students?: string[];
}

interface RoleCounts {
  all: number;
  super_admin: number;
  school_admin: number;
  teacher: number;
  parent: number;
  student: number;
  no_role: number;
}

interface UseAllUsersOptions {
  page: number;
  pageSize: number;
  searchQuery: string;
  roleFilter: string | null;
}

interface UseAllUsersResult {
  users: UserWithRole[];
  totalCount: number;
  roleCounts: RoleCounts;
  loading: boolean;
  refetch: () => void;
  removeUser: (userId: string) => void;
}

export function useAllUsers({ page, pageSize, searchQuery, roleFilter }: UseAllUsersOptions): UseAllUsersResult {
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [roleCounts, setRoleCounts] = useState<RoleCounts>({
    all: 0, super_admin: 0, school_admin: 0, teacher: 0, parent: 0, student: 0, no_role: 0,
  });
  const [loading, setLoading] = useState(true);
  const schoolsCache = useRef<Map<string, string>>(new Map());

  const fetchRoleCounts = useCallback(async () => {
    try {
      const { data, error } = await supabase.rpc('get_role_counts' as any);
      if (error) throw error;
      const r = data as any;
      setRoleCounts({
        all: Number(r?.all ?? 0),
        super_admin: Number(r?.super_admin ?? 0),
        school_admin: Number(r?.school_admin ?? 0),
        teacher: Number(r?.teacher ?? 0),
        parent: Number(r?.parent ?? 0),
        student: Number(r?.student ?? 0),
        no_role: Number(r?.no_role ?? 0),
      });
    } catch (error) {
      console.error('Error fetching role counts:', error);
    }
  }, []);

  const fetchSchools = useCallback(async () => {
    if (schoolsCache.current.size > 0) return;
    const { data } = await supabase.from('schools').select('id, name');
    (data || []).forEach(s => schoolsCache.current.set(s.id, s.name));
  }, []);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      await fetchSchools();

      let userIds: string[] | null = null;

      // If filtering by role, first get matching user IDs
      if (roleFilter && roleFilter !== 'no_role') {
        const { data: roleUsers } = await supabase
          .from('user_roles')
          .select('user_id')
          .eq('role', roleFilter as 'super_admin' | 'school_admin' | 'teacher' | 'parent' | 'student');
        userIds = (roleUsers || []).map(r => r.user_id);
        if (userIds.length === 0) {
          setUsers([]);
          setTotalCount(0);
          setLoading(false);
          return;
        }
      } else if (roleFilter === 'no_role') {
        // Get all user IDs that HAVE roles
        const { data: allRoleUsers } = await supabase
          .from('user_roles')
          .select('user_id');
        const withRoles = new Set((allRoleUsers || []).map(r => r.user_id));

        // Build query for profiles NOT in the set
        let query = supabase
          .from('profiles')
          .select('id, email, full_name, school_id, avatar_url', { count: 'exact' });

        if (searchQuery) {
          query = query.or(`full_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`);
        }

        const { data: allProfiles, count } = await query.order('full_name');

        const filtered = (allProfiles || []).filter(p => !withRoles.has(p.id));
        const total = filtered.length;
        const start = (page - 1) * pageSize;
        const paged = filtered.slice(start, start + pageSize);

        setUsers(paged.map(p => ({
          ...p,
          roles: [],
          school_name: p.school_id ? schoolsCache.current.get(p.school_id) : undefined,
        })));
        setTotalCount(total);
        setLoading(false);
        return;
      }

      // Build profiles query with server-side pagination
      let query = supabase
        .from('profiles')
        .select('id, email, full_name, school_id, avatar_url', { count: 'exact' });

      if (searchQuery) {
        query = query.or(`full_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`);
      }

      if (userIds) {
        query = query.in('id', userIds);
      }

      const { from, to } = getSupabaseRange(page, pageSize);
      const { data: profiles, count, error } = await query
        .order('full_name')
        .range(from, to);

      if (error) throw error;

      // Fetch roles for this page's users only
      const pageUserIds = (profiles || []).map(p => p.id);
      const { data: pageRoles } = pageUserIds.length > 0
        ? await supabase.from('user_roles').select('user_id, role').in('user_id', pageUserIds)
        : { data: [] };

      const rolesMap = new Map<string, string[]>();
      (pageRoles || []).forEach(r => {
        const existing = rolesMap.get(r.user_id) || [];
        existing.push(r.role);
        rolesMap.set(r.user_id, existing);
      });

      const usersWithRoles: UserWithRole[] = (profiles || []).map(profile => ({
        ...profile,
        roles: rolesMap.get(profile.id) || [],
        school_name: profile.school_id ? schoolsCache.current.get(profile.school_id) : undefined,
      }));

      // Enrich parents with linked student names
      const parentUsers = usersWithRoles.filter(u => u.roles.includes('parent'));
      if (parentUsers.length > 0) {
        const parentEmails = parentUsers.map(p => p.email);
        const { data: linkedStudents } = await supabase
          .from('students')
          .select('full_name, parent_email')
          .in('parent_email', parentEmails);

        const parentStudentMap = new Map<string, string[]>();
        (linkedStudents || []).forEach((s: any) => {
          const existing = parentStudentMap.get(s.parent_email) || [];
          existing.push(s.full_name);
          parentStudentMap.set(s.parent_email, existing);
        });

        usersWithRoles.forEach(u => {
          if (u.roles.includes('parent')) {
            u.linked_students = parentStudentMap.get(u.email) || [];
          }
        });
      }

      setUsers(usersWithRoles);
      setTotalCount(count || 0);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, searchQuery, roleFilter, fetchSchools]);

  useEffect(() => {
    fetchRoleCounts();
  }, [fetchRoleCounts]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const removeUser = useCallback((userId: string) => {
    setUsers(prev => prev.filter(u => u.id !== userId));
    setTotalCount(prev => Math.max(0, prev - 1));
    // Refresh role counts
    fetchRoleCounts();
  }, [fetchRoleCounts]);

  return { users, totalCount, roleCounts, loading, refetch: fetchUsers, removeUser };
}
