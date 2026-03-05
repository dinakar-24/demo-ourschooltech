import { SuperAdminLayout } from '@/components/layout/SuperAdminLayout';
import { InstallAppPage } from '@/components/pwa/InstallAppPage';

export default function SuperAdminInstallPage() {
  return (
    <SuperAdminLayout title="Install App">
      <InstallAppPage />
    </SuperAdminLayout>
  );
}
