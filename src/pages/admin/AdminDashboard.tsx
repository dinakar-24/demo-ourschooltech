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
import { useTranslation } from 'react-i18next';
import { Users, GraduationCap, CreditCard, ClipboardList } from 'lucide-react';
import { useCurrentAcademicYear } from '@/hooks/useAcademicYears';

export default function AdminDashboard() {
  const { user, school } = useAuth();
  const schoolId = useEffectiveSchoolId();
  const { impersonatedSchool, isImpersonating } = useImpersonation();
  const { t } = useTranslation();

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
    if (hour < 12) return t('greetings.morning');
    if (hour < 17) return t('greetings.afternoon');
    return t('greetings.evening');
  };

  return (
    <AdminLayout title={t('admin.dashboard.title')}>
      <div className="space-y-5 pb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-foreground">
              {greeting()}, {user?.name?.split(' ')[0]}! 👋
            </h2>
            <p className="text-sm text-muted-foreground line-clamp-1">
              {displaySchoolName || 'Your School'}
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-xs text-muted-foreground">{t('admin.dashboard.academicYear')}</p>
            <p className="text-sm font-semibold text-foreground">{currentAcademicYear?.name || '—'}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <AdminStatCard
            title={t('admin.dashboard.students')}
            value={loading ? '...' : (stats?.totalStudents ?? 0).toLocaleString()}
            icon={<Users className="w-4 h-4" />}
          />
          <AdminStatCard
            title={t('admin.dashboard.teachers')}
            value={loading ? '...' : (stats?.totalTeachers ?? 0).toLocaleString()}
            icon={<GraduationCap className="w-4 h-4" />}
          />
          <AdminStatCard
            title={t('admin.dashboard.feeCollected')}
            value={loading ? '...' : formatCurrency(stats?.feeCollected ?? 0)}
            icon={<CreditCard className="w-4 h-4" />}
          />
          <AdminStatCard
            title={t('admin.dashboard.attendance')}
            value={loading ? '...' : `${stats?.attendanceRate ?? 0}%`}
            subtitle={t('common.today')}
            icon={<ClipboardList className="w-4 h-4" />}
          />
        </div>

        <div>
          <h3 className="text-sm font-semibold text-foreground mb-3">{t('admin.dashboard.quickActions')}</h3>
          <AdminQuickActions />
        </div>

        <PendingTasks />
        <TodaysSummary />
      </div>
    </AdminLayout>
  );
}
