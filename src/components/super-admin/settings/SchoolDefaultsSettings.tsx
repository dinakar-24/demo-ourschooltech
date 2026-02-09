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
import { School, Users, Calendar, Loader2 } from 'lucide-react';
import { useSystemSettings } from '@/hooks/useSystemSettings';

const SCHOOL_DEFAULTS_FALLBACK = { student_limit: 500, subscription_plan: 'yearly', trial_duration: 30, price_per_student: 250 };
const ACADEMIC_DEFAULTS_FALLBACK = { session_start_month: 'april', timezone: 'asia-kolkata' };
const ACCOUNT_DEFAULTS_FALLBACK = { auto_create_parents: true, require_email_verification: true, allow_self_registration: false };

export function SchoolDefaultsSettings() {
  const { getSetting, updateSetting, isLoading } = useSystemSettings();

  const [schoolDefaults, setSchoolDefaults] = useState(SCHOOL_DEFAULTS_FALLBACK);
  const [academicDefaults, setAcademicDefaults] = useState(ACADEMIC_DEFAULTS_FALLBACK);
  const [accountDefaults, setAccountDefaults] = useState(ACCOUNT_DEFAULTS_FALLBACK);

  useEffect(() => {
    if (!isLoading) {
      setSchoolDefaults(getSetting('school_defaults', SCHOOL_DEFAULTS_FALLBACK));
      setAcademicDefaults(getSetting('academic_defaults', ACADEMIC_DEFAULTS_FALLBACK));
      setAccountDefaults(getSetting('account_defaults', ACCOUNT_DEFAULTS_FALLBACK));
    }
  }, [isLoading]);

  const saving = updateSetting.isPending;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <School className="w-5 h-5 text-primary" />
            Default School Settings
          </CardTitle>
          <CardDescription>These defaults are applied to all newly created schools.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Default Student Limit</Label>
              <Input type="number" value={schoolDefaults.student_limit} onChange={(e) => setSchoolDefaults(s => ({ ...s, student_limit: Number(e.target.value) }))} />
            </div>
            <div className="space-y-2">
              <Label>Default Subscription Plan</Label>
              <Select value={schoolDefaults.subscription_plan} onValueChange={(v) => setSchoolDefaults(s => ({ ...s, subscription_plan: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="trial">Trial (30 days)</SelectItem>
                  <SelectItem value="basic">Basic</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Trial Duration (days)</Label>
              <Input type="number" value={schoolDefaults.trial_duration} onChange={(e) => setSchoolDefaults(s => ({ ...s, trial_duration: Number(e.target.value) }))} />
            </div>
            <div className="space-y-2">
              <Label>Default Price per Student (₹)</Label>
              <Input type="number" value={schoolDefaults.price_per_student} onChange={(e) => setSchoolDefaults(s => ({ ...s, price_per_student: Number(e.target.value) }))} />
            </div>
          </div>
          <Button disabled={saving} onClick={() => updateSetting.mutate({ key: 'school_defaults', value: schoolDefaults })}>
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Save Defaults
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            Academic Defaults
          </CardTitle>
          <CardDescription>Default academic settings for new schools.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Default Session Start Month</Label>
              <Select value={academicDefaults.session_start_month} onValueChange={(v) => setAcademicDefaults(s => ({ ...s, session_start_month: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="january">January</SelectItem>
                  <SelectItem value="april">April</SelectItem>
                  <SelectItem value="june">June</SelectItem>
                  <SelectItem value="july">July</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Default Timezone</Label>
              <Select value={academicDefaults.timezone} onValueChange={(v) => setAcademicDefaults(s => ({ ...s, timezone: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="asia-kolkata">Asia/Kolkata (IST)</SelectItem>
                  <SelectItem value="asia-dubai">Asia/Dubai (GST)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button disabled={saving} onClick={() => updateSetting.mutate({ key: 'academic_defaults', value: academicDefaults })}>
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Save Academic Defaults
          </Button>
        </CardContent>
      </Card>

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
