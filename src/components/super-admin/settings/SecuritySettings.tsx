import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Shield, Lock, Key, Loader2 } from 'lucide-react';
import { useSystemSettings } from '@/hooks/useSystemSettings';

const PASSWORD_FALLBACK = { min_length: 8, require_uppercase: true, require_special: true, expiry_days: 'never' };
const SESSION_FALLBACK = { timeout_minutes: '60', require_2fa: false, ip_allowlisting: false, max_failed_attempts: 5 };

export function SecuritySettings() {
  const { getSetting, updateSetting, isLoading } = useSystemSettings();

  const [password, setPassword] = useState(PASSWORD_FALLBACK);
  const [session, setSession] = useState(SESSION_FALLBACK);

  useEffect(() => {
    if (!isLoading) {
      setPassword(getSetting('password_policy', PASSWORD_FALLBACK));
      setSession(getSetting('session_security', SESSION_FALLBACK));
    }
  }, [isLoading]);

  const saving = updateSetting.isPending;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-primary" />
            Password Policy
          </CardTitle>
          <CardDescription>Set system-wide password requirements for all user accounts.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Minimum Password Length</p>
              <p className="text-sm text-muted-foreground">Applies to all new passwords</p>
            </div>
            <Input type="number" value={password.min_length} onChange={(e) => setPassword(s => ({ ...s, min_length: Number(e.target.value) }))} className="w-20" />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Require uppercase letters</p>
              <p className="text-sm text-muted-foreground">At least one uppercase character</p>
            </div>
            <Switch checked={password.require_uppercase} onCheckedChange={(v) => setPassword(s => ({ ...s, require_uppercase: v }))} />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Require special characters</p>
              <p className="text-sm text-muted-foreground">At least one symbol (@, #, $, etc.)</p>
            </div>
            <Switch checked={password.require_special} onCheckedChange={(v) => setPassword(s => ({ ...s, require_special: v }))} />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Password expiry</p>
              <p className="text-sm text-muted-foreground">Force password change periodically</p>
            </div>
            <Select value={password.expiry_days} onValueChange={(v) => setPassword(s => ({ ...s, expiry_days: v }))}>
              <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="never">Never</SelectItem>
                <SelectItem value="30">30 days</SelectItem>
                <SelectItem value="60">60 days</SelectItem>
                <SelectItem value="90">90 days</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button disabled={saving} onClick={() => updateSetting.mutate({ key: 'password_policy', value: password })}>
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Save Password Policy
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Session & Access
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Session Timeout</p>
              <p className="text-sm text-muted-foreground">Auto-logout after inactivity</p>
            </div>
            <Select value={session.timeout_minutes} onValueChange={(v) => setSession(s => ({ ...s, timeout_minutes: v }))}>
              <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="15">15 minutes</SelectItem>
                <SelectItem value="30">30 minutes</SelectItem>
                <SelectItem value="60">1 hour</SelectItem>
                <SelectItem value="120">2 hours</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Two-factor authentication</p>
              <p className="text-sm text-muted-foreground">Require 2FA for super admin & school admin accounts</p>
            </div>
            <Switch checked={session.require_2fa} onCheckedChange={(v) => setSession(s => ({ ...s, require_2fa: v }))} />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">IP allowlisting</p>
              <p className="text-sm text-muted-foreground">Restrict super admin access to specific IPs</p>
            </div>
            <Switch checked={session.ip_allowlisting} onCheckedChange={(v) => setSession(s => ({ ...s, ip_allowlisting: v }))} />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Max failed login attempts</p>
              <p className="text-sm text-muted-foreground">Lock account after consecutive failures</p>
            </div>
            <Input type="number" value={session.max_failed_attempts} onChange={(e) => setSession(s => ({ ...s, max_failed_attempts: Number(e.target.value) }))} className="w-20" />
          </div>
          <Button className="mt-2" disabled={saving} onClick={() => updateSetting.mutate({ key: 'session_security', value: session })}>
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Save Security Settings
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="w-5 h-5 text-primary" />
            API & Integrations
          </CardTitle>
          <CardDescription>Manage external service keys and integrations.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Razorpay Key ID</Label>
              <Input type="password" defaultValue="••••••••••••" disabled />
            </div>
            <div className="space-y-2">
              <Label>Razorpay Key Secret</Label>
              <Input type="password" defaultValue="••••••••••••" disabled />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Payment keys are managed via environment secrets for security. Contact the developer to update.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
