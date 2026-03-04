import { AdminLayout } from '@/components/layout/AdminLayout';
import { NotificationCenter } from '@/components/notifications/NotificationCenter';

export default function AdminNotificationsPage() {
  return (
    <AdminLayout title="Notifications">
      <div className="max-w-2xl">
        <NotificationCenter />
      </div>
    </AdminLayout>
  );
}
