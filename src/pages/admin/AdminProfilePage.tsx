import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AvatarUpload } from '@/components/ui/avatar-upload';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { useImpersonation } from '@/contexts/ImpersonationContext';
import { useEffectiveSchoolId } from '@/hooks/useEffectiveSchoolId';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Mail,
  Phone,
  Settings,
  LogOut,
  ChevronRight,
  Bell,
  Shield,
  CreditCard,
  Globe,
  Loader2,
  Pencil,
  Check,
  X,
  MapPin,
  Building,
  User,
  Calendar,
} from 'lucide-react';
import { format } from 'date-fns';

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

export default function AdminProfilePage() {
  const { user, school, logout } = useAuth();
  const { impersonatedSchool, isImpersonating } = useImpersonation();
  const schoolId = useEffectiveSchoolId();
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const queryClient = useQueryClient();

  const displaySchool = isImpersonating ? impersonatedSchool : school;

  const [editingProfile, setEditingProfile] = useState(false);
  const [profileName, setProfileName] = useState(user?.name || '');
  const [profilePhone, setProfilePhone] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  const [editingSchool, setEditingSchool] = useState(false);
  const [schoolName, setSchoolName] = useState(displaySchool?.name || '');
  const [schoolAddress, setSchoolAddress] = useState((school as any)?.address || '');
  const [schoolCity, setSchoolCity] = useState((school as any)?.city || '');
  const [schoolEmail, setSchoolEmail] = useState('');
  const [schoolPhone, setSchoolPhone] = useState('');
  const [savingSchool, setSavingSchool] = useState(false);

  const { data: profileData } = useQuery({
    queryKey: ['admin-profile', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('profiles')
        .select('full_name, phone, email, created_at')
        .eq('id', user!.id)
        .single();
      return data;
    },
    enabled: !!user?.id,
  });

  const { data: schoolData } = useQuery({
    queryKey: ['school-details', schoolId],
    queryFn: async () => {
      const { data } = await supabase
        .from('schools')
        .select('name, address, city, email, phone, logo, code')
        .eq('id', schoolId)
        .single();
      return data;
    },
    enabled: !!schoolId,
  });

  useEffect(() => {
    if (profileData) {
      setProfileName(profileData.full_name || '');
      setProfilePhone(profileData.phone || '');
    }
  }, [profileData]);

  useEffect(() => {
    if (schoolData) {
      setSchoolName(schoolData.name || '');
      setSchoolAddress(schoolData.address || '');
      setSchoolCity(schoolData.city || '');
      setSchoolEmail(schoolData.email || '');
      setSchoolPhone(schoolData.phone || '');
    }
  }, [schoolData]);

  const handleSaveProfile = async () => {
    if (!profileName.trim()) { toast.error('Name is required'); return; }
    setSavingProfile(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: profileName.trim(), phone: profilePhone.trim() || null })
        .eq('id', user!.id);
      if (error) throw error;
      toast.success('Profile updated');
      setEditingProfile(false);
      queryClient.invalidateQueries({ queryKey: ['admin-profile'] });
    } catch (err: any) {
      toast.error(err.message || 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSaveSchool = async () => {
    if (!schoolId) return;
    setSavingSchool(true);
    try {
      const { error } = await supabase
        .from('schools')
        .update({
          name: schoolName.trim(),
          address: schoolAddress.trim(),
          city: schoolCity.trim(),
          phone: schoolPhone.trim() || null,
        })
        .eq('id', schoolId);
      if (error) throw error;
      toast.success('School info updated');
      setEditingSchool(false);
      queryClient.invalidateQueries({ queryKey: ['school-details'] });
    } catch (err: any) {
      toast.error(err.message || 'Failed to update school info');
    } finally {
      setSavingSchool(false);
    }
  };

  const handleLanguageChange = (val: string) => {
    i18n.changeLanguage(val);
    localStorage.setItem('app-language', val);
    const langLabel = LANGUAGES.find(l => l.code === val)?.label || val;
    toast.success(`Language changed to ${langLabel}`);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <AdminLayout title="My Profile">
      <div className="max-w-2xl mx-auto space-y-5 pb-8">

        {/* Hero Profile Card */}
        <Card className="overflow-hidden">
          <div className="h-24 bg-gradient-to-r from-primary/80 to-primary/40" />
          <CardContent className="relative px-5 pb-5">
            <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-12">
              <div className="ring-4 ring-background rounded-full">
                <AvatarUpload
                  value={user?.avatar}
                  onChange={async (url) => {
                    if (user?.id) {
                      await supabase.from('profiles').update({ avatar_url: url }).eq('id', user.id);
                      queryClient.invalidateQueries({ queryKey: ['admin-profile'] });
                    }
                  }}
                  fallback={user?.name}
                  size="lg"
                  folder="admins"
                />
              </div>
              <div className="flex-1 min-w-0 sm:pb-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-foreground truncate">
                    {profileData?.full_name || user?.name}
                  </h2>
                  {!editingProfile && (
                    <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => setEditingProfile(true)}>
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
                <p className="text-sm text-muted-foreground truncate">{user?.email}</p>
                <Badge className="mt-1.5 bg-primary/10 text-primary hover:bg-primary/15 border-0">
                  <Shield className="w-3 h-3 mr-1" />
                  School Admin
                </Badge>
              </div>
            </div>

            {editingProfile ? (
              <div className="mt-5 pt-4 border-t border-border space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-muted-foreground">Full Name</Label>
                    <Input value={profileName} onChange={e => setProfileName(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-muted-foreground">Phone Number</Label>
                    <Input value={profilePhone} onChange={e => setProfilePhone(e.target.value)} placeholder="+91 XXXXX XXXXX" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleSaveProfile} disabled={savingProfile}>
                    {savingProfile ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Check className="w-4 h-4 mr-1" />}
                    Save
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => { setEditingProfile(false); setProfileName(profileData?.full_name || ''); setProfilePhone(profileData?.phone || ''); }}>
                    <X className="w-4 h-4 mr-1" /> Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <Mail className="w-4 h-4 text-primary shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">Email</p>
                    <p className="text-sm text-foreground truncate">{user?.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <Phone className="w-4 h-4 text-primary shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">Phone</p>
                    <p className="text-sm text-foreground">{profileData?.phone || '—'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <Building className="w-4 h-4 text-primary shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">School</p>
                    <p className="text-sm text-foreground truncate">{displaySchool?.name || '—'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <Calendar className="w-4 h-4 text-primary shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">Member Since</p>
                    <p className="text-sm text-foreground">
                      {profileData?.created_at ? format(new Date(profileData.created_at), 'MMM yyyy') : '—'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* School Info */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-primary/10">
                  <Building className="w-4 h-4 text-primary" />
                </div>
                School Information
              </CardTitle>
              {!editingSchool && (
                <Button variant="ghost" size="sm" className="text-xs gap-1" onClick={() => setEditingSchool(true)}>
                  <Pencil className="w-3 h-3" /> Edit
                </Button>
              )}
            </div>
            {schoolData?.code && (
              <p className="text-xs text-muted-foreground mt-1">School Code: <span className="font-mono font-medium text-foreground">{schoolData.code}</span></p>
            )}
          </CardHeader>
          <CardContent className="space-y-3">
            {editingSchool ? (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-muted-foreground">School Name</Label>
                    <Input value={schoolName} onChange={e => setSchoolName(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-muted-foreground">City</Label>
                    <Input value={schoolCity} onChange={e => setSchoolCity(e.target.value)} />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label className="text-xs font-medium text-muted-foreground">Address</Label>
                    <Input value={schoolAddress} onChange={e => setSchoolAddress(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-muted-foreground">Email</Label>
                    <Input value={schoolEmail} disabled className="opacity-60 cursor-not-allowed" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-muted-foreground">Phone</Label>
                    <Input value={schoolPhone} onChange={e => setSchoolPhone(e.target.value)} placeholder="+91 XXXXX XXXXX" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleSaveSchool} disabled={savingSchool}>
                    {savingSchool ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Check className="w-4 h-4 mr-1" />}
                    Save
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setEditingSchool(false)}>
                    <X className="w-4 h-4 mr-1" /> Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-2.5">
                {[
                  { icon: Building, label: schoolData?.name || displaySchool?.name || '—' },
                  { icon: MapPin, label: `${schoolData?.address || '—'}, ${schoolData?.city || '—'}` },
                  { icon: Mail, label: schoolData?.email, show: !!schoolData?.email },
                  { icon: Phone, label: schoolData?.phone, show: !!schoolData?.phone },
                ].filter(item => item.show !== false).map((item, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm">
                    <item.icon className="w-4 h-4 text-muted-foreground shrink-0" />
                    <span className="text-foreground">{item.label}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Preferences */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <div className="p-1.5 rounded-md bg-primary/10">
                <Settings className="w-4 h-4 text-primary" />
              </div>
              Preferences
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="px-5 py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Globe className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="font-medium text-foreground text-sm">Language</p>
                  <p className="text-xs text-muted-foreground">Interface language</p>
                </div>
              </div>
              <Select value={i18n.language} onValueChange={handleLanguageChange}>
                <SelectTrigger className="w-[140px] h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGES.map((lang) => (
                    <SelectItem key={lang.code} value={lang.code}>{lang.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Separator />
            {[
              { label: 'Notification Settings', icon: Bell, href: '/admin/settings', desc: 'Manage alerts & reminders' },
              { label: 'Subscription', icon: CreditCard, href: '/admin/subscription', desc: 'Plan & billing details' },
              { label: 'School Settings', icon: Settings, href: '/admin/settings', desc: 'Configure school preferences' },
            ].map((item, i) => (
              <div key={item.label}>
                <button
                  onClick={() => navigate(item.href)}
                  className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="w-4 h-4 text-muted-foreground" />
                    <div className="text-left">
                      <span className="font-medium text-foreground text-sm block">{item.label}</span>
                      <span className="text-xs text-muted-foreground">{item.desc}</span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </button>
                {i < 2 && <Separator />}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Logout */}
        <Button
          variant="outline"
          className="w-full text-destructive hover:text-destructive hover:bg-destructive/5 border-destructive/20"
          onClick={handleLogout}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
      </div>
    </AdminLayout>
  );
}
