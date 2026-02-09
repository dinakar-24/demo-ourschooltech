import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Users, Loader2 } from 'lucide-react';
import { useSystemSettings } from '@/hooks/useSystemSettings';

const ACCOUNT_DEFAULTS_FALLBACK = { auto_create_parents: true, require_email_verification: true, allow_self_registration: false };

export function SchoolDefaultsSettings() {
  const { getSetting, updateSetting, isLoading } = useSystemSettings();

  const [accountDefaults, setAccountDefaults] = useState(ACCOUNT_DEFAULTS_FALLBACK);

  useEffect(() => {
    if (!isLoading) {
      setAccountDefaults(getSetting('account_defaults', ACCOUNT_DEFAULTS_FALLBACK));
    }
  }, [isLoading]);

  const saving = updateSetting.isPending;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            User Account Defaults
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Auto-create parent accounts</p>
              <p className="text-sm text-muted-foreground">Automatically create parent accounts when adding students</p>
            </div>
            <Switch checked={accountDefaults.auto_create_parents} onCheckedChange={(v) => setAccountDefaults(s => ({ ...s, auto_create_parents: v }))} />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Require email verification</p>
              <p className="text-sm text-muted-foreground">New users must verify email before access</p>
            </div>
            <Switch checked={accountDefaults.require_email_verification} onCheckedChange={(v) => setAccountDefaults(s => ({ ...s, require_email_verification: v }))} />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Allow school self-registration</p>
              <p className="text-sm text-muted-foreground">Schools can register without super admin approval</p>
            </div>
            <Switch checked={accountDefaults.allow_self_registration} onCheckedChange={(v) => setAccountDefaults(s => ({ ...s, allow_self_registration: v }))} />
          </div>
          <Button className="mt-2" disabled={saving} onClick={() => updateSetting.mutate({ key: 'account_defaults', value: accountDefaults })}>
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Save Account Settings
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
