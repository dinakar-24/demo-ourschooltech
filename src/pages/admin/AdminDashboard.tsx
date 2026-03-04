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
  const displaySchoolLogo = isImpersonating ? impersonatedSchool?.logo : school?.logo;

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
        <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-card p-4 md:p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              {displaySchoolLogo ? (
                <img src={displaySchoolLogo} alt={displaySchoolName || 'School'} className="w-11 h-11 md:w-12 md:h-12 rounded-xl object-contain bg-muted/50 p-1 shrink-0" />
              ) : (
                <div className="w-11 h-11 md:w-12 md:h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <GraduationCap className="w-6 h-6 text-primary" />
                </div>
              )}
              <div className="min-w-0">
                <h2 className="text-base md:text-lg font-bold text-foreground leading-tight truncate">
                  {greeting()}, {user?.name?.split(' ')[0]}! 👋
                </h2>
                <p className="text-xs md:text-sm text-muted-foreground truncate mt-0.5">
                  {displaySchoolName || 'Your School'}
                </p>
              </div>
            </div>
            {currentAcademicYear && (
              <div className="hidden sm:flex items-center gap-2 bg-primary/5 border border-primary/10 rounded-xl px-3 py-2 shrink-0">
                <CalendarDays className="w-4 h-4 text-primary" />
                <div className="text-right">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Academic Year</p>
                  <p className="text-sm font-bold text-foreground">{currentAcademicYear.name}</p>
                </div>
              </div>
            )}
          </div>
          {currentAcademicYear && (
            <div className="sm:hidden flex items-center gap-1.5 mt-3 text-xs text-muted-foreground">
              <CalendarDays className="w-3.5 h-3.5 text-primary" />
              <span className="font-medium">{currentAcademicYear.name}</span>
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
