import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '@/lib/api';
import { toast } from 'sonner';

// ─────────────────────────────────────────────────────────────────────────
// External shape is UNCHANGED from the Supabase version on purpose —
// SchoolAdminsPage.tsx and AdminCard/UserActionsMenu keep working with zero
// edits. Internally we now map from GET /api/superadmin/school-admins
// (backend/src/controllers/schooladmin.controller.js) instead of stitching
// together user_roles + profiles + schools client-side.
// ─────────────────────────────────────────────────────────────────────────

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
  avatar_url: string | null;
  school?: School;
  /**
   * NEW — the SchoolAdmin row id, which is what
   * PUT /api/superadmin/school-admins/:id expects.
   *
   * `id` above is deliberately the **User** id, not this one, because
   * SchoolAdminsPage passes `admin.id` straight into <UserActionsMenu
   * userId=…> and into the `user?.id === admin.id` self-check — both of
   * which are user-level operations. Don't collapse these two fields.
   */
  school_admin_id: string;
}

interface UseSchoolAdminsOptions {
  page: number;
  pageSize: number;
  searchQuery: string;
}

// Raw shape returned by GET /api/superadmin/school-admins
interface RawSchoolAdmin {
  id: string;
  schoolId: string;
  userId: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  designation: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    email: string;
    phone: string | null;
    isActive: boolean;
    lastLogin: string | null;
  } | null;
  school?: { id: string; name: string; schoolCode: string } | null;
}

interface RawSchool {
  id: string;
  name: string;
  schoolCode: string;
}

function mapAdmin(raw: RawSchoolAdmin): SchoolAdmin {
  return {
    // User id — see the note on `school_admin_id` above.
    id: raw.user?.id ?? raw.userId,
    school_admin_id: raw.id,
    email: raw.user?.email ?? '',
    full_name: `${raw.firstName} ${raw.lastName}`.trim(),
    school_id: raw.schoolId ?? null,
    // ⚠️ Gap: the SchoolAdmin model has no photo/avatar column (Teacher and
    // Student both have `photo`, SchoolAdmin doesn't). Always null for now,
    // so the UI falls back to initials. Needs a schema migration to fix.
    avatar_url: null,
    school: raw.school
      ? { id: raw.school.id, name: raw.school.name, code: raw.school.schoolCode }
      : undefined,
  };
}

export function useSchoolAdmins({ page, pageSize, searchQuery }: UseSchoolAdminsOptions) {
  const [admins, setAdmins] = useState<SchoolAdmin[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const schoolsLoaded = useRef(false);

  const fetchSchools = useCallback(async () => {
    if (schoolsLoaded.current) return;
    try {
      // Only feeds the "Assign to School" dropdown in CreateSchoolAdminDialog.
      // GET /superadmin/schools defaults to limit=25, so ask for a large page
      // rather than silently truncating the list.
      const { data } = await api.get('/superadmin/schools', { params: { limit: 200 } });
      const mapped = (data.schools as RawSchool[]).map(s => ({
        id: s.id,
        name: s.name,
        code: s.schoolCode,
      }));
      schoolsLoaded.current = true;
      setSchools(mapped);
    } catch (error: any) {
      // Surface this rather than swallowing it. Leaving `schools` as [] made a
      // 401 look identical to "there are no schools", which is exactly what
      // made the RLS/session outage hard to spot.
      console.error('Error fetching schools:', error);
      toast.error(
        error?.response?.data?.error || 'Failed to load schools for the assignment dropdown'
      );
    }
  }, []);

  const fetchAdmins = useCallback(async () => {
    setLoading(true);
    try {
      await fetchSchools();

      // Search is server-side now. Note it matches firstName OR lastName OR
      // email independently, so a full "First Last" string won't match the
      // way the old single full_name column did.
      const { data } = await api.get('/superadmin/school-admins', {
        params: {
          page,
          limit: pageSize,
          search: searchQuery || undefined,
        },
      });

      setAdmins((data.admins as RawSchoolAdmin[]).map(mapAdmin));
      setTotalCount(data.pagination.total as number);
    } catch (error: any) {
      console.error('Error fetching admins:', error);
      toast.error(error?.response?.data?.error || 'Failed to load school admins');
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
