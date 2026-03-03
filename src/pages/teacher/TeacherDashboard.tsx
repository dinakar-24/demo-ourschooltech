import { MobileLayout } from '@/components/layout/MobileLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { useEffectiveSchoolId } from '@/hooks/useEffectiveSchoolId';
import { Card, CardContent } from '@/components/ui/card';
import { AdminStatCard } from '@/components/admin/AdminStatCard';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  ClipboardList, 
  BookOpen, 
  FileText, 
  Bell,
  Users,
  ChevronRight,
  Calendar,
  Clock,
  GraduationCap,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  BarChart3,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';

const DAY_MAP: Record<number, string> = {
  0: 'Sunday', 1: 'Monday', 2: 'Tuesday', 3: 'Wednesday',
  4: 'Thursday', 5: 'Friday', 6: 'Saturday',
};

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

  // Fetch teacher record for classes/subjects/student count
  const { data: teacherRecord } = useQuery({
    queryKey: ['teacher-record', schoolId, user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('teachers')
        .select('id, classes, subjects')
        .eq('school_id', schoolId)
        .eq('user_id', user!.id)
        .single();
      return data;
    },
    enabled: !!schoolId && !!user?.id,
  });

  // Count students in teacher's classes
  const { data: studentCount } = useQuery({
    queryKey: ['teacher-student-count', schoolId, teacherRecord?.classes],
    queryFn: async () => {
      if (!teacherRecord?.classes?.length) return 0;
      const { count } = await supabase
        .from('students')
        .select('id', { count: 'exact', head: true })
        .eq('school_id', schoolId)
        .eq('status', 'active')
        .in('class_name', teacherRecord.classes);
      return count || 0;
    },
    enabled: !!schoolId && !!teacherRecord?.classes?.length,
  });

  // Fetch today's schedule from timetable_entries
  const todayName = DAY_MAP[new Date().getDay()];
  const { data: todayClasses } = useQuery({
    queryKey: ['teacher-today-schedule', schoolId, teacherRecord?.id, todayName],
    queryFn: async () => {
      if (!teacherRecord?.id) return [];
      const { data } = await supabase
        .from('timetable_entries' as any)
        .select('*')
        .eq('school_id', schoolId)
        .eq('teacher_id', teacherRecord.id)
        .eq('day_of_week', todayName)
        .eq('is_lunch', false)
        .order('period_number', { ascending: true });
      return (data || []) as any[];
    },
    enabled: !!schoolId && !!teacherRecord?.id,
  });

  // Pending tasks: attendance not marked today for teacher's classes
  const { data: pendingAttendanceClasses } = useQuery({
    queryKey: ['teacher-pending-attendance', schoolId, teacherRecord?.classes],
    queryFn: async () => {
      if (!teacherRecord?.classes?.length) return [];
      const today = format(new Date(), 'yyyy-MM-dd');
      // Get classes that have attendance marked today
      const { data: markedClasses } = await supabase
        .from('attendance')
        .select('student_id')
        .eq('school_id', schoolId)
        .eq('date', today)
        .limit(1);
      // If no attendance marked at all, all classes are pending
      if (!markedClasses?.length) return teacherRecord.classes;
      return [];
    },
    enabled: !!schoolId && !!teacherRecord?.classes?.length,
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

  const pendingTasks = [
    ...(pendingAttendanceClasses?.length ? [{
      label: t('teacher.dashboard.markAttendance', { className: pendingAttendanceClasses[0] }),
      icon: ClipboardList,
      href: '/teacher/attendance',
      color: 'bg-warning/10 text-warning',
    }] : []),
    ...(stats?.totalHomework === 0 ? [{
      label: t('teacher.dashboard.postFirstHomework'),
      icon: BookOpen,
      href: '/teacher/homework',
      color: 'bg-info/10 text-info',
    }] : []),
  ];

  const getTimeStatus = (startTime: string): 'completed' | 'ongoing' | 'upcoming' => {
    const now = new Date();
    const [h, m] = startTime.split(':').map(Number);
    const classTime = new Date();
    classTime.setHours(h, m, 0);
    const diff = (classTime.getTime() - now.getTime()) / 60000;
    if (diff < -45) return 'completed';
    if (diff < 0) return 'ongoing';
    return 'upcoming';
  };

  return (
    <MobileLayout>
      <div className="p-4 space-y-5 pb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-foreground">
              {greeting()}, {user?.name?.split(' ')[0]}! 👋
            </h2>
            <p className="text-sm text-muted-foreground line-clamp-1">
              {teacherRecord?.subjects?.join(', ') || user?.subjects?.join(', ') || 'Teacher'}
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-xs text-muted-foreground">{t('common.today')}</p>
            <p className="text-sm font-semibold text-foreground">
              {todayClasses?.length ?? 0} {t('teacher.dashboard.classes')}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <AdminStatCard
            title={t('teacher.dashboard.myStudents')}
            value={loading ? '...' : (studentCount ?? 0).toLocaleString()}
            icon={<Users className="w-4 h-4" />}
          />
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
            title={t('teacher.dashboard.classes')}
            value={teacherRecord?.classes?.length?.toString() ?? '0'}
            subtitle={t('common.active')}
            icon={<GraduationCap className="w-4 h-4" />}
          />
        </div>

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

        {pendingTasks.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-3">{t('teacher.dashboard.pendingTasks')}</h3>
            <Card>
              <CardContent className="divide-y divide-border p-0">
                {pendingTasks.map((task, i) => (
                  <Link key={i} to={task.href} className="flex items-center justify-between p-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-lg ${task.color} flex items-center justify-center`}>
                        <task.icon className="w-4 h-4" />
                      </div>
                      <span className="text-sm font-medium text-foreground">{task.label}</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </Link>
                ))}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Today's Schedule */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-foreground">{t('teacher.dashboard.todaysSchedule')}</h3>
            <Link to="/teacher/timetable" className="text-xs text-primary font-medium">{t('common.viewAll')}</Link>
          </div>
          {todayClasses && todayClasses.length > 0 ? (
            <div className="space-y-2">
              {todayClasses.map((cls: any, i: number) => {
                const status = getTimeStatus(cls.start_time);
                return (
                  <Card key={i} className={status === 'ongoing' ? 'border-primary/50 bg-primary/5' : ''}>
                    <CardContent className="p-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          status === 'completed' ? 'bg-success/10 text-success' :
                          status === 'ongoing' ? 'bg-primary/10 text-primary' :
                          'bg-muted text-muted-foreground'
                        }`}>
                          {status === 'completed' ? <CheckCircle className="w-5 h-5" /> :
                           status === 'ongoing' ? <TrendingUp className="w-5 h-5" /> :
                           <Clock className="w-5 h-5" />}
                        </div>
                        <div>
                          <p className="font-medium text-sm text-foreground">{cls.class_name}-{cls.section}</p>
                          <p className="text-xs text-muted-foreground">{cls.subject}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-foreground">{cls.start_time?.slice(0, 5)}</p>
                        <Badge variant={
                          status === 'completed' ? 'secondary' :
                          status === 'ongoing' ? 'default' : 'outline'
                        } className="text-[10px] px-1.5 py-0">
                          {status}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <Calendar className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  {todayName === 'Sunday' ? 'No classes on Sunday' : 'No classes scheduled today'}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </MobileLayout>
  );
}
