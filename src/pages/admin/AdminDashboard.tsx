import { AdminLayout } from '@/components/layout/AdminLayout';
import { AdminQuickActions } from '@/components/admin/AdminQuickActions';
import { AdminStatCard } from '@/components/admin/AdminStatCard';
import { TodaysSummary } from '@/components/admin/TodaysSummary';
import { PendingTasks } from '@/components/admin/PendingTasks';
import { useAuth } from '@/contexts/AuthContext';
import { useEffectiveSchoolId } from '@/hooks/useEffectiveSchoolId';
import { useImpersonation } from '@/contexts/ImpersonationContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Users, GraduationCap, CreditCard, ClipboardList, CalendarDays, RefreshCw } from 'lucide-react';
import { useCurrentAcademicYear } from '@/hooks/useAcademicYears';
import { useState, useRef, useCallback } from 'react';

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
  const queryClient = useQueryClient();

  // Pull-to-refresh
  const [refreshing, setRefreshing] = useState(false);
  const [pullY, setPullY] = useState(0);
  const touchStartY = useRef(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (refreshing) return;
    const scrollTop = scrollRef.current?.scrollTop ?? 0;
    if (scrollTop > 0) return;
    const diff = e.touches[0].clientY - touchStartY.current;
    if (diff > 0) setPullY(Math.min(diff * 0.4, 60));
  }, [refreshing]);

  const handleTouchEnd = useCallback(async () => {
    if (pullY > 40 && !refreshing) {
      setRefreshing(true);
      await queryClient.invalidateQueries({ queryKey: ['admin-dashboard-stats'] });
      setTimeout(() => {
        setRefreshing(false);
        setPullY(0);
      }, 600);
    } else {
      setPullY(0);
    }
  }, [pullY, refreshing, queryClient]);

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
      <div 
        ref={scrollRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="space-y-4 pb-6"
      >
        {/* Pull to refresh indicator */}
        <div 
          className="flex items-center justify-center overflow-hidden transition-all duration-200"
          style={{ height: pullY > 0 || refreshing ? `${Math.max(pullY, refreshing ? 36 : 0)}px` : '0px' }}
        >
          <RefreshCw className={`w-5 h-5 text-primary ${refreshing ? 'animate-spin' : ''}`} />
        </div>
        {/* Welcome Banner */}
        <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-card p-3.5 md:p-5 shadow-sm">
          <div className="flex items-center gap-3">
            {displaySchoolLogo ? (
              <img src={displaySchoolLogo} alt={displaySchoolName || 'School'} className="w-10 h-10 md:w-12 md:h-12 rounded-xl object-contain bg-muted/50 p-1 shrink-0" />
            ) : (
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <GraduationCap className="w-5 h-5 md:w-6 md:h-6 text-primary" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h2 className="text-sm md:text-lg font-bold text-foreground leading-tight truncate">
                {greeting()}, {user?.name?.split(' ')[0]}! 👋
              </h2>
              <p className="text-[11px] md:text-sm text-muted-foreground truncate">
                {displaySchoolName || 'Your School'}
              </p>
            </div>
          </div>
          {currentAcademicYear && (
            <div className="flex items-center gap-1.5 mt-2.5 pt-2.5 border-t border-border/40">
              <CalendarDays className="w-3.5 h-3.5 text-primary shrink-0" />
              <span className="text-[11px] md:text-xs font-semibold text-foreground">{currentAcademicYear.name}</span>
            </div>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-2.5 md:gap-3">
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

        {/* Quick Actions */}
        <div>
          <h3 className="text-xs md:text-sm font-semibold text-foreground mb-2.5">Quick Actions</h3>
          <AdminQuickActions />
        </div>

        <PendingTasks />
        <TodaysSummary />
      </div>
    </AdminLayout>
  );
}
