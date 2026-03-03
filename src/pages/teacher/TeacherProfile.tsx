import { MobileLayout } from '@/components/layout/MobileLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AvatarUpload } from '@/components/ui/avatar-upload';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { useEffectiveSchoolId } from '@/hooks/useEffectiveSchoolId';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Mail,
  Phone,
  BookOpen,
  Calendar,
  Settings,
  LogOut,
  ChevronRight,
  Bell,
  Clock,
  Users,
  MessageCircle,
} from 'lucide-react';

export default function TeacherProfile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const schoolId = useEffectiveSchoolId();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Fetch teacher record from DB for real phone + stats
  const { data: teacherData, isLoading } = useQuery({
    queryKey: ['teacher-profile-data', user?.id, schoolId],
    queryFn: async () => {
      if (!user?.id || !schoolId) return null;
      const { data, error } = await supabase
        .from('teachers')
        .select('phone, subjects, classes')
        .eq('user_id', user.id)
        .eq('school_id', schoolId)
        .single();
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!user?.id && !!schoolId,
    staleTime: 10 * 60 * 1000,
  });

  // Count students in teacher's classes
  const { data: studentCount } = useQuery({
    queryKey: ['teacher-student-count', teacherData?.classes, schoolId],
    queryFn: async () => {
      if (!teacherData?.classes?.length || !schoolId) return 0;
      const { count, error } = await supabase
        .from('students')
        .select('id', { count: 'exact', head: true })
        .eq('school_id', schoolId)
        .eq('status', 'active')
        .in('class_name', teacherData.classes);
      if (error) return 0;
      return count || 0;
    },
    enabled: !!teacherData?.classes?.length && !!schoolId,
    staleTime: 10 * 60 * 1000,
  });

  const phone = teacherData?.phone;
  const subjects = teacherData?.subjects || user?.subjects || [];
  const classes = teacherData?.classes || [];

  const menuItems = [
    { label: 'Notifications', icon: Bell, href: '/teacher/notifications' },
    { label: 'My Timetable', icon: Clock, href: '/teacher/timetable' },
    { label: 'My Students', icon: Users, href: '/teacher/students' },
    { label: 'Messages', icon: MessageCircle, href: '/teacher/messages' },
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
                <span>{phone || 'Not set'}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <BookOpen className="w-4 h-4 text-muted-foreground" />
                <span>{subjects.length > 0 ? subjects.join(', ') : 'No subjects assigned'}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <Card>
            <CardContent className="p-3 text-center">
              {isLoading ? <Skeleton className="h-8 w-12 mx-auto" /> : (
                <p className="text-2xl font-bold text-primary">{studentCount ?? 0}</p>
              )}
              <p className="text-xs text-muted-foreground">Students</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              {isLoading ? <Skeleton className="h-8 w-8 mx-auto" /> : (
                <p className="text-2xl font-bold text-success">{classes.length}</p>
              )}
              <p className="text-xs text-muted-foreground">Classes</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              {isLoading ? <Skeleton className="h-8 w-8 mx-auto" /> : (
                <p className="text-2xl font-bold text-warning">{subjects.length}</p>
              )}
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
                onClick={() => navigate(item.href)}
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
