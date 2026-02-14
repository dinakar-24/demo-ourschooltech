import { MobileLayout } from '@/components/layout/MobileLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AvatarUpload } from '@/components/ui/avatar-upload';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import {
  User,
  Mail,
  Phone,
  GraduationCap,
  Settings,
  LogOut,
  ChevronRight,
  Bell,
  HelpCircle,
  FileText,
} from 'lucide-react';

export default function ParentProfile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { label: 'Notification Settings', icon: Bell, href: '/parent/notifications' },
    { label: 'Documents', icon: FileText, href: '/parent/documents' },
    { label: 'Help & Support', icon: HelpCircle, href: '/parent/help' },
    { label: 'App Settings', icon: Settings, href: '/parent/settings' },
  ];

  return (
    <MobileLayout title="Profile">
      <div className="p-4 space-y-4">
        {/* Parent Profile Card */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-4 mb-4">
              <AvatarUpload
                value={user?.avatar}
                onChange={async (url) => {
                  if (user?.id) {
                    await supabase.from('profiles').update({ avatar_url: url }).eq('id', user.id);
                  }
                  queryClient.invalidateQueries({ queryKey: ['parent-child'] });
                }}
                fallback={user?.name}
                size="lg"
                folder="parents"
              />
              <div>
                <h2 className="text-lg font-bold">{user?.name}</h2>
                <Badge variant="secondary" className="mt-1">Parent</Badge>
              </div>
            </div>
            
            <div className="space-y-3 pt-4 border-t">
              <div className="flex items-center gap-3 text-sm">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <span>{user?.email}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Phone className="w-4 h-4 text-muted-foreground" />
                <span>+91 98765 43210</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Child Info */}
        <Card>
          <CardContent className="p-4">
            <h3 className="text-sm font-semibold text-muted-foreground mb-3">WARD DETAILS</h3>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-success" />
              </div>
              <div>
                <p className="font-bold">{user?.childName}</p>
                <p className="text-sm text-muted-foreground">
                  {user?.className} - {user?.section}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Menu Items */}
        <Card>
          <CardContent className="p-0 divide-y divide-border">
            {menuItems.map((item) => (
              <button
                key={item.label}
                className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <item.icon className="w-5 h-5 text-muted-foreground" />
                  <span className="font-medium">{item.label}</span>
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
    </MobileLayout>
  );
}
