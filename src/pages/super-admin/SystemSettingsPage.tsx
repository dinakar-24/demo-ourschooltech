import { SuperAdminLayout } from '@/components/layout/SuperAdminLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SchoolDefaultsSettings } from '@/components/super-admin/settings/SchoolDefaultsSettings';
import { NotificationSettings } from '@/components/super-admin/settings/NotificationSettings';
import { BrandingSettings } from '@/components/super-admin/settings/BrandingSettings';
import { SecuritySettings } from '@/components/super-admin/settings/SecuritySettings';
import { SubscriptionPricingSettings } from '@/components/super-admin/settings/SubscriptionPricingSettings';

export default function SystemSettingsPage() {
  return (
    <SuperAdminLayout title="System Settings">
      <div className="space-y-6 animate-fade-up">
        <Tabs defaultValue="accounts" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 lg:w-[620px]">
            <TabsTrigger value="accounts">Accounts</TabsTrigger>
            <TabsTrigger value="pricing">Pricing</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="branding">Branding</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
          </TabsList>

          <TabsContent value="accounts">
            <SchoolDefaultsSettings />
          </TabsContent>

          <TabsContent value="pricing">
            <SubscriptionPricingSettings />
          </TabsContent>

          <TabsContent value="notifications">
            <NotificationSettings />
          </TabsContent>

          <TabsContent value="branding">
            <BrandingSettings />
          </TabsContent>

          <TabsContent value="security">
            <SecuritySettings />
          </TabsContent>
        </Tabs>
      </div>
    </SuperAdminLayout>
  );
}
