import { MobileLayout } from '@/components/layout/MobileLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { useEffectiveSchoolId } from '@/hooks/useEffectiveSchoolId';
import { Card, CardContent } from '@/components/ui/card';
import { AdminStatCard } from '@/components/admin/AdminStatCard';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  ClipboardList, 
  BookOpen, 
  FileText, 
  Bell,
  Users,
  ChevronRight,
  Clock,
  GraduationCap,
  AlertCircle,
  BarChart3,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function TeacherDashboard() {
  const { user, school } = useAuth();
  const schoolId = useEffectiveSchoolId();
  const { t } = useTranslation();

  const { data: stats, isLoading: loading } = useQuery({
    queryKey: ['teacher-dashboard-stats', schoolId, user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_teacher_dashboard_stats', {
        _school_id: schoolId,
        _teacher_user_id: user!.id,
      });
      if (error) throw error;
      const r = data as any;
      return {
        totalHomework: Number(r?.totalHomework ?? 0),
        attendanceToday: Number(r?.attendanceRate ?? 0),
      };
    },
    enabled: !!schoolId && !!user?.id,
    staleTime: 5 * 60 * 1000,
  });

  // Fetch teacher record for real class/subject counts
  const { data: teacher } = useQuery({
    queryKey: ['teacher-record', user?.id, schoolId],
    queryFn: async () => {
      const { data } = await supabase
        .from('teachers')
        .select('classes, subjects')
        .eq('school_id', schoolId!)
        .eq('user_id', user!.id)
        .maybeSingle();
      return data;
    },
    enabled: !!schoolId && !!user?.id,
    staleTime: 10 * 60 * 1000,
  });

  // Fetch upcoming homework due
  const { data: upcomingHomework } = useQuery({
    queryKey: ['teacher-upcoming-hw', schoolId, user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('homework')
        .select('id, title, subject, due_date')
        .eq('school_id', schoolId!)
        .eq('assigned_by', user!.id)
        .gte('due_date', new Date().toISOString().split('T')[0])
        .order('due_date', { ascending: true })
        .limit(4);
      return data ?? [];
    },
    enabled: !!schoolId && !!user?.id,
    staleTime: 5 * 60 * 1000,
  });

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t('greetings.morning');
    if (hour < 17) return t('greetings.afternoon');
    return t('greetings.evening');
  };

  const quickActions = [
    { label: t('nav.attendance'), icon: ClipboardList, href: '/teacher/attendance', color: 'bg-emerald-500' },
    { label: t('nav.homework'), icon: BookOpen, href: '/teacher/homework', color: 'bg-blue-500' },
    { label: t('nav.marks'), icon: FileText, href: '/teacher/marks', color: 'bg-amber-500' },
    { label: t('nav.announcements'), icon: Bell, href: '/teacher/announcements', color: 'bg-rose-500' },
    { label: t('nav.results'), icon: BarChart3, href: '/teacher/marks', color: 'bg-purple-500' },
    { label: t('nav.timetable'), icon: Clock, href: '/teacher/timetable', color: 'bg-teal-500' },
    { label: t('nav.students'), icon: Users, href: '/teacher/students', color: 'bg-indigo-500' },
    { label: t('nav.profile'), icon: GraduationCap, href: '/teacher/profile', color: 'bg-primary' },
  ];

  const classCount = teacher?.classes?.length ?? 0;
  const subjectCount = teacher?.subjects?.length ?? 0;

  return (
    <MobileLayout>
      <div className="p-4 space-y-5 pb-6">
        {/* Welcome Section */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-foreground">
              {greeting()}, {user?.name?.split(' ')[0]}! 👋
            </h2>
            <p className="text-sm text-muted-foreground line-clamp-1">
              {user?.subjects?.join(', ') || 'Teacher'}
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-xs text-muted-foreground">Classes</p>
            <p className="text-sm font-semibold text-foreground">{classCount}</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <AdminStatCard
            title={t('teacher.dashboard.homework')}
            value={loading ? '...' : (stats?.totalHomework ?? 0).toLocaleString()}
            subtitle={t('teacher.dashboard.posted')}
            icon={<BookOpen className="w-4 h-4" />}
          />
          <AdminStatCard
            title={t('teacher.dashboard.attendance')}
            value={loading ? '...' : `${stats?.attendanceToday ?? 0}%`}
            subtitle={t('common.today')}
            icon={<ClipboardList className="w-4 h-4" />}
          />
          <AdminStatCard
            title="Subjects"
            value={String(subjectCount)}
            icon={<BookOpen className="w-4 h-4" />}
          />
          <AdminStatCard
            title="Classes"
            value={String(classCount)}
            icon={<Users className="w-4 h-4" />}
          />
        </div>

        {/* Quick Actions */}
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-3">{t('teacher.dashboard.quickActions')}</h3>
          <div className="grid grid-cols-4 gap-3">
            {quickActions.map((action) => (
              <Link 
                key={action.label} 
                to={action.href}
                className="flex flex-col items-center gap-2 p-3 rounded-xl bg-card border border-border/50 hover:border-primary/30 hover:shadow-md transition-all active:scale-95"
              >
                <div className={`w-11 h-11 rounded-xl ${action.color} flex items-center justify-center shadow-sm`}>
                  <action.icon className="w-5 h-5 text-white" />
                </div>
                <span className="text-[11px] font-medium text-muted-foreground text-center leading-tight">
                  {action.label}
                </span>
              </Link>
            ))}
          </div>
        </div>

        {/* Upcoming Homework */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-foreground">Upcoming Homework</h3>
            <Link to="/teacher/homework" className="text-xs text-primary font-medium">{t('common.viewAll')}</Link>
          </div>
          {upcomingHomework && upcomingHomework.length > 0 ? (
            <Card>
              <CardContent className="divide-y divide-border p-0">
                {upcomingHomework.map((hw) => (
                  <Link key={hw.id} to="/teacher/homework" className="flex items-center justify-between p-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-info/10 text-info flex items-center justify-center">
                        <BookOpen className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-sm font-medium text-foreground line-clamp-1">{hw.title}</span>
                        <p className="text-xs text-muted-foreground">{hw.subject} · Due {hw.due_date}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                  </Link>
                ))}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-6 text-center text-sm text-muted-foreground">
                No upcoming homework assigned.
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </MobileLayout>
  );
}
