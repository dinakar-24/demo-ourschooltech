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
import { Shield, Lock, Key } from 'lucide-react';

export function SecuritySettings() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-primary" />
            Password Policy
          </CardTitle>
          <CardDescription>
            Set system-wide password requirements for all user accounts.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Minimum Password Length</p>
              <p className="text-sm text-muted-foreground">Applies to all new passwords</p>
            </div>
            <Input type="number" defaultValue="8" className="w-20" />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Require uppercase letters</p>
              <p className="text-sm text-muted-foreground">At least one uppercase character</p>
            </div>
            <Switch defaultChecked />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Require special characters</p>
              <p className="text-sm text-muted-foreground">At least one symbol (@, #, $, etc.)</p>
            </div>
            <Switch defaultChecked />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Password expiry</p>
              <p className="text-sm text-muted-foreground">Force password change periodically</p>
            </div>
            <Select defaultValue="never">
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="never">Never</SelectItem>
                <SelectItem value="30">30 days</SelectItem>
                <SelectItem value="60">60 days</SelectItem>
                <SelectItem value="90">90 days</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button>Save Password Policy</Button>
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
            <Select defaultValue="60">
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
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
            <Switch />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">IP allowlisting</p>
              <p className="text-sm text-muted-foreground">Restrict super admin access to specific IPs</p>
            </div>
            <Switch />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Max failed login attempts</p>
              <p className="text-sm text-muted-foreground">Lock account after consecutive failures</p>
            </div>
            <Input type="number" defaultValue="5" className="w-20" />
          </div>
          <Button className="mt-2">Save Security Settings</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="w-5 h-5 text-primary" />
            API & Integrations
          </CardTitle>
          <CardDescription>
            Manage external service keys and integrations.
          </CardDescription>
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
