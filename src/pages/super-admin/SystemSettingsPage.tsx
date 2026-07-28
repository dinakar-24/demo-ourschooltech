import { SuperAdminLayout } from '@/components/layout/SuperAdminLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SchoolDefaultsSettings } from '@/components/super-admin/settings/SchoolDefaultsSettings';
import { NotificationSettings } from '@/components/super-admin/settings/NotificationSettings';
import { BrandingSettings } from '@/components/super-admin/settings/BrandingSettings';
import { SecuritySettings } from '@/components/super-admin/settings/SecuritySettings';
import { SubscriptionPricingSettings } from '@/components/super-admin/settings/SubscriptionPricingSettings';
import { PaymentSettings } from '@/components/super-admin/settings/PaymentSettings';
import { AiSettings } from '@/components/super-admin/settings/AiSettings';
import { UserCog, IndianRupee, Bell, Palette, ShieldCheck, CreditCard, Sparkles } from 'lucide-react';

const TABS = [
  { value: 'accounts', label: 'Accounts', icon: UserCog },
  { value: 'pricing', label: 'Pricing', icon: IndianRupee },
  { value: 'payments', label: 'Payments', icon: CreditCard },
  { value: 'ai', label: 'AI', icon: Sparkles },
  { value: 'notifications', label: 'Notifs', icon: Bell },
  { value: 'branding', label: 'Branding', icon: Palette },
  { value: 'security', label: 'Security', icon: ShieldCheck },
];

export default function SystemSettingsPage() {
  return (
    <SuperAdminLayout title="System Settings">
      <div className="space-y-6 animate-fade-up">
        <Tabs defaultValue="accounts" className="space-y-6">
          <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-none">
            <TabsList className="inline-flex h-auto p-1 gap-0.5 bg-muted/60 rounded-xl w-auto min-w-max">
              {TABS.map(tab => {
                const Icon = tab.icon;
                return (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    className="flex items-center gap-1.5 px-3 sm:px-4 py-2 text-xs sm:text-sm rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
                  >
                    <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                    {tab.label}
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </div>

          <TabsContent value="accounts">
            <SchoolDefaultsSettings />
          </TabsContent>

          <TabsContent value="pricing">
            <SubscriptionPricingSettings />
          </TabsContent>

          <TabsContent value="payments">
            <PaymentSettings />
          </TabsContent>

          <TabsContent value="ai">
            <AiSettings />
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
