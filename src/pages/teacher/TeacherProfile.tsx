import { MobileLayout } from '@/components/layout/MobileLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AvatarUpload } from '@/components/ui/avatar-upload';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffectiveSchoolId } from '@/hooks/useEffectiveSchoolId';
import {
  Mail,
  Phone,
  BookOpen,
  Calendar,
  Settings,
  LogOut,
  ChevronRight,
  Bell,
  Users,
  GraduationCap,
  MessageSquare,
  HelpCircle,
} from 'lucide-react';

export default function TeacherProfile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const schoolId = useEffectiveSchoolId();

  // Fetch real teacher data from DB
  const { data: teacher, isLoading } = useQuery({
    queryKey: ['teacher-profile-detail', user?.id, schoolId],
    queryFn: async () => {
      if (!user?.id || !schoolId) return null;
      const { data, error } = await supabase
        .from('teachers')
        .select('*')
        .eq('school_id', schoolId)
        .eq('user_id', user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id && !!schoolId,
  });

  // Fetch real profile for phone/avatar
  const { data: profile } = useQuery({
    queryKey: ['teacher-profile-base', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from('profiles')
        .select('phone, avatar_url')
        .eq('id', user.id)
        .single();
      return data;
    },
    enabled: !!user?.id,
  });

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { label: 'Notifications', icon: Bell, href: '/teacher/notifications' },
    { label: 'My Timetable', icon: Calendar, href: '/teacher/timetable' },
    { label: 'My Students', icon: Users, href: '/teacher/students' },
    { label: 'Feedback', icon: MessageSquare, href: '/teacher/feedback' },
    { label: 'Help & Queries', icon: HelpCircle, href: '/teacher/queries' },
    { label: 'Settings', icon: Settings, href: '/teacher/settings' },
  ];

  const subjectCount = teacher?.subjects?.length ?? user?.subjects?.length ?? 0;
  const classCount = teacher?.classes?.length ?? 0;

  return (
    <MobileLayout title="Profile">
      <div className="p-4 space-y-4">
        {/* Profile Card */}
        <Card>
          <CardContent className="p-5">
            {isLoading ? (
              <div className="flex items-center gap-4 mb-4">
                <Skeleton className="w-16 h-16 rounded-full" />
                <div>
                  <Skeleton className="h-5 w-32 mb-2" />
                  <Skeleton className="h-4 w-24 mb-1" />
                  <Skeleton className="h-5 w-16" />
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-4 mb-4">
                  <AvatarUpload
                    value={teacher?.avatar_url || profile?.avatar_url || user?.avatar}
                    onChange={async (url) => {
                      if (user?.id) {
                        await supabase.from('profiles').update({ avatar_url: url }).eq('id', user.id);
                      }
                      if (teacher?.id) {
                        await supabase.from('teachers').update({ avatar_url: url }).eq('id', teacher.id);
                      }
                      queryClient.invalidateQueries({ queryKey: ['teacher-profile-detail'] });
                      queryClient.invalidateQueries({ queryKey: ['teacher-profile-base'] });
                    }}
                    fallback={user?.name}
                    size="lg"
                    folder="teachers"
                  />
                  <div>
                    <h2 className="text-lg font-bold">{teacher?.full_name || user?.name}</h2>
                    <p className="text-sm text-muted-foreground">{teacher?.employee_id || user?.employeeId}</p>
                    <Badge variant="secondary" className="mt-1">Teacher</Badge>
                  </div>
                </div>
                
                <div className="space-y-3 pt-4 border-t">
                  <div className="flex items-center gap-3 text-sm">
                    <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
                    <span>{teacher?.email || user?.email}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Phone className="w-4 h-4 text-muted-foreground shrink-0" />
                    <span>{teacher?.phone || profile?.phone || 'Not provided'}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <BookOpen className="w-4 h-4 text-muted-foreground shrink-0" />
                    <span>{teacher?.subjects?.join(', ') || user?.subjects?.join(', ') || 'No subjects assigned'}</span>
                  </div>
                  {teacher?.qualification && (
                    <div className="flex items-center gap-3 text-sm">
                      <GraduationCap className="w-4 h-4 text-muted-foreground shrink-0" />
                      <span>{teacher.qualification}</span>
                    </div>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Stats from real data */}
        <div className="grid grid-cols-3 gap-3">
          <Card>
            <CardContent className="p-3 text-center">
              {isLoading ? <Skeleton className="h-8 w-8 mx-auto" /> : (
                <p className="text-2xl font-bold text-primary">{subjectCount}</p>
              )}
              <p className="text-xs text-muted-foreground">Subjects</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              {isLoading ? <Skeleton className="h-8 w-8 mx-auto" /> : (
                <p className="text-2xl font-bold text-success">{classCount}</p>
              )}
              <p className="text-xs text-muted-foreground">Classes</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              {isLoading ? <Skeleton className="h-8 w-8 mx-auto" /> : (
                <p className="text-2xl font-bold text-warning">{teacher?.joining_date ? new Date(teacher.joining_date).getFullYear() : '-'}</p>
              )}
              <p className="text-xs text-muted-foreground">Since</p>
            </CardContent>
          </Card>
        </div>

        {/* Menu Items - all linked to real routes */}
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
