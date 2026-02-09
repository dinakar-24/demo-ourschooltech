import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Bell, Mail, MessageSquare } from 'lucide-react';

export function NotificationSettings() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary" />
            System Notifications
          </CardTitle>
          <CardDescription>
            Configure global notification preferences for the platform.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Subscription expiry alerts</p>
              <p className="text-sm text-muted-foreground">Notify admins before their subscription expires</p>
            </div>
            <Switch defaultChecked />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">New school registration</p>
              <p className="text-sm text-muted-foreground">Get notified when a new school registers</p>
            </div>
            <Switch defaultChecked />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Payment failure alerts</p>
              <p className="text-sm text-muted-foreground">Alert when a subscription payment fails</p>
            </div>
            <Switch defaultChecked />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">System maintenance notices</p>
              <p className="text-sm text-muted-foreground">Auto-notify all schools before maintenance</p>
            </div>
            <Switch />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-primary" />
            Email Configuration
          </CardTitle>
          <CardDescription>
            SMTP settings for outgoing platform emails.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>SMTP Server</Label>
              <Input placeholder="smtp.ourschooltech.in" />
            </div>
            <div className="space-y-2">
              <Label>Port</Label>
              <Input placeholder="587" />
            </div>
            <div className="space-y-2">
              <Label>Sender Email</Label>
              <Input type="email" defaultValue="noreply@ourschooltech.in" />
            </div>
            <div className="space-y-2">
              <Label>Sender Name</Label>
              <Input defaultValue="Our School Tech" />
            </div>
          </div>
          <div className="flex gap-2">
            <Button>Save Email Settings</Button>
            <Button variant="outline">Send Test Email</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary" />
            SMS Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Enable SMS notifications</p>
              <p className="text-sm text-muted-foreground">Send SMS alerts to parents and admins</p>
            </div>
            <Switch />
          </div>
          <Separator />
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>SMS Provider</Label>
              <Input placeholder="e.g. Twilio, MSG91" disabled />
            </div>
            <div className="space-y-2">
              <Label>API Key</Label>
              <Input type="password" placeholder="••••••••" disabled />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">Enable SMS notifications above to configure provider settings.</p>
        </CardContent>
      </Card>
    </div>
  );
}
