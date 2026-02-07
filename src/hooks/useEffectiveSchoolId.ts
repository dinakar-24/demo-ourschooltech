import { useAuth } from '@/contexts/AuthContext';
import { useImpersonation } from '@/contexts/ImpersonationContext';

/**
 * Returns the effective school ID to use for data queries.
 * When a Super Admin is impersonating a school, returns the impersonated school's ID.
 * Otherwise returns the logged-in user's school ID.
 */
export function useEffectiveSchoolId(): string {
  const { user } = useAuth();
  const { impersonatedSchool, isImpersonating } = useImpersonation();

  if (isImpersonating && impersonatedSchool) {
    return impersonatedSchool.id;
  }

  return user?.schoolId || '';
}
