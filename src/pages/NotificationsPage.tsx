import { MobileLayout } from '@/components/layout/MobileLayout';
import { NotificationCenter } from '@/components/notifications/NotificationCenter';

export default function NotificationsPage() {
  return (
    <MobileLayout title="Notifications" showBack>
      <div className="p-4">
        <NotificationCenter />
      </div>
    </MobileLayout>
  );
}
