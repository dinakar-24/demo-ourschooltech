import { MobileLayout } from '@/components/layout/MobileLayout';
import { SharedSettings } from '@/components/settings/SharedSettings';
import { useTranslation } from 'react-i18next';

export default function StudentSettings() {
  const { t } = useTranslation();

  return (
    <MobileLayout title={t('settingsPage.title')} showBack>
      <div className="p-4">
        <SharedSettings />
      </div>
    </MobileLayout>
  );
}
