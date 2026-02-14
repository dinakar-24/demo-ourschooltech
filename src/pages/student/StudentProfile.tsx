import { MobileLayout } from '@/components/layout/MobileLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AvatarUpload } from '@/components/ui/avatar-upload';
import { useAuth } from '@/contexts/AuthContext';
import { useStudentProfile } from '@/hooks/useStudentData';
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
  Calendar,
  BookOpen,
} from 'lucide-react';

export default function StudentProfile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: student } = useStudentProfile();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { label: 'Notification Settings', icon: Bell, href: '/student/notifications' },
    { label: 'My Timetable', icon: Calendar, href: '/student/timetable' },
    { label: 'My Subjects', icon: BookOpen, href: '/student/subjects' },
    { label: 'App Settings', icon: Settings, href: '/student/settings' },
  ];

  return (
    <MobileLayout title="Profile">
      <div className="p-4 space-y-4">
        {/* Profile Card */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-4 mb-4">
              <AvatarUpload
                value={student?.avatar_url || user?.avatar}
                onChange={async (url) => {
                  if (user?.id) {
                    await supabase.from('profiles').update({ avatar_url: url }).eq('id', user.id);
                  }
                  if (student?.id) {
                    await supabase.from('students').update({ avatar_url: url }).eq('id', student.id);
                  }
                  queryClient.invalidateQueries({ queryKey: ['student-profile'] });
                }}
                fallback={user?.name}
                size="lg"
                folder="students"
              />
              <div>
                <h2 className="text-lg font-bold">{user?.name}</h2>
                <p className="text-sm text-muted-foreground">Roll No. 15</p>
                <Badge variant="secondary" className="mt-1">Student</Badge>
              </div>
            </div>
            
            <div className="space-y-3 pt-4 border-t">
              <div className="flex items-center gap-3 text-sm">
                <GraduationCap className="w-4 h-4 text-muted-foreground" />
                <span>{user?.className} - {user?.section}</span>
              </div>
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

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3">
          <Card>
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold text-success">94.5%</p>
              <p className="text-xs text-muted-foreground">Attendance</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold text-primary">A+</p>
              <p className="text-xs text-muted-foreground">Last Grade</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold text-warning">2</p>
              <p className="text-xs text-muted-foreground">Pending HW</p>
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
