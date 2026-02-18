import { useAuth } from '@/contexts/AuthContext';
import { useImpersonation } from '@/contexts/ImpersonationContext';
import { useTenant } from '@/contexts/TenantContext';

/**
 * Returns the effective school ID to use for data queries.
 * Priority: Impersonated school > User's school > Tenant school (subdomain)
 */
export function useEffectiveSchoolId(): string {
  const { user } = useAuth();
  const { impersonatedSchool, isImpersonating } = useImpersonation();
  const { tenant } = useTenant();

  if (isImpersonating && impersonatedSchool) {
    return impersonatedSchool.id;
  }

  if (user?.schoolId) {
    return user.schoolId;
  }

  // Fall back to tenant school ID (subdomain context)
  return tenant?.schoolId || '';
}
