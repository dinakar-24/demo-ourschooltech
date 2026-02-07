import { useState } from 'react';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AvatarUpload } from '@/components/ui/avatar-upload';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import {
  User,
  Mail,
  Phone,
  BookOpen,
  Calendar,
  Settings,
  LogOut,
  ChevronRight,
  Award,
  Bell,
} from 'lucide-react';

export default function TeacherProfile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { label: 'Notification Settings', icon: Bell, href: '/teacher/notifications' },
    { label: 'My Schedule', icon: Calendar, href: '/teacher/schedule' },
    { label: 'My Subjects', icon: BookOpen, href: '/teacher/subjects' },
    { label: 'App Settings', icon: Settings, href: '/teacher/settings' },
  ];

  return (
    <MobileLayout title="Profile">
      <div className="p-4 space-y-4">
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
                folder="teachers"
              />
              <div>
                <h2 className="text-lg font-bold">{user?.name}</h2>
                <p className="text-sm text-muted-foreground">{user?.employeeId}</p>
                <Badge variant="secondary" className="mt-1">Teacher</Badge>
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
              <div className="flex items-center gap-3 text-sm">
                <BookOpen className="w-4 h-4 text-muted-foreground" />
                <span>{user?.subjects?.join(', ')}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <Card>
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold text-primary">156</p>
              <p className="text-xs text-muted-foreground">Students</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold text-success">4</p>
              <p className="text-xs text-muted-foreground">Classes</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold text-warning">2</p>
              <p className="text-xs text-muted-foreground">Subjects</p>
            </CardContent>
          </Card>
        </div>

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
