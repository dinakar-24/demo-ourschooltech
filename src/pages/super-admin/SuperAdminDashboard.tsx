import { SuperAdminLayout } from '@/components/layout/SuperAdminLayout';
import { AdminStatCard } from '@/components/admin/AdminStatCard';
import { SuperAdminQuickActions } from '@/components/super-admin/SuperAdminQuickActions';
import { RecentSchoolsList } from '@/components/super-admin/RecentSchoolsList';
import { SubscriptionOverview } from '@/components/super-admin/SubscriptionOverview';
import { useAuth } from '@/contexts/AuthContext';
import { Building2, Users, GraduationCap, CreditCard, School } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function SuperAdminDashboard() {
  const { user } = useAuth();

  const { data: stats, isLoading: loading } = useQuery({
    queryKey: ['super-admin-dashboard-stats'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_super_admin_stats' as any);
      if (error) throw error;
      const r = data as any;
      return {
        totalSchools: Number(r?.totalSchools ?? 0),
        totalStudents: Number(r?.totalStudents ?? 0),
        totalTeachers: Number(r?.totalTeachers ?? 0),
        activeSubscriptions: Number(r?.activeSubscriptions ?? 0),
      };
    },
    staleTime: 5 * 60 * 1000,
  });

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <SuperAdminLayout title="Dashboard">
      <div className="space-y-5 pb-6 animate-fade-up">
        {/* Greeting */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-foreground">
              {greeting()}, {user?.name?.split(' ')[0] || 'Admin'}! 🔐
            </h2>
            <p className="text-sm text-muted-foreground">
              System overview & management
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <AdminStatCard
            title="Schools"
            value={loading ? '...' : (stats?.totalSchools ?? 0).toString()}
            icon={<Building2 className="w-4 h-4" />}
          />
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
            title="Active Subs"
            value={loading ? '...' : (stats?.activeSubscriptions ?? 0).toString()}
            icon={<CreditCard className="w-4 h-4" />}
          />
        </div>

        {/* Quick Actions */}
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-3">Quick Actions</h3>
          <SuperAdminQuickActions />
        </div>

        {/* Recent Schools */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <School className="w-4 h-4 text-primary" />
              Recent Schools
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <RecentSchoolsList />
          </CardContent>
        </Card>

        {/* Subscription Overview */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-primary" />
              Subscription Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <SubscriptionOverview />
          </CardContent>
        </Card>
      </div>
    </SuperAdminLayout>
  );
}
