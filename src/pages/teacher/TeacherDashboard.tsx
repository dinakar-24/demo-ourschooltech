import { MobileLayout } from '@/components/layout/MobileLayout';
import { useAuth } from '@/contexts/AuthContext';
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

export default function TeacherDashboard() {
  const { user, school } = useAuth();
  const schoolId = useEffectiveSchoolId();

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
        totalStudents: 0,
        totalHomework: Number(r?.totalHomework ?? 0),
        attendanceToday: Number(r?.attendanceRate ?? 0),
        pendingMarks: 0,
      };
    },
    enabled: !!schoolId && !!user?.id,
    staleTime: 5 * 60 * 1000,
  });

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const quickActions = [
    { label: 'Attendance', icon: ClipboardList, href: '/teacher/attendance', color: 'bg-emerald-500' },
    { label: 'Homework', icon: BookOpen, href: '/teacher/homework', color: 'bg-blue-500' },
    { label: 'Marks', icon: FileText, href: '/teacher/marks', color: 'bg-amber-500' },
    { label: 'Notices', icon: Bell, href: '/teacher/announcements', color: 'bg-rose-500' },
    { label: 'Results', icon: BarChart3, href: '/teacher/marks', color: 'bg-purple-500' },
    { label: 'Timetable', icon: Clock, href: '/teacher/timetable', color: 'bg-teal-500' },
    { label: 'Students', icon: Users, href: '/teacher/students', color: 'bg-indigo-500' },
    { label: 'Profile', icon: GraduationCap, href: '/teacher/profile', color: 'bg-primary' },
  ];

  const todayClasses = [
    { class: 'Class 8-A', subject: 'Mathematics', time: '9:00 AM', status: 'completed' },
    { class: 'Class 9-B', subject: 'Mathematics', time: '10:30 AM', status: 'ongoing' },
    { class: 'Class 10-A', subject: 'Physics', time: '12:00 PM', status: 'upcoming' },
    { class: 'Class 7-C', subject: 'Mathematics', time: '2:30 PM', status: 'upcoming' },
  ];

  const pendingTasks = [
    { label: 'Mark attendance for Class 9-B', icon: ClipboardList, href: '/teacher/attendance', color: 'bg-warning/10 text-warning' },
    { label: 'Review 12 homework submissions', icon: BookOpen, href: '/teacher/homework', color: 'bg-info/10 text-info' },
    { label: 'Enter marks for Class 10-A exam', icon: FileText, href: '/teacher/marks', color: 'bg-destructive/10 text-destructive' },
  ];

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
            <p className="text-xs text-muted-foreground">Today</p>
            <p className="text-sm font-semibold text-foreground">4 Classes</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <AdminStatCard
            title="My Students"
            value={loading ? '...' : stats.totalStudents.toLocaleString()}
            icon={<Users className="w-4 h-4" />}
          />
          <AdminStatCard
            title="Homework"
            value={loading ? '...' : stats.totalHomework.toLocaleString()}
            subtitle="posted"
            icon={<BookOpen className="w-4 h-4" />}
          />
          <AdminStatCard
            title="Attendance"
            value={loading ? '...' : `${stats.attendanceToday}%`}
            subtitle="today"
            icon={<ClipboardList className="w-4 h-4" />}
          />
          <AdminStatCard
            title="Pending"
            value={loading ? '...' : `${stats.pendingMarks}`}
            subtitle="tasks"
            icon={<AlertCircle className="w-4 h-4" />}
          />
        </div>

        {/* Quick Actions */}
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-3">Quick Actions</h3>
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

        {/* Pending Tasks */}
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-3">Pending Tasks</h3>
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

        {/* Today's Schedule */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-foreground">Today's Schedule</h3>
            <span className="text-xs text-primary font-medium">View All</span>
          </div>
          <div className="space-y-2">
            {todayClasses.map((cls, i) => (
              <Card key={i} className={cls.status === 'ongoing' ? 'border-primary/50 bg-primary/5' : ''}>
                <CardContent className="p-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      cls.status === 'completed' ? 'bg-success/10 text-success' :
                      cls.status === 'ongoing' ? 'bg-primary/10 text-primary' :
                      'bg-muted text-muted-foreground'
                    }`}>
                      {cls.status === 'completed' ? <CheckCircle className="w-5 h-5" /> :
                       cls.status === 'ongoing' ? <TrendingUp className="w-5 h-5" /> :
                       <Clock className="w-5 h-5" />}
                    </div>
                    <div>
                      <p className="font-medium text-sm text-foreground">{cls.class}</p>
                      <p className="text-xs text-muted-foreground">{cls.subject}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-foreground">{cls.time}</p>
                    <Badge variant={
                      cls.status === 'completed' ? 'secondary' :
                      cls.status === 'ongoing' ? 'default' : 'outline'
                    } className="text-[10px] px-1.5 py-0">
                      {cls.status}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </MobileLayout>
  );
}
