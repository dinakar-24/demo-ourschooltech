import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
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
  User,
  Mail,
  Phone,
  School,
  Settings,
  LogOut,
  ChevronRight,
  Bell,
  Shield,
  CreditCard,
  Lock,
  Globe,
  Loader2,
  Pencil,
  Check,
  X,
  Eye,
  EyeOff,
  Calendar,
  MapPin,
  Building,
} from 'lucide-react';

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
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();

  const displaySchool = isImpersonating ? impersonatedSchool : school;

  // Profile edit state
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileName, setProfileName] = useState(user?.name || '');
  const [profilePhone, setProfilePhone] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  // Password change state
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  // School info edit state
  const [editingSchool, setEditingSchool] = useState(false);
  const [schoolName, setSchoolName] = useState(displaySchool?.name || '');
  const [schoolAddress, setSchoolAddress] = useState((school as any)?.address || '');
  const [schoolCity, setSchoolCity] = useState((school as any)?.city || '');
  const [schoolEmail, setSchoolEmail] = useState('');
  const [schoolPhone, setSchoolPhone] = useState('');
  const [savingSchool, setSavingSchool] = useState(false);

  // Push notifications
  const [pushEnabled, setPushEnabled] = useState(false);

  // Fetch profile details
  const { data: profileData } = useQuery({
    queryKey: ['admin-profile', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('profiles')
        .select('full_name, phone, email')
        .eq('id', user!.id)
        .single();
      return data;
    },
    enabled: !!user?.id,
  });

  // Fetch school details
  const { data: schoolData } = useQuery({
    queryKey: ['school-details', schoolId],
    queryFn: async () => {
      const { data } = await supabase
        .from('schools')
        .select('name, address, city, email, phone')
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

  const handleChangePassword = async () => {
    if (newPassword.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    if (newPassword !== confirmPassword) { toast.error('Passwords do not match'); return; }
    setChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast.success('Password changed successfully');
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordSection(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to change password');
    } finally {
      setChangingPassword(false);
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
          email: schoolEmail.trim() || null,
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
      <div className="max-w-2xl mx-auto space-y-4 pb-8">
        {/* Profile Card */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-start gap-4">
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
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-foreground truncate">{profileData?.full_name || user?.name}</h2>
                    <p className="text-sm text-muted-foreground truncate">{user?.email}</p>
                  </div>
                  {!editingProfile && (
                    <Button variant="ghost" size="icon" onClick={() => setEditingProfile(true)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                <Badge variant="secondary" className="mt-1.5">
                  <Shield className="w-3 h-3 mr-1" />
                  School Admin
                </Badge>
              </div>
            </div>

            {/* Editable fields */}
            {editingProfile ? (
              <div className="mt-4 pt-4 border-t border-border space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Full Name</Label>
                  <Input value={profileName} onChange={e => setProfileName(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Phone Number</Label>
                  <Input value={profilePhone} onChange={e => setProfilePhone(e.target.value)} placeholder="+91 XXXXX XXXXX" />
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
              <div className="mt-4 pt-4 border-t border-border space-y-2.5">
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span className="text-foreground truncate">{user?.email}</span>
                </div>
                {profileData?.phone && (
                  <div className="flex items-center gap-3 text-sm">
                    <Phone className="w-4 h-4 text-muted-foreground shrink-0" />
                    <span className="text-foreground">{profileData.phone}</span>
                  </div>
                )}
                <div className="flex items-center gap-3 text-sm">
                  <School className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span className="text-foreground">{displaySchool?.name || 'Your School'}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Change Password */}
        <Card>
          <CardContent className="p-0">
            <button
              onClick={() => setShowPasswordSection(!showPasswordSection)}
              className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Lock className="w-5 h-5 text-muted-foreground" />
                <span className="font-medium text-foreground">Change Password</span>
              </div>
              <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform ${showPasswordSection ? 'rotate-90' : ''}`} />
            </button>
            {showPasswordSection && (
              <div className="px-4 pb-4 space-y-3">
                <Separator />
                <div className="space-y-1.5">
                  <Label className="text-xs">New Password</Label>
                  <div className="relative">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      placeholder="Min 6 characters"
                    />
                    <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2" onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <EyeOff className="w-4 h-4 text-muted-foreground" /> : <Eye className="w-4 h-4 text-muted-foreground" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Confirm Password</Label>
                  <Input
                    type="password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                  />
                </div>
                <Button size="sm" onClick={handleChangePassword} disabled={changingPassword || !newPassword}>
                  {changingPassword ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
                  Update Password
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* School Info */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Building className="w-5 h-5" />
                School Information
              </CardTitle>
              {!editingSchool && (
                <Button variant="ghost" size="icon" onClick={() => setEditingSchool(true)}>
                  <Pencil className="w-4 h-4" />
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {editingSchool ? (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">School Name</Label>
                    <Input value={schoolName} onChange={e => setSchoolName(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">City</Label>
                    <Input value={schoolCity} onChange={e => setSchoolCity(e.target.value)} />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label className="text-xs">Address</Label>
                    <Input value={schoolAddress} onChange={e => setSchoolAddress(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Email</Label>
                    <Input value={schoolEmail} onChange={e => setSchoolEmail(e.target.value)} placeholder="school@example.com" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Phone</Label>
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
                <div className="flex items-center gap-3 text-sm">
                  <Building className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span className="text-foreground">{schoolData?.name || displaySchool?.name || '—'}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <MapPin className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span className="text-foreground">{schoolData?.address || '—'}, {schoolData?.city || '—'}</span>
                </div>
                {schoolData?.email && (
                  <div className="flex items-center gap-3 text-sm">
                    <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
                    <span className="text-foreground">{schoolData.email}</span>
                  </div>
                )}
                {schoolData?.phone && (
                  <div className="flex items-center gap-3 text-sm">
                    <Phone className="w-4 h-4 text-muted-foreground shrink-0" />
                    <span className="text-foreground">{schoolData.phone}</span>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Language */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Globe className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="font-medium text-foreground text-sm">Language</p>
                  <p className="text-xs text-muted-foreground">Interface language</p>
                </div>
              </div>
              <Select value={i18n.language} onValueChange={handleLanguageChange}>
                <SelectTrigger className="w-[140px]">
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

        {/* Quick Navigation */}
        <Card>
          <CardContent className="p-0 divide-y divide-border">
            {[
              { label: 'Notification Settings', icon: Bell, href: '/admin/settings' },
              { label: 'Subscription', icon: CreditCard, href: '/admin/subscription' },
              { label: 'School Settings', icon: Settings, href: '/admin/settings' },
            ].map((item) => (
              <button
                key={item.label}
                onClick={() => navigate(item.href)}
                className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <item.icon className="w-5 h-5 text-muted-foreground" />
                  <span className="font-medium text-foreground text-sm">{item.label}</span>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </button>
            ))}
          </CardContent>
        </Card>

        {/* Logout */}
        <Button
          variant="outline"
          className="w-full text-destructive hover:text-destructive"
          onClick={handleLogout}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
      </div>
    </AdminLayout>
  );
}
