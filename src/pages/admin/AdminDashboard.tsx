import { AdminLayout } from '@/components/layout/AdminLayout';
import { AdminQuickActions } from '@/components/admin/AdminQuickActions';
import { AdminStatCard } from '@/components/admin/AdminStatCard';
import { TodaysSummary } from '@/components/admin/TodaysSummary';
import { PendingTasks } from '@/components/admin/PendingTasks';
import { useAuth } from '@/contexts/AuthContext';
import { useEffectiveSchoolId } from '@/hooks/useEffectiveSchoolId';
import { useImpersonation } from '@/contexts/ImpersonationContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Users, GraduationCap, CreditCard, ClipboardList, CalendarDays } from 'lucide-react';
import { useCurrentAcademicYear } from '@/hooks/useAcademicYears';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

export default function AdminDashboard() {
  const { user, school } = useAuth();
  const schoolId = useEffectiveSchoolId();
  const { impersonatedSchool, isImpersonating } = useImpersonation();

  const { data: stats, isLoading: loading } = useQuery({
    queryKey: ['admin-dashboard-stats', schoolId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_admin_dashboard_stats' as any, {
        _school_id: schoolId,
      } as any);
      if (error) throw error;
      const r = data as any;
      return {
        totalStudents: Number(r?.totalStudents ?? 0),
        totalTeachers: Number(r?.totalTeachers ?? 0),
        feeCollected: Number(r?.feeCollected ?? 0),
        attendanceRate: Number(r?.attendanceRate ?? 0),
      };
    },
    enabled: !!schoolId,
    staleTime: 5 * 60 * 1000,
  });

  const { data: currentAcademicYear } = useCurrentAcademicYear();
  const displaySchoolName = isImpersonating ? impersonatedSchool?.name : school?.name;

  const formatCurrency = (amount: number) => {
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
    if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
    return `₹${amount}`;
  };

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <AdminLayout title="Dashboard">
      <div className="space-y-5 pb-6">
        {/* Welcome Banner */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary/90 to-primary/70 p-5 md:p-6 text-primary-foreground">
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4" />
          <div className="relative flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 md:gap-4">
              <Avatar className="h-12 w-12 md:h-14 md:w-14 border-2 border-white/20 shadow-lg">
                {user?.avatar && <AvatarImage src={user.avatar} alt={user?.name || ''} />}
                <AvatarFallback className="bg-white/20 text-primary-foreground font-bold text-base md:text-lg">
                  {user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-base md:text-lg font-bold leading-tight">
                  {greeting()}, {user?.name?.split(' ')[0]}! 👋
                </h2>
                <p className="text-xs md:text-sm text-primary-foreground/70 mt-0.5">
                  {displaySchoolName || 'Your School'}
                </p>
              </div>
            </div>
            {currentAcademicYear && (
              <div className="hidden sm:flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-xl px-3 py-2 shrink-0">
                <CalendarDays className="w-4 h-4 text-primary-foreground/70" />
                <div className="text-right">
                  <p className="text-[10px] uppercase tracking-wider text-primary-foreground/60 font-medium">Academic Year</p>
                  <p className="text-sm font-bold">{currentAcademicYear.name}</p>
                </div>
              </div>
            )}
          </div>
          {/* Mobile academic year */}
          {currentAcademicYear && (
            <div className="sm:hidden flex items-center gap-2 mt-3 bg-white/10 backdrop-blur-sm rounded-lg px-3 py-2 w-fit">
              <CalendarDays className="w-3.5 h-3.5 text-primary-foreground/70" />
              <span className="text-xs font-semibold">{currentAcademicYear.name}</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <AdminStatCard
            title="Students"
            value={loading ? '...' : (stats?.totalStudents ?? 0).toLocaleString()}
            icon={<Users className="w-4 h-4" />}
          />
          <AdminStatCard
            title="Teachers"
            value={loading ? '...' : (stats?.totalTeachers ?? 0).toLocaleString()}
            icon={<GraduationCap className="w-4 h-4" />}
          />
          <AdminStatCard
            title="Fee Collected"
            value={loading ? '...' : formatCurrency(stats?.feeCollected ?? 0)}
            icon={<CreditCard className="w-4 h-4" />}
          />
          <AdminStatCard
            title="Attendance"
            value={loading ? '...' : `${stats?.attendanceRate ?? 0}%`}
            subtitle="today"
            icon={<ClipboardList className="w-4 h-4" />}
          />
        </div>

        <div>
          <h3 className="text-sm font-semibold text-foreground mb-3">Quick Actions</h3>
          <AdminQuickActions />
        </div>

        <PendingTasks />
        <TodaysSummary />
      </div>
    </AdminLayout>
  );
}
