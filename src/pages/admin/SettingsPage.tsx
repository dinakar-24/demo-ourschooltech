import { useState } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  School,
  Bell,
  Lock,
  Calendar,
  CreditCard,
  Shield,
  Loader2,
  Globe,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useEffectiveSchoolId } from '@/hooks/useEffectiveSchoolId';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिन्दी (Hindi)' },
  { code: 'te', label: 'తెలుగు (Telugu)' },
  { code: 'kn', label: 'ಕನ್ನಡ (Kannada)' },
  { code: 'ta', label: 'தமிழ் (Tamil)' },
  { code: 'mr', label: 'मराठी (Marathi)' },
  { code: 'bn', label: 'বাংলা (Bengali)' },
  { code: 'ml', label: 'മലയാളം (Malayalam)' },
];
export default function SettingsPage() {
  const { school } = useAuth();
  const { t, i18n } = useTranslation();
  const schoolId = useEffectiveSchoolId();
  const [saving, setSaving] = useState(false);

  const handleLanguageChange = (val: string) => {
    i18n.changeLanguage(val);
    localStorage.setItem('app-language', val);
    const langLabel = LANGUAGES.find(l => l.code === val)?.label || val;
    toast.success(t('settingsPage.languageSet', { language: langLabel }));
  };

  // School info form state
  const [schoolName, setSchoolName] = useState(school?.name || '');
  const [schoolAddress, setSchoolAddress] = useState(school?.address || '');
  const [schoolCity, setSchoolCity] = useState(school?.city || '');
  const [schoolEmail, setSchoolEmail] = useState('');
  const [schoolPhone, setSchoolPhone] = useState('');

  const handleSaveSchoolInfo = async () => {
    if (!schoolId) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('schools')
        .update({
          name: schoolName,
          address: schoolAddress,
          city: schoolCity,
          email: schoolEmail,
          phone: schoolPhone,
        })
        .eq('id', schoolId);

      if (error) throw error;
      toast.success('School information updated successfully');
    } catch (err: any) {
      toast.error(err.message || 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout title="Settings">
      <div className="space-y-6 animate-fade-up">
        <Tabs defaultValue="school" className="space-y-6">
          <div className="overflow-x-auto -mx-1 px-1 scrollbar-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <TabsList className="inline-flex w-auto min-w-max sm:grid sm:grid-cols-5 sm:w-[500px]">
              <TabsTrigger value="school" className="text-xs sm:text-sm">School</TabsTrigger>
              <TabsTrigger value="academic" className="text-xs sm:text-sm">Academic</TabsTrigger>
              <TabsTrigger value="notifications" className="text-xs sm:text-sm">Notifications</TabsTrigger>
              <TabsTrigger value="security" className="text-xs sm:text-sm">Security</TabsTrigger>
              <TabsTrigger value="language" className="text-xs sm:text-sm">Language</TabsTrigger>
            </TabsList>
          </div>

          {/* School Settings */}
          <TabsContent value="school" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <School className="w-5 h-5" />
                  School Information
                </CardTitle>
                <CardDescription>
                  Update your school's basic information and branding.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>School Name</Label>
                    <Input value={schoolName} onChange={(e) => setSchoolName(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>School Code</Label>
                    <Input defaultValue={school?.code || ''} disabled className="opacity-60" />
                  </div>
                  <div className="space-y-2">
                    <Label>Address</Label>
                    <Input value={schoolAddress} onChange={(e) => setSchoolAddress(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>City</Label>
                    <Input value={schoolCity} onChange={(e) => setSchoolCity(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input type="email" value={schoolEmail} onChange={(e) => setSchoolEmail(e.target.value)} placeholder="school@example.com" />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone</Label>
                    <Input value={schoolPhone} onChange={(e) => setSchoolPhone(e.target.value)} placeholder="+91 XXXXX XXXXX" />
                  </div>
                </div>
                <Button onClick={handleSaveSchoolInfo} disabled={saving}>
                  {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Save Changes
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Academic Settings */}
          <TabsContent value="academic" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Academic Year
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Current Academic Year</Label>
                    <Select defaultValue="2024-25">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="2024-25">2024-25</SelectItem>
                        <SelectItem value="2025-26">2025-26</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Session Start Month</Label>
                    <Select defaultValue="april">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="april">April</SelectItem>
                        <SelectItem value="june">June</SelectItem>
                        <SelectItem value="july">July</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Fee Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Late Fee Penalty</p>
                    <p className="text-sm text-muted-foreground">Apply penalty for late payments</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Late Fee Amount (₹)</Label>
                    <Input type="number" defaultValue="500" />
                  </div>
                  <div className="space-y-2">
                    <Label>Grace Period (days)</Label>
                    <Input type="number" defaultValue="7" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notification Settings */}
          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  Notification Preferences
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Fee Reminders</p>
                    <p className="text-sm text-muted-foreground">Automatic reminders for pending fees</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Attendance Alerts</p>
                    <p className="text-sm text-muted-foreground">Alert parents when student is absent</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Settings */}
          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="w-5 h-5" />
                  Password Policy
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Minimum Password Length</p>
                    <p className="text-sm text-muted-foreground">Minimum 8 characters required</p>
                  </div>
                  <Input type="number" defaultValue="8" className="w-20" />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Require Special Characters</p>
                    <p className="text-sm text-muted-foreground">Password must contain @, #, $ etc.</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Access Control
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Session Timeout</p>
                    <p className="text-sm text-muted-foreground">Auto logout after inactivity</p>
                  </div>
                  <Select defaultValue="30">
                    <SelectTrigger className="w-[120px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 minutes</SelectItem>
                      <SelectItem value="30">30 minutes</SelectItem>
                      <SelectItem value="60">1 hour</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Language Settings */}
          <TabsContent value="language" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="w-5 h-5" />
                  Language Preference
                </CardTitle>
                <CardDescription>
                  Choose your preferred language for the admin interface.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between max-w-md">
                  <div>
                    <p className="font-medium">Interface Language</p>
                    <p className="text-sm text-muted-foreground">Select the language for all menus and labels</p>
                  </div>
                  <Select value={i18n.language} onValueChange={handleLanguageChange}>
                    <SelectTrigger className="w-[160px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LANGUAGES.map((lang) => (
                        <SelectItem key={lang.code} value={lang.code}>{lang.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

        </Tabs>
      </div>
    </AdminLayout>
  );
}
