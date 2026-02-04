import { SuperAdminLayout } from '@/components/layout/SuperAdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings, Shield, Database, Bell, Globe } from 'lucide-react';

export default function SystemSettingsPage() {
  return (
    <SuperAdminLayout title="System Settings">
      <div className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                Security Settings
              </CardTitle>
              <CardDescription>Configure system-wide security options</CardDescription>
            </CardHeader>
            <CardContent className="text-muted-foreground text-sm">
              Security settings will be available here. Configure password policies, 
              session timeouts, and access controls.
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5 text-primary" />
                Database
              </CardTitle>
              <CardDescription>Database management and backups</CardDescription>
            </CardHeader>
            <CardContent className="text-muted-foreground text-sm">
              Database statistics and backup options will be available here.
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-primary" />
                Notifications
              </CardTitle>
              <CardDescription>Configure system notifications</CardDescription>
            </CardHeader>
            <CardContent className="text-muted-foreground text-sm">
              Email and push notification settings will be available here.
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-primary" />
                General
              </CardTitle>
              <CardDescription>General system configuration</CardDescription>
            </CardHeader>
            <CardContent className="text-muted-foreground text-sm">
              System name, timezone, and other general settings will be available here.
            </CardContent>
          </Card>
        </div>
      </div>
    </SuperAdminLayout>
  );
}
