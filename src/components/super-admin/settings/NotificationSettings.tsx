import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Bell, Mail, MessageSquare, Loader2 } from 'lucide-react';
import { useSystemSettings } from '@/hooks/useSystemSettings';

const NOTIF_FALLBACK = { subscription_expiry_alerts: true, new_school_registration: true, payment_failure_alerts: true, maintenance_notices: false };
const EMAIL_FALLBACK = { smtp_server: '', port: '587', sender_email: 'noreply@ourschooltech.in', sender_name: 'Our School Tech' };
const SMS_FALLBACK = { enabled: false, provider: '', api_key: '' };

export function NotificationSettings() {
  const { getSetting, updateSetting, isLoading } = useSystemSettings();

  const [notif, setNotif] = useState(NOTIF_FALLBACK);
  const [email, setEmail] = useState(EMAIL_FALLBACK);
  const [sms, setSms] = useState(SMS_FALLBACK);

  useEffect(() => {
    if (!isLoading) {
      setNotif(getSetting('notifications', NOTIF_FALLBACK));
      setEmail(getSetting('email_config', EMAIL_FALLBACK));
      setSms(getSetting('sms_config', SMS_FALLBACK));
    }
  }, [isLoading]);

  const saving = updateSetting.isPending;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary" />
            System Notifications
          </CardTitle>
          <CardDescription>Configure global notification preferences for the platform.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {([
            { key: 'subscription_expiry_alerts' as const, label: 'Subscription expiry alerts', desc: 'Notify admins before their subscription expires' },
            { key: 'new_school_registration' as const, label: 'New school registration', desc: 'Get notified when a new school registers' },
            { key: 'payment_failure_alerts' as const, label: 'Payment failure alerts', desc: 'Alert when a subscription payment fails' },
            { key: 'maintenance_notices' as const, label: 'System maintenance notices', desc: 'Auto-notify all schools before maintenance' },
          ]).map((item, i) => (
            <div key={item.key}>
              {i > 0 && <Separator className="mb-4" />}
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{item.label}</p>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
                <Switch checked={notif[item.key]} onCheckedChange={(v) => setNotif(s => ({ ...s, [item.key]: v }))} />
              </div>
            </div>
          ))}
          <Button disabled={saving} onClick={() => updateSetting.mutate({ key: 'notifications', value: notif })}>
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Save Notifications
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-primary" />
            Email Configuration
          </CardTitle>
          <CardDescription>SMTP settings for outgoing platform emails.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>SMTP Server</Label>
              <Input value={email.smtp_server} onChange={(e) => setEmail(s => ({ ...s, smtp_server: e.target.value }))} placeholder="smtp.ourschooltech.in" />
            </div>
            <div className="space-y-2">
              <Label>Port</Label>
              <Input value={email.port} onChange={(e) => setEmail(s => ({ ...s, port: e.target.value }))} placeholder="587" />
            </div>
            <div className="space-y-2">
              <Label>Sender Email</Label>
              <Input type="email" value={email.sender_email} onChange={(e) => setEmail(s => ({ ...s, sender_email: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Sender Name</Label>
              <Input value={email.sender_name} onChange={(e) => setEmail(s => ({ ...s, sender_name: e.target.value }))} />
            </div>
          </div>
          <Button disabled={saving} onClick={() => updateSetting.mutate({ key: 'email_config', value: email })}>
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Save Email Settings
          </Button>
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
            <Switch checked={sms.enabled} onCheckedChange={(v) => setSms(s => ({ ...s, enabled: v }))} />
          </div>
          <Separator />
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>SMS Provider</Label>
              <Input value={sms.provider} onChange={(e) => setSms(s => ({ ...s, provider: e.target.value }))} placeholder="e.g. Twilio, MSG91" disabled={!sms.enabled} />
            </div>
            <div className="space-y-2">
              <Label>API Key</Label>
              <Input type="password" value={sms.api_key} onChange={(e) => setSms(s => ({ ...s, api_key: e.target.value }))} placeholder="••••••••" disabled={!sms.enabled} />
            </div>
          </div>
          <Button disabled={saving || !sms.enabled} onClick={() => updateSetting.mutate({ key: 'sms_config', value: sms })}>
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Save SMS Settings
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
