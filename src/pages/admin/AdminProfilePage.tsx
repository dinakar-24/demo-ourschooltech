import { AdminLayout } from '@/components/layout/AdminLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AvatarUpload } from '@/components/ui/avatar-upload';
import { useAuth } from '@/contexts/AuthContext';
import { useImpersonation } from '@/contexts/ImpersonationContext';
import { useEffectiveSchoolId } from '@/hooks/useEffectiveSchoolId';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
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
} from 'lucide-react';

export default function AdminProfilePage() {
  const { user, school, logout } = useAuth();
  const { impersonatedSchool, isImpersonating } = useImpersonation();
  const navigate = useNavigate();

  const displaySchool = isImpersonating ? impersonatedSchool : school;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { label: 'Notification Settings', icon: Bell, href: '/admin/settings' },
    { label: 'Subscription', icon: CreditCard, href: '/admin/subscription' },
    { label: 'School Settings', icon: Settings, href: '/admin/settings' },
  ];

  return (
    <AdminLayout title="My Profile">
      <div className="max-w-2xl mx-auto space-y-5 pb-6">
        {/* Profile Card */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-4 mb-4">
              <AvatarUpload
                value={user?.avatar}
                onChange={async (url) => {
                  if (user?.id) {
                    await supabase.from('profiles').update({ avatar_url: url }).eq('id', user.id);
                  }
                }}
                fallback={user?.name}
                size="lg"
                folder="admins"
              />
              <div>
                <h2 className="text-lg font-bold text-foreground">{user?.name}</h2>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
                <Badge variant="secondary" className="mt-1">
                  <Shield className="w-3 h-3 mr-1" />
                  School Admin
                </Badge>
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t border-border">
              <div className="flex items-center gap-3 text-sm">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <span className="text-foreground">{user?.email}</span>
              </div>
              {(user as any)?.phone && (
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <span className="text-foreground">{(user as any).phone}</span>
                </div>
              )}
              <div className="flex items-center gap-3 text-sm">
                <School className="w-4 h-4 text-muted-foreground" />
                <span className="text-foreground">{displaySchool?.name || 'Your School'}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Links */}
        <Card>
          <CardContent className="p-0 divide-y divide-border">
            {menuItems.map((item) => (
              <button
                key={item.label}
                onClick={() => navigate(item.href)}
                className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <item.icon className="w-5 h-5 text-muted-foreground" />
                  <span className="font-medium text-foreground">{item.label}</span>
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
