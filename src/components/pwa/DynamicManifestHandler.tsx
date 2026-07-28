import { useTenant } from '@/contexts/TenantContext';
import { useAuth } from '@/contexts/AuthContext';
import { useDynamicManifest } from '@/hooks/useDynamicManifest';

export function DynamicManifestHandler() {
  const { tenant } = useTenant();
  const { user } = useAuth();
  useDynamicManifest(tenant, user?.role);
  return null;
}
