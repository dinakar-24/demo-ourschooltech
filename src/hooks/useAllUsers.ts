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
      // Get total profiles count
      const { count: totalProfiles } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true });

      // Get role counts from user_roles
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role');

      const counts: Record<string, number> = {};
      const usersWithRoles = new Set<string>();

      // We need user_id too for no_role calculation
      const { data: roleDataFull } = await supabase
        .from('user_roles')
        .select('user_id, role');

      (roleDataFull || []).forEach(r => {
        counts[r.role] = (counts[r.role] || 0) + 1;
        usersWithRoles.add(r.user_id);
      });

      const total = totalProfiles || 0;

      setRoleCounts({
        all: total,
        super_admin: counts['super_admin'] || 0,
        school_admin: counts['school_admin'] || 0,
        teacher: counts['teacher'] || 0,
        parent: counts['parent'] || 0,
        student: counts['student'] || 0,
        no_role: total - usersWithRoles.size,
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

      const usersWithRoles = (profiles || []).map(profile => ({
        ...profile,
        roles: rolesMap.get(profile.id) || [],
        school_name: profile.school_id ? schoolsCache.current.get(profile.school_id) : undefined,
      }));

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
